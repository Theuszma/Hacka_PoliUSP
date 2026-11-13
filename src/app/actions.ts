"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_KEYS, DESTINATION_KEYS, category } from "@/lib/catalog";
import { db } from "@/lib/db";
import { createSession, currentUser, destroySession, homeFor, requireCompanyUser, requireEngineerUser, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { locate } from "@/lib/cities";
import { SECTOR_KEYS } from "@/lib/sectors";
import { monthKey } from "@/lib/history";
import { flowMetrics, totals } from "@/lib/metrics";
import { networkMatches } from "@/lib/data";
import { notifyCompany, notifyUser } from "@/lib/notify";
import { money } from "@/lib/format";

export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string> } | null;

const enumOf = (keys: readonly string[]) => z.enum(keys as [string, ...string[]]);
function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}
function initialsOf(name: string) {
  return name.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || name.slice(0, 2).toUpperCase();
}

/* ======================= Conta ======================= */

const signUpSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Use pelo menos 8 caracteres"),
  role: z.enum(["COMPANY", "ENGINEER"], { message: "Escolha um perfil" }),
});

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { name, email, password, role } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { ok: false, errors: { email: "Já existe uma conta com este e-mail" } };
  const user = await db.user.create({ data: { name, email, role, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  redirect(role === "COMPANY" ? "/onboarding/empresa" : "/onboarding/engenheiro");
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email }, include: { company: true, engineer: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { ok: false, message: "E-mail ou senha incorretos" };
  await createSession(user.id);
  redirect(homeFor(user));
}

/** Entra direto numa conta de demonstração. */
export async function demoSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const user = await db.user.findFirst({ where: { email, isDemo: true }, include: { company: true, engineer: true } });
  if (!user) redirect("/entrar");
  await createSession(user.id);
  redirect(homeFor(user));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

/* ======================= Onboarding ======================= */

const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa"),
  cnpj: z.string().trim().optional().transform((v) => v || null)
    .refine((v) => !v || v.replace(/\D/g, "").length === 14, "CNPJ deve ter 14 dígitos"),
  sector: enumOf(SECTOR_KEYS),
  size: z.enum(["Micro", "Pequena", "Média"]),
  employees: z.coerce.number().int().min(1, "Informe o número de funcionários").max(5000),
  city: z.string().min(2, "Escolha a cidade"),
  description: z.string().trim().max(280).optional().transform((v) => v || null),
});

const flowItem = z.object({
  name: z.string().trim().min(2),
  category: enumOf(CATEGORY_KEYS),
  monthlyQty: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0),
  lossRate: z.coerce.number().min(0).max(1),
  destination: enumOf(DESTINATION_KEYS),
  destinationValue: z.coerce.number(),
  leverText: z.string().nullable().optional(),
  leverReduction: z.number().nullable().optional(),
});

const inputItem = z.object({
  category: enumOf(CATEGORY_KEYS),
  description: z.string().trim().min(3),
  pricePaid: z.coerce.number(),
  virginPrice: z.coerce.number().min(0),
  capacity: z.coerce.number().positive(),
});

/** Conclui o onboarding da empresa: dados, insumos e (opcional) o que aceita receber. */
export async function completeCompanyOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "COMPANY") redirect(homeFor(user));
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Revise os dados da empresa" };

  let flows: z.infer<typeof flowItem>[] = [];
  let inputs: z.infer<typeof inputItem>[] = [];
  try {
    flows = z.array(flowItem).min(1, "Adicione pelo menos um insumo").parse(JSON.parse(String(formData.get("flows") ?? "[]")));
    inputs = z.array(inputItem).parse(JSON.parse(String(formData.get("inputs") ?? "[]")));
  } catch {
    return { ok: false, message: "Confira os insumos: cada um precisa de nome, consumo e custo" };
  }

  const { city, ...company } = parsed.data;
  const loc = locate(city, company.name);
  const month = monthKey();
  const data = { ...company, initials: initialsOf(company.name), city: loc.city, lat: loc.lat, lng: loc.lng, onboardedAt: new Date() };

  const saved = user.companyId
    ? await db.company.update({ where: { id: user.companyId }, data })
    : await db.company.create({ data: { ...data, users: { connect: { id: user.id } } } });

  for (const f of flows) {
    await db.materialFlow.create({
      data: {
        ...f, unit: category(f.category).unit, companyId: saved.id,
        records: { create: { month, monthlyQty: f.monthlyQty, unitCost: f.unitCost, lossRate: f.lossRate, destination: f.destination, destinationValue: f.destinationValue } },
      },
    });
  }
  for (const i of inputs) {
    await db.inputDemand.create({ data: { ...i, use: i.description, substitution: 0.8, companyId: saved.id } });
  }
  await notifyUser(user.id, { title: "Bem-vinda(o) ao Elo", body: "Seu diagnóstico está pronto. Veja onde a fábrica perde mais dinheiro.", href: "/app" });
  revalidatePath("/", "layout");
  redirect("/app?bemvindo=1");
}

