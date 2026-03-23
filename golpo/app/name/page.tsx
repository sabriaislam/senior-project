"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createNewSession,
  defaultDraft,
  INSTALLATION_CACHE_KEY,
  type InstallationDraft,
} from "@/lib/installation-cache";
import { updateUserDb } from "@/lib/firebase/user-db";


export default function NamePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<InstallationDraft>(defaultDraft);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INSTALLATION_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<InstallationDraft>;
        setDraft({ name: parsed.name ?? "" });
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    if (!draft.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setError(null);
    setIsSaving(true);
    createNewSession();

    try {
      await updateUserDb({ name: draft.name.trim() });
      setSaved(true);
      router.push("/questions");
    } catch (err) {
      console.error("Firestore save failed:", err);
      setError("Could not save to Firebase. Check your Firebase config and rules.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <h1 className="font-average text-4xl leading-tight md:text-5xl">Nice to meet you, what's your name?</h1>
      </div>
      <form id="name-form" className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Name</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, name: event.target.value }))
            }
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
          type="submit"
          form="name-form"
          disabled={isSaving}
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Next"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
      {saved ? <p className="text-sm text-green-100">Saved.</p> : null}
    </main>
  );
}
