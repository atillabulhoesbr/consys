"use client";

import { useActionState } from "react";
import { Building2, LoaderCircle, Plus } from "lucide-react";
import {
  createTenantAction,
  type CreateTenantState,
} from "@/lib/actions";

const initialState: CreateTenantState = { error: null, success: null };

export function CreateTenantForm() {
  const [state, formAction, isPending] = useActionState(
    createTenantAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
          <Building2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold text-[#173b2b]">Novo cliente</h2>
          <p className="text-xs text-[#788579]">
            Crie um espaço independente para uma organização.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#315541]" htmlFor="name">
            Nome da organização
          </label>
          <input
            className="h-10 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
            id="name"
            maxLength={120}
            name="name"
            placeholder="Condomínio Jardim"
            required
          />
          <p className="text-xs text-[#788579]">
            Código para localizar o condomínio no app: identificador@consys.com
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#315541]" htmlFor="slug">
            Identificador da URL
          </label>
          <input
            autoCapitalize="none"
            className="h-10 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
            id="slug"
            maxLength={63}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="condominio-jardim"
            required
          />
        </div>
      </div>
      <div className="border-t border-[#edf1ea] pt-4">
        <h3 className="text-sm font-semibold text-[#173b2b]">
          Primeiro síndico
        </h3>
        <p className="mt-1 text-xs text-[#788579]">
          A conta será criada e vinculada a este condomínio.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[#315541]">Nome</span>
            <input
              autoComplete="name"
              className="h-10 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm outline-none focus:border-[#7fae4e]"
              maxLength={120}
              name="managerName"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[#315541]">Email</span>
            <input
              autoComplete="email"
              className="h-10 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm outline-none focus:border-[#7fae4e]"
              maxLength={254}
              name="managerEmail"
              required
              type="email"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[#315541]">
              Senha inicial
            </span>
            <input
              autoComplete="new-password"
              className="h-10 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm outline-none focus:border-[#7fae4e]"
              minLength={8}
              maxLength={256}
              name="managerPassword"
              required
              type="password"
            />
          </label>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p
          className={`text-sm ${state.error ? "text-rose-700" : "text-[#47713d]"}`}
          aria-live="polite"
        >
          {state.error ?? state.success}
        </p>
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#174c36] px-4 text-sm font-medium text-white transition hover:bg-[#103b2a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Plus aria-hidden="true" className="size-4" />
          )}
          Criar cliente
        </button>
      </div>
    </form>
  );
}
