import { notFound, redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { findTenantBySlug } from "@/lib/storage/json-store";
import {
  canAccessTenantPortal,
  isValidTenantSlug,
} from "@/lib/tenant-access";
import { TenantSidebar } from "@/components/tenant-sidebar";
import { listResidentRegistrations } from "@/lib/storage/json-store";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
  if (!account) {
    redirect(`/${tenant.slug}/login`);
  }

  if (!canAccessTenantPortal(account, tenant)) {
    notFound();
  }
  const pendingResidentCount = (
    await listResidentRegistrations(tenant.id)
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f9f5] md:flex">
      <TenantSidebar
        tenant={tenant}
        account={account}
        pendingResidentCount={pendingResidentCount}
      />
      <div className="min-w-0 flex-1">
        {process.env.NODE_ENV === "production" &&
        process.env.CONSYS_DEMO_JSON === "true" ? (
          <p className="border-b border-[#ead9aa] bg-[#fff8e7] px-5 py-2 text-center text-xs leading-5 text-[#76591d]">
            Ambiente de demonstração: alterações em dados podem ser temporárias
            e não aparecer para outros usuários.
          </p>
        ) : null}
        <main>{children}</main>
      </div>
    </div>
  );
}
