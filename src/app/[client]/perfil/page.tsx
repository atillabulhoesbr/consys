import Image from "next/image";
import { Home, Mail, MapPin, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ResidentBottomNavigation } from "@/components/resident-bottom-navigation";
import { getCurrentAccount } from "@/lib/auth";
import { findTenantBySlug } from "@/lib/storage/json-store";
import { findResidentUnit, isValidTenantSlug } from "@/lib/tenant-access";

export default async function ResidentProfilePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  if (!isValidTenantSlug(client)) notFound();

  const [tenant, account] = await Promise.all([
    findTenantBySlug(client),
    getCurrentAccount(),
  ]);
  if (!tenant || tenant.status !== "active") notFound();
  if (!account) redirect(`/${tenant.slug}/login`);

  const unitCode = findResidentUnit(account, tenant);
  if (!unitCode) notFound();

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-6 pb-28 text-[#173b2b] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header>
          <p className="text-sm font-semibold text-[#5c8a32]">{tenant.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Meu perfil
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Seus dados de cadastro e unidade no condomínio.
          </p>
        </header>

        <section
          aria-label="Dados do morador"
          className="mt-7 overflow-hidden rounded-2xl border border-[#e5ebe2] bg-white shadow-sm shadow-[#24452b]/[0.04]"
        >
          <div className="flex flex-col items-center border-b border-[#edf1ea] bg-[#f9fbf7] px-5 py-8 text-center">
            <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#e9f1e3] text-[#47713d] shadow-md shadow-[#24452b]/[0.08]">
              {account.avatarUrl ? (
                <Image
                  alt={`Foto de ${account.name}`}
                  className="object-cover"
                  fill
                  priority
                  sizes="112px"
                  src={account.avatarUrl}
                  unoptimized
                />
              ) : (
                <UserRound aria-hidden="true" className="size-12" />
              )}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#788579]">
              Foto de perfil
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {account.name}
            </h2>
          </div>

          <dl className="divide-y divide-[#edf1ea] px-5">
            <div className="flex items-start gap-3 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
                <UserRound aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-[#788579]">Nome</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-[#173b2b]">
                  {account.name}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
                <Mail aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-[#788579]">Email</dt>
                <dd className="mt-1 break-all text-sm font-semibold text-[#173b2b]">
                  {account.email}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
                <Home aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-[#788579]">
                  Apartamento / unidade
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#173b2b]">
                  {unitCode}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
                <MapPin aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-[#788579]">
                  Condomínio
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#173b2b]">
                  {tenant.name}
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>
      <ResidentBottomNavigation
        currentSection="profile"
        tenantSlug={tenant.slug}
      />
    </main>
  );
}
