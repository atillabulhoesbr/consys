"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticate,
  destroyCurrentSession,
  getCurrentAccount,
  hashPassword,
} from "@/lib/auth";
import {
  createTenant,
  findTenantBySlug,
  listTenants,
} from "@/lib/storage/json-store";
import { canManageTenant, isValidTenantSlug } from "@/lib/tenant-access";

export type LoginState = {
  error: string | null;
};

export type AdminLoginState = {
  error: string | null;
};

export type CreateTenantState = {
  error: string | null;
  success: string | null;
};

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(63)
    .refine(isValidTenantSlug),
  managerName: z.string().trim().min(2).max(120),
  managerEmail: z.string().email().max(254),
  managerPassword: z.string().min(8).max(256),
});

const loginSchema = z.object({
  client: z.string().refine(isValidTenantSlug),
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const input = loginSchema.safeParse({
    client: formData.get("client"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!input.success) {
    return { error: "Informe um email e uma senha válidos." };
  }

  const tenant = await findTenantBySlug(input.data.client);
  if (!tenant || tenant.status !== "active") {
    return { error: "Não foi possível acessar esse espaço." };
  }

  const account = await authenticate(
    input.data.email,
    input.data.password,
    "manager",
  );
  const authenticatedAccount = account ? await getCurrentAccount() : null;
  if (
    !authenticatedAccount ||
    !canManageTenant(authenticatedAccount, tenant)
  ) {
    if (authenticatedAccount) await destroyCurrentSession();
    return { error: "Email ou senha inválidos." };
  }

  redirect(`/${tenant.slug}`);
}

export async function adminLoginAction(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const input = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!input.success) {
    return { error: "Informe um email e uma senha válidos." };
  }

  const account = await authenticate(
    input.data.email,
    input.data.password,
    "manager",
  );
  if (!account) {
    return { error: "Email ou senha inválidos." };
  }

  const authenticatedAccount = await getCurrentAccount();
  if (authenticatedAccount?.platformRole === "super_admin") {
    redirect("/admin");
  }

  const tenants = await listTenants();
  const managerTenants = tenants.filter(
    (tenant) =>
      tenant.status === "active" &&
      authenticatedAccount?.managerTenantIds.includes(tenant.id),
  );
  if (managerTenants.length !== 1) {
    await destroyCurrentSession();
    return {
      error:
        "Esta conta precisa estar vinculada a um único condomínio ativo para acessar a gestão.",
    };
  }

  redirect(`/${managerTenants[0].slug}`);
}

export async function createTenantAction(
  _previousState: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  const account = await getCurrentAccount();
  if (!account || account.platformRole !== "super_admin") {
    return { error: "Sua sessão administrativa expirou.", success: null };
  }

  const input = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    managerName: formData.get("managerName"),
    managerEmail: formData.get("managerEmail"),
    managerPassword: formData.get("managerPassword"),
  });
  if (!input.success) {
    return {
      error: "Informe um nome e um identificador válidos (ex.: meu-condominio).",
      success: null,
    };
  }

  const tenant = await createTenant(input.data.name, input.data.slug, {
    name: input.data.managerName,
    email: input.data.managerEmail,
    passwordHash: await hashPassword(input.data.managerPassword),
    password: input.data.managerPassword,
  });
  if (!tenant) {
    return {
      error: "Esse identificador ou email de síndico já está em uso.",
      success: null,
    };
  }

  revalidatePath("/admin");
  return {
    error: null,
    success: `${tenant.name} foi adicionado à lista de clientes.`,
  };
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/");
}

export async function adminLogoutAction() {
  await destroyCurrentSession();
  redirect("/admin/login");
}
