import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import {
  Add01Icon,
  Alert01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Attachment01Icon,
  Image01Icon,
  BalanceScaleIcon,
  BankIcon,
  Building03Icon,
  Calendar03Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download01Icon,
  File01Icon,
  FileValidationIcon,
  FolderOpenIcon,
  KanbanIcon,
  LanguageCircleIcon,
  LeftToRightListBulletIcon,
  LinkSquare02Icon,
  Loading01Icon,
  Menu01Icon,
  Moon02Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon,
  PrinterIcon,
  Route01Icon,
  SecurityCheckIcon,
  Settings02Icon,
  SparklesIcon,
  StopCircleIcon,
  Sun01Icon,
  TextBoldIcon,
  TextItalicIcon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "../lib/utils";

/** Semantic icon catalog — views import names, not the icon library. */
export const icons = {
  add: Add01Icon,
  alert: Alert01Icon,
  alertTriangle: Alert01Icon,
  alertWarn: Alert02Icon,
  arrowRight: ArrowRight01Icon,
  arrowUp: ArrowUp01Icon,
  attach: Attachment01Icon,
  image: Image01Icon,
  scale: BalanceScaleIcon,
  banknote: BankIcon,
  building: Building03Icon,
  calendar: Calendar03Icon,
  cancel: CancelCircleIcon,
  check: CheckmarkCircle02Icon,
  copy: Copy01Icon,
  download: Download01Icon,
  file: File01Icon,
  fileText: File01Icon,
  fileCheck: FileValidationIcon,
  folder: FolderOpenIcon,
  board: KanbanIcon,
  languages: LanguageCircleIcon,
  list: LeftToRightListBulletIcon,
  loading: Loading01Icon,
  externalLink: LinkSquare02Icon,
  menu: Menu01Icon,
  moon: Moon02Icon,
  sidebarCollapse: SidebarLeft01Icon,
  sidebarExpand: SidebarRight01Icon,
  printer: PrinterIcon,
  route: Route01Icon,
  shield: SecurityCheckIcon,
  settings: Settings02Icon,
  sparkles: SparklesIcon,
  stop: StopCircleIcon,
  sun: Sun01Icon,
  user: UserCircle02Icon,
  bold: TextBoldIcon,
  italic: TextItalicIcon,
} as const satisfies Record<string, HugeiconsIconProps["icon"]>;

export type IconName = keyof typeof icons;

const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

export interface IconProps extends Omit<HugeiconsIconProps, "icon" | "size"> {
  icon?: HugeiconsIconProps["icon"];
  name?: IconName;
  size?: IconSize | number;
  className?: string;
}

export function Icon({
  icon,
  name,
  size = "md",
  className,
  strokeWidth = 1.5,
  color = "currentColor",
  ...rest
}: IconProps) {
  const resolved = icon ?? (name ? icons[name] : undefined);
  if (!resolved) return null;

  const px = typeof size === "number" ? size : ICON_SIZES[size];

  return (
    <HugeiconsIcon
      icon={resolved}
      size={px}
      strokeWidth={strokeWidth}
      color={color}
      className={cn("shrink-0", className)}
      {...rest}
    />
  );
}

export { HugeiconsIcon, ICON_SIZES };

export function PanelLeftIcon(props: Omit<IconProps, "name">) {
  return <Icon name="sidebarExpand" {...props} />;
}
