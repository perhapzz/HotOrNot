"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LOCALES = [
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Detect current locale from pathname
  const currentLocale = pathname.startsWith("/en") ? "en" : "zh";
  const current = LOCALES.find((l) => l.code === currentLocale) || LOCALES[0];

  const switchLocale = (locale: string) => {
    setOpen(false);
    // Remove current locale prefix and add new one
    let newPath = pathname;
    if (pathname.startsWith("/en")) {
      newPath = pathname.slice(3) || "/";
    }
    if (locale !== "zh") {
      newPath = `/${locale}${newPath}`;
    }
    router.push(newPath);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md hover:border-gray-300"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              onClick={() => switchLocale(locale.code)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                locale.code === currentLocale
                  ? "text-blue-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              {locale.flag} {locale.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
