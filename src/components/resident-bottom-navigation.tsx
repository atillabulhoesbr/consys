import Link from "next/link";
import {
  CalendarDays,
  Camera,
  FileText,
  Home,
  type LucideIcon,
  UserRound,
} from "lucide-react";

type ResidentSection = "home" | "agenda" | "assemblies" | "profile";
type NavigationItemData = {
  label: string;
  href: string;
  icon: LucideIcon;
  ariaLabel?: string;
  section?: ResidentSection;
};

export function ResidentBottomNavigation({
  tenantSlug,
  currentSection,
}: {
  tenantSlug: string;
  currentSection: ResidentSection;
}) {
  const appPath = `/${tenantSlug}/app`;
  const items: NavigationItemData[] = [
    {
      label: "Início",
      href: currentSection === "home" ? "#inicio" : `${appPath}#inicio`,
      icon: Home,
      section: "home",
    },
    {
      label: "Agenda",
      href: `/${tenantSlug}/agenda`,
      icon: CalendarDays,
      section: "agenda",
    },
    {
      label: "Assembleias",
      href: `/${tenantSlug}/assembleias`,
      icon: FileText,
      ariaLabel: "Atas e assembleias",
      section: "assemblies",
    },
    {
      label: "Perfil",
      href: `/${tenantSlug}/perfil`,
      icon: UserRound,
      section: "profile",
    },
  ] as const;

  return (
    <nav
      aria-label="Navegação do app"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-3xl grid-cols-5 border-t border-[#e5ebe2] bg-white/95 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(23,59,43,0.06)] backdrop-blur sm:px-6"
    >
      {items.slice(0, 2).map((item) => (
        <NavigationItem
          currentSection={currentSection}
          item={item}
          key={item.label}
        />
      ))}
      <button
        aria-label="Câmera (em breve)"
        className="relative -mt-7 flex size-14 place-self-center items-center justify-center rounded-full border-4 border-white bg-[#174c36] text-white shadow-md shadow-[#24452b]/20"
        disabled
        title="Câmera em breve"
        type="button"
      >
        <Camera aria-hidden="true" className="size-6" />
      </button>
      {items.slice(2).map((item) => (
        <NavigationItem
          currentSection={currentSection}
          item={item}
          key={item.label}
        />
      ))}
    </nav>
  );
}

function NavigationItem({
  item,
  currentSection,
}: {
  item: NavigationItemData;
  currentSection: ResidentSection;
}) {
  const Icon = item.icon;
  const isCurrent = item.section === currentSection;

  return (
    <Link
      aria-current={isCurrent ? "page" : undefined}
      aria-label={"ariaLabel" in item ? item.ariaLabel : item.label}
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium transition hover:bg-[#f5f7f2] hover:text-[#174c36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c8a32] sm:text-xs ${
        isCurrent ? "text-[#174c36]" : "text-[#657568]"
      }`}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span>{item.label}</span>
    </Link>
  );
}