const engineerSchema = z.object({
  kind: z.enum(["STUDENT", "MENTOR"]),
  course: z.string().trim().min(3, "Informe o curso ou a formação"),
  bio: z.string().trim().min(10, "Conte um pouco da sua experiência").max(400),
  skills: z.string().trim().min(2, "Escolha pelo menos uma área"),
  hoursPerWeek: z.coerce.number().int().min(1).max(40),
  city: z.string().min(2),
});

export async function completeEngineerOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "ENGINEER") redirect(homeFor(user));
  const parsed = engineerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { city, ...profile } = parsed.data;
  const loc = locate(city, user.name);
  const existed = !!user.engineer;
  await db.engineer.upsert({
    where: { userId: user.id },
    create: { ...profile, userId: user.id, rating: 5, lat: loc.lat, lng: loc.lng },
    update: { ...profile, lat: loc.lat, lng: loc.lng },
  });
  revalidatePath("/", "layout");
  if (existed) return { ok: true, message: "Perfil atualizado" };
  redirect("/eng");
}

/* ======================= Empresa ======================= */

export async function updateCompany(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { city, ...rest } = parsed.data;
  const loc = city === user.company.city ? { city, lat: user.company.lat, lng: user.company.lng } : locate(city, rest.name);
  await db.company.update({ where: { id: user.company.id }, data: { ...rest, initials: initialsOf(rest.name), city: loc.city, lat: loc.lat, lng: loc.lng } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Dados da empresa atualizados" };
}

const flowSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do insumo"),
  category: enumOf(CATEGORY_KEYS),
  monthlyQty: z.coerce.number().positive("Consumo deve ser maior que zero"),
  unitCost: z.coerce.number().min(0, "Custo não pode ser negativo"),
  lossRate: z.coerce.number().min(0, "Perda vai de 0 a 100%").max(100, "Perda vai de 0 a 100%").transform((v) => v / 100),
  destination: enumOf(DESTINATION_KEYS),
  destinationValue: z.coerce.number({ message: "Informe um número" }),
  supplier: z.string().trim().optional().transform((v) => v || null),
  lot: z.string().trim().optional().transform((v) => v || null),
});

async function snapshot(flowId: string) {
  const f = await db.materialFlow.findUniqueOrThrow({ where: { id: flowId } });
  const month = monthKey();
  const data = { monthlyQty: f.monthlyQty, unitCost: f.unitCost, lossRate: f.lossRate, destination: f.destination, destinationValue: f.destinationValue };
  await db.monthlyRecord.upsert({ where: { flowId_month: { flowId, month } }, create: { flowId, month, ...data }, update: data });
}

export async function saveFlow(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = flowSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const data = { ...parsed.data, unit: category(parsed.data.category).unit };
  const id = String(formData.get("id") ?? "");
  let flowId = id;
  if (id) {
    const existing = await db.materialFlow.findFirst({ where: { id, companyId: user.company.id } });
    if (!existing) return { ok: false, message: "Insumo não encontrado" };
    await db.materialFlow.update({ where: { id }, data });
  } else {
    flowId = (await db.materialFlow.create({ data: { ...data, companyId: user.company.id } })).id;
  }
  await snapshot(flowId);
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Insumo atualizado" : `${data.name} adicionado ao diagnóstico` };
}

export async function deleteFlow(formData: FormData) {
  const user = await requireCompanyUser();
  await db.materialFlow.deleteMany({ where: { id: String(formData.get("id")), companyId: user.company.id } });
  revalidatePath("/", "layout");
}

