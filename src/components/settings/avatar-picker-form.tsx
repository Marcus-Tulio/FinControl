"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_ICON_KEYS, avatarIconSrc } from "@/lib/avatars";
import { updateAvatar } from "@/server/actions/auth";

export function AvatarPickerForm({ avatarIcon }: { avatarIcon: string | null }) {
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();
  const router = useRouter();

  function choose(icon: string | null) {
    startTransition(async () => {
      const result = await updateAvatar(icon);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(icon ? "Avatar atualizado" : "Avatar removido");
      // AppShell/UserMenu recebem o usuário via Server Component — update({}) só atualiza a sessão
      // do lado do cliente; o refresh é o que faz o avatar no cabeçalho refletir a troca na hora.
      await update({});
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {AVATAR_ICON_KEYS.map((key) => {
          const selected = avatarIcon === key;
          return (
            <button
              key={key}
              type="button"
              disabled={isPending}
              onClick={() => choose(key)}
              aria-label={`Usar avatar ${key}`}
              aria-pressed={selected}
              className={cn(
                "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted transition-colors disabled:opacity-50",
                selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:bg-accent"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarIconSrc(key)} alt="" className="h-full w-full object-cover" />
            </button>
          );
        })}
        {avatarIcon && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => choose(null)}
            aria-label="Remover avatar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
