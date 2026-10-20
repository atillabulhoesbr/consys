"use client";

import { useActionState } from "react";
import { ArrowRight, Camera, LoaderCircle, Plus } from "lucide-react";
import {
  createResidentReservationAction,
  createResidentTicketAction,
  findCondominiumForAppAction,
  requestResidentRegistrationAction,
  residentLoginAction,
  residentVoteInPollAction,
  type ResidentActionState,
} from "@/lib/resident-actions";

const initialState: ResidentActionState = { error: null, success: null };
const inputClass =
  "h-11 w-full rounded-xl border border-[#dce5d8] bg-white px-3 text-sm text-[#173b2b] outline-none transition placeholder:text-[#9ba79a] focus:border-[#7fae4e] focus:ring-2 focus:ring-[#d3fa62]/30";
const labelClass = "text-sm font-medium text-[#315541]";

function Feedback({ state }: { state: ResidentActionState }) {
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

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: string;
}) {
  return (
    <div className="flex justify-end">
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#174c36] px-4 text-sm font-semibold text-white transition hover:bg-[#103b2a] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Plus aria-hidden="true" className="size-4" />
        )}
        {children}
      </button>
    </div>
  );
}

export function ResidentLoginForm({ client }: { client: string }) {
  const [state, action, pending] = useActionState(
    residentLoginAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="client" type="hidden" value={client} />
      <label className="block space-y-2">
        <span className={labelClass}>Email</span>
        <input
          autoComplete="username"
          className={inputClass}
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />
      </label>
      <label className="block space-y-2">
        <span className={labelClass}>Senha</span>
        <input
          autoComplete="current-password"
          className={inputClass}
          maxLength={256}
          name="password"
          placeholder="Sua senha"
          required
          type="password"
        />
      </label>
      <Feedback state={state} />
      <button
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174c36] px-4 text-sm font-semibold text-white transition hover:bg-[#103b2a] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Entrar no app
        {!pending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
      </button>
    </form>
  );
}

export function FindCondominiumForm() {
  const [state, action, pending] = useActionState(
    findCondominiumForAppAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-2">
        <span className={labelClass}>Identificador do condomínio</span>
        <input
          autoCapitalize="none"
          autoComplete="email"
          className={inputClass}
          maxLength={254}
          name="appCode"
          placeholder="residencialmodelo@consys.com"
          required
          type="email"
        />
      </label>
      <p className="text-xs leading-5 text-[#788579]">
        Use o identificador enviado pelo síndico do seu condomínio.
      </p>
      <Feedback state={state} />
      <button
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174c36] px-4 text-sm font-semibold text-white transition hover:bg-[#103b2a] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Continuar
        {!pending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
      </button>
    </form>
  );
}

export function ResidentRegistrationForm({ client }: { client: string }) {
  const [state, action, pending] = useActionState(
    requestResidentRegistrationAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="client" type="hidden" value={client} />
      <label className="block space-y-2">
        <span className={labelClass}>Nome completo</span>
        <input
          autoComplete="name"
          className={inputClass}
          maxLength={120}
          name="name"
          required
        />
      </label>
      <label className="block space-y-2">
        <span className={labelClass}>Email</span>
        <input
          autoComplete="email"
          className={inputClass}
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block space-y-2">
        <span className={labelClass}>Crie uma senha</span>
        <input
          autoComplete="new-password"
          className={inputClass}
          minLength={8}
          maxLength={256}
          name="password"
          required
          type="password"
        />
        <span className="block text-xs text-[#788579]">
          Mínimo de 8 caracteres. O acesso só será liberado após aprovação.
        </span>
      </label>
      <Feedback state={state} />
      <SubmitButton pending={pending}>Solicitar acesso</SubmitButton>
    </form>
  );
}

export function ResidentReservationForm({ client }: { client: string }) {
  const [state, action, pending] = useActionState(
    createResidentReservationAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="client" type="hidden" value={client} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Espaço comum</span>
          <select className={inputClass} name="space">
            <option>Salão de festas</option>
            <option>Espaço gourmet</option>
            <option>Churrasqueira</option>
            <option>Quadra poliesportiva</option>
            <option>Espaço de reuniões</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Data</span>
          <input className={inputClass} name="date" required type="date" />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Horário de início</span>
          <input className={inputClass} name="startsAt" required type="time" />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Horário de término</span>
          <input className={inputClass} name="endsAt" required type="time" />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelClass}>Número de convidados</span>
          <input
            className={inputClass}
            defaultValue="0"
            max="200"
            min="0"
            name="guestCount"
            required
            type="number"
          />
        </label>
      </div>
      <Feedback state={state} />
      <SubmitButton pending={pending}>Enviar solicitação</SubmitButton>
    </form>
  );
}

export function ResidentTicketForm({ client }: { client: string }) {
  const [state, action, pending] = useActionState(
    createResidentTicketAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="client" type="hidden" value={client} />
      <label className="block space-y-1.5">
        <span className={labelClass}>Tipo de chamado</span>
        <select className={inputClass} name="category">
          <option value="maintenance">Manutenção</option>
          <option value="noise">Convivência</option>
          <option value="question">Dúvida</option>
          <option value="other">Outro assunto</option>
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className={labelClass}>Assunto</span>
        <input className={inputClass} maxLength={160} name="title" required />
      </label>
      <label className="block space-y-1.5">
        <span className={labelClass}>Descreva sua solicitação</span>
        <textarea
          className={`${inputClass} h-28 resize-y py-3`}
          maxLength={5000}
          name="description"
          required
        />
      </label>
      <Feedback state={state} />
      <div className="flex items-center justify-between gap-3">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce5d8] bg-white px-3 text-xs font-semibold text-[#47713d] opacity-60"
          disabled
          title="Anexos de foto estarão disponíveis em breve"
          type="button"
        >
          <Camera aria-hidden="true" className="size-4" />
          Anexar foto
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#174c36] px-4 text-sm font-semibold text-white transition hover:bg-[#103b2a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Enviar chamado
          {!pending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
        </button>
      </div>
    </form>
  );
}

export function ResidentPollVote({
  client,
  announcementId,
  optionIndex,
}: {
  client: string;
  announcementId: string;
  optionIndex: number;
}) {
  return (
    <form action={residentVoteInPollAction}>
      <input name="client" type="hidden" value={client} />
      <input name="announcementId" type="hidden" value={announcementId} />
      <input name="optionIndex" type="hidden" value={optionIndex} />
      <button
        className="mt-2 text-xs font-semibold text-[#47713d] hover:underline"
        type="submit"
      >
        Votar nesta opção
      </button>
    </form>
  );
}
