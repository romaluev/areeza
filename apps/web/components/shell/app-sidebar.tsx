"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@areeza/ui/icons";
import { Button } from "@areeza/ui/components/button";
import { Kbd } from "@areeza/ui/components/kbd";
import {
  NavMenuGroup,
  NavMenuHighlight,
} from "@areeza/ui/components/fluid/nav-menu-group";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@areeza/ui/components/sidebar";
import { navLabelWeight } from "@areeza/ui/lib/nav-motion";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { useAppStore } from "@/lib/use-app-store";
import { useSettingsStore } from "@/lib/use-settings-store";
import { LocaleToggle } from "./locale-toggle";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: IconName;
  match?: (pathname: string) => boolean;
};

function buildNav(copy: ReturnType<typeof uiCopy>): NavItem[] {
  return [
    {
      id: "situations",
      href: "/situations",
      label: copy.homeLink,
      icon: "folder",
      match: (p) =>
        p === "/situations" ||
        (p.startsWith("/situations/") && !p.startsWith("/situations/new")),
    },
    {
      id: "board",
      href: "/board",
      label: copy.boardLink,
      icon: "board",
      match: (p) => p.startsWith("/board"),
    },
  ];
}

function NavRow({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <SidebarMenuItem
      data-nav-highlight-id={item.id}
      {...(active ? { "data-active": "" } : {})}
    >
      <NavMenuHighlight id={item.id} />
      <SidebarMenuButton asChild isActive={active} variant="nav" tooltip={item.label}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
        >
          <Icon name={item.icon} size="sm" />
          <span className={navLabelWeight}>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  mobile,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const { resolvedTheme, setTheme } = useTheme();
  const setThemePref = useAppStore((s) => s.setTheme);
  const themeMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setThemePref(next);
    setTheme(next);
  };

  // Global "N" shortcut → new situation.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "n" && e.key !== "N") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      e.preventDefault();
      router.push("/situations/new");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  const isDark = themeMounted && resolvedTheme === "dark";
  const themeLabel = isDark ? "Yorug' rejim" : "Qorong'u rejim";
  const themeIcon = !themeMounted ? "moon" : isDark ? "sun" : "moon";

  const mainNav = buildNav(copy);

  return (
    <Sidebar collapsible={mobile ? "none" : "icon"} variant="inset">
      <SidebarHeader className="gap-1.5 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Areeza">
              <Link
                href="/situations"
                onClick={onNavigate}
                aria-label="Bosh sahifa — Holatlarim"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm">
                  <Icon name="scale" size="sm" />
                </span>
                <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-semibold tracking-tight">
                    Areeza
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    Sud hujjatlari
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              asChild
              variant="brand"
              size="lg"
              className="w-full justify-start gap-2 px-2 font-medium group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <Link href="/situations/new" onClick={onNavigate}>
                <Icon name="add" size="sm" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {copy.newSituation}
                </span>
                <Kbd
                  variant="hint"
                  className="ml-auto group-data-[collapsible=icon]:hidden"
                >
                  N
                </Kbd>
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Asosiy</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenuGroup layoutId="sidebar-main">
              <SidebarMenu>
                {mainNav.map((item) => {
                  const active =
                    item.match?.(pathname) ?? pathname.startsWith(item.href);
                  return (
                    <NavRow
                      key={item.id}
                      item={item}
                      active={active}
                      onNavigate={onNavigate}
                    />
                  );
                })}
              </SidebarMenu>
            </NavMenuGroup>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border">
        <LocaleToggle className="w-full group-data-[collapsible=icon]:hidden" />
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand"
            aria-hidden
          >
            FL
          </span>
          <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Foydalanuvchi</span>
            <span className="truncate text-[11px] text-muted-foreground">
              Demo rejim
            </span>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
          onClick={toggleTheme}
          disabled={!themeMounted}
          aria-label={themeMounted ? themeLabel : "Mavzuni almashtirish"}
        >
          <Icon name={themeIcon} size="sm" />
          <span className="group-data-[collapsible=icon]:hidden">
            {themeMounted ? themeLabel : "Mavzu"}
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
          onClick={() => useSettingsStore.getState().setOpen(true)}
          aria-label={copy.settingsOpen}
        >
          <Icon name="settings" size="sm" />
          <span className="group-data-[collapsible=icon]:hidden">
            {copy.settingsOpen}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
