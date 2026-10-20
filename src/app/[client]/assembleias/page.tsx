import { notFound, redirect } from "next/navigation";
import { ResidentAssembliesHistory } from "@/components/resident-assemblies-history";
import { ResidentBottomNavigation } from "@/components/resident-bottom-navigation";
import { getCurrentAccount } from "@/lib/auth";
import { listTenantAnnouncements, findTenantBySlug } from "@/lib/storage/json-store";
import { findResidentUnit, isValidTenantSlug } from "@/lib/tenant-access";

export default async function ResidentAssembliesPage({
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
  if (!findResidentUnit(account, tenant)) notFound();

  const announcements = await listTenantAnnouncements(tenant.id);
  const assemblies = announcements
    .filter((announcement) => announcement.category === "assembly")
    .map(({ id, title, content, publishedAt }) => ({
      id,
      title,
      content,
      publishedAt,
    }));

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-6 pb-28 text-[#173b2b] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header>
          <p className="text-sm font-semibold text-[#5c8a32]">{tenant.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Atas e assembleias
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Consulte as próximas reuniões e encontre registros anteriores.
          </p>
        </header>

        <div className="mt-7">
          <ResidentAssembliesHistory assemblies={assemblies} />
        </div>
      </div>
      <ResidentBottomNavigation
        currentSection="assemblies"
        tenantSlug={tenant.slug}
      />
    </main>
  );
}
