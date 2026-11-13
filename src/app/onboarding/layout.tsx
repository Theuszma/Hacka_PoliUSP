import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh bg-subtle">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
        <Logo href="/onboarding/empresa" />
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="hidden sm:inline">{user.email}</span>
          <form action={signOut}><Button variant="ghost" size="sm">Sair</Button></form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </div>
  );
}
