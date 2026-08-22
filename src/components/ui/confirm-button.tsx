"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfirmButton({
  action,
  confirmText = "¿Confirmás esta acción?",
  successText = "Listo",
  className,
  icon,
  label,
}: {
  action: () => Promise<{ success?: boolean; error?: string }>;
  confirmText?: string;
  successText?: string;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setConfirming(false);
    startTransition(async () => {
      const res = await action();
      if (res.error) toast.error(res.error);
      else toast.success(successText);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={confirming ? confirmText : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg p-1.5 cursor-pointer transition disabled:opacity-50",
        confirming
          ? "bg-red-600 text-white hover:bg-red-700"
          : "text-slate-400 hover:bg-red-50 hover:text-red-600",
        className
      )}
    >
      {icon ?? <Trash2 className="size-4" />}
      {confirming && !label && <span className="text-xs font-medium pr-1">¿Seguro?</span>}
      {label && <span className="text-sm">{confirming ? "¿Confirmar?" : label}</span>}
    </button>
  );
}
