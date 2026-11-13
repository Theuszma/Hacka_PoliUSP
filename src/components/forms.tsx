"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/app/actions";
import { Button, type ButtonProps } from "./ui/button";

/** Botão de envio com estado de carregamento. */
export function SubmitButton({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingText ?? children : children}
    </Button>
  );
}

/** Executa uma Server Action com campos fixos e mostra o resultado como toast. */
export function ActionButton({ action, fields, children, onDone, ...props }: ButtonProps & {
  action: (fd: FormData) => Promise<ActionState | void>;
  fields: Record<string, string>;
  children: ReactNode;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      disabled={pending || props.disabled}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
          const res = await action(fd);
          if (res?.message) (res.ok ? toast.success : toast.error)(res.message);
          onDone?.();
          router.refresh();
        })
      }
      {...props}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
