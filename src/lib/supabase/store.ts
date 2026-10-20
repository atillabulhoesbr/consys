import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Announcement,
  Charge,
  Reservation,
  ResidentRegistration,
  Tenant,
  Ticket,
} from "@/lib/storage/json-store";

function fail(error: { message: string } | null, operation: string): never | void {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

function toTenant(row: {
  id: string;
  slug: string;
  app_code: string;
  name: string;
  status: "active" | "suspended";
}): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    appCode: row.app_code,
    name: row.name,
    status: row.status,
  };
}

export async function listTenants() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, app_code, name, status")
    .order("name");
  fail(error, "Falha ao listar condomínios");
  return (data ?? []).map(toTenant);
}

export async function findTenantBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, app_code, name, status")
    .eq("slug", slug)
    .maybeSingle();
  fail(error, "Falha ao localizar condomínio");
  return data ? toTenant(data) : null;
}

export async function findTenantByAppCode(appCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, app_code, name, status")
    .eq("app_code", appCode.trim().toLowerCase())
    .maybeSingle();
  fail(error, "Falha ao localizar condomínio");
  return data ? toTenant(data) : null;
}

export async function createTenant(
  name: string,
  slug: string,
  manager: { name: string; email: string; password: string },
) {
  const admin = createAdminClient();
  const email = manager.email.trim().toLowerCase();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: manager.password,
      email_confirm: true,
      user_metadata: { full_name: manager.name.trim() },
    });
  if (createError) {
    if (createError.status === 422) return null;
    throw new Error(`Falha ao criar conta do síndico: ${createError.message}`);
  }
  if (!created.user) {
    throw new Error("Supabase não retornou a conta criada para o síndico.");
  }

  const { data: tenantId, error } = await admin.rpc("provision_tenant", {
    target_name: name.trim(),
    target_slug: slug,
    manager_user_id: created.user.id,
  });
  if (error || !tenantId) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(
      created.user.id,
    );
    if (cleanupError) {
      throw new Error(
        `Falha ao criar condomínio: ${error?.message ?? "resposta vazia"}. A conta recém-criada não pôde ser removida: ${cleanupError.message}`,
      );
    }
    if (error?.code === "23505") return null;
    throw new Error(`Falha ao criar condomínio: ${error?.message ?? "resposta vazia"}`);
  }
  return findTenantBySlug(slug);
}

export async function createResidentRegistration(input: {
  tenantId: string;
  name: string;
  email: string;
  password: string;
}) {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: false,
      user_metadata: { full_name: input.name.trim() },
    });
  if (createError) {
    if (createError.status === 422) return false;
    throw new Error(`Falha ao registrar conta do morador: ${createError.message}`);
  }
  if (!created.user) {
    throw new Error("Supabase não retornou a conta de morador criada.");
  }

  const { error } = await admin.from("resident_registrations").insert({
    tenant_id: input.tenantId,
    user_id: created.user.id,
    full_name: input.name.trim(),
    email,
    status: "pending",
  });
  if (error) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(
      created.user.id,
    );
    if (cleanupError) {
      throw new Error(
        `Falha ao criar solicitação: ${error.message}. A conta recém-criada não pôde ser removida: ${cleanupError.message}`,
      );
    }
    if (error.code === "23505") return false;
    throw new Error(`Falha ao criar solicitação de morador: ${error.message}`);
  }
  return true;
}

export async function listResidentRegistrations(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resident_registrations")
    .select("id, tenant_id, full_name, email, requested_at, status")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("requested_at");
  fail(error, "Falha ao listar solicitações de moradores");
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.full_name,
    email: row.email,
    requestedAt: row.requested_at,
    status: row.status as ResidentRegistration["status"],
  }));
}

export async function reviewResidentRegistration(
  tenantId: string,
  registrationId: string,
  decision: "approve" | "reject",
  unitCode?: string,
) {
  const supabase = await createClient();
  if (decision === "approve") {
    const unit = unitCode?.trim();
    if (!unit || unit.length > 32) {
      throw new Error("Informe uma unidade válida para aprovar o cadastro.");
    }
    const { error } = await supabase.rpc("approve_resident_registration", {
      target_tenant_id: tenantId,
      target_registration_id: registrationId,
      target_unit_code: unit,
    });
    if (error?.code === "P0001") return false;
    fail(error, "Falha ao aprovar solicitação");
    return true;
  }

  const { data, error } = await supabase
    .from("resident_registrations")
    .update({ status: "rejected" })
    .eq("tenant_id", tenantId)
    .eq("id", registrationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  fail(error, "Falha ao rejeitar solicitação");
  return Boolean(data);
}

async function getUnitId(tenantId: string, unitCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("code", unitCode)
    .maybeSingle();
  fail(error, "Falha ao localizar unidade");
  if (!data) throw new Error("A unidade informada não existe neste condomínio.");
  return data.id;
}

export async function listTenantCharges(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("condominium_charges")
    .select("*, units!inner(code)")
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: false });
  fail(error, "Falha ao carregar cobranças");
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    unitCode: row.units.code,
    description: row.description,
    competence: row.competence,
    dueDate: row.due_date,
    amountCents: row.amount_cents,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  })) satisfies Charge[];
}

