// Layout raíz de /admin: no hace nada por sí mismo. La protección con
// sesión y el shell del panel viven en admin/(protected)/layout.tsx; la
// página de login vive fuera de ese grupo para no quedar atrapada en un
// loop de redirección.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
