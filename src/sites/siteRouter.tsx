import HomeDefault from "../pages/HomeDefault";

export function getHomeComponentForHost(hostname: string) {
  // All hostnames currently use HomeDefault
  // Add specific Home components when needed by creating Home1.tsx, Home2.tsx, etc.
  return HomeDefault;
}