/** Importação em lote (linhas já lidas da planilha no navegador). */
export async function importFlows(rows: unknown): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = z.array(flowItem.omit({ leverText: true, leverReduction: true })).min(1).max(200).safeParse(rows);
  if (!parsed.success) return { ok: false, message: "Planilha com linhas inválidas. Confira as colunas e os números." };
  for (const f of parsed.data) {
    const created = await db.materialFlow.create({ data: { ...f, unit: category(f.category).unit, companyId: user.company.id } });
    await snapshot(created.id);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `${parsed.data.length} insumos importados` };
}

const inputSchema = z.object({
  category: enumOf(CATEGORY_KEYS),
  description: z.string().trim().min(3, "Descreva o material"),
  use: z.string().trim().min(3, "Diga como vai usar"),
  pricePaid: z.coerce.number(),
  virginPrice: z.coerce.number().min(0),
  capacity: z.coerce.number().positive("Informe a quantidade por mês"),
  substitution: z.coerce.number().min(0).max(100).transform((v) => v / 100),
  licensed: z.string().optional().transform((v) => v === "on"),
});

export async function saveInputDemand(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = inputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await db.inputDemand.create({ data: { ...parsed.data, companyId: user.company.id } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Agora o Elo procura esse material para você" };
}

export async function deleteInputDemand(formData: FormData) {
  const user = await requireCompanyUser();
  await db.inputDemand.deleteMany({ where: { id: String(formData.get("id")), companyId: user.company.id } });
  revalidatePath("/", "layout");
}

/* ======================= Simbiose ======================= */

export async function proposeExchange(formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const flowId = String(formData.get("flowId"));
  const demandId = String(formData.get("demandId"));
  const match = (await networkMatches()).find((m) => m.flow.id === flowId && m.demand.id === demandId);
  const me = user.company.id;
  if (!match || (match.flow.companyId !== me && match.demand.companyId !== me)) return { ok: false, message: "Essa troca não está mais disponível" };
  const existing = await db.exchange.findFirst({ where: { flowId, demandId, status: { in: ["PROPOSED", "ACCEPTED"] } } });
  if (existing) return { ok: true, message: "Proposta já enviada" };
  await db.exchange.create({
    data: { flowId, demandId, fromId: match.flow.companyId, toId: match.demand.companyId, initiatorId: me, quantity: Math.round(match.volume), price: match.demand.pricePaid },
  });
  const other = match.flow.companyId === me ? match.demand.companyId : match.flow.companyId;
  await notifyCompany(other, {
    title: `${user.company.name} propôs uma troca`,
    body: `${match.flow.name}: ${Math.round(match.volume).toLocaleString("pt-BR")} ${match.flow.unit}/mês`,
    href: "/app/marketplace",
  });
  revalidatePath("/", "layout");
  return { ok: true, message: `Proposta enviada para ${match.flow.companyId === me ? match.demand.company.name : match.flow.company.name}` };
}

export async function respondExchange(formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const id = String(formData.get("id"));
  const accept = formData.get("decision") === "accept";
  const ex = await db.exchange.findUnique({ where: { id }, include: { flow: true } });
  const me = user.company.id;
  if (!ex || ex.status !== "PROPOSED" || ex.initiatorId === me || (ex.fromId !== me && ex.toId !== me)) return { ok: false, message: "Proposta não encontrada" };
  await db.exchange.update({ where: { id }, data: { status: accept ? "ACCEPTED" : "DECLINED" } });
  if (accept) {
    await db.materialFlow.update({ where: { id: ex.flowId }, data: { destination: "simbiose", destinationValue: ex.price } });
    await snapshot(ex.flowId);
  }
  await notifyCompany(ex.initiatorId, {
    title: `${user.company.name} ${accept ? "aceitou" : "recusou"} sua proposta`,
    body: ex.flow.name,
    href: "/app/marketplace",
  });
  revalidatePath("/", "layout");
  return { ok: true, message: accept ? "Troca ativa. O diagnóstico foi atualizado." : "Proposta recusada" };
}

/* ======================= Demandas de engenharia ======================= */

const requestSchema = z.object({
  title: z.string().trim().min(5, "Dê um título com pelo menos 5 letras"),
  briefing: z.string().trim().min(20, "Descreva o problema com um pouco mais de detalhe"),
  category: enumOf(CATEGORY_KEYS),
  estimatedHours: z.coerce.number().int().min(2, "Mínimo de 2 horas").max(200),
  invitedId: z.string().optional().transform((v) => v || null),
});

export async function createRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCompanyUser();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const flows = await db.materialFlow.findMany({ where: { companyId: user.company.id } });
  const related = flows.filter((f) => f.category === parsed.data.category);
  const monthlyLoss = related.length ? related.reduce((s, f) => s + flowMetrics(f).loss, 0) : totals(flows).loss;
  const invited = parsed.data.invitedId ? await db.engineer.findUnique({ where: { id: parsed.data.invitedId }, include: { user: true } }) : null;

  const req = await db.supportRequest.create({
    data: {
      ...parsed.data, companyId: user.company.id, monthlyLoss,
      updates: { create: [{ kind: "EVENT", body: "Demanda publicada na rede" }, ...(invited ? [{ kind: "EVENT", body: `${invited.user.name} foi convidado(a)` }] : [])] },
    },
  });
  if (invited) await notifyUser(invited.userId, { title: `${user.company.name} convidou você`, body: parsed.data.title, href: `/demandas/${req.id}` });
  revalidatePath("/", "layout");
  redirect(`/demandas/${req.id}`);
}

export async function assignRequest(formData: FormData): Promise<ActionState> {
  const user = await requireEngineerUser();
  const id = String(formData.get("id"));
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req || req.status !== "OPEN") return { ok: false, message: "Essa demanda já foi assumida" };
  await db.supportRequest.update({
    where: { id },
    data: { status: "IN_PROGRESS", assigneeId: user.engineer.id, updates: { create: { kind: "EVENT", body: `${user.name} assumiu a demanda` } } },
  });
  await notifyCompany(req.companyId, { title: `${user.name} assumiu sua demanda`, body: req.title, href: `/demandas/${id}` });
  revalidatePath("/", "layout");
  return { ok: true, message: "Demanda assumida. A empresa foi avisada." };
}

