"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createNewSession,
  defaultDraft,
  INSTALLATION_CACHE_KEY,
  type InstallationDraft,
} from "@/lib/installation-cache";
import { updateUserDb } from "@/lib/firebase/user-db";
import { PageShell } from "@/components/page-shell";

export default function NamePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<InstallationDraft>(defaultDraft);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!loaded) return;
    window.localStorage.setItem(INSTALLATION_CACHE_KEY, JSON.stringify(draft));
  }, [draft, loaded]);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError(null);
    setIsSaving(true);
    createNewSession();
    try {
      await updateUserDb({ name: draft.name.trim() });
      router.push("/questions");
    } catch (err) {
      console.error("Firestore save failed:", err);
      setError("Could not save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell videoSrc="/name.mov">
      <div
        className="absolute inset-0"
        style={{ zIndex: 20 }}
      >
        {/* Floating blue card */}
        <div
          style={{
            position: "absolute",
            left: "7.3%",
            bottom: "7.2%",
            width: "71.6%",
            backgroundColor: "#6298DB",
            padding: "2.5rem 2.5rem 3rem 4rem",
          }}
        >
          <h1
            className="text-white mb-6"
            style={{ fontSize: "2.4rem", lineHeight: 1.2 }}
          >
            <span className="font-pixel">W</span>
            <span className="font-gayatri" style={{ fontStyle: "italic" }}>hat name do you want to be remembered by?</span>
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={draft.name}
                onChange={(e) =>
                  setDraft((prev: InstallationDraft) => ({ ...prev, name: e.target.value }))
                }
                className="font-roboto-mono px-2 py-2 text-base text-black outline-none"
                style={{
                  width: "280px",
                  backgroundColor: "rgba(217, 217, 217, 0.7)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                }}
              />
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  opacity: draft.name.trim() ? 1 : 0,
                  pointerEvents: draft.name.trim() ? "auto" : "none",
                  transition: "opacity 0.4s ease, transform 0.2s ease",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
                className="hover:scale-105 disabled:opacity-40"
              >
                <Image src="/buttons/next-button.svg" alt="Next" width={59} height={47} />
              </button>
            </div>
          </form>

          {error ? <p className="text-sm text-red-300 mt-2">{error}</p> : null}
        </div>
      </div>
    </PageShell>
  );
}
