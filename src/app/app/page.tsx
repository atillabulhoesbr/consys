import { ArrowLeft, Bell, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FindCondominiumForm } from "@/components/resident-forms";

export default function AppEntryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9f3] px-5 py-12 text-[#173b2b]">
      <div className="w-full max-w-md">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#657568] hover:text-[#173b2b]"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar ao ConSys
        </Link>
        <section className="rounded-3xl border border-[#e2e9de] bg-white p-6 shadow-xl shadow-[#24452b]/[0.08] sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#174c36] text-[#d3fa62]">
            <Bell aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-6 text-sm font-semibold text-[#5c8a32]">ConSys App</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Encontre seu condomínio
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657568]">
            Informe o identificador compartilhado pelo síndico. Depois, entre
            ou solicite seu acesso de morador.
          </p>
          <div className="mt-7">
            <FindCondominiumForm />
          </div>
          <div className="mt-6 flex items-start gap-2 border-t border-[#e8eee8] pt-5 text-xs leading-5 text-[#788579]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#5c8a32]"
            />
            O cadastro só libera o acesso após confirmação do síndico.
          </div>
        </section>
      </div>
    </main>
  );
}
