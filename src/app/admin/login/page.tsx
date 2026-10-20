import { ArrowLeft, Blocks, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getCurrentAccount } from "@/lib/auth";
import { hasSupabaseConfiguration } from "@/lib/supabase/server";
import { listTenants } from "@/lib/storage/json-store";

export default async function AdminLoginPage() {
  const supabaseRequired =
    process.env.NODE_ENV === "production" &&
    process.env.CONSYS_DEMO_JSON !== "true" &&
    !hasSupabaseConfiguration();
  const account = await getCurrentAccount();
  if (account?.platformRole === "super_admin") {
    redirect("/admin");
  }
  if (account?.managerTenantIds.length) {
    const tenants = await listTenants();
    const managerTenants = tenants.filter(
      (tenant) =>
        tenant.status === "active" &&
        account.managerTenantIds.includes(tenant.id),
    );
    if (managerTenants.length === 1) redirect(`/${managerTenants[0].slug}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9f3] px-5 py-12 text-[#173b2b]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/2 -z-0 size-[30rem] -translate-x-1/2 rounded-full bg-[#d9f479]/25 blur-3xl"
      />
      <div className="relative z-10 w-full max-w-md">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#657568] transition hover:text-[#173b2b]"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar ao ConSys
        </Link>
        <section className="rounded-2xl border border-[#e2e9de] bg-white p-6 shadow-xl shadow-[#24452b]/[0.08] sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#174c36] text-[#d3fa62]">
            <Blocks aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-6 text-sm font-semibold text-[#5c8a32]">
            ConSys · MabFy
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#173b2b]">
            Acesso administrativo
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Síndicos e administradores entram com email e senha. Não é
            necessário informar o link do condomínio.
          </p>
          {supabaseRequired ? (
            <p
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900"
              role="alert"
            >
              Login indisponível: configure a URL e a chave pública do Supabase
              nas variáveis de ambiente da Vercel e faça um novo deploy.
            </p>
          ) : null}
          <div className="mt-7">
            <AdminLoginForm disabled={supabaseRequired} />
          </div>
          <div className="mt-6 flex items-start gap-2 border-t border-[#e8eee8] pt-5 text-xs leading-5 text-[#788579]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#5c8a32]"
            />
            O ambiente do condomínio é identificado pelo vínculo da sua conta.
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-[#788579]">
          ConSys · Uma plataforma MabFy Systems
        </p>
      </div>
    </main>
  );
}
