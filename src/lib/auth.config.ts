import type { NextAuthConfig } from "next-auth";

// Configuración "edge-safe": sin Prisma ni bcrypt, para poder usarse en el
// middleware/proxy (que corre en un runtime restringido que no soporta
// addons nativos de Node como el motor de Prisma). auth.ts la extiende
// agregando el provider de credenciales para el resto de la app.
export const authConfig: NextAuthConfig = {
  // Necesario fuera de Vercel (Netlify, etc.) para que NextAuth confíe en el
  // host que le llega desde el proxy de la plataforma.
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { role: string; professionalId: string | null };
        token.role = u.role;
        token.professionalId = u.professionalId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
        (session.user as { professionalId?: string | null }).professionalId =
          (token.professionalId as string | null | undefined) ?? null;
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
