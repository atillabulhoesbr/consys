import { ArrowDownToLine, Banknote, CircleCheck, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { ChargeForm } from "@/components/tenant-module-forms";
import { markChargePaidAction } from "@/lib/tenant-actions";
import { authorizeTenant } from "@/lib/tenant-authorization";
import { listTenantCharges } from "@/lib/storage/json-store";
import { canManageTenant } from "@/lib/tenant-access";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function ChargesPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const context = await authorizeTenant(client);
  if (!context) notFound();

  const charges = await listTenantCharges(context.tenant.id);
  const openCharges = charges.filter((charge) => charge.status === "open");
  const paidTotal = charges
    .filter((charge) => charge.status === "paid")
    .reduce((sum, charge) => sum + charge.amountCents, 0);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeading
        eyebrow={context.tenant.name}
        title="Taxas e cotas"
        description="Consulte cobranças, vencimentos e registros de pagamento do condomínio."
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Metric icon={Clock3} label="Em aberto" value={String(openCharges.length)} detail={currency.format(openCharges.reduce((sum, charge) => sum + charge.amountCents, 0) / 100)} />
        <Metric icon={CircleCheck} label="Pagas" value={String(charges.length - openCharges.length)} detail="Registros liquidados" />
        <Metric icon={Banknote} label="Total recebido" value={currency.format(paidTotal / 100)} detail="Cobranças marcadas como pagas" />
      </div>

      {canManageTenant(context.account, context.tenant) ? (
        <article className="mt-7 rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6">
          <h2 className="mb-4 font-semibold">Registrar cobrança</h2>
          <ChargeForm client={client} />
        </article>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Histórico de cobranças</h2>
            <p className="mt-1 text-sm text-[#657568]">
              {charges.length} registro{charges.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="hidden items-center gap-1 text-xs text-[#788579] sm:inline-flex">
            <ArrowDownToLine aria-hidden="true" className="size-3.5" />
            PIX e boleto: integração futura
          </span>
        </div>
        {charges.length ? (
          <div className="overflow-hidden rounded-2xl border border-[#e5ebe2] bg-white shadow-sm shadow-[#24452b]/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-[#f8faf6] text-xs text-[#657568]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Unidade / descrição</th>
                    <th className="px-5 py-3 font-medium">Competência</th>
                    <th className="px-5 py-3 font-medium">Vencimento</th>
                    <th className="px-5 py-3 font-medium">Valor</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    {canManageTenant(context.account, context.tenant) ? (
                      <th className="px-5 py-3 font-medium">Ação</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ea]">
                  {charges.map((charge) => (
                    <tr key={charge.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#173b2b]">
                          {charge.description}
                        </p>
                        <p className="mt-1 text-xs text-[#788579]">
                          {charge.unitCode}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[#657568]">
                        {charge.competence}
                      </td>
                      <td className="px-5 py-4 text-[#657568]">
                        {formatDate(charge.dueDate)}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#173b2b]">
                        {currency.format(charge.amountCents / 100)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${charge.status === "paid" ? "bg-[#eff5e9] text-[#47713d]" : "bg-[#fff5df] text-[#8a6320]"}`}>
                          {charge.status === "paid" ? "Paga" : "Em aberto"}
                        </span>
                      </td>
                      {canManageTenant(context.account, context.tenant) ? (
                        <td className="px-5 py-4">
                          {charge.status === "open" ? (
                            <form action={markChargePaidAction} className="text-right">
                              <input name="client" type="hidden" value={client} />
                              <input name="chargeId" type="hidden" value={charge.id} />
                              <button className="text-xs font-medium text-[#47713d] hover:underline" type="submit">
                                Dar baixa
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-[#788579]">
                              {charge.paidAt ? formatDate(charge.paidAt.slice(0, 10)) : "—"}
                            </span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState message="Nenhuma cobrança cadastrada para este condomínio." />
        )}
      </section>
    </section>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#5c8a32]">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657568]">
        {description}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
      <div className="flex items-center gap-2 text-sm text-[#657568]">
        <Icon aria-hidden="true" className="size-4 text-[#5c8a32]" />
        {label}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[#788579]">{detail}</p>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-14 text-center text-sm text-[#788579]">
      {message}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}
