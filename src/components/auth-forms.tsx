"use client";

import { Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type ActionState } from "@/app/actions";
import { SubmitButton } from "./forms";
import { cn } from "./ui/cn";
import { Field, Input } from "./ui/form";

export function SignInForm() {
  const [state, action] = useActionState<ActionState, FormData>(signIn, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="E-mail" htmlFor="si-email"><Input id="si-email" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com.br" /></Field>
      <Field label="Senha" htmlFor="si-pass"><Input id="si-pass" name="password" type="password" autoComplete="current-password" required /></Field>
      {state?.message && <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{state.message}</p>}
      <SubmitButton className="w-full" pendingText="Entrando…">Entrar</SubmitButton>
      <p className="text-center text-[13px] text-muted-foreground">Ainda não tem conta? <Link href="/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">Criar conta</Link></p>
    </form>
  );
}

export function SignUpForm({ initialRole }: { initialRole?: "COMPANY" | "ENGINEER" }) {
  const [state, action] = useActionState<ActionState, FormData>(signUp, null);
  const [role, setRole] = useState<"COMPANY" | "ENGINEER">(initialRole ?? "COMPANY");
  const e = state?.errors ?? {};
  const options = [
    { v: "COMPANY" as const, icon: Building2, title: "Sou uma indústria", text: "Quero reduzir desperdício" },
    { v: "ENGINEER" as const, icon: GraduationCap, title: "Sou engenheiro(a)", text: "Estudante ou mentor" },
  ];
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Perfil">
        {options.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={role === o.v} onClick={() => setRole(o.v)}
            className={cn("grid gap-1 rounded-lg border p-3 text-left transition", role === o.v ? "border-foreground bg-subtle ring-1 ring-foreground" : "hover:bg-subtle")}>
            <o.icon className="size-4" />
            <span className="text-[13px] font-medium">{o.title}</span>
            <span className="text-xs text-muted-foreground">{o.text}</span>
          </button>
        ))}
      </div>
      <Field label="Nome completo" htmlFor="su-name" error={e.name}><Input id="su-name" name="name" autoComplete="name" aria-invalid={!!e.name} /></Field>
      <Field label={role === "COMPANY" ? "E-mail de trabalho" : "E-mail"} htmlFor="su-email" error={e.email}><Input id="su-email" name="email" type="email" autoComplete="email" aria-invalid={!!e.email} /></Field>
      <Field label="Senha" htmlFor="su-pass" error={e.password} hint="Mínimo de 8 caracteres"><Input id="su-pass" name="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} /></Field>
      <SubmitButton className="w-full" pendingText="Criando conta…">Criar conta</SubmitButton>
      <p className="text-center text-[13px] text-muted-foreground">Já tem conta? <Link href="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">Entrar</Link></p>
    </form>
  );
}
