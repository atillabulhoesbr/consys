import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import * as supabaseStore from "@/lib/supabase/store";
import { hasSupabaseConfiguration } from "@/lib/supabase/server";

const tenantSchema = z
  .object({
    id: z.string().uuid(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .refine((slug) => !["admin", "api", "app", "_next"].includes(slug)),
    appCode: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*@consys\.com$/)
      .optional(),
    name: z.string().min(1),
    status: z.enum(["active", "suspended"]),
  })
  .transform((tenant) => ({
    ...tenant,
    appCode: tenant.appCode ?? `${tenant.slug}@consys.com`,
  }));

const accountSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  passwordHash: z.string().min(1),
  platformRole: z.enum(["super_admin"]).nullable(),
  tenantIds: z.array(z.string().uuid()),
  managerTenantIds: z.array(z.string().uuid()).default([]),
  unitMemberships: z
    .array(
      z.object({
        tenantId: z.string().uuid(),
        unitCode: z.string().min(1).max(32),
      }),
    )
    .default([]),
  active: z.boolean(),
});

const residentRegistrationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  requestedAt: z.string().datetime(),
  status: z.enum(["pending", "approved", "rejected"]),
});

const sessionSchema = z.object({
  tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
  userId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

const chargeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitCode: z.string().min(1).max(32),
  description: z.string().min(1).max(160),
  competence: z.string().min(1).max(40),
  dueDate: z.iso.date(),
  amountCents: z.number().int().positive(),
  status: z.enum(["open", "paid"]),
  paidAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

const reservationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitCode: z.string().min(1).max(32),
  requestedBy: z.string().uuid(),
  space: z.string().min(2).max(100),
  date: z.iso.date(),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  guestCount: z.number().int().min(0).max(200),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  createdAt: z.string().datetime(),
});

const announcementSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(10000),
  category: z.enum(["general", "maintenance", "assembly", "conviviality"]),
  priority: z.enum(["normal", "urgent"]),
  pinned: z.boolean(),
  publishedAt: z.string().datetime(),
  poll: z
    .object({
      question: z.string().min(1).max(500),
      options: z.array(z.string().min(1).max(200)).min(2).max(8),
      votes: z.array(
        z.object({
          userId: z.string().uuid(),
          optionIndex: z.number().int().min(0).max(7),
        }),
      ),
      voteCounts: z.array(z.number().int().nonnegative()).optional(),
    })
    .nullable(),
});

const ticketSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitCode: z.string().min(1).max(32),
  openedBy: z.string().uuid(),
  category: z.enum(["maintenance", "noise", "question", "other"]),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(5000),
  status: z.enum(["open", "in_progress", "resolved"]),
  response: z.string().max(5000).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const runtimeSchema = z.object({
  users: z.array(accountSchema),
  sessions: z.array(sessionSchema),
  residentRegistrations: z.array(residentRegistrationSchema).default([]),
  tenants: z.array(tenantSchema).default([]),
  charges: z.array(chargeSchema).default([]),
  reservations: z.array(reservationSchema).default([]),
  announcements: z.array(announcementSchema).default([]),
  tickets: z.array(ticketSchema).default([]),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type Account = z.infer<typeof accountSchema>;
export type ResidentRegistration = z.infer<typeof residentRegistrationSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Charge = z.infer<typeof chargeSchema>;
export type Reservation = z.infer<typeof reservationSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
type RuntimeData = z.infer<typeof runtimeSchema>;

const seedDataDirectory = path.join(process.cwd(), "dados_json");
const isProductionJsonDemo =
  process.env.NODE_ENV === "production" &&
  process.env.CONSYS_DEMO_JSON === "true" &&
  !hasSupabaseConfiguration();
const runtimeDirectory = isProductionJsonDemo
  ? path.join(tmpdir(), "consys-demo-json")
  : seedDataDirectory;
const tenantsPath = path.join(seedDataDirectory, "tenants.json");
const runtimePath = path.join(runtimeDirectory, "runtime.json");

let writeQueue = Promise.resolve();

function assertJsonStorageEnabled() {
  if (process.env.NODE_ENV === "production" && !isProductionJsonDemo) {
    throw new Error(
      "O armazenamento JSON local não pode ser usado em produção. Configure o Supabase após implementar seu adaptador de autenticação.",
    );
  }
}

export async function listTenants() {
  if (hasSupabaseConfiguration()) return supabaseStore.listTenants();
  assertJsonStorageEnabled();
  const seededTenants = z.array(tenantSchema).parse(
    JSON.parse(await readFile(tenantsPath, "utf8")),
  );
  const { tenants: storedTenants } = await readRuntimeData();
  const parsed = [...seededTenants, ...storedTenants];
  const activeSlugs = new Set<string>();
  const tenantIds = new Set<string>();
  const appCodes = new Set<string>();

  for (const tenant of parsed) {
    if (
      activeSlugs.has(tenant.slug) ||
      tenantIds.has(tenant.id) ||
      appCodes.has(tenant.appCode)
    ) {
      throw new Error("Organizações duplicadas encontradas no armazenamento.");
    }
    activeSlugs.add(tenant.slug);
    tenantIds.add(tenant.id);
    appCodes.add(tenant.appCode);
  }

  return parsed;
}

export async function findTenantBySlug(slug: string) {
  if (hasSupabaseConfiguration()) return supabaseStore.findTenantBySlug(slug);
  const tenants = await listTenants();
  return tenants.find((tenant) => tenant.slug === slug) ?? null;
}

export async function findTenantByAppCode(appCode: string) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.findTenantByAppCode(appCode);
  }
  const tenants = await listTenants();
  const normalizedCode = appCode.trim().toLowerCase();
  return tenants.find((tenant) => tenant.appCode === normalizedCode) ?? null;
}

