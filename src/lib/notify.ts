import "server-only";
import { db } from "./db";

/** Cria um aviso para todos os usuários de uma empresa. */
export async function notifyCompany(companyId: string, n: { title: string; body?: string; href?: string }) {
  const users = await db.user.findMany({ where: { companyId }, select: { id: true } });
  if (users.length) await db.notification.createMany({ data: users.map((u) => ({ userId: u.id, ...n })) });
}

export async function notifyUser(userId: string, n: { title: string; body?: string; href?: string }) {
  await db.notification.create({ data: { userId, ...n } });
}
