"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";

export type AssemblyHistoryItem = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
};

export function ResidentAssembliesHistory({
  assemblies,
}: {
  assemblies: AssemblyHistoryItem[];
}) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredAssemblies = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return assemblies.filter((assembly) => {
      const publicationDate = assembly.publishedAt.slice(0, 10);
      const matchesSearch =
        !normalizedSearch ||
        `${assembly.title} ${assembly.content}`
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);
      return (
        matchesSearch &&
        (!fromDate || publicationDate >= fromDate) &&
        (!toDate || publicationDate <= toDate)
      );
    });
  }, [assemblies, fromDate, search, toDate]);

  return (
    <>
      <section aria-labelledby="upcoming-assemblies-title">
        <h2
          className="text-lg font-semibold tracking-tight"
          id="upcoming-assemblies-title"
        >
          Próximas
        </h2>
        <div className="mt-3 rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
              <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Nenhuma assembleia futura</h3>
              <p className="mt-1 text-sm leading-6 text-[#657568]">
                Quando a administração divulgar uma próxima assembleia, ela
                aparecerá aqui.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="assembly-history-title" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight"
              id="assembly-history-title"
            >
              Histórico
            </h2>
            <p className="mt-1 text-sm text-[#657568]">
              Comunicados e registros de assembleias publicados.
            </p>
          </div>
          <span className="text-xs text-[#788579]">
            {filteredAssemblies.length}{" "}
            {filteredAssemblies.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#657568]">
              Buscar no histórico
            </span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#788579]"
              />
              <input
                className="h-11 w-full rounded-xl border border-[#dce5d8] bg-white pl-9 pr-3 text-sm text-[#173b2b] outline-none transition placeholder:text-[#9ba79a] focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite um assunto ou palavra"
                type="search"
                value={search}
              />
            </span>
          </label>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-1 text-xs font-medium text-[#657568]">
              Filtrar por data de publicação
            </legend>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[#788579]">
                De
              </span>
              <input
                className="h-11 w-full rounded-xl border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none transition focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                type="date"
                value={fromDate}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[#788579]">
                Até
              </span>
              <input
                className="h-11 w-full rounded-xl border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none transition focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                type="date"
                value={toDate}
              />
            </label>
          </fieldset>
        </div>

        <div aria-live="polite" className="mt-4 space-y-3">
          {filteredAssemblies.length ? (
            filteredAssemblies.map((assembly) => (
              <article
                className="rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-sm shadow-[#24452b]/[0.03]"
                key={assembly.id}
              >
                <time
                  className="text-xs font-medium text-[#788579]"
                  dateTime={assembly.publishedAt}
                >
                  Publicado em{" "}
                  {new Date(assembly.publishedAt).toLocaleDateString("pt-BR")}
                </time>
                <h3 className="mt-2 font-semibold text-[#173b2b]">
                  {assembly.title}
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#657568]">
                  {assembly.content}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-8 text-center">
              <p className="text-sm font-medium text-[#315541]">
                {assemblies.length
                  ? "Nenhum registro encontrado com esses filtros."
                  : "Ainda não há registros de assembleias."}
              </p>
              {assemblies.length ? (
                <button
                  className="mt-3 min-h-10 rounded-lg px-3 text-sm font-semibold text-[#47713d] hover:bg-[#f5f7f2]"
                  onClick={() => {
                    setSearch("");
                    setFromDate("");
                    setToDate("");
                  }}
                  type="button"
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
