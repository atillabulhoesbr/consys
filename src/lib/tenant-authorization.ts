import "server-only";

import { getCurrentAccount } from "@/lib/auth";
import { findTenantBySlug } from "@/lib/storage/json-store";
import {
  canManageTenant,
  canAccessTenantPortal,
  findResidentUnit,
  isValidTenantSlug,
} from "@/lib/tenant-access";

export async function authorizeTenant(slug: string) {
  if (!isValidTenantSlug(slug)) {
    return null;
  }

  const [account, tenant] = await Promise.all([
    getCurrentAccount(),
    findTenantBySlug(slug),
  ]);
  if (
    !account ||
    !tenant ||
    !canAccessTenantPortal(account, tenant)
  ) {
    return null;
  }

  return { account, tenant };
}

export async function authorizeTenantAdministrator(slug: string) {
  const context = await authorizeTenant(slug);
  return context && canManageTenant(context.account, context.tenant)
    ? context
    : null;
}

export async function authorizeTenantResident(slug: string) {
  if (!isValidTenantSlug(slug)) return null;

  const [account, tenant] = await Promise.all([
    getCurrentAccount(),
    findTenantBySlug(slug),
  ]);
  if (!account || !tenant) return null;

  const unitCode = findResidentUnit(account, tenant);
  return unitCode ? { account, tenant, unitCode } : null;
}
