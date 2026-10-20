import {
  Bell,
  CalendarDays,
  CircleHelp,
  Clock3,
  FileText,
  Home,
  Megaphone,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import {
  ResidentPollVote,
  ResidentReservationForm,
  ResidentTicketForm,
} from "@/components/resident-forms";
import { getCurrentAccount } from "@/lib/auth";
import {
  listResidentReservations,
  listResidentTickets,
  listTenantAnnouncements,
  listTenantChargesForUnit,
} from "@/lib/storage/json-store";
import { findTenantBySlug } from "@/lib/storage/json-store";
import { findResidentUnit, isValidTenantSlug } from "@/lib/tenant-access";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function ResidentAppPage({
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
  const unitCode = findResidentUnit(account, tenant);
  if (!unitCode) notFound();

  const [charges, reservations, announcements, tickets] = await Promise.all([
    listTenantChargesForUnit(tenant.id, unitCode),
    listResidentReservations(tenant.id, account.id),
    listTenantAnnouncements(tenant.id),
    listResidentTickets(tenant.id, account.id),
  ]);
  const visibleCharges = charges.slice(0, 5);
  const visibleReservations = reservations.slice(0, 4);
  const visibleTickets = tickets.slice(0, 4);
  const openCharges = charges.filter((charge) => charge.status === "open");
  const latestAnnouncements = announcements.slice(0, 3);
  const assemblyAnnouncements = announcements
    .filter((announcement) => announcement.category === "assembly")
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f5f7f2] pb-28 text-[#173b2b]">
      <header className="sticky top-0 z-20 border-b border-[#e5ebe2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#174c36] text-[#d3fa62]">
              <Bell aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-semibold">ConSys</p>
              <p className="text-xs text-[#788579]">{tenant.name}</p>
            </div>
          </div>
        </div>
      </header>
      {process.env.NODE_ENV === "production" &&
      process.env.CONSYS_DEMO_JSON === "true" ? (
        <p className="border-b border-[#ead9aa] bg-[#fff8e7] px-4 py-2 text-center text-xs leading-5 text-[#76591d]">
          Ambiente de demonstração: alterações em dados podem ser temporárias e
          não aparecer para outros usuários.
        </p>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 sm:px-5">
        <section className="py-7" id="inicio">
          <p className="text-sm font-medium text-[#5c8a32]">{unitCode}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Olá, {account.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Acompanhe as novidades e resolva sua rotina do condomínio por aqui.
          </p>
        </section>

        <section aria-label="Resumo do condomínio" className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={ReceiptText}
            label="Taxas em aberto"
            value={String(openCharges.length)}
            detail={
              openCharges.length
                ? currency.format(
                    openCharges.reduce(
                      (sum, charge) => sum + charge.amountCents,
                      0,
                    ) / 100,
                  )
                : "Tudo em dia"
            }
          />
          <SummaryCard
            icon={CircleHelp}
            label="Meus chamados"
            value={String(visibleTickets.length)}
            detail="Solicitações recentes"
          />
        </section>

        <section className="mt-7 scroll-mt-24" id="notificacoes">
          <SectionTitle
            icon={Megaphone}
            title="Notificações e mural"
            detail="Avisos e enquetes da administração"
          />
          {latestAnnouncements.length ? (
            <div className="mt-3 space-y-3">
              {latestAnnouncements.map((announcement) => {
                const voteCount = announcement.poll?.votes.length ?? 0;
                const hasVoted =
                  announcement.poll?.votes.some(
                    (vote) => vote.userId === account.id,
                  ) ?? false;
                return (
                  <article
                    className="rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]"
                    key={announcement.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#eff5e9] px-2.5 py-1 text-[11px] font-semibold text-[#47713d]">
                        {categoryLabel(announcement.category)}
                      </span>
                      <time className="text-xs text-[#788579]">
                        {new Date(announcement.publishedAt).toLocaleDateString(
                          "pt-BR",
                        )}
                      </time>
                    </div>
                    <h3 className="mt-3 font-semibold text-[#173b2b]">
                      {announcement.title}
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#657568]">
                      {announcement.content}
                    </p>
                    {announcement.poll ? (
                      <div className="mt-4 rounded-xl bg-[#f7f9f5] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold">
                            {announcement.poll.question}
                          </h4>
                          <span className="shrink-0 text-[11px] text-[#788579]">
                            {voteCount} voto{voteCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {announcement.poll.options.map((option, index) => {
                            const votes =
                              announcement.poll?.votes.filter(
                                (vote) => vote.optionIndex === index,
                              ).length ?? 0;
                            const percentage = voteCount
                              ? Math.round((votes / voteCount) * 100)
                              : 0;
                            return (
                              <div
                                className="rounded-lg border border-[#e5ebe2] bg-white p-3"
                                key={`${announcement.id}-${index}`}
                              >
                                <div className="flex justify-between gap-3 text-sm">
                                  <span>{option}</span>
                                  <span className="text-xs text-[#788579]">
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-[#edf1ea]">
                                  <div
                                    className="h-1.5 rounded-full bg-[#a8d638]"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                {!hasVoted ? (
                                  <ResidentPollVote
                                    client={client}
                                    announcementId={announcement.id}
                                    optionIndex={index}
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                        {hasVoted ? (
                          <p className="mt-3 text-xs font-medium text-[#47713d]">
                            Seu voto já foi registrado.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyCard>Os comunicados da administração aparecerão aqui.</EmptyCard>
          )}
        </section>

        <section className="mt-7 scroll-mt-24" id="assembleias">
          <SectionTitle
            icon={FileText}
            title="Atas e assembleias"
            detail="Informações importantes da vida condominial"
          />
          {assemblyAnnouncements.length ? (
            <div className="mt-3 space-y-3">
              {assemblyAnnouncements.map((announcement) => (
                <article
                  className="rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]"
                  key={announcement.id}
                >
                  <time className="text-xs text-[#788579]">
                    {new Date(announcement.publishedAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </time>
                  <h3 className="mt-2 font-semibold text-[#173b2b]">
                    {announcement.title}
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#657568]">
                    {announcement.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyCard>
              Atas e informações de assembleias aparecerão aqui.
            </EmptyCard>
          )}
        </section>

        <section className="mt-7">
          <SectionTitle
            icon={CalendarDays}
            title="Reservas"
            detail="Solicite um espaço e acompanhe o andamento"
          />
          <article className="mt-3 rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03] sm:p-5">
            <ResidentReservationForm client={client} />
          </article>
          {visibleReservations.length ? (
            <div className="mt-3 space-y-2">
              {visibleReservations.map((reservation) => (
                <article
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#e5ebe2] bg-white p-3.5"
                  key={reservation.id}
                >
                  <div>
                    <p className="text-sm font-semibold">{reservation.space}</p>
                    <p className="mt-1 text-xs text-[#788579]">
                      {new Date(`${reservation.date}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}{" "}
                      · {reservation.startsAt}–{reservation.endsAt}
                    </p>
                  </div>
                  <StatusPill status={reservation.status} />
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-7">
          <SectionTitle
            icon={CircleHelp}
            title="Fale com a administração"
            detail="Abra um chamado e acompanhe a resposta"
          />
          <article className="mt-3 rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03] sm:p-5">
            <ResidentTicketForm client={client} />
          </article>
          {visibleTickets.length ? (
            <div className="mt-3 space-y-2">
              {visibleTickets.map((ticket) => (
                <article
                  className="rounded-xl border border-[#e5ebe2] bg-white p-3.5"
                  key={ticket.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{ticket.title}</p>
                    <StatusPill status={ticket.status} />
                  </div>
                  {ticket.response ? (
                    <p className="mt-2 text-xs leading-5 text-[#657568]">
                      Administração: {ticket.response}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-7">
          <SectionTitle
            icon={Clock3}
            title="Taxas da minha unidade"
            detail="Cobranças e vencimentos"
          />
          {visibleCharges.length ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#e5ebe2] bg-white">
              {visibleCharges.map((charge) => (
                <article
                  className="flex items-center justify-between gap-3 border-b border-[#edf1ea] p-4 last:border-0"
                  key={charge.id}
                >
                  <div>
                    <p className="text-sm font-semibold">{charge.description}</p>
                    <p className="mt-1 text-xs text-[#788579]">
                      Vencimento{" "}
                      {new Date(`${charge.dueDate}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {currency.format(charge.amountCents / 100)}
                    </p>
                    <StatusPill status={charge.status} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyCard>Nenhuma cobrança cadastrada para sua unidade.</EmptyCard>
          )}
          <p className="mt-2 text-xs text-[#788579]">
            Pagamentos por PIX e boleto serão disponibilizados futuramente.
          </p>
        </section>

        <section
          aria-labelledby="resident-profile-title"
          className="mt-7 scroll-mt-24"
          id="perfil"
        >
          <SectionTitle
            icon={UserRound}
            title="Meu perfil"
            detail="Seus dados de acesso e unidade"
          />
          <article className="mt-3 rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]">
            <h3 className="font-semibold" id="resident-profile-title">
              {account.name}
            </h3>
            <p className="mt-1 text-sm text-[#657568]">{account.email}</p>
            <p className="mt-3 border-t border-[#edf1ea] pt-3 text-sm text-[#788579]">
              Unidade: {unitCode}
            </p>
          </article>
        </section>

        <p className="py-8 text-center text-xs text-[#9ba79a]">
          ConSys · Seu condomínio, mais perto.
        </p>
      </div>

      <nav
        aria-label="Navegação do app"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-3xl grid-cols-4 border-t border-[#e5ebe2] bg-white/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(23,59,43,0.06)] backdrop-blur"
      >
        {[
          { label: "Início", href: "#inicio", icon: Home },
          { label: "Notificações", href: "#notificacoes", icon: Bell },
          {
            label: "Assembleias",
            href: "#assembleias",
            icon: FileText,
            ariaLabel: "Atas e assembleias",
          },
          { label: "Perfil", href: "#perfil", icon: UserRound },
        ].map(({ label, href, icon: Icon, ariaLabel }) => (
          <a
            aria-label={ariaLabel ?? label}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium text-[#657568] transition hover:bg-[#f5f7f2] hover:text-[#174c36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c8a32] sm:text-xs"
            href={href}
            key={label}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]">
      <div className="flex items-center gap-2 text-xs text-[#657568]">
        <Icon aria-hidden="true" className="size-4 text-[#5c8a32]" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[#788579]">{detail}</p>
    </article>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Bell;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-[#788579]">{detail}</p>
      </div>
    </div>
  );
}

function EmptyCard({ children }: { children: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-[#dce5d8] bg-white px-4 py-7 text-center text-sm text-[#788579]">
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = {
    open: "Aberto",
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Recusada",
    cancelled: "Cancelada",
    in_progress: "Em atendimento",
    resolved: "Concluído",
    paid: "Paga",
  };
  const tones: Record<string, string> = {
    approved: "bg-[#eff5e9] text-[#47713d]",
    paid: "bg-[#eff5e9] text-[#47713d]",
    pending: "bg-[#fff5df] text-[#8a6320]",
    open: "bg-[#fff5df] text-[#8a6320]",
    rejected: "bg-rose-50 text-rose-700",
    cancelled: "bg-[#f1f3ef] text-[#657568]",
    in_progress: "bg-[#eff5e9] text-[#47713d]",
    resolved: "bg-[#f1f3ef] text-[#657568]",
  };
  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${tones[status] ?? "bg-[#f1f3ef] text-[#657568]"}`}
    >
      {labels[status] ?? status}
    </span>
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
