import { CalendarDays, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { updateReservationAction } from "@/lib/tenant-actions";
import { authorizeTenant } from "@/lib/tenant-authorization";
import { listTenantReservations } from "@/lib/storage/json-store";

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const context = await authorizeTenant(client);
  if (!context) notFound();

  const reservations = await listTenantReservations(context.tenant.id);
  const pending = reservations.filter((item) => item.status === "pending");
  const approved = reservations.filter((item) => item.status === "approved");

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-sm font-semibold text-[#5c8a32]">
        {context.tenant.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Reservas de áreas comuns
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657568]">
        Consulte solicitações e organize o uso dos espaços compartilhados do
        condomínio.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Metric label="Solicitações pendentes" value={pending.length} />
        <Metric label="Reservas aprovadas" value={approved.length} />
        <Metric label="No histórico" value={reservations.length} />
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Pedidos dos moradores</h2>
          <p className="mt-1 text-sm text-[#657568]">
            Revise, aprove ou recuse as solicitações enviadas pelo app. Pedidos
            pendentes e aprovados bloqueiam horários conflitantes.
          </p>
        </div>
        {reservations.length ? (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <article
                className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]"
                key={reservation.id}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{reservation.space}</h3>
                      <Status status={reservation.status} />
                    </div>
                    <p className="mt-1 text-sm text-[#657568]">
                      {reservation.unitCode}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#788579]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {formatDate(reservation.date)} · {reservation.startsAt}–
                        {reservation.endsAt}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UsersRound aria-hidden="true" className="size-3.5" />
                        {reservation.guestCount} convidados
                      </span>
                    </div>
                  </div>
                  {reservation.status === "pending" ? (
                    <div className="flex gap-2">
                      <StatusButton
                        client={client}
                        id={reservation.id}
                        status="approved"
                        label="Aprovar"
                        positive
                      />
                      <StatusButton
                        client={client}
                        id={reservation.id}
                        status="rejected"
                        label="Recusar"
                      />
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-14 text-center">
            <CalendarDays
              aria-hidden="true"
              className="mx-auto size-8 text-[#91a28b]"
            />
            <p className="mt-3 text-sm font-medium">Nenhuma reserva registrada</p>
            <p className="mt-1 text-sm text-[#788579]">
              As próximas solicitações aparecerão nesta lista.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
      <p className="text-sm text-[#657568]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function Status({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Recusada",
    cancelled: "Cancelada",
  };
  const styles: Record<string, string> = {
    pending: "bg-[#fff5df] text-[#8a6320]",
    approved: "bg-[#eff5e9] text-[#47713d]",
    rejected: "bg-rose-50 text-rose-700",
    cancelled: "bg-[#f1f3ef] text-[#657568]",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status] ?? status}
    </span>
  );
}

function StatusButton({
  client,
  id,
  status,
  label,
  positive = false,
}: {
  client: string;
  id: string;
  status: "approved" | "rejected";
  label: string;
  positive?: boolean;
}) {
  return (
    <form action={updateReservationAction}>
      <input name="client" type="hidden" value={client} />
      <input name="reservationId" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />
      <button
        className={`h-9 rounded-lg px-3 text-xs font-medium ${
          positive
            ? "bg-[#174c36] text-white hover:bg-[#103b2a]"
            : "border border-[#dce5d8] text-[#657568] hover:bg-[#f7f9f5]"
        }`}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}
