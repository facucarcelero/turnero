"use client";

import { useEffect, useMemo, useRef } from "react";
import { CalendarDays } from "lucide-react";
import { addDaysStr, todayStr, weekdayName } from "@/lib/time";
import { cn } from "@/lib/utils";

export function DayPicker({
  value,
  onChange,
  maxAdvanceDays,
}: {
  value: string;
  onChange: (date: string) => void;
  maxAdvanceDays: number;
}) {
  const today = todayStr();
  const days = useMemo(
    () => Array.from({ length: maxAdvanceDays }, (_, i) => addDaysStr(today, i)),
    [today, maxAdvanceDays]
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  return (
    <div>
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 snap-x"
      >
        {days.map((d) => {
          const active = d === value;
          const dt = new Date(d + "T00:00:00");
          return (
            <button
              key={d}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onChange(d)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border px-3.5 py-2.5 min-w-[58px] shrink-0 snap-start transition",
                active
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              <span className={cn("text-[11px] uppercase", active ? "text-white/80" : "text-slate-400")}>
                {weekdayName(dt.getDay(), true)}
              </span>
              <span className="text-base font-semibold">{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-500 cursor-pointer w-fit">
        <CalendarDays className="size-4" />
        <span>Ir a una fecha puntual</span>
        <input
          type="date"
          min={today}
          max={addDaysStr(today, maxAdvanceDays - 1)}
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
        />
      </label>
    </div>
  );
}
