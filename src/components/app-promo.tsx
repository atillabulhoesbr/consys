import {
  Apple,
  Bell,
  CalendarDays,
  Check,
  Play,
  UsersRound,
} from "lucide-react";

export function AppPromo() {
  return (
    <section className="overflow-hidden bg-[#f7f9f3]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dce8d6] bg-white px-3 py-1.5 text-xs font-medium text-[#47713d]">
            <span className="size-2 rounded-full bg-[#a8d638]" />
            ConSys no seu celular
          </span>
          <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[#173b2b] sm:text-4xl">
            A vida do condomínio, mais perto de você.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#657568]">
            Receba comunicados, acompanhe suas taxas e fale com a administração
            direto pelo app. Uma experiência simples para iPhone e Android.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <StoreBadge platform="apple" />
            <StoreBadge platform="google" />
          </div>
          <p className="mt-3 text-xs text-[#788579]">
            O app está em preparação. Avisaremos quando estiver disponível para
            baixar.
          </p>
          <ul className="mt-7 grid gap-3 text-sm text-[#315541] sm:grid-cols-2">
            {[
              "Comunicados e regras do condomínio",
              "Solicitação de reservas",
              "Acompanhamento de chamados",
              "Taxas e vencimentos da sua unidade",
            ].map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <span className="flex size-5 items-center justify-center rounded-full bg-[#e9f2dd] text-[#47713d]">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xl min-w-0 [container-type:inline-size]">
          <div className="absolute left-0 top-0 flex size-[36rem] origin-top-left items-center justify-center gap-8 [transform:scale(tan(atan2(100cqw,36rem)))]">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e7efd9]"
            />
            <PhoneMockup className="relative z-10 -rotate-[7deg] translate-y-5" variant="notices" />
            <PhoneMockup className="relative z-20 rotate-[6deg] -translate-y-5" variant="home" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({
  className,
  variant,
}: {
  className: string;
  variant: "home" | "notices";
}) {
  return (
    <div
      aria-label={
        variant === "home"
          ? "Prévia do app ConSys para celular"
          : "Prévia das regras e comunicados do app ConSys"
      }
      className={`w-60 shrink-0 rounded-[2.4rem] border-[5px] border-[#163d2d] bg-[#163d2d] p-1.5 shadow-2xl shadow-[#183b2b]/25 ${className}`}
      role="img"
    >
      <div className="overflow-hidden rounded-[1.9rem] bg-[#f7f9f5]">
        <div className="flex h-8 items-center justify-center bg-white">
          {variant === "notices" ? (
            <span className="size-2 rounded-full bg-[#163d2d]" />
          ) : (
            <span className="h-1 w-12 rounded-full bg-[#163d2d]" />
          )}
        </div>
        <div className="min-h-[23rem] px-4 pb-4">
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#174c36] text-[#d3fa62]">
                <Bell aria-hidden="true" className="size-3.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-[#173b2b]">
                  ConSys
                </p>
                <p className="text-[8px] text-[#788579]">
                  Residencial Modelo
                </p>
              </div>
            </div>
            <span className="size-6 rounded-full bg-[#e6eddf]" />
          </div>

          {variant === "home" ? (
            <>
              <div className="mt-5">
                <p className="text-[9px] text-[#5c8a32]">
                  Bloco A · Unidade 402
                </p>
                <h3 className="mt-1 text-base font-bold text-[#173b2b]">
                  Olá, Marina
                </h3>
                <p className="mt-1 text-[9px] text-[#788579]">
                  Seu condomínio em um só lugar
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniCard label="Taxas em aberto" value="1" />
                <MiniCard label="Meus chamados" value="2" />
              </div>
              <div className="mt-3 rounded-xl bg-[#174c36] p-3 text-white">
                <div className="flex items-center gap-1.5 text-[#d3fa62]">
                  <CalendarDays aria-hidden="true" className="size-3" />
                  <span className="text-[8px] font-semibold">Reservas</span>
                </div>
                <p className="mt-2 text-[10px] font-semibold">
                  Reserve seu espaço
                </p>
                <p className="mt-1 text-[7px] text-white/75">
                  Veja horários e acompanhe pedidos
                </p>
                <span className="mt-3 inline-flex rounded-lg bg-[#d3fa62] px-2.5 py-1 text-[7px] font-bold text-[#173b2b]">
                  Nova solicitação
                </span>
              </div>
              <div className="mt-3 rounded-xl border border-[#e5ebe2] bg-white p-3">
                <p className="text-[8px] font-bold text-[#173b2b]">
                  Fale com a administração
                </p>
                <p className="mt-1 text-[7px] text-[#788579]">
                  Acompanhe suas solicitações
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mt-5">
                <p className="text-[9px] text-[#5c8a32]">
                  Fique por dentro
                </p>
                <h3 className="mt-1 text-base font-bold text-[#173b2b]">
                  Mural do condomínio
                </h3>
              </div>
              <div className="mt-4 rounded-xl border border-[#e5ebe2] bg-white p-3">
                <span className="rounded-full bg-[#eff5e9] px-2 py-1 text-[7px] font-semibold text-[#47713d]">
                  REGRAS DO CONDOMÍNIO
                </span>
                <h4 className="mt-3 text-[10px] font-bold text-[#173b2b]">
                  Uso das áreas comuns
                </h4>
                <p className="mt-1 text-[8px] leading-4 text-[#657568]">
                  Consulte os horários e orientações para aproveitar nossos
                  espaços com tranquilidade.
                </p>
                <div className="mt-3 space-y-2">
                  <RuleRow>Respeite o horário reservado</RuleRow>
                  <RuleRow>Deixe o espaço organizado</RuleRow>
                  <RuleRow>Cuide das áreas compartilhadas</RuleRow>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-[#e5ebe2] bg-white p-3">
                <p className="text-[7px] font-semibold text-[#5c8a32]">
                  COMUNICADO
                </p>
                <p className="mt-1 text-[8px] font-bold text-[#173b2b]">
                  Assembleia de moradores
                </p>
                <p className="mt-1 text-[7px] text-[#788579]">
                  Quinta-feira, às 19h
                </p>
              </div>
            </>
          )}

          <div className="mt-4 flex justify-around border-t border-[#e5ebe2] pt-3">
            {[Bell, CalendarDays, UsersRound].map((Icon, index) => (
              <span
                className={`flex size-6 items-center justify-center rounded-lg ${
                  index === 0 ? "bg-[#eff5e9] text-[#47713d]" : "text-[#9ba79a]"
                }`}
                key={index}
              >
                <Icon aria-hidden="true" className="size-3" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5ebe2] bg-white p-2.5">
      <p className="text-[7px] leading-3 text-[#788579]">{label}</p>
      <p className="mt-1 text-base font-bold text-[#173b2b]">{value}</p>
    </div>
  );
}

function RuleRow({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[8px] leading-3 text-[#657568]">
      <Check aria-hidden="true" className="size-2.5 shrink-0 text-[#5c8a32]" />
      {children}
    </div>
  );
}

function StoreBadge({ platform }: { platform: "apple" | "google" }) {
  const apple = platform === "apple";
  const Icon = apple ? Apple : Play;
  return (
    <span
      aria-disabled="true"
      className="inline-flex min-h-14 cursor-not-allowed items-center gap-3 rounded-xl bg-[#111] px-4 py-2.5 text-white opacity-80"
      title="Disponível quando o aplicativo for publicado"
    >
      <Icon aria-hidden="true" className="size-6" fill={apple ? "none" : "currentColor"} />
      <span>
        <span className="block text-[9px] leading-3 text-white/75">
          {apple ? "EM BREVE NA" : "DISPONÍVEL EM BREVE NO"}
        </span>
        <span className="block text-sm font-semibold leading-5">
          {apple ? "App Store" : "Google Play"}
        </span>
      </span>
    </span>
  );
}
