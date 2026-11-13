import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

export const SESSION_COOKIE = "elo_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { id, userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, id, {
    httpOnly: true, sameSite: "lax", path: "/", expires: expiresAt, secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await db.session.deleteMany({ where: { id } });
  jar.delete(SESSION_COOKIE);
}

/** Usuário da sessão atual (memoizado por requisição). */
export const currentUser = cache(async () => {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await db.session.findUnique({
    where: { id },
    include: { user: { include: { company: true, engineer: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** Para onde mandar o usuário logado, conforme o estágio do cadastro. */
export function homeFor(user: SessionUser): string {
  if (user.role === "COMPANY") return user.company?.onboardedAt ? "/app" : "/onboarding/empresa";
  return user.engineer ? "/eng" : "/onboarding/engenheiro";
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireCompanyUser() {
  const user = await requireUser();
  if (user.role !== "COMPANY") redirect(homeFor(user));
  if (!user.company?.onboardedAt) redirect("/onboarding/empresa");
  return user as SessionUser & { company: NonNullable<SessionUser["company"]> };
}

export async function requireEngineerUser() {
  const user = await requireUser();
  if (user.role !== "ENGINEER") redirect(homeFor(user));
  if (!user.engineer) redirect("/onboarding/engenheiro");
  return user as SessionUser & { engineer: NonNullable<SessionUser["engineer"]> };
}
