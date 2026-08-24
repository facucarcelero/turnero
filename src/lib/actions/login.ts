"use server";

import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | null;

const LOGIN_ATTEMPT_LIMIT = 8;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
// Más permisivo que el límite por email: sólo frena a alguien rotando
// muchos emails distintos desde la misma IP para tantear cuentas válidas.
const LOGIN_IP_ATTEMPT_LIMIT = 30;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/admin";

  // Límite por email (fuerza bruta de contraseña) y por IP (tanteo de
  // muchas cuentas distintas desde el mismo origen).
  const ip = await clientIp();
  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit(`login:${email?.toLowerCase().trim()}`, LOGIN_ATTEMPT_LIMIT, LOGIN_ATTEMPT_WINDOW_MS),
    checkRateLimit(`login:ip:${ip}`, LOGIN_IP_ATTEMPT_LIMIT, LOGIN_ATTEMPT_WINDOW_MS),
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryAfterSeconds = Math.max(
      emailLimit.allowed ? 0 : emailLimit.retryAfterSeconds,
      ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds
    );
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return { error: `Demasiados intentos. Probá de nuevo en ${minutes} minuto(s).` };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw error;
  }
}
