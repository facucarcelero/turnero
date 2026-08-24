import { describe, expect, it, vi } from "vitest";
import { verifyCoverage } from "./verify-coverage";
import type { RecordVerificationParams } from "@/lib/coverage/domain/types";
import { isConfirmedActive } from "@/lib/coverage/domain/types";

describe("verifyCoverage", () => {
  it("resolves to the stub connector's result and persists an audit record via the injected repo", async () => {
    const record = vi.fn().mockResolvedValue(undefined);

    const result = await verifyCoverage(
      {
        insuranceProviderId: "ins-1",
        memberNumber: "123456789",
        source: "ONLINE",
        appointmentId: "appt-1",
        patientId: "pat-1",
      },
      { record }
    );

    expect(result.state).toBe("MANUAL_VERIFICATION_REQUIRED");
    expect(result.connectorStatus).toBe("NOT_AVAILABLE");
    expect(record).toHaveBeenCalledTimes(1);

    const call = record.mock.calls[0][0] as RecordVerificationParams;
    expect(call.request.insuranceProviderId).toBe("ins-1");
    expect(call.source).toBe("ONLINE");
    expect(call.appointmentId).toBe("appt-1");
    expect(call.patientId).toBe("pat-1");
  });

  it("never persists or returns a result that isConfirmedActive() would treat as active, since no real connector exists yet", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const result = await verifyCoverage({ insuranceProviderId: "ins-1", source: "ADMIN" }, { record });

    expect(isConfirmedActive(result.state, result.connectorStatus)).toBe(false);
  });

  it("falls back to the DEFAULT connector for an unknown connectorKey without throwing", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const result = await verifyCoverage(
      { insuranceProviderId: "ins-1", connectorKey: "SOME_UNKNOWN_KEY", source: "ONLINE" },
      { record }
    );
    expect(result.connectorStatus).toBe("NOT_AVAILABLE");
  });

  it("passes the raw member number to the connector but never to the recorded request in cleartext beyond what the repo redacts", async () => {
    // La redacción real ocurre en la capa de repositorio (maskMemberNumber);
    // acá sólo verificamos que verifyCoverage no la evita ni la duplica.
    const record = vi.fn().mockResolvedValue(undefined);
    await verifyCoverage({ insuranceProviderId: "ins-1", memberNumber: "999999999", source: "ONLINE" }, { record });
    const call = record.mock.calls[0][0] as RecordVerificationParams;
    expect(call.request.memberNumber).toBe("999999999");
  });
});
