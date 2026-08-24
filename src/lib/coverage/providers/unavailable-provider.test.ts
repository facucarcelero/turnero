import { describe, expect, it } from "vitest";
import { createUnavailableProvider } from "./unavailable-provider";
import { NON_CONFIRMING_STATES, isConfirmedActive } from "@/lib/coverage/domain/types";

describe("createUnavailableProvider", () => {
  it("always reports NOT_AVAILABLE and MANUAL_VERIFICATION_REQUIRED", async () => {
    const provider = createUnavailableProvider("PAMI");
    expect(provider.connectorStatus).toBe("NOT_AVAILABLE");

    const result = await provider.checkCoverage({
      insuranceProviderId: "ins-1",
      connectorKey: "PAMI",
    });

    expect(result.state).toBe("MANUAL_VERIFICATION_REQUIRED");
    expect(result.connectorStatus).toBe("NOT_AVAILABLE");
    expect(result.sourceId).toBe("UNAVAILABLE_OFFICIAL:PAMI");
  });

  it("never produces a result that isConfirmedActive() would treat as active", async () => {
    const provider = createUnavailableProvider("OSDE");
    const result = await provider.checkCoverage({ insuranceProviderId: "ins-1", connectorKey: "OSDE" });

    expect(isConfirmedActive(result.state, result.connectorStatus)).toBe(false);
    expect(NON_CONFIRMING_STATES).toContain(result.state);
  });
});