export async function createTenant(
  name: string,
  slug: string,
  manager: {
    name: string;
    email: string;
    passwordHash: string;
    password?: string;
  },
) {
  if (hasSupabaseConfiguration()) {
    if (!manager.password) {
      throw new Error("A senha inicial do síndico é obrigatória no Supabase.");
    }
    return supabaseStore.createTenant(name, slug, {
      name: manager.name,
      email: manager.email,
      password: manager.password,
    });
  }
  const input = tenantSchema.safeParse({
    id: randomUUID(),
    name: name.trim(),
    slug,
    appCode: `${slug}@consys.com`,
    status: "active",
  });
  if (!input.success) {
    throw new Error("Dados inválidos para criação da organização.");
  }

  return updateRuntimeData(async (data) => {
    const seededTenants = z.array(tenantSchema).parse(
      JSON.parse(await readFile(tenantsPath, "utf8")),
    );
    const allTenants = [...seededTenants, ...data.tenants];
    if (
      allTenants.some(
        (tenant) =>
          tenant.slug === input.data.slug ||
          tenant.appCode === input.data.appCode,
      )
    ) {
      return null;
    }
    const email = manager.email.trim().toLowerCase();
    if (data.users.some((user) => user.email === email)) {
      return null;
    }

    data.tenants.push(input.data);
    data.users.push({
      id: randomUUID(),
      email,
      name: manager.name.trim(),
      passwordHash: manager.passwordHash,
      platformRole: null,
      tenantIds: [input.data.id],
      managerTenantIds: [input.data.id],
      unitMemberships: [],
      active: true,
    });
    return input.data;
  });
}

export async function createResidentRegistration(input: {
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  password?: string;
}) {
  if (hasSupabaseConfiguration()) {
    if (!input.password) {
      throw new Error("A senha é necessária para provisionar a conta de morador.");
    }
    return supabaseStore.createResidentRegistration({
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      password: input.password,
    });
  }
  return updateRuntimeData((data) => {
    const email = input.email.trim().toLowerCase();
    if (
      data.users.some((user) => user.email === email) ||
      data.residentRegistrations.some(
        (registration) =>
          registration.email === email &&
          registration.tenantId === input.tenantId &&
          registration.status === "pending",
      )
    ) {
      return false;
    }

    data.residentRegistrations.push(
      residentRegistrationSchema.parse({
        ...input,
        id: randomUUID(),
        name: input.name.trim(),
        email,
        requestedAt: new Date().toISOString(),
        status: "pending",
      }),
    );
    return true;
  });
}

export async function listResidentRegistrations(tenantId: string) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.listResidentRegistrations(tenantId);
  }
  const data = await readRuntimeData();
  return data.residentRegistrations
    .filter(
      (registration) =>
        registration.tenantId === tenantId && registration.status === "pending",
    )
    .map((registration) => ({
      id: registration.id,
      tenantId: registration.tenantId,
      name: registration.name,
      email: registration.email,
      requestedAt: registration.requestedAt,
      status: registration.status,
    }))
    .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt));
}

