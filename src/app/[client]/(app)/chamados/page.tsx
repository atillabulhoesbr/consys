import { CircleHelp, MessageSquareText, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { respondToTicketAction } from "@/lib/tenant-actions";
import { authorizeTenant } from "@/lib/tenant-authorization";
import { listTenantTickets } from "@/lib/storage/json-store";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const context = await authorizeTenant(client);
  if (!context) notFound();
  const tickets = await listTenantTickets(context.tenant.id);
  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "in_progress",
  ).length;

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-sm font-semibold text-[#5c8a32]">
        {context.tenant.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Chamados e ocorrências
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657568]">
        Acompanhe solicitações de manutenção, convivência e dúvidas
        encaminhadas à administração.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Metric label="Abertos" value={openCount} />
        <Metric label="Em atendimento" value={inProgressCount} />
        <Metric label="Total de registros" value={tickets.length} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Chamados enviados pelos moradores</h2>
        {tickets.length ? (
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <article
                className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6"
                key={ticket.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#eff5e9] text-[#47713d]">
                    {ticket.category === "maintenance" ? (
                      <Wrench aria-hidden="true" className="size-4" />
                    ) : (
                      <MessageSquareText
                        aria-hidden="true"
                        className="size-4"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-[#173b2b]">
                      {ticket.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#788579]">
                      {categoryLabel(ticket.category)} · {ticket.unitCode} ·{" "}
                      {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Status status={ticket.status} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#657568]">
                  {ticket.description}
                </p>
                {ticket.response ? (
                  <div className="mt-4 rounded-xl bg-[#f7f9f5] p-4">
                    <p className="text-xs font-semibold text-[#47713d]">
                      Retorno da administração
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#657568]">
                      {ticket.response}
                    </p>
                  </div>
                ) : null}
                {ticket.status !== "resolved" ? (
                  <form
                    action={respondToTicketAction}
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <input name="client" type="hidden" value={client} />
                    <input name="ticketId" type="hidden" value={ticket.id} />
                    <label className="sr-only" htmlFor={`response-${ticket.id}`}>
                      Resposta da administração
                    </label>
                    <input
                      className="h-10 rounded-lg border border-[#dce5d8] bg-white px-3 text-sm outline-none focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
                      defaultValue={ticket.response ?? ""}
                      id={`response-${ticket.id}`}
                      maxLength={5000}
                      name="response"
                      placeholder="Escreva um retorno para a unidade"
                      required
                    />
                    <button
                      className="h-10 rounded-lg border border-[#dce5d8] px-3 text-xs font-medium text-[#47713d] hover:bg-[#f7f9f5]"
                      name="status"
                      type="submit"
                      value="in_progress"
                    >
                      Em atendimento
                    </button>
                    <button
                      className="h-10 rounded-lg bg-[#174c36] px-3 text-xs font-medium text-white hover:bg-[#103b2a]"
                      name="status"
                      type="submit"
                      value="resolved"
                    >
                      Concluir
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-14 text-center">
            <CircleHelp
              aria-hidden="true"
              className="mx-auto size-8 text-[#91a28b]"
            />
            <p className="mt-3 text-sm font-medium">
              Nenhum chamado registrado
            </p>
            <p className="mt-1 text-sm text-[#788579]">
              As solicitações do condomínio serão listadas aqui.
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
    open: "Aberto",
    in_progress: "Em atendimento",
    resolved: "Concluído",
  };
  const styles: Record<string, string> = {
    open: "bg-[#fff5df] text-[#8a6320]",
    in_progress: "bg-[#eff5e9] text-[#47713d]",
    resolved: "bg-[#f1f3ef] text-[#657568]",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status] ?? status}
    </span>
  );
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    maintenance: "Manutenção",
    noise: "Convivência",
    question: "Dúvida",
    other: "Outro assunto",
  };
  return labels[category] ?? "Chamado";
}
