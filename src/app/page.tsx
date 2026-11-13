import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  redirect(user.role === "COMPANY" ? "/empresa" : "/engenheiro");
}
