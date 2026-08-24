import { describe, expect, it } from "vitest";
import { computeTotals, findMatchingCombo } from "./combo-totals";

describe("computeTotals", () => {
  it("sums individual service price/duration when there is no combo", () => {
    const services = [
      { price: 1000, durationMin: 30 },
      { price: 500, durationMin: 15 },
    ];
    expect(computeTotals(services, null)).toEqual({ totalPrice: 1500, totalDurationMin: 45 });
  });

  it("uses the combo's own price/duration when present", () => {
    const services = [
      { price: 1000, durationMin: 30 },
      { price: 500, durationMin: 15 },
    ];
    const combo = { id: "combo-1", price: 1200, durationMin: 40 };
    expect(computeTotals(services, combo)).toEqual({ totalPrice: 1200, totalDurationMin: 40 });
  });

  it("falls back to the sum for whichever combo field is null", () => {
    const services = [{ price: 1000, durationMin: 30 }];
    const combo = { id: "combo-1", price: null, durationMin: 45 };
    expect(computeTotals(services, combo)).toEqual({ totalPrice: 1000, totalDurationMin: 45 });
  });
});

describe("findMatchingCombo", () => {
  const combos = [
    { id: "c1", price: 100, durationMin: 20, serviceIds: ["a", "b"] },
    { id: "c2", price: 200, durationMin: 40, serviceIds: ["a", "b", "c"] },
  ];

  it("matches a combo regardless of the order of serviceIds", () => {
    expect(findMatchingCombo(["b", "a"], combos)?.id).toBe("c1");
  });

  it("returns null when fewer than 2 services are selected", () => {
    expect(findMatchingCombo(["a"], combos)).toBeNull();
  });

  it("returns null when no combo matches the exact set", () => {
    expect(findMatchingCombo(["a", "c"], combos)).toBeNull();
  });

  it("does not match a subset or superset of a combo's services", () => {
    expect(findMatchingCombo(["a", "b", "c", "d"], combos)).toBeNull();
  });
});
