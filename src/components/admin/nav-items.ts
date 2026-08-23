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
  UserCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * El menú se arma según el rol y si el usuario tiene un perfil de
 * profesional vinculado (autogestión): las secciones de configuración
 * global de la clínica sólo las ve quien tiene rol ADMIN u OWNER.
 */
export function getNavItems(role: string, isLinkedProfessional: boolean): NavItem[] {
  const isManager = role === "OWNER" || role === "ADMIN";

  const items: NavItem[] = [
    { href: "/admin", label: "Inicio", icon: LayoutDashboard },
    { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/admin/turnos", label: "Turnos", icon: ClipboardList },
    { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  ];

  if (isManager) {
    items.push(
      { href: "/admin/servicios", label: "Servicios", icon: Stethoscope },
      { href: "/admin/profesionales", label: "Profesionales", icon: UserCog },
      { href: "/admin/obras-sociales", label: "Obras sociales", icon: ShieldCheck }
    );
  }

  if (isManager || isLinkedProfessional) {
    items.push({ href: "/admin/horarios", label: isManager ? "Horarios" : "Mi horario", icon: Clock });
    items.push({ href: "/admin/bloqueos", label: isManager ? "Bloqueos" : "Mis bloqueos", icon: CalendarX2 });
  }

  if (isLinkedProfessional) {
    items.push({ href: "/admin/mi-perfil", label: "Mi perfil", icon: UserCircle });
  }

  if (isManager) {
    items.push({ href: "/admin/configuracion", label: "Configuración", icon: Settings });
  }

  return items;
}

export function splitMobileNav(items: NavItem[]) {
  return { primary: items.slice(0, 4), more: items.slice(4) };
}
