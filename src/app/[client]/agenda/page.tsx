import { CalendarDays, Clock3 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ResidentBottomNavigation } from "@/components/resident-bottom-navigation";
import { ResidentReservationForm } from "@/components/resident-forms";
import { getCurrentAccount } from "@/lib/auth";
import {
  findTenantBySlug,
  listResidentReservations,
} from "@/lib/storage/json-store";
import { findResidentUnit, isValidTenantSlug } from "@/lib/tenant-access";

const statusStyles: Record<string, string> = {
  pending: "bg-[#fff5df] text-[#8a6320]",
  approved: "bg-[#eff5e9] text-[#47713d]",
  rejected: "bg-rose-50 text-rose-700",
  cancelled: "bg-[#f1f3ef] text-[#657568]",
};

const statusLabels: Record<string, string> = {
  pending: "Aguardando aprovação",
  approved: "Confirmada",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

export default async function ResidentAgendaPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  if (!isValidTenantSlug(client)) notFound();

  const [tenant, account] = await Promise.all([
    findTenantBySlug(client),
    getCurrentAccount(),
  ]);
  if (!tenant || tenant.status !== "active") notFound();
  if (!account) redirect(`/${tenant.slug}/login`);
  if (!findResidentUnit(account, tenant)) notFound();

  const reservations = await listResidentReservations(tenant.id, account.id);

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-6 pb-28 text-[#173b2b] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header>
          <p className="text-sm font-semibold text-[#5c8a32]">{tenant.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Agenda
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Escolha um espaço comum para solicitar uma reserva e acompanhe sua
            agenda.
          </p>
        </header>

        <section aria-labelledby="schedule-title" className="mt-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
              <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold" id="schedule-title">
                Agendar um espaço
              </h2>
              <p className="mt-0.5 text-xs text-[#788579]">
                Selecione a área, data e horário desejados.
              </p>
            </div>
          </div>
          <article className="mt-3 rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03] sm:p-5">
            <ResidentReservationForm client={tenant.slug} />
          </article>
        </section>

        <section aria-labelledby="my-agenda-title" className="mt-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold" id="my-agenda-title">
                Minha agenda
              </h2>
              <p className="mt-0.5 text-xs text-[#788579]">
                Reservas solicitadas para sua unidade.
              </p>
            </div>
          </div>

          {reservations.length ? (
            <ol className="mt-3 space-y-3">
              {reservations.map((reservation) => (
                <li
                  className="rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]"
                  key={reservation.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{reservation.space}</h3>
                      <time
                        className="mt-1 block text-sm text-[#657568]"
                        dateTime={`${reservation.date}T${reservation.startsAt}`}
                      >
                        {new Date(
                          `${reservation.date}T12:00:00`,
                        ).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      <p className="mt-1 text-xs text-[#788579]">
                        {reservation.startsAt}–{reservation.endsAt}
                        {" · "}
                        {reservation.guestCount} convidado
                        {reservation.guestCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        statusStyles[reservation.status] ??
                        "bg-[#f1f3ef] text-[#657568]"
                      }`}
                    >
                      {statusLabels[reservation.status] ?? reservation.status}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-[#dce5d8] bg-white px-4 py-8 text-center">
              <p className="text-sm font-medium text-[#315541]">
                Sua agenda ainda está vazia.
              </p>
              <p className="mt-1 text-sm text-[#788579]">
                Quando solicitar uma reserva, ela aparecerá aqui.
              </p>
            </div>
          )}
        </section>
      </div>
      <ResidentBottomNavigation
        currentSection="agenda"
        tenantSlug={tenant.slug}
      />
    </main>
  );
}
