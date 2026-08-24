import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  addDaysStr,
  daysInMonth,
  isPastDateTime,
  minutesFromNow,
  minutesToTime,
  startOfMonthStr,
  timeToMinutes,
  toDateStr,
  weekdayOf,
} from "./time";

describe("timeToMinutes / minutesToTime", () => {
  it("converts HH:mm to minutes and back", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(1439)).toBe("23:59");
  });
});

describe("addDaysStr", () => {
  it("adds and subtracts days, including across month/year boundaries", () => {
    expect(addDaysStr("2026-08-21", 1)).toBe("2026-08-22");
    expect(addDaysStr("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysStr("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysStr("2026-08-21", -1)).toBe("2026-08-20");
  });
});

describe("weekdayOf", () => {
  it("returns the correct day of week (0=domingo)", () => {
    // 2026-08-24 es lunes
    expect(weekdayOf("2026-08-24")).toBe(1);
    // 2026-08-23 es domingo
    expect(weekdayOf("2026-08-23")).toBe(0);
  });
});

describe("daysInMonth / startOfMonthStr", () => {
  it("computes days in month including February in a leap year", () => {
    expect(daysInMonth("2026-02-01")).toBe(28);
    expect(daysInMonth("2028-02-01")).toBe(29); // 2028 es bisiesto
    expect(daysInMonth("2026-08-01")).toBe(31);
  });

  it("returns the first day of the month", () => {
    expect(startOfMonthStr("2026-08-21")).toBe("2026-08-01");
  });
});

describe("isPastDateTime / minutesFromNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 24, 12, 0, 0)); // 2026-08-24 12:00 local
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats a past datetime as past", () => {
    expect(isPastDateTime("2026-08-24", "11:00")).toBe(true);
    expect(isPastDateTime("2026-08-23", "12:00")).toBe(true);
  });

  it("treats a future datetime as not past", () => {
    expect(isPastDateTime("2026-08-24", "13:00")).toBe(false);
    expect(isPastDateTime("2026-08-25", "12:00")).toBe(false);
  });

  it("computes minutes from now, positive for future and negative for past", () => {
    expect(minutesFromNow("2026-08-24", "13:00")).toBe(60);
    expect(minutesFromNow("2026-08-24", "11:00")).toBe(-60);
  });
});

describe("toDateStr", () => {
  it("pads month/day with leading zeros", () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
