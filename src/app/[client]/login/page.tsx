import { ArrowLeft, Blocks, ShieldCheck, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ResidentLoginForm } from "@/components/resident-forms";
import { getCurrentAccount } from "@/lib/auth";
import { findTenantBySlug } from "@/lib/storage/json-store";
import {
  canAccessTenantPortal,
  findResidentUnit,
  isValidTenantSlug,
} from "@/lib/tenant-access";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  if (!isValidTenantSlug(client)) {
    notFound();
  }

  const tenant = await findTenantBySlug(client);
  if (!tenant || tenant.status !== "active") {
    notFound();
  }

  const account = await getCurrentAccount();
  if (account) {
    if (findResidentUnit(account, tenant)) redirect(`/${tenant.slug}/app`);
    if (canAccessTenantPortal(account, tenant)) redirect(`/${tenant.slug}`);
    notFound();
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
          <p className="mt-6 text-sm font-semibold text-[#5c8a32]">ConSys</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#173b2b]">
            Acesse o app do condomínio
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Moradores e síndicos entram no espaço de{" "}
            <span className="font-medium text-[#315541]">{tenant.name}</span>.
          </p>
          <div className="mt-7">
            <ResidentLoginForm client={tenant.slug} />
          </div>
          <Link
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#dce5d8] text-sm font-semibold text-[#315541] transition hover:bg-[#f7f9f5]"
            href={`/${tenant.slug}/cadastro`}
          >
            <UserRoundPlus aria-hidden="true" className="size-4" />
            Solicitar acesso de morador
          </Link>
          <div className="mt-6 flex items-start gap-2 border-t border-[#e8eee8] pt-5 text-xs leading-5 text-[#788579]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#5c8a32]"
            />
            O acesso e a unidade são confirmados pela administração.
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-[#788579]">
          ConSys · Uma plataforma MabFy Systems
        </p>
      </div>
    </main>
  );
}
