import { describe, expect, it } from "vitest";
import { maskMemberNumber, redactForLog } from "./redact";

describe("maskMemberNumber", () => {
  it("masks all but the last 4 characters", () => {
    expect(maskMemberNumber("123456789")).toBe("*****6789");
  });

  it("masks short values entirely", () => {
    expect(maskMemberNumber("123")).toBe("***");
  });

  it("returns null for empty/nullish input", () => {
    expect(maskMemberNumber(null)).toBeNull();
    expect(maskMemberNumber(undefined)).toBeNull();
    expect(maskMemberNumber("   ")).toBeNull();
  });
});

describe("redactForLog", () => {
  it("redacts sensitive keys case-insensitively, recursively", () => {
    const result = redactForLog({
      dni: "35123456",
      Patient: { CUIL: "20351234569", name: "Juan" },
      memberNumber: "123456789",
      token: "abc",
      credentials: { password: "hunter2" },
      note: "ok",
    }) as Record<string, unknown>;

    expect(result.dni).toBe("[REDACTED]");
    expect((result.Patient as Record<string, unknown>).CUIL).toBe("[REDACTED]");
    expect((result.Patient as Record<string, unknown>).name).toBe("Juan");
    expect(result.memberNumber).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
    // La clave "credentials" en sí matchea como sensible, así que todo el
    // objeto se redacta de una (más seguro que recursar y arriesgar dejar
    // pasar un campo sensible con nombre inesperado adentro).
    expect(result.credentials).toBe("[REDACTED]");
    expect(result.note).toBe("ok");
  });

  it("redacts inside arrays", () => {
    const result = redactForLog([{ dni: "1" }, { name: "ok" }]) as Record<string, unknown>[];
    expect(result[0].dni).toBe("[REDACTED]");
    expect(result[1].name).toBe("ok");
  });
});
