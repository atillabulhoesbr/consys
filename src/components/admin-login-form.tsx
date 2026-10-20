"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import {
  adminLoginAction,
  type AdminLoginState,
} from "@/lib/actions";

const initialState: AdminLoginState = { error: null };

export function AdminLoginForm({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(
    adminLoginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#315541]" htmlFor="email">
          Email de acesso
        </label>
        <input
          autoComplete="username"
          className="h-11 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none transition placeholder:text-[#9ba79a] focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
          id="email"
          maxLength={254}
          name="email"
          placeholder="sindico@exemplo.com"
          required
          disabled={disabled}
          type="email"
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#315541]"
          htmlFor="password"
        >
          Senha
        </label>
        <input
          autoComplete="current-password"
          className="h-11 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none transition placeholder:text-[#9ba79a] focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30"
          id="password"
          maxLength={256}
          name="password"
          placeholder="Sua senha"
          required
          disabled={disabled}
          type="password"
        />
      </div>
      {state.error ? (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#174c36] px-4 text-sm font-semibold text-white transition hover:bg-[#103b2a] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || disabled}
        type="submit"
      >
        {isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar no ambiente web
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
