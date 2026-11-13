import Link from "next/link";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "./ui/button";

export function PublicHeader({ loggedHref }: { loggedHref?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-5 text-[13.5px] text-muted-foreground md:flex">
          <a href="/#como-funciona" className="hover:text-foreground">Como funciona</a>
          <a href="/#industrias" className="hover:text-foreground">Indústrias</a>
          <a href="/#engenheiros" className="hover:text-foreground">Engenheiros</a>
          <Link href="/impacto" className="hover:text-foreground">Impacto</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {loggedHref ? (
            <Link href={loggedHref} className={buttonVariants({ size: "sm" })}>Abrir painel</Link>
          ) : (
            <>
              <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>Entrar</Link>
              <Link href="/cadastro" className={buttonVariants({ size: "sm" })}>Criar conta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:px-6">
        <Logo />
        <p>Projeto do Hack@Poli 2026 · Indústria nacional, ODS 9 e 12. Empresas e números da rede piloto são fictícios.</p>
      </div>
    </footer>
  );
}
