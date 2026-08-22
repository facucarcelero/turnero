import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@prisma/client";

export function Badge({
  children,
  className,
  color = "slate",
}: {
  children: React.ReactNode;
  className?: string;
  color?: "slate" | "teal" | "amber" | "red" | "green" | "blue";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    teal: "bg-teal-100 text-teal-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Atendido",
  NO_SHOW: "No asistió",
};

const STATUS_COLOR: Record<AppointmentStatus, "slate" | "teal" | "amber" | "red" | "green" | "blue"> = {
  PENDING: "amber",
  CONFIRMED: "teal",
  CANCELLED: "red",
  COMPLETED: "green",
  NO_SHOW: "slate",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>;
}

export { STATUS_LABEL };
