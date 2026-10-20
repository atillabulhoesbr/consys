import { ArrowLeft, Blocks, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ResidentRegistrationForm } from "@/components/resident-forms";
import { getCurrentAccount } from "@/lib/auth";
import { findTenantBySlug } from "@/lib/storage/json-store";
import {
  canAccessTenantPortal,
  findResidentUnit,
  isValidTenantSlug,
} from "@/lib/tenant-access";

export default async function ResidentRegistrationPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  if (!isValidTenantSlug(client)) notFound();
  const tenant = await findTenantBySlug(client);
  if (!tenant || tenant.status !== "active") notFound();
  const account = await getCurrentAccount();
  if (account) {
    if (findResidentUnit(account, tenant)) redirect(`/${tenant.slug}/app`);
    if (canAccessTenantPortal(account, tenant)) redirect(`/${tenant.slug}`);
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9f3] px-5 py-12 text-[#173b2b]">
      <div className="w-full max-w-md">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#657568] hover:text-[#173b2b]"
          href={`/${tenant.slug}/login`}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para entrar
        </Link>
        <section className="rounded-3xl border border-[#e2e9de] bg-white p-6 shadow-xl shadow-[#24452b]/[0.08] sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#174c36] text-[#d3fa62]">
            <Blocks aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-6 text-sm font-semibold text-[#5c8a32]">
            {tenant.name}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Solicite seu acesso
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Informe seus dados. O síndico confirmará sua unidade e liberará seu
            acesso ao app.
          </p>
          <div className="mt-7">
            <ResidentRegistrationForm client={tenant.slug} />
          </div>
          <div className="mt-6 flex items-start gap-2 border-t border-[#e8eee8] pt-5 text-xs leading-5 text-[#788579]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#5c8a32]"
            />
            A solicitação não revela informações do condomínio nem cria uma
            sessão antes da aprovação.
          </div>
        </section>
      </div>
    </main>
  );
}
