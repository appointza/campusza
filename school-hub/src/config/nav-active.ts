/** True when the current path matches this nav link (including child routes). */
export function isNavItemActive(href: string, pathname: string): boolean {
  const path = pathname.split("?")[0];
  if (href === "/admin") {
    return path === "/admin";
  }
  const base = href.split("?")[0];
  return path === base || path.startsWith(`${base}/`);
}
