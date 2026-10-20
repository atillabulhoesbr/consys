import type { Account, Tenant } from "@/lib/storage/json-store";

type TenantAccessUser = Pick<
  Account,
  "active" | "platformRole" | "tenantIds" | "managerTenantIds" | "unitMemberships"
>;

export function isValidTenantSlug(slug: string) {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    !new Set(["admin", "api", "app", "_next"]).has(slug)
  );
}

export function canAccessTenant(user: TenantAccessUser, tenant: Tenant) {
  if (!user.active || tenant.status !== "active") {
    return false;
  }

  return (
    user.platformRole === "super_admin" ||
    user.tenantIds.includes(tenant.id) ||
    user.managerTenantIds.includes(tenant.id)
  );
}

export function canAccessTenantPortal(user: TenantAccessUser, tenant: Tenant) {
  return canManageTenant(user, tenant);
}

export function canManageTenant(user: TenantAccessUser, tenant: Tenant) {
  return (
    user.active &&
    tenant.status === "active" &&
    (user.platformRole === "super_admin" ||
      user.managerTenantIds.includes(tenant.id))
  );
}

export function findResidentUnit(
  user: TenantAccessUser,
  tenant: Tenant,
): string | null {
  if (
    !user.active ||
    user.platformRole !== null ||
    user.managerTenantIds.includes(tenant.id) ||
    tenant.status !== "active"
  ) {
    return null;
  }

  return (
    user.unitMemberships.find(
      (membership) => membership.tenantId === tenant.id,
    )?.unitCode ?? null
  );
}
