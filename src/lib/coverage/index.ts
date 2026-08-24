import "server-only";
import { verifyCoverage as verifyCoverageCore, type VerifyCoverageInput } from "@/lib/coverage/services/verify-coverage";
import {
  recordManualVerification as recordManualVerificationCore,
  type RecordManualVerificationInput,
} from "@/lib/coverage/services/record-manual-verification";
import { recordCoverageVerification } from "@/lib/coverage/repositories/coverage-verification-repo";

export * from "@/lib/coverage/domain/types";

export async function verifyCoverage(input: VerifyCoverageInput) {
  return verifyCoverageCore(input, { record: recordCoverageVerification });
}

export async function recordManualVerification(input: RecordManualVerificationInput) {
  return recordManualVerificationCore(input, { record: recordCoverageVerification });
}