export async function listTenantChargesForUnit(
  tenantId: string,
  unitCode: string,
) {
  return (await listTenantCharges(tenantId)).filter(
    (charge) => charge.unitCode === unitCode,
  );
}

export async function createTenantCharge(
  input: Omit<Charge, "id" | "createdAt" | "paidAt" | "status">,
) {
  const supabase = await createClient();
  const unitId = await getUnitId(input.tenantId, input.unitCode);
  const { data, error } = await supabase
    .from("condominium_charges")
    .insert({
      tenant_id: input.tenantId,
      unit_id: unitId,
      description: input.description,
      competence: input.competence,
      due_date: input.dueDate,
      amount_cents: input.amountCents,
    })
    .select("*, units!inner(code)")
    .single();
  fail(error, "Falha ao registrar cobrança");
  return {
    id: data.id,
    tenantId: data.tenant_id,
    unitCode: data.units.code,
    description: data.description,
    competence: data.competence,
    dueDate: data.due_date,
    amountCents: data.amount_cents,
    status: data.status,
    paidAt: data.paid_at,
    createdAt: data.created_at,
  } satisfies Charge;
}

export async function markChargePaid(tenantId: string, chargeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("condominium_charges")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", chargeId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();
  fail(error, "Falha ao atualizar cobrança");
  return Boolean(data);
}

export async function listTenantReservations(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("amenity_reservations")
    .select("*, units!inner(code)")
    .eq("tenant_id", tenantId)
    .order("starts_at");
  fail(error, "Falha ao carregar reservas");
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    unitCode: row.units.code,
    requestedBy: row.requested_by,
    space: row.space_name,
    date: row.starts_at.slice(0, 10),
    startsAt: row.starts_at.slice(11, 16),
    endsAt: row.ends_at.slice(11, 16),
    guestCount: row.guest_count,
    status: row.status,
    createdAt: row.created_at,
  })) satisfies Reservation[];
}

export async function listResidentReservations(tenantId: string, userId: string) {
  return (await listTenantReservations(tenantId)).filter(
    (reservation) => reservation.requestedBy === userId,
  );
}

export async function createTenantReservation(
  input: Omit<Reservation, "id" | "createdAt" | "status">,
) {
  if (input.endsAt <= input.startsAt) {
    throw new Error("O horário final deve ser posterior ao horário inicial.");
  }
  const supabase = await createClient();
  const unitId = await getUnitId(input.tenantId, input.unitCode);
  const startsAt = new Date(`${input.date}T${input.startsAt}:00`).toISOString();
  const endsAt = new Date(`${input.date}T${input.endsAt}:00`).toISOString();
  const { data, error } = await supabase
    .from("amenity_reservations")
    .insert({
      tenant_id: input.tenantId,
      unit_id: unitId,
      requested_by: input.requestedBy,
      space_name: input.space,
      starts_at: startsAt,
      ends_at: endsAt,
      guest_count: input.guestCount,
    })
    .select("*, units!inner(code)")
    .single();
  if (error?.code === "23P01") return null;
  fail(error, "Falha ao solicitar reserva");
  return {
    id: data.id,
    tenantId: data.tenant_id,
    unitCode: data.units.code,
    requestedBy: data.requested_by,
    space: data.space_name,
    date: data.starts_at.slice(0, 10),
    startsAt: data.starts_at.slice(11, 16),
    endsAt: data.ends_at.slice(11, 16),
    guestCount: data.guest_count,
    status: data.status,
    createdAt: data.created_at,
  } satisfies Reservation;
}

export async function updateTenantReservation(
  tenantId: string,
  reservationId: string,
  status: "approved" | "rejected" | "cancelled",
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("amenity_reservations")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", reservationId)
    .select("id")
    .maybeSingle();
  fail(error, "Falha ao atualizar reserva");
  return Boolean(data);
}

