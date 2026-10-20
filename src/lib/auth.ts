import "server-only";

import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  findTenantBySlug,
  getRuntimeData,
  type Account,
  updateRuntimeData,
} from "@/lib/storage/json-store";

const SESSION_COOKIE = "consys_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const PASSWORD_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const DUMMY_PASSWORD_HASH = `scrypt$32768$8$1$${"0".repeat(32)}$${"0".repeat(128)}`;
const bootstrapSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(256),
  name: z.string().trim().min(1).max(120),
});
const demoManagerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(120),
});
const demoResidentSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(120),
  unitCode: z.string().trim().min(1).max(32),
});

export type PublicAccount = Pick<
  Account,
  "id" | "email" | "name" | "platformRole"
>;
export type AuthenticatedAccount = PublicAccount &
  Pick<
    Account,
    "tenantIds" | "managerTenantIds" | "unitMemberships" | "active"
  >;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt);

  return `scrypt$32768$8$1$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, n, r, p, saltHex, expectedHex] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    n !== "32768" ||
    r !== "8" ||
    p !== "1" ||
    !/^[a-f0-9]{32}$/.test(saltHex ?? "") ||
    !/^[a-f0-9]{128}$/.test(expectedHex ?? "")
  ) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await deriveKey(password, Buffer.from(saltHex, "hex"));

  return timingSafeEqual(actual, expected);
}

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
      SCRYPT_OPTIONS,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

export async function ensureBootstrapAdmin() {
  const parsed = bootstrapSchema.safeParse({
    email: process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.INITIAL_ADMIN_PASSWORD,
    name: process.env.INITIAL_ADMIN_NAME?.trim() || "Administrador ConSys",
  });
  if (!parsed.success) {
    throw new Error(
      "Configure INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD (mínimo 6 caracteres no modo local) e INITIAL_ADMIN_NAME no ambiente.",
    );
  }

  const { email, password, name } = parsed.data;
  return updateRuntimeData(async (data) => {
    const existingAdmin = data.users.find(
      (user) => user.platformRole === "super_admin",
    );
    if (existingAdmin) {
      return existingAdmin;
    }

    const account: Account = {
      id: randomUUID(),
      email,
      name,
      passwordHash: await hashPassword(password),
      platformRole: "super_admin",
      tenantIds: [],
      managerTenantIds: [],
      unitMemberships: [],
      active: true,
    };
    data.users.push(account);
    return account;
  });
}

async function ensureDemoAccounts() {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.CONSYS_DEMO_JSON !== "true"
  ) {
    return;
  }

  const managerInput = demoManagerSchema.safeParse({
    email: process.env.DEMO_MANAGER_EMAIL?.trim().toLowerCase(),
    password: process.env.DEMO_MANAGER_PASSWORD,
    name: process.env.DEMO_MANAGER_NAME?.trim() || "Síndico Demonstração",
  });
  if (!managerInput.success) {
    throw new Error(
      "Configure DEMO_MANAGER_EMAIL, DEMO_MANAGER_PASSWORD (mínimo 8 caracteres) e DEMO_MANAGER_NAME no ambiente da demonstração.",
    );
  }

  const residentInput = demoResidentSchema.safeParse({
    email: process.env.DEMO_RESIDENT_EMAIL?.trim().toLowerCase(),
    password: process.env.DEMO_RESIDENT_PASSWORD,
    name: process.env.DEMO_RESIDENT_NAME?.trim() || "Morador Demonstração",
    unitCode: process.env.DEMO_RESIDENT_UNIT?.trim() || "Bloco A · 101",
  });
  if (!residentInput.success) {
    throw new Error(
      "Configure DEMO_RESIDENT_EMAIL, DEMO_RESIDENT_PASSWORD (mínimo 8 caracteres), DEMO_RESIDENT_NAME e DEMO_RESIDENT_UNIT no ambiente da demonstração.",
    );
  }
  if (managerInput.data.email === residentInput.data.email) {
    throw new Error(
      "As contas de síndico e morador demo precisam usar emails diferentes.",
    );
  }

  const tenant = await findTenantBySlug("condominio-demo");
  if (!tenant || tenant.status !== "active") {
    throw new Error(
      "O condomínio ativo condominio-demo é necessário para iniciar a conta de demonstração.",
    );
  }

  const demoAccounts = [
    {
      ...managerInput.data,
      managerTenantIds: [tenant.id],
      unitMemberships: [],
    },
    {
      ...residentInput.data,
      managerTenantIds: [],
      unitMemberships: [
        { tenantId: tenant.id, unitCode: residentInput.data.unitCode },
      ],
    },
  ];

  await updateRuntimeData(async (data) => {
    for (const demoAccount of demoAccounts) {
      const existingAccount = data.users.find(
        (user) => user.email === demoAccount.email,
      );
      if (existingAccount) {
        const isManager = demoAccount.managerTenantIds.length > 0;
        const hasExpectedAccess = isManager
          ? existingAccount.managerTenantIds.length === 1 &&
            existingAccount.managerTenantIds[0] === tenant.id &&
            existingAccount.unitMemberships.length === 0
          : existingAccount.managerTenantIds.length === 0 &&
            existingAccount.unitMemberships.length === 1 &&
            existingAccount.unitMemberships[0].tenantId === tenant.id &&
            existingAccount.unitMemberships[0].unitCode ===
              demoAccount.unitMemberships[0].unitCode;
        if (
          !existingAccount.active ||
          existingAccount.platformRole !== null ||
          !existingAccount.tenantIds.includes(tenant.id) ||
          !hasExpectedAccess
        ) {
          throw new Error(
            `A conta demo ${demoAccount.email} já existe com vínculo incompatível.`,
          );
        }
        continue;
      }

      const account: Account = {
        id: randomUUID(),
        email: demoAccount.email,
        name: demoAccount.name,
        passwordHash: await hashPassword(demoAccount.password),
        platformRole: null,
        tenantIds: [tenant.id],
        managerTenantIds: demoAccount.managerTenantIds,
        unitMemberships: demoAccount.unitMemberships,
        active: true,
      };
      data.users.push(account);
    }
  });
}

export async function authenticate(
  email: string,
  password: string,
  requiredRole?: "super_admin" | "resident" | "manager",
) {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.CONSYS_DEMO_JSON !== "true"
  ) {
    await ensureBootstrapAdmin();
  }
  await ensureDemoAccounts();
  const data = await getRuntimeData();
  const account = data.users.find(
    (user) => user.email === email.trim().toLowerCase() && user.active,
  );
  const passwordMatches = await verifyPassword(
    password,
    account?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (
    !account ||
    !passwordMatches ||
    (requiredRole === "super_admin" &&
      account.platformRole !== "super_admin") ||
    (requiredRole === "resident" && account.platformRole !== null) ||
    (requiredRole === "manager" &&
      account.platformRole !== "super_admin" &&
      account.managerTenantIds.length === 0)
  ) {
    return null;
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000,
  ).toISOString();

  await updateRuntimeData((runtime) => {
    runtime.sessions = runtime.sessions.filter(
      (session) => Date.parse(session.expiresAt) > Date.now(),
    );
    runtime.sessions.push({ tokenHash, userId: account.id, expiresAt });
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return toPublicAccount(account);
}

export async function getCurrentAccount(): Promise<AuthenticatedAccount | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) {
    return null;
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const data = await getRuntimeData();
  const session = data.sessions.find(
    (candidate) =>
      candidate.tokenHash === tokenHash &&
      Date.parse(candidate.expiresAt) > Date.now(),
  );
  if (!session) {
    return null;
  }

  const account = data.users.find(
    (candidate) => candidate.id === session.userId && candidate.active,
  );
  return account ? toAuthenticatedAccount(account) : null;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (rawToken && /^[A-Za-z0-9_-]{43}$/.test(rawToken)) {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await updateRuntimeData((data) => {
      data.sessions = data.sessions.filter(
        (session) => session.tokenHash !== tokenHash,
      );
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    platformRole: account.platformRole,
  };
}

function toAuthenticatedAccount(account: Account): AuthenticatedAccount {
  return {
    ...toPublicAccount(account),
    tenantIds: account.tenantIds,
    managerTenantIds: account.managerTenantIds,
    unitMemberships: account.unitMemberships,
    active: account.active,
  };
}