export async function reviewResidentRegistration(
  tenantId: string,
  registrationId: string,
  decision: "approve" | "reject",
  unitCode?: string,
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.reviewResidentRegistration(
      tenantId,
      registrationId,
      decision,
      unitCode,
    );
  }
  return updateRuntimeData((data) => {
    const registration = data.residentRegistrations.find(
      (item) =>
        item.tenantId === tenantId &&
        item.id === registrationId &&
        item.status === "pending",
    );
    if (!registration) return false;

    if (decision === "approve") {
      const unit = unitCode?.trim();
      if (!unit || unit.length > 32) {
        throw new Error("Informe uma unidade válida para aprovar o cadastro.");
      }
      if (data.users.some((user) => user.email === registration.email)) {
        throw new Error("Já existe uma conta cadastrada para este email.");
      }
      data.users.push({
        id: randomUUID(),
        email: registration.email,
        name: registration.name,
        passwordHash: registration.passwordHash,
        platformRole: null,
        tenantIds: [tenantId],
        managerTenantIds: [],
        unitMemberships: [{ tenantId, unitCode: unit }],
        active: true,
      });
      registration.status = "approved";
    } else {
      registration.status = "rejected";
    }

    return true;
  });
}

export async function listTenantCharges(tenantId: string) {
  if (hasSupabaseConfiguration()) return supabaseStore.listTenantCharges(tenantId);
  const data = await readRuntimeData();
  return data.charges
    .filter((charge) => charge.tenantId === tenantId)
    .sort((left, right) => right.dueDate.localeCompare(left.dueDate));
}

export async function listTenantChargesForUnit(
  tenantId: string,
  unitCode: string,
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.listTenantChargesForUnit(tenantId, unitCode);
  }
  const charges = await listTenantCharges(tenantId);
  return charges.filter((charge) => charge.unitCode === unitCode);
}

export async function createTenantCharge(
  input: Omit<Charge, "id" | "createdAt" | "paidAt" | "status">,
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.createTenantCharge(input);
  }
  const charge = chargeSchema.parse({
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    paidAt: null,
    status: "open",
  });
  return updateRuntimeData((data) => {
    data.charges.push(charge);
    return charge;
  });
}

export async function markChargePaid(tenantId: string, chargeId: string) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.markChargePaid(tenantId, chargeId);
  }
  return updateRuntimeData((data) => {
    const charge = data.charges.find(
      (item) => item.tenantId === tenantId && item.id === chargeId,
    );
    if (!charge) {
      return false;
    }
    charge.status = "paid";
    charge.paidAt = new Date().toISOString();
    return true;
  });
}

export async function listTenantReservations(tenantId: string) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.listTenantReservations(tenantId);
  }
  const data = await readRuntimeData();
  return data.reservations
    .filter((reservation) => reservation.tenantId === tenantId)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function listResidentReservations(
  tenantId: string,
  userId: string,
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.listResidentReservations(tenantId, userId);
  }
  const reservations = await listTenantReservations(tenantId);
  return reservations.filter((reservation) => reservation.requestedBy === userId);
}

export async function createTenantReservation(
  input: Omit<Reservation, "id" | "createdAt" | "status">,
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.createTenantReservation(input);
  }
  if (input.endsAt <= input.startsAt) {
    throw new Error("O horário final deve ser posterior ao horário inicial.");
  }
  const reservation = reservationSchema.parse({
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  return updateRuntimeData((data) => {
    const conflict = data.reservations.some(
      (item) =>
        item.tenantId === reservation.tenantId &&
        item.space === reservation.space &&
        item.date === reservation.date &&
        ["pending", "approved"].includes(item.status) &&
        reservation.startsAt < item.endsAt &&
        reservation.endsAt > item.startsAt,
    );
    if (conflict) {
      return null;
    }
    data.reservations.push(reservation);
    return reservation;
  });
}

export async function updateTenantReservation(
  tenantId: string,
  reservationId: string,
  status: "approved" | "rejected" | "cancelled",
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.updateTenantReservation(
      tenantId,
      reservationId,
      status,
    );
  }
  return updateRuntimeData((data) => {
    const reservation = data.reservations.find(
      (item) => item.tenantId === tenantId && item.id === reservationId,
    );
    if (!reservation) {
      return false;
    }
    reservation.status = status;
    return true;
  });
}

