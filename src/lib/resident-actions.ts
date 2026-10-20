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
  createResidentRegistration,
  createTenantReservation,
  createTenantTicket,
  findTenantBySlug,
  findTenantByAppCode,
  reviewResidentRegistration,
  voteOnTenantPoll,
} from "@/lib/storage/json-store";
import {
  authorizeTenantAdministrator,
  authorizeTenantResident,
} from "@/lib/tenant-authorization";
import { canManageTenant, findResidentUnit, isValidTenantSlug } from "@/lib/tenant-access";

export type ResidentActionState = {
  error: string | null;
  success: string | null;
};

export async function findCondominiumForAppAction(
  _previousState: ResidentActionState,
  formData: FormData,
): Promise<ResidentActionState> {
  const appCode = z.string().trim().email().max(254).safeParse(
    field(formData, "appCode"),
  );
  if (!appCode.success) {
    return { error: "Informe o identificador enviado pelo síndico.", success: null };
  }
  const tenant = await findTenantByAppCode(appCode.data);
  if (!tenant || tenant.status !== "active") {
    return { error: "Não encontramos um condomínio com esse identificador.", success: null };
  }
  redirect(`/${tenant.slug}/login`);
}

const credentialsSchema = z.object({
  client: z.string().refine(isValidTenantSlug),
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

const registrationSchema = z.object({
  client: z.string().refine(isValidTenantSlug),
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
});

const reservationSchema = z.object({
  client: z.string().refine(isValidTenantSlug),
  space: z.string().trim().min(2).max(100),
  date: z.iso.date(),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  guestCount: z.coerce.number().int().min(0).max(200),
});

const ticketSchema = z.object({
  client: z.string().refine(isValidTenantSlug),
  category: z.enum(["maintenance", "noise", "question", "other"]),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(5000),
});

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function residentLoginAction(
  _previousState: ResidentActionState,
  formData: FormData,
): Promise<ResidentActionState> {
  const input = credentialsSchema.safeParse({
    client: field(formData, "client"),
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  if (!input.success) return { error: "Informe um email e uma senha válidos.", success: null };

  const tenant = await findTenantBySlug(input.data.client);
  if (!tenant || tenant.status !== "active") {
    return { error: "Não foi possível acessar esse espaço.", success: null };
  }

  const account = await authenticate(input.data.email, input.data.password);
  const currentAccount = account ? await getCurrentAccount() : null;
  if (!currentAccount) {
    return { error: "Email ou senha inválidos.", success: null };
  }

  if (findResidentUnit(currentAccount, tenant)) {
    redirect(`/${tenant.slug}/app`);
  }
  if (canManageTenant(currentAccount, tenant)) {
    redirect(`/${tenant.slug}`);
  }
  await destroyCurrentSession();
  return { error: "Email ou senha inválidos.", success: null };
}

export async function requestResidentRegistrationAction(
  _previousState: ResidentActionState,
  formData: FormData,
): Promise<ResidentActionState> {
  const input = registrationSchema.safeParse({
    client: field(formData, "client"),
    name: field(formData, "name"),
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  if (!input.success) {
    return {
      error: "Informe nome, email e senha com pelo menos 8 caracteres.",
      success: null,
    };
  }

  const tenant = await findTenantBySlug(input.data.client);
  if (!tenant || tenant.status !== "active") {
    return { error: "Não foi possível solicitar acesso.", success: null };
  }

  const accepted = await createResidentRegistration({
    tenantId: tenant.id,
    name: input.data.name,
    email: input.data.email,
    passwordHash: await hashPassword(input.data.password),
    password: input.data.password,
  });
  if (!accepted) {
    return {
      error: "Já existe uma conta ou solicitação pendente para este email.",
      success: null,
    };
  }

  return {
    error: null,
    success: "Solicitação enviada. O acesso será liberado após aprovação da administração.",
  };
}

export async function createResidentReservationAction(
  _previousState: ResidentActionState,
  formData: FormData,
): Promise<ResidentActionState> {
  const input = reservationSchema.safeParse({
    client: field(formData, "client"),
    space: field(formData, "space"),
    date: field(formData, "date"),
    startsAt: field(formData, "startsAt"),
    endsAt: field(formData, "endsAt"),
    guestCount: field(formData, "guestCount"),
  });
  if (!input.success) return { error: "Confira os dados da reserva.", success: null };

  const context = await authorizeTenantResident(input.data.client);
  if (!context) return { error: "Acesso de morador negado.", success: null };
  if (
    input.data.date < new Date().toISOString().slice(0, 10) ||
    input.data.endsAt <= input.data.startsAt
  ) {
    return { error: "Escolha uma data futura e um horário válido.", success: null };
  }

  const reservation = await createTenantReservation({
    tenantId: context.tenant.id,
    unitCode: context.unitCode,
    requestedBy: context.account.id,
    space: input.data.space,
    date: input.data.date,
    startsAt: input.data.startsAt,
    endsAt: input.data.endsAt,
    guestCount: input.data.guestCount,
  });
  if (!reservation) {
    return { error: "Esse espaço já tem uma solicitação nesse horário.", success: null };
  }

  revalidatePath(`/${input.data.client}/app`);
  revalidatePath(`/${input.data.client}/agenda`);
  revalidatePath(`/${input.data.client}/reservas`);
  return { error: null, success: "Solicitação enviada para a administração." };
}

export async function createResidentTicketAction(
  _previousState: ResidentActionState,
  formData: FormData,
): Promise<ResidentActionState> {
  const input = ticketSchema.safeParse({
    client: field(formData, "client"),
    category: field(formData, "category"),
    title: field(formData, "title"),
    description: field(formData, "description"),
  });
  if (!input.success) return { error: "Confira os dados do chamado.", success: null };

  const context = await authorizeTenantResident(input.data.client);
  if (!context) return { error: "Acesso de morador negado.", success: null };

  await createTenantTicket({
    tenantId: context.tenant.id,
    unitCode: context.unitCode,
    openedBy: context.account.id,
    category: input.data.category,
    title: input.data.title,
    description: input.data.description,
  });
  revalidatePath(`/${input.data.client}/app`);
  revalidatePath(`/${input.data.client}/chamados`);
  return { error: null, success: "Chamado enviado para a administração." };
}

export async function residentVoteInPollAction(formData: FormData) {
  const client = field(formData, "client");
  const announcementId = field(formData, "announcementId");
  const optionIndex = z.coerce.number().int().min(0).max(7).safeParse(
    field(formData, "optionIndex"),
  );
  const context = await authorizeTenantResident(client);
  if (!context || !optionIndex.success) {
    throw new Error("Acesso ou voto inválido.");
  }
  const voted = await voteOnTenantPoll(
    context.tenant.id,
    announcementId,
    context.account.id,
    optionIndex.data,
  );
  if (!voted) throw new Error("Enquete indisponível ou voto já registrado.");
  revalidatePath(`/${client}/app`);
}

export async function reviewResidentRegistrationAction(formData: FormData) {
  const client = field(formData, "client");
  const registrationId = field(formData, "registrationId");
  const decision = z.enum(["approve", "reject"]).safeParse(field(formData, "decision"));
  const unitCode = field(formData, "unitCode");
  const context = await authorizeTenantAdministrator(client);
  if (!context || !decision.success) {
    throw new Error("Acesso ou solicitação inválida.");
  }
  const updated = await reviewResidentRegistration(
    context.tenant.id,
    registrationId,
    decision.data,
    unitCode,
  );
  if (!updated) throw new Error("A solicitação não está mais pendente.");
  revalidatePath(`/${client}/moradores`);
}

export async function residentLogoutAction() {
  await destroyCurrentSession();
  redirect("/");
}
