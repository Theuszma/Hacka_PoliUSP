import Link from "next/link";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "./ui/button";
import { cn } from "./ui/cn";

/** Cabeçalho das páginas públicas. `dark` é usado sobre o hero escuro da landing. */
export function PublicHeader({ loggedHref, dark }: { loggedHref?: string | null; dark?: boolean }) {
  return (
    <header className={cn("sticky top-0 z-40 border-b backdrop-blur", dark ? "dark border-white/10 bg-zinc-950/95 text-white" : "bg-background/80")}>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className={cn("hidden items-center gap-5 text-[13.5px] md:flex", dark ? "text-zinc-400" : "text-muted-foreground")}>
          <a href="/#como-funciona" className="transition hover:text-foreground">Como funciona</a>
          <a href="/#industrias" className="transition hover:text-foreground">Indústrias</a>
          <a href="/#engenheiros" className="transition hover:text-foreground">Engenheiros</a>
          <Link href="/impacto" className="transition hover:text-foreground">Impacto</Link>
          <Link href="/metodologia" className="transition hover:text-foreground">Metodologia</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {loggedHref ? (
            <Link href={loggedHref} className={buttonVariants({ size: "sm", variant: dark ? "brand" : "default" })}>Abrir painel</Link>
          ) : (
            <>
              <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>Entrar</Link>
              <Link href="/cadastro" className={buttonVariants({ size: "sm", variant: dark ? "brand" : "default" })}>Criar conta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="dark border-t border-white/10 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-[13px] text-zinc-400">Rede de indústria circular: diagnóstico de perdas, troca de resíduos e engenharia aplicada para PMEs.</p>
        </div>
        <div className="grid content-start gap-2 text-[13px] text-zinc-400">
          <p className="font-medium text-white">Produto</p>
          <a href="/#como-funciona" className="hover:text-white">Como funciona</a>
          <Link href="/impacto" className="hover:text-white">Impacto da rede</Link>
          <Link href="/metodologia" className="hover:text-white">Como calculamos</Link>
          <Link href="/cadastro" className="hover:text-white">Criar conta</Link>
        </div>
        <div className="grid content-start gap-2 text-[13px] text-zinc-400">
          <p className="font-medium text-white">Hack@Poli 2026</p>
          <p>Indústria nacional · ODS 9 e 12</p>
          <p>Empresas e números da rede piloto são fictícios.</p>
        </div>
      </div>
    </footer>
  );
}
