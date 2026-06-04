"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icon, type IconName } from "@areeza/ui/icons";
import { useTheme } from "next-themes";
import { Button } from "@areeza/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@areeza/ui/components/tooltip";
import { useProximityHover, PROXIMITY_ID_ATTR } from "@areeza/ui/hooks/use-proximity-hover";
import { useMotionTransition } from "@areeza/ui/hooks/use-reduced-motion";
import { navLabelWeight } from "@areeza/ui/lib/font-weight";
import { useSurfaceStyle } from "@areeza/ui/lib/surface-context";
import { cn } from "@areeza/ui/lib/utils";
import { useAppStore } from "@/lib/use-app-store";

const SIDEBAR_COLLAPSED_KEY = "areeza-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  match?: (pathname: string) => boolean;
};

const mainNav: NavItem[] = [
  {
    href: "/cases",
    label: "Ishlarim",
    icon: "folder",
    match: (p) => p === "/cases" || (p.startsWith("/cases/") && !p.startsWith("/cases/new")),
  },
];

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

export function AppSidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const setThemePref = useAppStore((s) => s.setTheme);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const surfaceStyle = useSurfaceStyle(0);
  const navTransition = useMotionTransition("moderate");

  useProximityHover(navRef, { enabled: !collapsed });

  useEffect(() => {
    setCollapsed(readCollapsed());
    setMounted(true);
  }, []);

  const persistCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
  }, []);

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setThemePref(next);
    setTheme(next);
  };

  const widthVar = collapsed
    ? "var(--layout-app-sidebar-collapsed-width)"
    : "var(--layout-app-sidebar-width)";

  return (
    <aside
      className={cn(
        "relative flex h-dvh shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-200 ease-out",
        mounted ? "opacity-100" : "opacity-0",
      )}
      style={{ ...surfaceStyle, width: widthVar }}
      data-collapsed={collapsed ? "" : undefined}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-3">
        <Link
          href="/cases"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center",
          )}
          aria-label="Areeza — ishlarim"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground shadow-[var(--shadow-2)]">
            <Icon name="scale" size="sm" />
          </span>
          {!collapsed && (
            <span className="min-w-0 truncate">
              <span className="block text-sm font-semibold tracking-tight text-sidebar-foreground">
                Areeza
              </span>
              <span className="block text-[10px] leading-tight text-muted-foreground">
                Sud hujjatlari
              </span>
            </span>
          )}
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              aria-label={collapsed ? "Panelni kengaytirish" : "Panelni yig'ish"}
              onClick={() => persistCollapsed(!collapsed)}
            >
              <Icon
                name={collapsed ? "sidebarExpand" : "sidebarCollapse"}
                size="sm"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Kengaytirish" : "Yig'ish"}
          </TooltipContent>
        </Tooltip>
      </header>

      <div className={cn("px-3 pt-4", collapsed && "px-2")}>
        <NewCaseCta collapsed={collapsed} />
      </div>

      <nav
        ref={navRef}
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4"
        aria-label="Asosiy navigatsiya"
      >
        <NavSection title="Asosiy" collapsed={collapsed}>
          {mainNav.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              transition={navTransition}
            />
          ))}
        </NavSection>

        <NavSection title="Tez orada" collapsed={collapsed}>
          <SidebarNavLink
            item={{
              href: "#",
              label: "Sozlamalar",
              icon: "route",
            }}
            pathname={pathname}
            collapsed={collapsed}
            transition={navTransition}
            disabled
          />
        </NavSection>
      </nav>

      <footer
        className={cn(
          "shrink-0 space-y-2 border-t border-sidebar-border p-3",
          collapsed && "px-2",
        )}
      >
        <UserTile collapsed={collapsed} />
        <ThemeToggle
          collapsed={collapsed}
          mounted={mounted}
          resolvedTheme={resolvedTheme}
          onToggle={toggleTheme}
        />
      </footer>
    </aside>
  );
}

