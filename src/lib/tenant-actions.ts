"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createTenantAnnouncement,
  createTenantCharge,
  markChargePaid,
  respondToTenantTicket,
  updateTenantReservation,
} from "@/lib/storage/json-store";
import { authorizeTenantAdministrator } from "@/lib/tenant-authorization";

export type ModuleActionState = {
  error: string | null;
  success: string | null;
};

const initialError = "Confira os campos informados.";

const chargeSchema = z.object({
  client: z.string().min(1),
  unitCode: z.string().trim().min(1).max(32),
  description: z.string().trim().min(2).max(160),
  competence: z.string().trim().min(1).max(40),
  dueDate: z.iso.date(),
  amount: z
    .string()
    .regex(/^\d{1,7}(?:\.\d{1,2})?$/)
    .refine((amount) => Number(amount) > 0),
});

const announcementSchema = z.object({
  client: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  content: z.string().trim().min(2).max(10000),
  category: z.enum(["general", "maintenance", "assembly", "conviviality"]),
  priority: z.enum(["normal", "urgent"]),
  pinned: z.enum(["yes", "no"]),
  pollQuestion: z.string().trim().max(500),
  pollOptions: z.string().trim().max(1600),
});

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function modulePath(client: string, section: string) {
  return `/${client}${section ? `/${section}` : ""}`;
}

function failure(): ModuleActionState {
  return { error: initialError, success: null };
}

export async function createChargeAction(
  _previousState: ModuleActionState,
  formData: FormData,
): Promise<ModuleActionState> {
  const input = chargeSchema.safeParse({
    client: field(formData, "client"),
    unitCode: field(formData, "unitCode"),
    description: field(formData, "description"),
    competence: field(formData, "competence"),
    dueDate: field(formData, "dueDate"),
    amount: field(formData, "amount"),
  });
  if (!input.success) return failure();

  const context = await authorizeTenantAdministrator(input.data.client);
  if (!context) return { error: "Acesso administrativo negado.", success: null };

  await createTenantCharge({
    tenantId: context.tenant.id,
    unitCode: input.data.unitCode,
    description: input.data.description,
    competence: input.data.competence,
    dueDate: input.data.dueDate,
    amountCents: Math.round(Number(input.data.amount) * 100),
  });
  revalidatePath(modulePath(input.data.client, "taxas"));
  return { error: null, success: "Cobrança registrada." };
}

export async function markChargePaidAction(formData: FormData) {
  const client = field(formData, "client");
  const chargeId = field(formData, "chargeId");
  const context = await authorizeTenantAdministrator(client);
  if (!context) throw new Error("Acesso administrativo negado.");
  const updated = await markChargePaid(context.tenant.id, chargeId);
  if (!updated) throw new Error("Cobrança não encontrada neste condomínio.");
  revalidatePath(modulePath(client, "taxas"));
}

export async function updateReservationAction(formData: FormData) {
  const client = field(formData, "client");
  const reservationId = field(formData, "reservationId");
  const status = z
    .enum(["approved", "rejected", "cancelled"])
    .safeParse(field(formData, "status"));
  const context = await authorizeTenantAdministrator(client);
  if (!context || !status.success) {
    throw new Error("Acesso ou solicitação inválida.");
  }
  const updated = await updateTenantReservation(
    context.tenant.id,
    reservationId,
    status.data,
  );
  if (!updated) throw new Error("Reserva não encontrada neste condomínio.");
  revalidatePath(modulePath(client, "reservas"));
}

export async function createAnnouncementAction(
  _previousState: ModuleActionState,
  formData: FormData,
): Promise<ModuleActionState> {
  const input = announcementSchema.safeParse({
    client: field(formData, "client"),
    title: field(formData, "title"),
    content: field(formData, "content"),
    category: field(formData, "category"),
    priority: field(formData, "priority"),
    pinned: field(formData, "pinned"),
    pollQuestion: field(formData, "pollQuestion"),
    pollOptions: field(formData, "pollOptions"),
  });
  if (!input.success) return failure();

  const context = await authorizeTenantAdministrator(input.data.client);
  if (!context) return { error: "Acesso administrativo negado.", success: null };

  const options = input.data.pollOptions
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
  const hasPoll = input.data.pollQuestion.length > 0 || options.length > 0;
  if (hasPoll && (input.data.pollQuestion.length < 3 || options.length < 2)) {
    return {
      error: "Enquetes precisam de uma pergunta e ao menos duas opções.",
      success: null,
    };
  }

  await createTenantAnnouncement({
    tenantId: context.tenant.id,
    authorId: context.account.id,
    title: input.data.title,
    content: input.data.content,
    category: input.data.category,
    priority: input.data.priority,
    pinned: input.data.pinned === "yes",
    poll: hasPoll
      ? {
          question: input.data.pollQuestion,
          options,
          votes: [],
        }
      : null,
  });
  revalidatePath(modulePath(input.data.client, "mural"));
  return { error: null, success: "Comunicado publicado." };
}

export async function respondToTicketAction(formData: FormData) {
  const client = field(formData, "client");
  const ticketId = field(formData, "ticketId");
  const response = z.string().trim().min(2).max(5000).safeParse(
    field(formData, "response"),
  );
  const status = z.enum(["in_progress", "resolved"]).safeParse(
    field(formData, "status"),
  );
  const context = await authorizeTenantAdministrator(client);
  if (!context || !response.success || !status.success) {
    throw new Error("Acesso ou resposta inválida.");
  }
  const updated = await respondToTenantTicket(
    context.tenant.id,
    ticketId,
    response.data,
    status.data,
  );
  if (!updated) throw new Error("Chamado não encontrado neste condomínio.");
  revalidatePath(modulePath(client, "chamados"));
}
