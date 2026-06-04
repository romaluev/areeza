"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@areeza/ui/icons";
import { useTheme } from "next-themes";
import { Button } from "@areeza/ui/components/button";
import { cn } from "@areeza/ui/lib/utils";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/cases", label: "Ishlar ro'yxati", icon: "folder" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--sidebar-border)] px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
          <Icon name="scale" size="sm" />
        </span>
        <div>
          <span className="text-sm font-semibold tracking-tight">Areeza</span>
          <p className="text-[10px] text-[var(--muted-foreground)]">Sud hujjatlari</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-[var(--sidebar-accent)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]",
            )}
          >
            <Icon name={icon} size="sm" />
            {label}
          </Link>
        ))}
        <Link href="/cases/new" className="mt-2">
          <Button className="w-full gap-2" size="sm">
            <Icon name="add" size="sm" />
            Yangi ish
          </Button>
        </Link>
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Icon name="sun" size="sm" />
          ) : (
            <Icon name="moon" size="sm" />
          )}
          {theme === "dark" ? "Yorug' rejim" : "Qorong'u rejim"}
        </Button>
      </div>
    </aside>
  );
}
