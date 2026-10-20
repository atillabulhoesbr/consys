import assert from "node:assert/strict";
import test from "node:test";
import type { Account, Tenant } from "@/lib/storage/json-store";
import {
  canAccessTenant,
  canAccessTenantPortal,
  canManageTenant,
  findResidentUnit,
  isValidTenantSlug,
} from "@/lib/tenant-access";

const tenantA: Tenant = {
  id: "0a19f1cb-eeba-4b2d-a80f-239fe03d98fc",
  slug: "condominio-a",
  appCode: "condominio-a@consys.com",
  name: "Condomínio A",
  status: "active",
};

const tenantB: Tenant = {
  id: "e6d372fe-4bb9-4e48-a520-5febbe538d42",
  slug: "condominio-b",
  appCode: "condominio-b@consys.com",
  name: "Condomínio B",
  status: "active",
};

const user: Account = {
  id: "a53094f2-0ce1-4e94-8ff2-f7a73bd8a2fd",
  email: "morador@example.com",
  name: "Morador",
  passwordHash: "not-used-in-this-test",
  platformRole: null,
  tenantIds: [tenantA.id],
  managerTenantIds: [],
  unitMemberships: [{ tenantId: tenantA.id, unitCode: "Bloco A · 402" }],
  active: true,
};

test("tenant member can access only the tenant in their verified membership", () => {
  assert.equal(canAccessTenant(user, tenantA), true);
  assert.equal(canAccessTenant(user, tenantB), false);
});

test("super admin can access every active tenant", () => {
  const admin = { ...user, platformRole: "super_admin" as const, tenantIds: [], managerTenantIds: [] };
  assert.equal(canAccessTenant(admin, tenantA), true);
  assert.equal(canAccessTenant(admin, tenantB), true);
});

test("tenant portal remains closed to accounts without unit-scoped permissions", () => {
  const admin = { ...user, platformRole: "super_admin" as const, tenantIds: [], managerTenantIds: [] };
  const manager = { ...user, managerTenantIds: [tenantA.id] };
  assert.equal(canAccessTenantPortal(user, tenantA), false);
  assert.equal(canAccessTenantPortal(manager, tenantA), true);
  assert.equal(canAccessTenantPortal(manager, tenantB), false);
  assert.equal(canManageTenant(manager, tenantA), true);
  assert.equal(canManageTenant(manager, tenantB), false);
  assert.equal(canManageTenant(user, tenantA), false);
  assert.equal(canAccessTenantPortal(admin, tenantA), true);
  assert.equal(canAccessTenantPortal(admin, tenantB), true);
});

test("resident access is scoped to the approved unit and active tenant", () => {
  assert.equal(findResidentUnit(user, tenantA), "Bloco A · 402");
  assert.equal(findResidentUnit(user, tenantB), null);
  assert.equal(
    findResidentUnit(user, { ...tenantA, status: "suspended" }),
    null,
  );
  assert.equal(
    findResidentUnit(
      { ...user, platformRole: "super_admin" },
      tenantA,
    ),
    null,
  );
});

test("inactive accounts and suspended tenants are denied", () => {
  assert.equal(canAccessTenant({ ...user, active: false }, tenantA), false);
  assert.equal(
    canAccessTenant({ ...user, platformRole: "super_admin" }, {
      ...tenantA,
      status: "suspended",
    }),
    false,
  );
});

test("tenant slugs reject path separators and ambiguous forms", () => {
  assert.equal(isValidTenantSlug("condominio-a"), true);
  assert.equal(isValidTenantSlug("../condominio-b"), false);
  assert.equal(isValidTenantSlug("condominio-a/condominio-b"), false);
  assert.equal(isValidTenantSlug("Condominio-A"), false);
  assert.equal(isValidTenantSlug("admin"), false);
  assert.equal(isValidTenantSlug("api"), false);
  assert.equal(isValidTenantSlug("app"), false);
});
