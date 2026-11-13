import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

/**
 * Sessão simplificada para a demonstração: o usuário escolhe um perfil na tela de entrada
 * e o id fica num cookie httpOnly. Em produção, trocar por autenticação real (Supabase Auth / NextAuth).
 */
export const SESSION_COOKIE = "elo_uid";

export async function currentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return db.user.findUnique({ where: { id }, include: { company: true, engineer: true } });
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireCompanyUser() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "COMPANY" || !user.company) redirect("/engenheiro");
  return user as SessionUser & { company: NonNullable<SessionUser["company"]> };
}

export async function requireEngineerUser() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "ENGINEER" || !user.engineer) redirect("/empresa");
  return user as SessionUser & { engineer: NonNullable<SessionUser["engineer"]> };
}
