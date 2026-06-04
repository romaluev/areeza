/** Default page titles from the pathname when no page publishes `useTopBar`. */
export function resolveShellPageTitle(pathname: string): string {
  if (pathname === "/situations/new" || pathname === "/cases/new") {
    return "Yangi holat";
  }
  if (pathname === "/situations" || pathname === "/cases") {
    return "Holatlarim";
  }
  if (
    /^\/situations\/[^/]+$/.test(pathname) &&
    pathname !== "/situations/new"
  ) {
    return "Holat";
  }
  if (/^\/cases\/[^/]+$/.test(pathname) && pathname !== "/cases/new") {
    return "Holat";
  }
  return "Areeza";
}
