import type { NextAuthConfig } from "next-auth";

// Configuración "edge-safe": sin Prisma ni bcrypt, para poder usarse en el
// middleware/proxy (que corre en un runtime restringido que no soporta
// addons nativos de Node como el motor de Prisma). auth.ts la extiende
// agregando el provider de credenciales para el resto de la app.
export const authConfig: NextAuthConfig = {
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
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
