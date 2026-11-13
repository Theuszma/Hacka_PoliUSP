import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-content-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted">O endereço pode ter mudado ou o item foi removido.</p>
      <Link href="/" className="btn btn-primary justify-self-center">Voltar ao início</Link>
    </main>
  );
}
