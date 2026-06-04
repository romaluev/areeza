"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="min-h-dvh bg-[#0a1426] font-sans text-[#f8fafc] antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <h1 className="text-xl font-semibold">Areeza vaqtincha ishlamayapti</h1>
          <p className="max-w-md text-sm text-[#94a3b8]">
            Kutilmagan xatolik yuz berdi. Qayta urinib ko&apos;ring yoki bosh sahifaga
            qayting.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white"
            >
              Qayta urinish
            </button>
            <Link
              href="/cases"
              className="rounded-full border border-[#334155] px-5 py-2.5 text-sm font-medium text-[#e2e8f0]"
            >
              Bosh sahifa
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
