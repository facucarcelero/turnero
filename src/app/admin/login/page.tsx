import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";
import { initials } from "@/lib/utils";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const clinic = await prisma.clinic.findFirst();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl bg-[var(--brand)] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[var(--brand)]/20 mb-4">
            {initials(clinic?.name ?? "Turnero")}
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{clinic?.name ?? "Turnero"}</h1>
          <p className="text-sm text-slate-500 mt-1">Panel administrativo</p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