function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {!collapsed && (
        <p className="eyebrow px-2 pb-1">{title}</p>
      )}
      <ul className="relative flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

function SidebarNavLink({
  item,
  pathname,
  collapsed,
  transition,
  disabled,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  transition: ReturnType<typeof useMotionTransition>;
  disabled?: boolean;
}) {
  const active = disabled
    ? false
    : (item.match?.(pathname) ??
      (item.href === "/cases"
        ? pathname === "/cases" ||
          (pathname.startsWith("/cases/") && pathname !== "/cases/new")
        : pathname.startsWith(item.href)));

  const linkClass = cn(
    "relative flex items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-2 text-sm text-muted-foreground outline-none transition-colors duration-150",
    navLabelWeight,
    "hover:text-foreground",
    "data-[proximity]:text-foreground data-[proximity]:font-medium",
    active && "text-foreground font-medium",
    disabled && "pointer-events-none opacity-40",
    collapsed && "justify-center px-2",
  );

  const inner = (
    <>
      {active && !disabled && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-[var(--radius-lg)] bg-sidebar-accent ring-1 ring-sidebar-border"
          transition={transition}
          aria-hidden
        />
      )}
      <Icon name={item.icon} size="sm" className="relative z-[1]" />
      {!collapsed && <span className="relative z-[1] truncate">{item.label}</span>}
    </>
  );

  if (disabled) {
    return (
      <li>
        <span
          className={linkClass}
          {...{ [PROXIMITY_ID_ATTR]: item.href }}
          data-active={active ? "" : undefined}
        >
          {inner}
        </span>
      </li>
    );
  }

  const link = (
    <Link
      href={item.href}
      className={linkClass}
      {...{ [PROXIMITY_ID_ATTR]: item.href }}
      data-active={active ? "" : undefined}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{link}</li>;
}

function NewCaseCta({ collapsed }: { collapsed: boolean }) {
  const cta = (
    <Button
      asChild
      className={cn(
        "w-full gap-2 shadow-[var(--shadow-2)]",
        collapsed && "size-10 px-0",
      )}
      size={collapsed ? "icon" : "default"}
    >
      <Link href="/cases/new" aria-label="Yangi ish">
        <Icon name="add" size="sm" />
        {!collapsed && <span>Yangi ish</span>}
      </Link>
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{cta}</TooltipTrigger>
        <TooltipContent side="right">Yangi ish</TooltipContent>
      </Tooltip>
    );
  }

  return cta;
}

function UserTile({ collapsed }: { collapsed: boolean }) {
  const tile = (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-lg)] bg-sidebar-accent/60 px-2.5 py-2 ring-1 ring-sidebar-border",
        collapsed && "justify-center px-2",
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        aria-hidden
      >
        FL
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">
          <span className="block text-sm font-medium text-sidebar-foreground">
            Foydalanuvchi
          </span>
          <span className="block text-[11px] text-muted-foreground">
            Demo rejim
          </span>
        </span>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="w-full outline-none" aria-label="Foydalanuvchi">
            {tile}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Foydalanuvchi · Demo</TooltipContent>
      </Tooltip>
    );
  }

  return tile;
}

function ThemeToggle({
  collapsed,
  mounted,
  resolvedTheme,
  onToggle,
}: {
  collapsed: boolean;
  mounted: boolean;
  resolvedTheme?: string;
  onToggle: () => void;
}) {
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Yorug' rejim" : "Qorong'u rejim";

  const control = (
    <Button
      type="button"
      variant="ghost"
      size={collapsed ? "icon" : "sm"}
      className={cn(
        "w-full text-muted-foreground hover:text-foreground",
        !collapsed && "justify-start gap-2.5",
      )}
      onClick={onToggle}
      aria-label={label}
    >
      <Icon name={isDark ? "sun" : "moon"} size="sm" />
      {!collapsed && <span>{label}</span>}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return control;
}
