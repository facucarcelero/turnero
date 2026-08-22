import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Stethoscope,
  UserCog,
  Clock,
  CalendarX2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/turnos", label: "Turnos", icon: ClipboardList },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/servicios", label: "Servicios", icon: Stethoscope },
  { href: "/admin/profesionales", label: "Profesionales", icon: UserCog },
  { href: "/admin/horarios", label: "Horarios", icon: Clock },
  { href: "/admin/bloqueos", label: "Bloqueos", icon: CalendarX2 },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

// Los primeros 4 van en la barra inferior móvil; el resto vive en "Más".
export const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 4);
export const MOBILE_MORE = NAV_ITEMS.slice(4);