export async function listTenantAnnouncements(
  tenantId: string,
): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  fail(error, "Falha ao carregar comunicados");
  const announcements = data ?? [];
  const announcementIds = announcements.map((announcement) => announcement.id);
  const [countsResult, ownVotesResult, userResult] = await Promise.all([
    announcementIds.length
      ? supabase.rpc("get_announcement_vote_counts", {
          target_tenant_id: tenantId,
          target_announcement_ids: announcementIds,
        })
      : Promise.resolve({ data: [], error: null }),
    announcementIds.length
      ? supabase
          .from("announcement_votes")
          .select("announcement_id, user_id, option_index")
          .eq("tenant_id", tenantId)
      : Promise.resolve({ data: [], error: null }),
    supabase.auth.getUser(),
  ]);
  fail(countsResult.error, "Falha ao carregar totais de enquetes");
  fail(ownVotesResult.error, "Falha ao carregar voto do usuário");
  if (userResult.error) {
    throw new Error(`Falha ao validar usuário Supabase: ${userResult.error.message}`);
  }
  const voteCounts = countsResult.data ?? [];
  const ownVotes = ownVotesResult.data ?? [];

  return announcements.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    category: row.category,
    priority: row.priority,
    pinned: row.pinned,
    publishedAt: row.published_at ?? row.created_at,
    poll:
      row.poll_question && Array.isArray(row.poll_options)
        ? {
            question: row.poll_question,
            options: row.poll_options as string[],
            votes: ownVotes
              .filter((vote) => vote.announcement_id === row.id)
              .map((vote) => ({
                userId: vote.user_id,
                optionIndex: vote.option_index,
              })),
            voteCounts: row.poll_options.map(
              (_option: string, index: number) =>
                Number(
                  voteCounts.find(
                    (vote: {
                      announcement_id: string;
                      option_index: number;
                      vote_count: number;
                    }) =>
                      vote.announcement_id === row.id &&
                      vote.option_index === index,
                  )?.vote_count ?? 0,
                ),
            ),
          }
        : null,
  })) satisfies Announcement[];
}

export async function createTenantAnnouncement(
  input: Omit<Announcement, "id" | "publishedAt" | "poll"> & {
    poll: Announcement["poll"];
  },
) {
  const supabase = await createClient();
  const { data: condominium, error: condominiumError } = await supabase
    .from("condominiums")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .limit(1)
    .single();
  fail(condominiumError, "Falha ao localizar condomínio");
  if (!condominium) {
    throw new Error("Condomínio não configurado neste tenant.");
  }
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      tenant_id: input.tenantId,
      condominium_id: condominium.id,
      author_id: input.authorId,
      title: input.title,
      content: input.content,
      status: "published",
      published_at: new Date().toISOString(),
      category: input.category,
      priority: input.priority,
      pinned: input.pinned,
      poll_question: input.poll?.question ?? null,
      poll_options: input.poll?.options ?? null,
    })
    .select("*")
    .single();
  fail(error, "Falha ao publicar comunicado");
  return {
    id: data.id,
    tenantId: data.tenant_id,
    authorId: data.author_id,
    title: data.title,
    content: data.content,
    category: data.category,
    priority: data.priority,
    pinned: data.pinned,
    publishedAt: data.published_at,
    poll: input.poll ? { ...input.poll, votes: [] } : null,
  } satisfies Announcement;
}

export async function voteOnTenantPoll(
  tenantId: string,
  announcementId: string,
  userId: string,
  optionIndex: number,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("announcement_votes").insert({
    tenant_id: tenantId,
    announcement_id: announcementId,
    user_id: userId,
    option_index: optionIndex,
  });
  if (error?.code === "23505") return false;
  fail(error, "Falha ao registrar voto");
  return true;
}

export async function listTenantTickets(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("condominium_tickets")
    .select("*, units!inner(code)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  fail(error, "Falha ao carregar chamados");
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    unitCode: row.units.code,
    openedBy: row.opened_by,
    category: row.category,
    title: row.title,
    description: row.description,
    status: row.status,
    response: row.response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) satisfies Ticket[];
}

export async function listResidentTickets(tenantId: string, userId: string) {
  return (await listTenantTickets(tenantId)).filter(
    (ticket) => ticket.openedBy === userId,
  );
}

export async function createTenantTicket(
  input: Omit<Ticket, "id" | "status" | "response" | "createdAt" | "updatedAt">,
) {
  const supabase = await createClient();
  const unitId = await getUnitId(input.tenantId, input.unitCode);
  const { data, error } = await supabase
    .from("condominium_tickets")
    .insert({
      tenant_id: input.tenantId,
      unit_id: unitId,
      opened_by: input.openedBy,
      category: input.category,
      title: input.title,
      description: input.description,
    })
    .select("*, units!inner(code)")
    .single();
  fail(error, "Falha ao abrir chamado");
  return {
    id: data.id,
    tenantId: data.tenant_id,
    unitCode: data.units.code,
    openedBy: data.opened_by,
    category: data.category,
    title: data.title,
    description: data.description,
    status: data.status,
    response: data.response,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } satisfies Ticket;
}

export async function respondToTenantTicket(
  tenantId: string,
  ticketId: string,
  response: string,
  status: "in_progress" | "resolved",
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("condominium_tickets")
    .update({ response, status })
    .eq("tenant_id", tenantId)
    .eq("id", ticketId)
    .select("id")
    .maybeSingle();
  fail(error, "Falha ao responder chamado");
  return Boolean(data);
}
