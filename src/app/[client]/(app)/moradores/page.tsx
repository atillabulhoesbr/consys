import { UserRoundCheck, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { reviewResidentRegistrationAction } from "@/lib/resident-actions";
import { authorizeTenantAdministrator } from "@/lib/tenant-authorization";
import { listResidentRegistrations } from "@/lib/storage/json-store";

export default async function ResidentsPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const context = await authorizeTenantAdministrator(client);
  if (!context) notFound();

  const registrations = await listResidentRegistrations(context.tenant.id);
  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-sm font-semibold text-[#5c8a32]">
        {context.tenant.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Acessos de moradores
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657568]">
        Confira os pedidos de acesso, confirme a unidade e libere somente quem
        pertence a este condomínio.
      </p>

      <article className="mt-7 flex items-center gap-4 rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
          <UsersRound aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-sm text-[#657568]">Aguardando confirmação</p>
          <p className="mt-1 text-2xl font-semibold">{registrations.length}</p>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Solicitações pendentes</h2>
        {registrations.length ? (
          <div className="mt-4 space-y-3">
            {registrations.map((registration) => (
              <article
                className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]"
                key={registration.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{registration.name}</h3>
                    <p className="mt-1 text-sm text-[#657568]">
                      {registration.email}
                    </p>
                    <p className="mt-1 text-xs text-[#788579]">
                      Solicitado em{" "}
                      {new Date(registration.requestedAt).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff5df] px-2.5 py-1 text-xs font-medium text-[#8a6320]">
                    Pendente
                  </span>
                </div>
                <form
                  action={reviewResidentRegistrationAction}
                  className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                >
                  <input name="client" type="hidden" value={client} />
                  <input
                    name="registrationId"
                    type="hidden"
                    value={registration.id}
                  />
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[#315541]">
                      Unidade a confirmar
                    </span>
                    <input
                      className="h-10 w-full rounded-lg border border-[#dce5d8] px-3 text-sm outline-none focus:border-[#7fae4e]"
                      maxLength={32}
                      name="unitCode"
                      placeholder="Ex.: Bloco A · 402"
                    />
                  </label>
                  <button
                    className="self-end rounded-lg bg-[#174c36] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#103b2a]"
                    name="decision"
                    type="submit"
                    value="approve"
                  >
                    Aprovar acesso
                  </button>
                  <button
                    className="self-end rounded-lg border border-[#dce5d8] px-4 py-2.5 text-sm font-medium text-[#657568] hover:bg-[#f7f9f5]"
                    name="decision"
                    type="submit"
                    value="reject"
                  >
                    Recusar
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-14 text-center">
            <UserRoundCheck
              aria-hidden="true"
              className="mx-auto size-8 text-[#91a28b]"
            />
            <p className="mt-3 text-sm font-medium">
              Nenhuma solicitação pendente
            </p>
            <p className="mt-1 text-sm text-[#788579]">
              Novos pedidos de acesso aparecerão aqui.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
