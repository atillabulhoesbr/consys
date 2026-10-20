import {
  ArrowRight,
  Bell,
  CalendarDays,
  CircleHelp,
  CreditCard,
  House,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import {
  listResidentRegistrations,
  listTenantAnnouncements,
  listTenantCharges,
  listTenantReservations,
  listTenantTickets,
} from "@/lib/storage/json-store";
import { authorizeTenant } from "@/lib/tenant-authorization";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function TenantDashboard({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const context = await authorizeTenant(client);
  if (!context) notFound();

  const [
    account,
    charges,
    reservations,
    announcements,
    tickets,
    residentRegistrations,
  ] =
    await Promise.all([
      getCurrentAccount(),
      listTenantCharges(context.tenant.id),
      listTenantReservations(context.tenant.id),
      listTenantAnnouncements(context.tenant.id),
      listTenantTickets(context.tenant.id),
      listResidentRegistrations(context.tenant.id),
    ]);
  if (!account) notFound();

  const openCharges = charges.filter((charge) => charge.status === "open");
  const upcomingReservations = reservations.filter(
    (reservation) =>
      reservation.date >= new Date().toISOString().slice(0, 10) &&
      ["pending", "approved"].includes(reservation.status),
  );
  const latestAnnouncement = announcements[0];
  const openTickets = tickets.filter((ticket) => ticket.status !== "resolved");

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#5c8a32]">
            {context.tenant.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#173b2b]">
            Olá, {account.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-[#657568]">
            Acompanhe as informações e a rotina do seu condomínio.
          </p>
          <p className="mt-3 text-xs text-[#788579]">
            Identificador para compartilhar com moradores:{" "}
            <span className="font-semibold text-[#315541]">
              {context.tenant.appCode}
            </span>
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dce8d6] bg-white px-3 py-1.5 text-xs font-medium text-[#47713d]">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Espaço protegido
        </div>
      </div>

      {residentRegistrations.length ? (
        <Link
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[#dce8d6] bg-white p-4 text-sm transition hover:border-[#b8cba9]"
          href={`/${client}/moradores`}
        >
          <span>
            <span className="font-semibold text-[#173b2b]">
              {residentRegistrations.length} solicitação
              {residentRegistrations.length === 1 ? "" : "ões"} de acesso
            </span>
            <span className="mt-1 block text-xs text-[#657568]">
              Confirme a unidade para liberar o app do morador.
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-[#47713d]" />
        </Link>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          href={`/${client}/taxas`}
          icon={CreditCard}
          label="Cobranças em aberto"
          value={String(openCharges.length)}
          detail={
            openCharges.length
              ? currency.format(
                  openCharges.reduce(
                    (sum, charge) => sum + charge.amountCents,
                    0,
                  ) / 100,
                )
              : "Nenhuma cobrança pendente"
          }
        />
        <SummaryCard
          href={`/${client}/reservas`}
          icon={CalendarDays}
          label="Próximas reservas"
          value={String(upcomingReservations.length)}
          detail="Solicitações futuras"
        />
        <SummaryCard
          href={`/${client}/mural`}
          icon={Bell}
          label="Comunicados"
          value={String(announcements.length)}
          detail="Publicados no mural"
        />
        <SummaryCard
          href={`/${client}/chamados`}
          icon={CircleHelp}
          label="Chamados em aberto"
          value={String(openTickets.length)}
          detail="Aguardando atendimento"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#173b2b]">
                Comunicados do condomínio
              </p>
              <p className="mt-1 text-xs text-[#788579]">
                Avisos e informações recentes
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-medium text-[#47713d] hover:text-[#174c36]"
              href={`/${client}/mural`}
            >
              Ver mural
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          {latestAnnouncement ? (
            <div className="mt-5 rounded-xl bg-[#f7f9f5] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#788579]">
                <span className="font-medium text-[#47713d]">
                  {categoryLabel(latestAnnouncement.category)}
                </span>
                {latestAnnouncement.priority === "urgent" ? (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                    Prioritário
                  </span>
                ) : null}
                {latestAnnouncement.pinned ? (
                  <span className="rounded-full bg-[#eff5e9] px-2 py-0.5 font-medium text-[#47713d]">
                    Fixado
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 font-semibold text-[#173b2b]">
                {latestAnnouncement.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#657568]">
                {latestAnnouncement.content}
              </p>
            </div>
          ) : (
            <EmptyInline
              icon={Bell}
              message="Ainda não há comunicados publicados."
            />
          )}
        </article>

        <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#173b2b]">
                Próxima reserva
              </p>
              <p className="mt-1 text-xs text-[#788579]">
                Áreas comuns do condomínio
              </p>
            </div>
            <House aria-hidden="true" className="size-5 text-[#5c8a32]" />
          </div>
          {upcomingReservations[0] ? (
            <div className="mt-5 rounded-xl bg-[#f7f9f5] p-4">
              <p className="font-medium text-[#173b2b]">
                {upcomingReservations[0].space}
              </p>
              <p className="mt-2 text-sm text-[#657568]">
                {new Date(
                  `${upcomingReservations[0].date}T12:00:00`,
                ).toLocaleDateString("pt-BR")}{" "}
                · {upcomingReservations[0].startsAt}
              </p>
              <p className="mt-2 text-xs text-[#788579]">
                {statusLabel(upcomingReservations[0].status)}
              </p>
            </div>
          ) : (
            <EmptyInline
              icon={CalendarDays}
              message="Você ainda não tem reservas futuras."
            />
          )}
          <Link
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#47713d] hover:text-[#174c36]"
            href={`/${client}/reservas`}
          >
            Consultar reservas
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </article>
      </div>
    </section>
  );
}

function SummaryCard({
  href,
  icon: Icon,
  label,
  value,
  detail,
}: {
  href: string;
  icon: typeof CreditCard;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Link
      className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] transition hover:border-[#a8c887] hover:shadow-md"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#657568]">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-[#eff5e9] text-[#47713d]">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#173b2b]">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-[#788579]">{detail}</p>
    </Link>
  );
}

function EmptyInline({
  icon: Icon,
  message,
}: {
  icon: typeof Bell;
  message: string;
}) {
  return (
    <div className="mt-5 flex min-h-24 items-center gap-3 rounded-xl border border-dashed border-[#dce5d8] px-4 text-sm text-[#788579]">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[#91a28b]" />
      {message}
    </div>
  );
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    general: "Aviso geral",
    maintenance: "Manutenção",
    assembly: "Assembleia",
    conviviality: "Convivência",
  };
  return labels[category] ?? "Comunicado";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Aguardando aprovação",
    approved: "Aprovada",
    rejected: "Não aprovada",
    cancelled: "Cancelada",
  };
  return labels[status] ?? status;
}
