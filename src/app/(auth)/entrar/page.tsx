import { Building2, GraduationCap } from "lucide-react";
import { demoSignIn } from "@/app/actions";
import { SignInForm } from "@/components/auth-forms";
import { SubmitButton } from "@/components/forms";

export const metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Entrar no Elo</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Acesse o painel da sua fábrica ou suas demandas de engenharia.</p>
      </div>
      <SignInForm />
      <div className="relative text-center text-xs text-muted-foreground before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-border">
        <span className="relative bg-background px-2">ou explore uma conta de demonstração</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <form action={demoSignIn}>
          <input type="hidden" name="email" value="rosana@ipiranga.demo" />
          <SubmitButton variant="outline" className="w-full" pendingText="Abrindo…"><Building2 />Indústria</SubmitButton>
        </form>
        <form action={demoSignIn}>
          <input type="hidden" name="email" value="ana@poli.demo" />
          <SubmitButton variant="outline" className="w-full" pendingText="Abrindo…"><GraduationCap />Engenheira</SubmitButton>
        </form>
      </div>
    </div>
  );
}
