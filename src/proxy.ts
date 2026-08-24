import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Defensa en profundidad: cada página de /admin ya llama a requirePageRole
// (ver src/lib/actions/guard.ts) para el chequeo de rol específico, pero
// eso depende de que cada página nueva se acuerde de hacerlo. Este proxy
// (antes "middleware", renombrado en esta versión de Next.js) es la red de
// seguridad central: si no hay sesión, nadie ve una página de /admin, sin
// importar si esa página en particular tiene o no su propio guard.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isLoginPage;

  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
