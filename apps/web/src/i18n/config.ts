import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  localePrefix: "as-needed", // Only show prefix for non-default locale
});

export const config = {
  // Match all pathnames except API, static, and internal paths
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