const completeSchema = z.object({
  outcome: z.string().trim().min(10, "Conte o que foi feito"),
  savedPerMonth: z.coerce.number({ message: "Informe um número" }).min(0, "Não pode ser negativo"),
});

export async function completeRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireEngineerUser();
  const id = String(formData.get("id"));
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req || req.assigneeId !== user.engineer.id || req.status !== "IN_PROGRESS") return { ok: false, message: "Só quem assumiu pode concluir" };
  const parsed = completeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const saved = money(parsed.data.savedPerMonth);

  // Mentores validam o próprio trabalho; entregas de estudantes passam pela revisão de um mentor.
  if (user.engineer.kind === "MENTOR") {
    await db.supportRequest.update({
      where: { id },
      data: { status: "DONE", ...parsed.data, reviewerId: user.engineer.id, reviewedAt: new Date(), updates: { create: { kind: "EVENT", body: `Concluída por mentor(a) · economia validada de ${saved}/mês` } } },
    });
    await notifyCompany(req.companyId, { title: "Demanda concluída", body: req.title, href: `/demandas/${id}` });
    revalidatePath("/", "layout");
    return { ok: true, message: "Demanda concluída e validada." };
  }

  await db.supportRequest.update({
    where: { id },
    data: { status: "REVIEW", ...parsed.data, updates: { create: { kind: "EVENT", body: `Entregue para revisão de um(a) mentor(a) · economia estimada de ${saved}/mês` } } },
  });
  const mentors = await db.engineer.findMany({ where: { kind: "MENTOR", id: { not: user.engineer.id } }, select: { userId: true } });
  if (mentors.length) await db.notification.createMany({ data: mentors.map((m) => ({ userId: m.userId, title: `${user.name} entregou uma demanda para revisão`, body: req.title, href: `/demandas/${id}` })) });
  await notifyCompany(req.companyId, { title: "Entrega recebida, em revisão por um(a) mentor(a)", body: req.title, href: `/demandas/${id}` });
  revalidatePath("/", "layout");
  return { ok: true, message: "Entrega enviada. Um(a) mentor(a) vai revisar antes de validar a economia." };
}

