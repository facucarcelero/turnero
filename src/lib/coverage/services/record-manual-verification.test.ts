import { describe, expect, it, vi } from "vitest";
import { recordManualVerification } from "./record-manual-verification";
import type { RecordVerificationParams } from "@/lib/coverage/domain/types";

describe("recordManualVerification", () => {
  it("returns the same shape upsertAdminAppointment persists today when there is an insurance provider", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const result = await recordManualVerification(
      {
        insuranceProviderId: "ins-1",
        insuranceVerified: true,
        insuranceVerifiedUntil: " 2026-09-01 ",
      },
      { record }
    );
    expect(result).toEqual({ insuranceVerified: true, insuranceVerifiedUntil: "2026-09-01" });
  });

  it("forces insuranceVerified/insuranceVerifiedUntil to false/null when there is no insurance provider, even if flags were passed", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const result = await recordManualVerification(
      { insuranceProviderId: null, insuranceVerified: true, insuranceVerifiedUntil: "2026-09-01" },
      { record }
    );
    expect(result).toEqual({ insuranceVerified: false, insuranceVerifiedUntil: null });
    expect(record).not.toHaveBeenCalled();
  });

  it("records an ACTIVE audit row with sourceId MANUAL_STAFF when the staff confirms coverage", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    await recordManualVerification(
      { insuranceProviderId: "ins-1", insuranceVerified: true, staffUserId: "user-1" },
      { record }
    );
    const call = record.mock.calls[0][0] as RecordVerificationParams;
    expect(call.result.state).toBe("ACTIVE");
    expect(call.result.sourceId).toBe("MANUAL_STAFF");
    expect(call.source).toBe("ADMIN");
    expect(call.requestedById).toBe("user-1");
  });

  it("records MANUAL_VERIFICATION_REQUIRED when the staff has not confirmed coverage yet", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    await recordManualVerification({ insuranceProviderId: "ins-1", insuranceVerified: false }, { record });
    const call = record.mock.calls[0][0] as RecordVerificationParams;
    expect(call.result.state).toBe("MANUAL_VERIFICATION_REQUIRED");
  });
});
