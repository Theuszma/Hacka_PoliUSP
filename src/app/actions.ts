"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_KEYS, DESTINATION_KEYS, category } from "@/lib/catalog";
import { db } from "@/lib/db";
import { SESSION_COOKIE, currentUser, requireCompanyUser, requireEngineerUser } from "@/lib/auth";
import { flowMetrics, totals } from "@/lib/metrics";
import { networkMatches } from "@/lib/data";

export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string> } | null;

/* ---------------- Sessão ---------------- */

export async function signIn(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect("/entrar");
  (await cookies()).set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect(user.role === "COMPANY" ? "/empresa" : "/engenheiro");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/entrar");
}

/* ---------------- Insumos ---------------- */

const flowSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do insumo"),
  category: z.enum(CATEGORY_KEYS as [string, ...string[]]),
  monthlyQty: z.coerce.number().positive("Consumo deve ser maior que zero"),
  unitCost: z.coerce.number().min(0, "Custo não pode ser negativo"),
  lossRate: z.coerce.number().min(0).max(100, "Perda vai de 0 a 100%").transform((v) => v / 100),
  destination: z.enum(DESTINATION_KEYS as [string, ...string[]]),
  destinationValue: z.coerce.number(),
  supplier: z.string().trim().optional().transform((v) => v || null),
  lot: z.string().trim().optional().transform((v) => v || null),
});

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

export async function saveFlow(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = flowSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const data = { ...parsed.data, unit: category(parsed.data.category).unit };
  const id = String(formData.get("id") ?? "");
  if (id) {
    const existing = await db.materialFlow.findFirst({ where: { id, companyId: user.company.id } });
    if (!existing) return { ok: false, message: "Insumo não encontrado" };
    await db.materialFlow.update({ where: { id }, data });
  } else {
    await db.materialFlow.create({ data: { ...data, companyId: user.company.id } });
  }
  revalidatePath("/empresa", "layout");
  return { ok: true, message: id ? "Insumo atualizado" : `${data.name} entrou no diagnóstico` };
}

export async function deleteFlow(formData: FormData) {
  const user = await requireCompanyUser();
  const id = String(formData.get("id"));
  await db.materialFlow.deleteMany({ where: { id, companyId: user.company.id } });
  revalidatePath("/empresa", "layout");
  redirect("/empresa/insumos");
}

/* ---------------- Simbiose ---------------- */

export async function proposeExchange(formData: FormData) {
  const user = await requireCompanyUser();
  const flowId = String(formData.get("flowId"));
  const demandId = String(formData.get("demandId"));
  const match = (await networkMatches()).find((m) => m.flow.id === flowId && m.demand.id === demandId);
  if (!match) return;
  const me = user.company.id;
  if (match.flow.companyId !== me && match.demand.companyId !== me) return;

  const existing = await db.exchange.findFirst({ where: { flowId, demandId, status: { in: ["PROPOSED", "ACCEPTED"] } } });
  if (!existing) {
    await db.exchange.create({
      data: {
        flowId, demandId, fromId: match.flow.companyId, toId: match.demand.companyId, initiatorId: me,
        quantity: Math.round(match.volume), price: match.demand.pricePaid,
      },
    });
  }
  revalidatePath("/empresa", "layout");
}

export async function respondExchange(formData: FormData) {
  const user = await requireCompanyUser();
  const id = String(formData.get("id"));
  const accept = formData.get("decision") === "accept";
  const ex = await db.exchange.findUnique({ where: { id } });
  const me = user.company.id;
  if (!ex || ex.status !== "PROPOSED" || ex.initiatorId === me || (ex.fromId !== me && ex.toId !== me)) return;
  await db.exchange.update({ where: { id }, data: { status: accept ? "ACCEPTED" : "DECLINED" } });
  if (accept) {
    // o resíduo passa a ter destino de simbiose no fluxo de quem envia
    await db.materialFlow.update({ where: { id: ex.flowId }, data: { destination: "simbiose", destinationValue: ex.price } });
  }
  revalidatePath("/", "layout");
}

/* ---------------- Pedidos de apoio técnico ---------------- */

const requestSchema = z.object({
  title: z.string().trim().min(5, "Dê um título com pelo menos 5 letras"),
  briefing: z.string().trim().min(20, "Descreva o problema com um pouco mais de detalhe"),
  category: z.enum(CATEGORY_KEYS as [string, ...string[]]),
  estimatedHours: z.coerce.number().int().min(2).max(200),
  invitedId: z.string().optional().transform((v) => v || null),
});

export async function createRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const flows = await db.materialFlow.findMany({ where: { companyId: user.company.id } });
  const related = flows.filter((f) => f.category === parsed.data.category);
  const monthlyLoss = related.length ? related.reduce((s, f) => s + flowMetrics(f).loss, 0) : totals(flows).loss;

  let invitedName: string | null = null;
  if (parsed.data.invitedId) {
    const eng = await db.engineer.findUnique({ where: { id: parsed.data.invitedId }, include: { user: true } });
    invitedName = eng?.user.name ?? null;
  }
  const req = await db.supportRequest.create({
    data: {
      ...parsed.data,
      companyId: user.company.id,
      monthlyLoss,
      updates: {
        create: [
          { kind: "EVENT", body: "Demanda publicada na rede" },
          ...(invitedName ? [{ kind: "EVENT", body: `${invitedName} foi convidado(a) para a demanda` }] : []),
        ],
      },
    },
  });
  revalidatePath("/", "layout");
  redirect(`/demandas/${req.id}`);
}

export async function assignRequest(formData: FormData) {
  const user = await requireEngineerUser();
  const id = String(formData.get("id"));
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req || req.status !== "OPEN") return;
  await db.supportRequest.update({
    where: { id },
    data: { status: "IN_PROGRESS", assigneeId: user.engineer.id, updates: { create: { kind: "EVENT", body: `${user.name} assumiu a demanda` } } },
  });
  revalidatePath("/", "layout");
}

const completeSchema = z.object({
  outcome: z.string().trim().min(10, "Conte o que foi feito"),
  savedPerMonth: z.coerce.number().min(0, "Informe a economia validada (pode ser 0)"),
});

export async function completeRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireEngineerUser();
  const id = String(formData.get("id"));
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req || req.assigneeId !== user.engineer.id || req.status !== "IN_PROGRESS") return { ok: false, message: "Só quem assumiu pode concluir" };
  const parsed = completeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const saved = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(parsed.data.savedPerMonth);
  await db.supportRequest.update({
    where: { id },
    data: { status: "DONE", ...parsed.data, updates: { create: { kind: "EVENT", body: `Demanda concluída · economia validada de ${saved}/mês` } } },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Demanda concluída" };
}

export async function postUpdate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const id = String(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2) return { ok: false, errors: { body: "Escreva uma mensagem" } };
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req) return { ok: false, message: "Demanda não encontrada" };
  const allowed = (user.companyId && user.companyId === req.companyId) || (user.engineer && user.engineer.id === req.assigneeId);
  if (!allowed) return { ok: false, message: "Só a empresa e o responsável podem escrever aqui" };
  await db.requestUpdate.create({ data: { requestId: id, authorId: user.id, body } });
  revalidatePath(`/demandas/${id}`);
  return { ok: true };
}