const reviewSchema = z.object({
  decision: z.enum(["approve", "changes"]),
  note: z.string().trim().max(2000).optional().transform((v) => v || ""),
  savedPerMonth: z.coerce.number({ message: "Informe um número" }).min(0, "Não pode ser negativo").optional(),
});

/** Mentor(a) valida a entrega de um(a) estudante ou pede ajustes. */
export async function reviewRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireEngineerUser();
  if (user.engineer.kind !== "MENTOR") return { ok: false, message: "Só mentores revisam entregas" };
  const id = String(formData.get("id"));
  const req = await db.supportRequest.findUnique({ where: { id }, include: { assignee: true } });
  if (!req || req.status !== "REVIEW") return { ok: false, message: "Essa entrega não está aguardando revisão" };
  if (req.assigneeId === user.engineer.id) return { ok: false, message: "Outra pessoa precisa revisar o seu trabalho" };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { decision, note } = parsed.data;

  if (decision === "changes") {
    if (note.length < 10) return { ok: false, errors: { note: "Explique o que precisa ser ajustado" } };
    await db.supportRequest.update({
      where: { id },
      data: {
        status: "IN_PROGRESS", reviewerId: user.engineer.id,
        updates: { create: [
          { kind: "EVENT", body: `${user.name} pediu ajustes na entrega` },
          { kind: "MESSAGE", body: note, authorId: user.id },
        ] },
      },
    });
    if (req.assignee) await notifyUser(req.assignee.userId, { title: `${user.name} pediu ajustes`, body: req.title, href: `/demandas/${id}` });
    revalidatePath("/", "layout");
    return { ok: true, message: "Pedido de ajuste enviado ao(à) estudante." };
  }

  const savedPerMonth = parsed.data.savedPerMonth ?? req.savedPerMonth ?? 0;
  const adjusted = req.savedPerMonth !== null && Math.abs(savedPerMonth - req.savedPerMonth) >= 1;
  await db.supportRequest.update({
    where: { id },
    data: {
      status: "DONE", savedPerMonth, reviewerId: user.engineer.id, reviewedAt: new Date(),
      updates: { create: [
        ...(note ? [{ kind: "MESSAGE", body: note, authorId: user.id }] : []),
        { kind: "EVENT", body: `Validada por ${user.name}${adjusted ? " (economia ajustada)" : ""} · economia de ${money(savedPerMonth)}/mês` },
      ] },
    },
  });
  if (req.assignee) await notifyUser(req.assignee.userId, { title: `${user.name} validou sua entrega`, body: `${req.title} · ${money(savedPerMonth)}/mês`, href: `/demandas/${id}` });
  await notifyCompany(req.companyId, { title: "Demanda concluída e validada por mentor(a)", body: req.title, href: `/demandas/${id}` });
  revalidatePath("/", "layout");
  return { ok: true, message: "Entrega validada. As horas entram no perfil do(a) estudante." };
}

export async function postUpdate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const id = String(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2) return { ok: false, errors: { body: "Escreva uma mensagem" } };
  const req = await db.supportRequest.findUnique({ where: { id }, include: { assignee: true } });
  if (!req) return { ok: false, message: "Demanda não encontrada" };
  const isCompany = user.companyId === req.companyId;
  const isAssignee = !!user.engineer && user.engineer.id === req.assigneeId;
  const isReviewer = user.engineer?.kind === "MENTOR" && req.status === "REVIEW";
  if (!isCompany && !isAssignee && !isReviewer) return { ok: false, message: "Só a empresa, o responsável e o(a) mentor(a) revisor(a) podem escrever aqui" };
  await db.requestUpdate.create({ data: { requestId: id, authorId: user.id, body } });
  const n = { title: `Nova mensagem de ${user.name}`, body: body.slice(0, 120), href: `/demandas/${id}` };
  if (isCompany && req.assignee) await notifyUser(req.assignee.userId, n);
  if (isAssignee || isReviewer) await notifyCompany(req.companyId, n);
  if (isReviewer && !isAssignee && req.assignee) await notifyUser(req.assignee.userId, n);
  revalidatePath(`/demandas/${id}`);
  return { ok: true };
}

/* ======================= Notificações ======================= */

export async function markAllRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
