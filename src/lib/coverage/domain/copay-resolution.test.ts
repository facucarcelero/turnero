import { describe, expect, it } from "vitest";
import { resolveCopayAmount, type CopayRuleMatch } from "./copay-resolution";

const rule = (over: Partial<CopayRuleMatch>): CopayRuleMatch => ({
  id: "rule-id",
  professionalId: null,
  serviceId: null,
  copaymentAmount: "0.00",
  active: true,
  ...over,
});

describe("resolveCopayAmount", () => {
  it("prefers an exact professional+service match over anything else", () => {
    const rules = [
      rule({ id: "provider-wide", copaymentAmount: "1000.00" }),
      rule({ id: "prof-only", professionalId: "p1", copaymentAmount: "1500.00" }),
      rule({ id: "service-only", serviceId: "s1", copaymentAmount: "1200.00" }),
      rule({ id: "exact", professionalId: "p1", serviceId: "s1", copaymentAmount: "2000.00" }),
    ];
    const result = resolveCopayAmount(rules, { professionalId: "p1", serviceId: "s1" }, "500.00");
    expect(result).toEqual({ amount: "2000.00", source: "rule", ruleId: "exact" });
  });

  it("falls back to professional-only when no exact match exists", () => {
    const rules = [
      rule({ id: "provider-wide", copaymentAmount: "1000.00" }),
      rule({ id: "prof-only", professionalId: "p1", copaymentAmount: "1500.00" }),
    ];
    const result = resolveCopayAmount(rules, { professionalId: "p1", serviceId: "other-service" }, null);
    expect(result).toEqual({ amount: "1500.00", source: "rule", ruleId: "prof-only" });
  });

  it("falls back to service-only when no professional match exists", () => {
    const rules = [
      rule({ id: "provider-wide", copaymentAmount: "1000.00" }),
      rule({ id: "service-only", serviceId: "s1", copaymentAmount: "1200.00" }),
    ];
    const result = resolveCopayAmount(rules, { professionalId: "other-prof", serviceId: "s1" }, null);
    expect(result).toEqual({ amount: "1200.00", source: "rule", ruleId: "service-only" });
  });

  it("falls back to the provider-wide rule when nothing more specific matches", () => {
    const rules = [rule({ id: "provider-wide", copaymentAmount: "1000.00" })];
    const result = resolveCopayAmount(rules, { professionalId: "x", serviceId: "y" }, "999.00");
    expect(result).toEqual({ amount: "1000.00", source: "rule", ruleId: "provider-wide" });
  });

  it("falls back to defaultCopayment when no rule matches at all", () => {
    const result = resolveCopayAmount([], { professionalId: "x", serviceId: "y" }, "300.00");
    expect(result).toEqual({ amount: "300.00", source: "default_copayment", ruleId: null });
  });

  it("returns none when there is no rule and no defaultCopayment", () => {
    const result = resolveCopayAmount([], {}, null);
    expect(result).toEqual({ amount: null, source: "none", ruleId: null });
  });

  it("ignores inactive rules", () => {
    const rules = [rule({ id: "inactive", professionalId: "p1", serviceId: "s1", active: false, copaymentAmount: "5000.00" })];
    const result = resolveCopayAmount(rules, { professionalId: "p1", serviceId: "s1" }, "300.00");
    expect(result).toEqual({ amount: "300.00", source: "default_copayment", ruleId: null });
  });
});
