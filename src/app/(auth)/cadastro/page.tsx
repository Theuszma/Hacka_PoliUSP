import { SignUpForm } from "@/components/auth-forms";

export const metadata = { title: "Criar conta" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Crie sua conta</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Leva menos de 5 minutos para ter o primeiro diagnóstico da sua fábrica.</p>
      </div>
      <SignUpForm initialRole={perfil === "engenheiro" ? "ENGINEER" : "COMPANY"} />
    </div>
  );
}
