import Link from "next/link";
import { LogoMark } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center justify-items-center gap-4 px-4 text-center">
      <LogoMark size={36} />
      <p className="text-xs font-medium text-muted-foreground">Erro 404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-[13.5px] text-muted-foreground">O endereço pode ter mudado ou o item foi removido.</p>
      <Link href="/" className={buttonVariants()}>Voltar ao início</Link>
    </main>
  );
}
