import { describe, expect, it, vi } from "vitest";
import { dedupe } from "./dedupe";

describe("dedupe", () => {
  it("shares the same promise across concurrent calls with the same key", async () => {
    let calls = 0;
    const slowFn = () =>
      new Promise<string>((resolve) => {
        calls++;
        setTimeout(() => resolve("result"), 20);
      });

    const [a, b, c] = await Promise.all([
      dedupe("key-1", slowFn),
      dedupe("key-1", slowFn),
      dedupe("key-1", slowFn),
    ]);

    expect(calls).toBe(1);
    expect(a).toBe("result");
    expect(b).toBe("result");
    expect(c).toBe("result");
  });

  it("does not dedupe calls with different keys", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await Promise.all([dedupe("key-a", fn), dedupe("key-b", fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("allows a new call after the in-flight promise settles", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await dedupe("key-1", fn);
    await dedupe("key-1", fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not cache a rejected promise", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce("ok");
    await expect(dedupe("key-1", fn)).rejects.toThrow("boom");
    await expect(dedupe("key-1", fn)).resolves.toBe("ok");
  });
});
