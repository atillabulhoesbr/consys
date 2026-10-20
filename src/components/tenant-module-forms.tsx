"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import {
  createAnnouncementAction,
  createChargeAction,
  type ModuleActionState,
} from "@/lib/tenant-actions";

const initialState: ModuleActionState = { error: null, success: null };
const inputClass =
  "h-10 w-full rounded-lg border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none transition placeholder:text-[#9ba79a] focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30";
const labelClass = "text-sm font-medium text-[#315541]";

function Feedback({ state }: { state: ModuleActionState }) {
  const message = state.error ?? state.success;
  if (!message) return null;
  return (
    <p
      aria-live="polite"
      className={`text-sm ${state.error ? "text-rose-700" : "text-[#47713d]"}`}
      role={state.error ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function ChargeForm({ client }: { client: string }) {
  const [state, action, pending] = useActionState(
    createChargeAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="client" type="hidden" value={client} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Unidade</span>
          <input className={inputClass} maxLength={32} name="unitCode" placeholder="Ex.: Bloco A · 402" required />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Descrição</span>
          <input className={inputClass} maxLength={160} name="description" placeholder="Cota condominial" required />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Competência</span>
          <input className={inputClass} maxLength={40} name="competence" placeholder="Outubro/2026" required />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Vencimento</span>
          <input className={inputClass} name="dueDate" required type="date" />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelClass}>Valor (R$)</span>
          <input className={inputClass} min="0.01" name="amount" placeholder="0,00" required step="0.01" type="number" />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="mr-auto">
          <Feedback state={state} />
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#174c36] px-4 text-sm font-medium text-white transition hover:bg-[#103b2a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
          Registrar cobrança
        </button>
      </div>
    </form>
  );
}

export function AnnouncementForm({ client }: { client: string }) {
  const [state, action, pending] = useActionState(
    createAnnouncementAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="client" type="hidden" value={client} />
      <label className="block space-y-1.5">
        <span className={labelClass}>Título</span>
        <input className={inputClass} maxLength={160} name="title" required />
      </label>
      <label className="block space-y-1.5">
        <span className={labelClass}>Comunicado</span>
        <textarea className={`${inputClass} h-28 resize-y py-2`} maxLength={10000} name="content" required />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className={labelClass}>Categoria</span>
          <select className={inputClass} name="category">
            <option value="general">Geral</option>
            <option value="maintenance">Manutenção</option>
            <option value="assembly">Assembleia</option>
            <option value="conviviality">Convivência</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Prioridade</span>
          <select className={inputClass} name="priority">
            <option value="normal">Normal</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Fixar no mural?</span>
          <select className={inputClass} name="pinned">
            <option value="no">Não</option>
            <option value="yes">Sim</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Pergunta de enquete (opcional)</span>
          <input className={inputClass} maxLength={500} name="pollQuestion" />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Opções (uma por linha)</span>
          <textarea className={`${inputClass} h-20 resize-y py-2`} maxLength={1600} name="pollOptions" />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="mr-auto">
          <Feedback state={state} />
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#174c36] px-4 text-sm font-medium text-white transition hover:bg-[#103b2a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
          Publicar
        </button>
      </div>
    </form>
  );
}
