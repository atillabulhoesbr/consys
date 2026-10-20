import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronRight,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { AppPromo } from "@/components/app-promo";

const features = [
  {
    icon: Building2,
    title: "Tudo em um só lugar",
    description:
      "Condomínios, blocos e unidades organizados para simplificar a rotina administrativa.",
  },
  {
    icon: Bell,
    title: "Comunicação que aproxima",
    description:
      "Comunicados acessíveis para manter todos informados sobre a vida em comunidade.",
  },
  {
    icon: ShieldCheck,
    title: "Cada cliente no seu espaço",
    description:
      "Acesso individual para cada condomínio, com informações protegidas por usuário.",
  },
];

export default function Home() {
  return (
    <main
      className="landing-page min-h-screen overflow-hidden bg-white text-[#173b2b]"
      data-page="landing"
    >
      <header className="border-b border-[#e8eee8] bg-white">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"
        >
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#174c36] text-[#d3fa62]">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-[#173b2b]">
              consys
            </span>
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#174c36] px-4 text-sm font-medium text-white transition hover:bg-[#103b2a]"
            href="/admin/login"
          >
            Acessar plataforma
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </nav>
      </header>

      <section className="relative bg-[#f7f9f3]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-40 size-[34rem] rounded-full bg-[#d9f479]/35 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dce8d6] bg-white px-3 py-1.5 text-xs font-medium text-[#3f6a4b]">
              <span className="size-2 rounded-full bg-[#a8d638]" />
              Administração e convivência em harmonia
            </span>
            <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight text-[#173b2b] sm:text-6xl">
              Cuidar do condomínio pode ser{" "}
              <span className="text-[#5c8a32]">mais simples.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#657568]">
              O ConSys reúne a rotina da administração em um ambiente claro,
              organizado e fácil de usar — para que a comunidade fique sempre
              bem informada.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#174c36] px-5 font-semibold text-white shadow-sm transition hover:bg-[#103b2a]"
                href="/admin/login"
              >
                Entrar no meu espaço
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#cfd9cf] bg-white px-5 font-medium text-[#315541] transition hover:bg-[#f1f5ec]"
                href="#recursos"
              >
                Conhecer a plataforma
              </a>
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-[#657568]">
              <ShieldCheck aria-hidden="true" className="size-4 text-[#528141]" />
              Um ambiente próprio para cada condomínio
            </div>
          </div>

          <div className="relative z-0 mx-auto w-full max-w-lg">
            <div
              aria-hidden="true"
              className="absolute -right-5 -top-5 size-28 rounded-full bg-[#d3fa62] sm:-right-8 sm:-top-8 sm:size-36"
            />
            <div className="relative z-10 flex aspect-[1.08] items-end justify-center overflow-hidden rounded-[2rem] border border-[#e4ebdd] bg-[#edf3e5] px-5 pt-12 shadow-xl shadow-[#24452b]/10 sm:px-8">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/4 bg-[#dce9cf]"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-[20%] left-[13%] size-20 rounded-full bg-[#d3fa62]/70 sm:left-[15%] sm:size-28"
              />
              <div className="relative z-10 mb-[18%] flex items-end gap-2 sm:gap-3">
                <div className="flex h-36 w-24 flex-col justify-between rounded-t-xl bg-[#789778] p-3 sm:h-44 sm:w-28 sm:p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span
                        aria-hidden="true"
                        className="aspect-square rounded-sm bg-[#e8f0dc]/80"
                        key={index}
                      />
                    ))}
                  </div>
                  <span className="mx-auto h-7 w-5 rounded-t-full bg-[#e8f0dc]/80" />
                </div>
                <div className="flex h-52 w-32 flex-col justify-between rounded-t-xl bg-[#174c36] p-3.5 sm:h-64 sm:w-36 sm:p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, index) => (
                      <span
                        aria-hidden="true"
                        className="aspect-square rounded-sm bg-[#d3fa62]/75"
                        key={index}
                      />
                    ))}
                  </div>
                  <span className="mx-auto h-9 w-6 rounded-t-full bg-[#d3fa62]/75" />
                </div>
                <div className="flex h-32 w-24 flex-col justify-between rounded-t-xl bg-[#98ad84] p-3 sm:h-40 sm:w-28 sm:p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }, (_, index) => (
                      <span
                        aria-hidden="true"
                        className="aspect-square rounded-sm bg-white/75"
                        key={index}
                      />
                    ))}
                  </div>
                  <span className="mx-auto h-6 w-5 rounded-t-full bg-white/75" />
                </div>
              </div>
              <div className="absolute left-4 top-4 z-20 max-w-[14rem] rounded-2xl border border-white/80 bg-white p-4 shadow-lg shadow-[#24452b]/10 sm:left-6 sm:top-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#174c36] text-[#d3fa62]">
                    <Building2 aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#173b2b]">
                      ConSys
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#788579]">
                      Gestão condominial
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 z-20 max-w-[13rem] rounded-2xl border border-[#e7ece4] bg-white p-4 shadow-lg shadow-[#24452b]/10 sm:bottom-6 sm:right-6">
                <div className="flex items-center gap-2 text-[#47713d]">
                  <UsersRound aria-hidden="true" className="size-4" />
                  <span className="text-[10px] font-medium">
                    Para quem administra e mora
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#657568]">
                  Rotinas mais organizadas, comunidade mais próxima.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#eff5e9] px-2.5 py-1 text-[10px] font-medium text-[#47713d]">
                  <Check aria-hidden="true" className="size-3" />
                  Um só lugar
                </span>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -left-5 z-0 size-24 rounded-[1.75rem] bg-[#e8f0dc] sm:-left-8 sm:size-32"
            />
          </div>
        </div>
      </section>

      <section className="bg-white" id="recursos">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-[#5c8a32]">
              Simples para todos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#173b2b] sm:text-4xl">
              Mais organização para a vida em comunidade.
            </h2>
            <p className="mt-4 leading-7 text-[#657568]">
              Uma ferramenta acolhedora para aproximar a administração dos
              moradores, sem complicar a rotina.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-2xl border border-[#e7ece4] bg-white p-6 shadow-sm shadow-[#24452b]/[0.03]"
                key={title}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold text-[#173b2b]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#657568]">
                  {description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-[#5c8a32]">
                  Pensado para a sua rotina
                  <ChevronRight aria-hidden="true" className="size-3.5" />
                </span>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#174c36] px-6 py-8 sm:flex-row sm:items-center sm:px-9">
            <div>
              <p className="text-sm font-medium text-[#d3fa62]">
                Um bom lugar começa com uma boa conversa.
              </p>
              <h2 className="mt-2 max-w-xl text-xl font-semibold text-white sm:text-2xl">
                Acesse o espaço do seu condomínio pelo ConSys.
              </h2>
            </div>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d3fa62] px-4 text-sm font-semibold text-[#173b2b] transition hover:bg-[#c5ed4e]"
              href="/admin/login"
            >
              Acessar plataforma
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <AppPromo />

      <footer className="bg-[#102f25] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-16">
          <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr] lg:gap-16">
            <div className="max-w-md">
              <Link
                className="inline-flex items-center gap-3"
                href="/"
                aria-label="ConSys, página inicial"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#d3fa62] text-[#102f25]">
                  <Building2 aria-hidden="true" className="size-5" />
                </span>
                <span className="text-xl font-semibold tracking-tight">
                  consys
                </span>
              </Link>
              <p className="mt-5 text-sm leading-6 text-white/70">
                Mais organização para a administração. Mais tranquilidade para
                quem vive o condomínio todos os dias.
              </p>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d3fa62]">
                ConSys
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>
                  <Link className="transition hover:text-white" href="#recursos">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link
                    className="transition hover:text-white"
                    href="/condominio-demo/login"
                  >
                    Acesse o app
                  </Link>
                </li>
                <li>
                  <span className="text-white/45">Aplicativo móvel em breve</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d3fa62]">
                Acesso
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>
                  <Link
                    className="transition hover:text-white"
                    href="/admin/login"
                  >
                    Acesso do síndico
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" href="/admin">
                    Administração da plataforma
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} ConSys · Uma plataforma MabFy Systems</p>
            <p>Gestão condominial feita para aproximar pessoas.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
