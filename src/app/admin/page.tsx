import {
  ArrowUpRight,
  Blocks,
  Building2,
  LogOut,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTenantForm } from "@/components/create-tenant-form";
import { adminLogoutAction } from "@/lib/actions";
import { getCurrentAccount } from "@/lib/auth";
import { listTenants } from "@/lib/storage/json-store";

export default async function AdminPage() {
  const account = await getCurrentAccount();
  if (!account || account.platformRole !== "super_admin") {
    redirect("/admin/login");
  }

  const tenants = await listTenants();
  const activeTenants = tenants.filter((tenant) => tenant.status === "active");
  const suspendedTenants = tenants.length - activeTenants.length;

  return (
    <main className="min-h-screen bg-[#f7f9f5] text-[#173b2b]">
      <header className="border-b border-[#e5ebe2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="/admin">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#174c36] text-[#d3fa62]">
              <Blocks aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block font-semibold tracking-tight">ConSys</span>
              <span className="block text-xs text-[#788579]">
                Administração da plataforma
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{account.name}</p>
              <p className="text-xs text-[#788579]">{account.email}</p>
            </div>
            <form action={adminLogoutAction}>
              <button
                aria-label="Sair da administração"
                className="flex size-10 items-center justify-center rounded-lg border border-[#dce5d8] text-[#657568] transition hover:bg-[#f1f5ec] hover:text-[#173b2b]"
                title="Sair"
                type="submit"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#5c8a32]">
              Painel da plataforma
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Organizações clientes
            </h1>
            <p className="mt-2 text-[#657568]">
              Gerencie os ambientes ConSys cadastrados na plataforma.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dce8d6] bg-[#eff5e9] px-3 py-1.5 text-xs font-medium text-[#47713d]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Sessão de Super Admin
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm text-[#657568]">Total de clientes</p>
            <p className="mt-1 text-3xl font-semibold">{tenants.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
              <UsersRound aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm text-[#657568]">Clientes ativos</p>
            <p className="mt-1 text-3xl font-semibold">{activeTenants.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#f4f2e9] text-[#877342]">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm text-[#657568]">Clientes suspensos</p>
            <p className="mt-1 text-3xl font-semibold">{suspendedTenants}</p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-sm shadow-[#24452b]/[0.03] sm:p-6">
          <CreateTenantForm />
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Clientes cadastrados</h2>
              <p className="mt-1 text-sm text-[#657568]">
                Cada cliente tem seu próprio endereço e espaço de acesso.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#657568] ring-1 ring-[#e5ebe2]">
              {tenants.length} no total
            </span>
          </div>

          {tenants.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5ebe2] bg-white shadow-sm shadow-[#24452b]/[0.03]">
              <ul className="divide-y divide-[#edf1ea]">
                {tenants.map((tenant) => (
                  <li
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    key={tenant.id}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff5e9] text-[#47713d]">
                        <Building2 aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="mt-0.5 text-sm text-[#788579]">
                          app.consys/{tenant.slug} · {tenant.appCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          tenant.status === "active"
                            ? "bg-[#eff5e9] text-[#47713d]"
                            : "bg-[#f4f2e9] text-[#877342]"
                        }`}
                      >
                        {tenant.status === "active" ? "Ativo" : "Suspenso"}
                      </span>
                      {tenant.status === "active" ? (
                        <Link
                          aria-label={`Abrir ${tenant.name}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#47713d] hover:text-[#174c36]"
                          href={`/${tenant.slug}`}
                        >
                          Abrir espaço
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-4"
                          />
                        </Link>
                      ) : (
                        <span className="text-sm text-[#9ba79a]">
                          Acesso bloqueado
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#dce5d8] bg-white px-5 py-12 text-center">
              <Building2
                aria-hidden="true"
                className="mx-auto size-8 text-[#91a28b]"
              />
              <h3 className="mt-3 font-medium">Nenhum cliente cadastrado</h3>
              <p className="mt-1 text-sm text-[#788579]">
                Use o formulário acima para criar o primeiro espaço.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
