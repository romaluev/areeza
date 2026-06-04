"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Icon, type IconName } from "@areeza/ui/icons";
import { Button } from "@areeza/ui/components/button";
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
import { cn } from "@areeza/ui/lib/utils";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { useAppStore } from "@/lib/use-app-store";
import { LocaleToggle } from "./locale-toggle";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: IconName;
  match?: (pathname: string) => boolean;
};

function buildNav(copy: ReturnType<typeof uiCopy>) {
  const mainNav: NavItem[] = [
    {
      id: "situations",
      href: "/situations",
      label: copy.homeLink,
      icon: "folder",
      match: (p) =>
        p === "/situations" ||
        (p.startsWith("/situations/") && !p.startsWith("/situations/new")),
    },
  ];

  const newCaseNav: NavItem = {
    id: "new-case",
    href: "/situations/new",
    label: copy.newSituation,
    icon: "add",
    match: (p) => p === "/situations/new" || p === "/cases/new",
  };

  return { mainNav, newCaseNav };
}

function NavRow({
  item,
  active,
  onNavigate,
  buttonVariant = "nav",
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  buttonVariant?: "nav" | "default";
}) {
  return (
    <SidebarMenuItem
      data-nav-highlight-id={item.id}
      {...(active ? { "data-active": "" } : {})}
    >
      <NavMenuHighlight id={item.id} />
      <SidebarMenuButton
        asChild
        isActive={active}
        variant={buttonVariant}
        tooltip={item.label}
      >
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

  const isDark = themeMounted && resolvedTheme === "dark";
  const themeLabel = isDark ? "Yorug' rejim" : "Qorong'u rejim";
  const themeIcon = !themeMounted ? "moon" : isDark ? "sun" : "moon";

  const { mainNav, newCaseNav } = buildNav(copy);
  const isNewCaseActive =
    newCaseNav.match?.(pathname) ?? pathname.startsWith(newCaseNav.href);

  return (
    <Sidebar
      collapsible={mobile ? "none" : "icon"}
      variant="inset"
      className={cn(!mobile && "shellPanel h-full w-full border-0")}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          href="/situations"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onNavigate}
          aria-label="Bosh sahifa — Holatlarim"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm">
            <Icon name="scale" size="sm" />
          </span>
          <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-semibold tracking-tight">Areeza</span>
            <span className="block text-[10px] text-muted-foreground">Sud hujjatlari</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Asosiy</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenuGroup layoutId="sidebar-main">
              <SidebarMenu>
                {mainNav.map((item) => {
                const active = item.match?.(pathname) ?? pathname.startsWith(item.href);
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

        <SidebarGroup>
          <SidebarGroupLabel>{copy.newSituation}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenuGroup layoutId="sidebar-new-case">
              <SidebarMenu>
                <NavRow
                  item={newCaseNav}
                  active={isNewCaseActive}
                  onNavigate={onNavigate}
                  buttonVariant="default"
                />
              </SidebarMenu>
            </NavMenuGroup>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <LocaleToggle className="mb-2 w-full group-data-[collapsible=icon]:hidden" />
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand"
            aria-hidden
          >
            FL
          </span>
          <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-medium">Foydalanuvchi</span>
            <span className="block text-[11px] text-muted-foreground">Demo rejim</span>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
          onClick={toggleTheme}
          disabled={!themeMounted}
          aria-label={themeMounted ? themeLabel : "Mavzuni almashtirish"}
        >
          <Icon name={themeIcon} size="sm" />
          <span className="group-data-[collapsible=icon]:hidden">
            {themeMounted ? themeLabel : "Mavzu"}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
