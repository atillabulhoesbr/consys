import { Bell, Pin, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/tenant-module-forms";
import { authorizeTenant } from "@/lib/tenant-authorization";
import { listTenantAnnouncements } from "@/lib/storage/json-store";

export default async function BulletinPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const context = await authorizeTenant(client);
  if (!context) notFound();
  const announcements = await listTenantAnnouncements(context.tenant.id);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-sm font-semibold text-[#5c8a32]">
        {context.tenant.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Mural do condomínio
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657568]">
        Avisos, manutenções, assembleias e enquetes em um só lugar.
      </p>

      <article className="mt-7 rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6">
        <h2 className="mb-4 font-semibold">Publicar no mural</h2>
        <AnnouncementForm client={client} />
      </article>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Avisos publicados</h2>
          <p className="mt-1 text-sm text-[#657568]">
            {announcements.length} comunicado
            {announcements.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {announcements.length ? (
        <div className="mt-4 space-y-4">
          {announcements.map((announcement) => {
            const voteCount = announcement.poll?.votes.length ?? 0;
            return (
              <article
                className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6"
                key={announcement.id}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#eff5e9] px-2.5 py-1 font-medium text-[#47713d]">
                    {categoryLabel(announcement.category)}
                  </span>
                  {announcement.priority === "urgent" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                      <ShieldAlert aria-hidden="true" className="size-3.5" />
                      Prioritário
                    </span>
                  ) : null}
                  {announcement.pinned ? (
                    <span className="inline-flex items-center gap-1 text-[#788579]">
                      <Pin aria-hidden="true" className="size-3.5" />
                      Fixado
                    </span>
                  ) : null}
                  <time className="ml-auto text-[#788579]" dateTime={announcement.publishedAt}>
                    {new Date(announcement.publishedAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </time>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#173b2b]">
                  {announcement.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#657568]">
                  {announcement.content}
                </p>
                {announcement.poll ? (
                  <div className="mt-5 rounded-xl bg-[#f7f9f5] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-medium text-[#173b2b]">
                        {announcement.poll.question}
                      </h4>
                      <span className="text-xs text-[#788579]">
                        {voteCount} voto{voteCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {announcement.poll.options.map((option, index) => {
                        const optionVotes =
                          announcement.poll?.votes.filter(
                            (vote) => vote.optionIndex === index,
                          ).length ?? 0;
                        const percentage = voteCount
                          ? Math.round((optionVotes / voteCount) * 100)
                          : 0;

                        return (
                          <div
                            className="rounded-lg border border-[#e5ebe2] bg-white p-3"
                            key={`${announcement.id}-${index}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-[#315541]">{option}</p>
                              <span className="shrink-0 text-xs text-[#788579]">
                                {percentage}% · {optionVotes}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf1ea]">
                              <div
                                className="h-full rounded-full bg-[#a8d638]"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-14 text-center">
          <Bell aria-hidden="true" className="mx-auto size-8 text-[#91a28b]" />
          <p className="mt-3 text-sm font-medium">O mural está vazio</p>
          <p className="mt-1 text-sm text-[#788579]">
            Os próximos comunicados publicados aparecerão aqui.
          </p>
        </div>
      )}
    </section>
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
