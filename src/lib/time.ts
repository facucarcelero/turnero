// Todas las fechas se manejan como strings "YYYY-MM-DD" y las horas como "HH:mm",
// siempre en la zona horaria local de la clínica. Esto evita problemas de husos horarios
// ya que el turnero es de una sola clínica/localidad.

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function parseDateStr(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysStr(date: string, days: number): string {
  const d = parseDateStr(date);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function weekdayOf(date: string): number {
  return parseDateStr(date).getDay();
}

export function weekdayName(weekday: number, short = false): string {
  return short ? WEEKDAY_SHORT[weekday] : WEEKDAY_NAMES[weekday];
}

export function formatDateLong(date: string): string {
  const d = parseDateStr(date);
  return `${WEEKDAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDateShort(date: string): string {
  const d = parseDateStr(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatDateMedium(date: string): string {
  const d = parseDateStr(date);
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isPastDateTime(date: string, time: string): boolean {
  const now = new Date();
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  return dt.getTime() < now.getTime();
}

export function minutesFromNow(date: string, time: string): number {
  const now = new Date();
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  return (dt.getTime() - now.getTime()) / 60000;
}

export function monthLabel(date: string): string {
  const d = parseDateStr(date);
  return `${MONTH_NAMES[d.getMonth()][0].toUpperCase()}${MONTH_NAMES[d.getMonth()].slice(1)} ${d.getFullYear()}`;
}

export function startOfMonthStr(date: string): string {
  const d = parseDateStr(date);
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function daysInMonth(date: string): number {
  const d = parseDateStr(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