export async function listTenantAnnouncements(tenantId: string) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.listTenantAnnouncements(tenantId);
  }
  const data = await readRuntimeData();
  return data.announcements
    .filter((announcement) => announcement.tenantId === tenantId)
    .sort(
      (left, right) =>
        Number(right.pinned) - Number(left.pinned) ||
        right.publishedAt.localeCompare(left.publishedAt),
    );
}

export async function createTenantAnnouncement(
  input: Omit<Announcement, "id" | "publishedAt" | "poll"> & {
    poll: Announcement["poll"];
  },
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.createTenantAnnouncement(input);
  }
  const announcement = announcementSchema.parse({
    ...input,
    id: randomUUID(),
    publishedAt: new Date().toISOString(),
  });
  return updateRuntimeData((data) => {
    data.announcements.push(announcement);
    return announcement;
  });
}

export async function voteOnTenantPoll(
  tenantId: string,
  announcementId: string,
  userId: string,
  optionIndex: number,
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.voteOnTenantPoll(
      tenantId,
      announcementId,
      userId,
      optionIndex,
    );
  }
  return updateRuntimeData((data) => {
    const announcement = data.announcements.find(
      (item) => item.tenantId === tenantId && item.id === announcementId,
    );
    if (!announcement?.poll || optionIndex >= announcement.poll.options.length) {
      return false;
    }
    if (announcement.poll.votes.some((vote) => vote.userId === userId)) {
      return false;
    }
    announcement.poll.votes.push({ userId, optionIndex });
    return true;
  });
}

export async function listTenantTickets(tenantId: string) {
  if (hasSupabaseConfiguration()) return supabaseStore.listTenantTickets(tenantId);
  const data = await readRuntimeData();
  return data.tickets
    .filter((ticket) => ticket.tenantId === tenantId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listResidentTickets(tenantId: string, userId: string) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.listResidentTickets(tenantId, userId);
  }
  const tickets = await listTenantTickets(tenantId);
  return tickets.filter((ticket) => ticket.openedBy === userId);
}

export async function createTenantTicket(
  input: Omit<Ticket, "id" | "status" | "response" | "createdAt" | "updatedAt">,
) {
  if (hasSupabaseConfiguration()) return supabaseStore.createTenantTicket(input);
  const now = new Date().toISOString();
  const ticket = ticketSchema.parse({
    ...input,
    id: randomUUID(),
    status: "open",
    response: null,
    createdAt: now,
    updatedAt: now,
  });
  return updateRuntimeData((data) => {
    data.tickets.push(ticket);
    return ticket;
  });
}

export async function respondToTenantTicket(
  tenantId: string,
  ticketId: string,
  response: string,
  status: "in_progress" | "resolved",
) {
  if (hasSupabaseConfiguration()) {
    return supabaseStore.respondToTenantTicket(
      tenantId,
      ticketId,
      response,
      status,
    );
  }
  return updateRuntimeData((data) => {
    const ticket = data.tickets.find(
      (item) => item.tenantId === tenantId && item.id === ticketId,
    );
    if (!ticket) {
      return false;
    }
    ticket.response = response;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    return true;
  });
}

async function readRuntimeData(): Promise<RuntimeData> {
  assertJsonStorageEnabled();
  try {
    return runtimeSchema.parse(JSON.parse(await readFile(runtimePath, "utf8")));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {
        users: [],
        sessions: [],
        residentRegistrations: [],
        tenants: [],
        charges: [],
        reservations: [],
        announcements: [],
        tickets: [],
      };
    }
    throw error;
  }
}

async function writeRuntimeData(data: RuntimeData) {
  await mkdir(runtimeDirectory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${runtimePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  await rename(temporaryPath, runtimePath);
}

export async function updateRuntimeData<T>(
  update: (data: RuntimeData) => T | Promise<T>,
) {
  const operation = writeQueue.then(async () => {
    const data = await readRuntimeData();
    const result = await update(data);
    await writeRuntimeData(data);
    return result;
  });
  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export async function getRuntimeData() {
  return readRuntimeData();
}
