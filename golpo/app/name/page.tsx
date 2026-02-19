"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultDraft,
  INSTALLATION_CACHE_KEY,
  type InstallationDraft,
} from "@/lib/installation-cache";

export default function NamePage() {
  const [draft, setDraft] = useState<InstallationDraft>(defaultDraft);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INSTALLATION_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<InstallationDraft>;
        setDraft({
          fullName: parsed.fullName ?? "",
          email: parsed.email ?? "",
        });
      }
    } catch {
      setDraft(defaultDraft);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    window.localStorage.setItem(INSTALLATION_CACHE_KEY, JSON.stringify(draft));
  }, [draft, loaded]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <h1 className="font-instrument text-4xl leading-tight md:text-5xl">Questions</h1>
      </div>
      <form className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Full name</span>
          <input
            type="text"
            value={draft.fullName}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, fullName: event.target.value }))
            }
            placeholder="Jane Doe"
            className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-black outline-none ring-0 transition focus:border-black/50"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="jane@email.com"
            className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-black outline-none ring-0 transition focus:border-black/50"
          />
        </label>
      </form>

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/intro"
          className="inline-flex rounded-full border border-black/20 bg-black/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/10"
        >
          Back
        </Link>
        <button
          type="button"
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20"
        >
          Next
        </button>
      </div>
    </main>
  );
}

