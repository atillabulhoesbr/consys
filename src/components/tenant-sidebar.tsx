"use client";

import {
  Banknote,
  Bell,
  Blocks,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Home,
  LogOut,
  Menu,
  UserRoundCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AuthenticatedAccount } from "@/lib/auth";
import type { Tenant } from "@/lib/storage/json-store";
import { logoutAction } from "@/lib/actions";

const navigation = [
  { label: "Início", path: "", icon: Home },
  { label: "Taxas", path: "/taxas", icon: Banknote },
  { label: "Reservas", path: "/reservas", icon: Blocks },
  { label: "Mural", path: "/mural", icon: Bell },
  { label: "Chamados", path: "/chamados", icon: CircleHelp },
  { label: "Moradores", path: "/moradores", icon: UserRoundCheck },
];

type TenantSidebarProps = {
  tenant: Tenant;
  account: AuthenticatedAccount;
  pendingResidentCount: number;
};

export function TenantSidebar({
  tenant,
  account,
  pendingResidentCount,
}: TenantSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const menu = (isCollapsed: boolean, close?: () => void) => (
    <div className="flex h-full flex-col bg-white">
      <div
        className={`flex h-[4.5rem] shrink-0 items-center border-b border-[#edf1ea] ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <Link
          aria-label="ConSys — início"
          className="flex min-w-0 items-center gap-3"
          href={`/${tenant.slug}`}
          onClick={close}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#174c36] text-[#d3fa62]">
            <Blocks aria-hidden="true" className="size-5" />
          </span>
          {!isCollapsed ? (
            <span className="min-w-0">
              <span className="block font-semibold tracking-tight text-[#173b2b]">
                ConSys
              </span>
              <span className="block truncate text-xs text-[#788579]">
                {tenant.name}
              </span>
            </span>
          ) : null}
        </Link>
        {!close ? (
          <button
            aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#788579] transition hover:bg-[#f1f5ec] hover:text-[#315541]"
            onClick={() => setCollapsed((value) => !value)}
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            type="button"
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" className="size-4" />
            ) : (
              <ChevronLeft aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      {!isCollapsed ? (
        <p className="px-5 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ba79a]">
          Espaço do condomínio
        </p>
      ) : (
        <div className="h-4" />
      )}
      <nav aria-label="Menu do condomínio" className="flex-1 space-y-1 px-3">
        {navigation.map(({ label, path, icon: Icon }) => {
          const href = `/${tenant.slug}${path}`;
          const active =
            path === ""
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={isCollapsed ? label : undefined}
              className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition ${
                active
                  ? "bg-[#eff5e9] font-semibold text-[#315f3e]"
                  : "text-[#657568] hover:bg-[#f7f9f5] hover:text-[#173b2b]"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              href={href}
              key={path}
              onClick={close}
              title={isCollapsed ? label : undefined}
            >
              <Icon
                aria-hidden="true"
                className={`size-[18px] shrink-0 ${
                  active ? "text-[#47713d]" : "text-[#788579]"
                }`}
              />
              {!isCollapsed ? <span>{label}</span> : null}
              {!isCollapsed &&
              path === "/moradores" &&
              pendingResidentCount > 0 ? (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#d3fa62] px-1.5 py-0.5 text-[10px] font-bold text-[#173b2b]">
                  {pendingResidentCount}
                </span>
              ) : null}
              {!isCollapsed && active ? (
                <span className="ml-auto size-1.5 rounded-full bg-[#8db64f]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-[#edf1ea] p-3 ${isCollapsed ? "px-2" : ""}`}>
        <div className={`flex items-center gap-3 rounded-lg p-2 ${isCollapsed ? "justify-center" : ""}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e7efe0] text-sm font-semibold text-[#315541]">
            {account.name.slice(0, 1).toUpperCase()}
          </span>
          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#173b2b]">
                {account.name}
              </p>
              <p className="truncate text-xs text-[#788579]">
                {account.platformRole === "super_admin"
                  ? "Super Admin"
                  : account.managerTenantIds.includes(tenant.id)
                    ? "Síndico"
                    : "Morador"}
              </p>
            </div>
          ) : null}
        </div>
        <form action={logoutAction}>
          <button
            aria-label="Sair da conta"
            className={`mt-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-[#657568] transition hover:bg-[#f7f9f5] hover:text-[#173b2b] ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isCollapsed ? "Sair" : undefined}
            type="submit"
          >
            <LogOut aria-hidden="true" className="size-[18px] shrink-0" />
            {!isCollapsed ? <span>Sair</span> : null}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e5ebe2] bg-white px-4 md:hidden">
        <button
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          className="flex size-10 items-center justify-center rounded-lg text-[#315541] hover:bg-[#eff5e9]"
          onClick={() => setMobileOpen((value) => !value)}
          type="button"
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
        <Link
          className="text-sm font-semibold text-[#173b2b]"
          href={`/${tenant.slug}`}
        >
          ConSys
        </Link>
        <span className="size-10" />
      </header>

      <aside
        className={`hidden h-screen shrink-0 border-r border-[#e5ebe2] bg-white transition-[width] duration-200 md:sticky md:top-0 md:flex ${
          collapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        {menu(collapsed)}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-[#173b2b]/25"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative z-10 h-full w-[min(18rem,85vw)] border-r border-[#e5ebe2] shadow-xl">
            {menu(false, () => setMobileOpen(false))}
          </aside>
        </div>
      ) : null}
    </>
  );
}
