"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
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
        setDraft({
          name: parsed.name ?? "",
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    console.log("submit fired", draft);

    if (!draft.name.trim() || !draft.email.trim()) {
      setError("Please add both full name and email.");
      console.log("validation failed: missing name or email");
      return;
    }

    setError(null);
    setIsSaving(true);
    console.time("firestore-save");
    console.log("before updateUserDb");

    try {
      await updateUserDb({
        name: draft.name.trim(),
        email: draft.email.trim(),
      });
      console.log("after updateUserDb");
      setSaved(true);
      router.push("/questions");
    } catch (err) {
      console.error("Firestore save failed:", err);
      setError("Could not save to Firebase. Check your Firebase config and rules.");
    } finally {
      console.timeEnd("firestore-save");
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <h1 className="font-instrument text-4xl leading-tight md:text-5xl">Name</h1>
      </div>
      <form id="name-form" className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Full name</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, name: event.target.value }))
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
          type="submit"
          form="name-form"
          disabled={isSaving}
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Next"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
      {saved ? <p className="text-sm text-green-100">Saved to Firebase.</p> : null}
    </main>
  );
}
