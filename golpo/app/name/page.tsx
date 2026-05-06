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
  const [pressed, setPressed] = useState(false);

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
    <PageShell videoSrc="/bg/how-will-u-be-rmm-thumb.jpg" brightness={0.9}>
      <div
        className="absolute inset-0"
        style={{ zIndex: 20 }}
      >
        {/* Card using name-box.svg as background */}
        <div
          style={{
            position: "absolute",
            left: "5%",
            top: "7%",
            width: "50%",
          }}
        >
          {/* SVG background (brown rect + gold stars) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/buttons/name-box.svg" style={{ width: "100%", display: "block" }} alt="" />

          {/* Content overlay positioned over the brown rectangle portion of the SVG */}
          {/* Brown rect in SVG: x=69–541 (left 11.6%, right 9.4%), y=36–296 (top 10.1%, bottom 17.1%) */}
          <div
            style={{
              position: "absolute",
              left: "11.6%",
              top: "10.1%",
              right: "9.4%",
              bottom: "17.1%",
              padding: "1.4rem 1.8rem 1.4rem 2.2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1
              className="text-white mb-5"
              style={{ fontSize: "3rem", lineHeight: 1.2 }}
            >
              <span className="font-pixel">H</span>
              <span className="font-gayatri" style={{ fontStyle: "italic" }}>ow do you want to be remembered?</span>
            </h1>

            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev: InstallationDraft) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter your name"
                  className="font-roboto-mono px-2 py-2 text-base text-black outline-none"
                  style={{
                    width: "280px",
                    backgroundColor: "rgba(210, 188, 162, 0.9)",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  onMouseDown={() => setPressed(true)}
                  onMouseUp={() => setPressed(false)}
                  onMouseLeave={() => setPressed(false)}
                  onTouchStart={() => setPressed(true)}
                  onTouchEnd={() => setPressed(false)}
                  style={{
                    opacity: draft.name.trim() ? 1 : 0,
                    pointerEvents: draft.name.trim() ? "auto" : "none",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "inline-block",
                    flexShrink: 0,
                    transform: pressed ? "scale(0.88)" : "scale(1)",
                    filter: pressed ? "brightness(0.8)" : "brightness(1)",
                    transition: pressed
                      ? "transform 0.08s ease, filter 0.08s ease"
                      : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
                  }}
                >
                  <Image src="/buttons/next-button.svg" alt="Next" width={59} height={47} />
                </button>
              </div>
            </form>

            {error ? <p className="text-sm text-red-300 mt-2">{error}</p> : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
