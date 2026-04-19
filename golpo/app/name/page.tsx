"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Film grain canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRAIN_SIZE = 1.7;
    let animFrame: number;

    function resize() {
      canvas!.width = Math.ceil(window.innerWidth / GRAIN_SIZE);
      canvas!.height = Math.ceil(window.innerHeight / GRAIN_SIZE);
    }

    function drawGrain() {
      const w = canvas!.width;
      const h = canvas!.height;
      const imageData = ctx!.createImageData(w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 38;
      }
      ctx!.putImageData(imageData, 0, 0);
      animFrame = requestAnimationFrame(drawGrain);
    }

    resize();
    drawGrain();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

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
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Layer 1: Video */}
      <video
        src="/train.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Layer 3: Content — horizontal position controlled by `paddingLeft`, vertical by `justifyContent` */}
      <div
        className="absolute inset-0 flex flex-col justify-end gap-6"
        style={{
          zIndex: 20,
          paddingLeft: "8%", /* ← shift left/right */
          paddingRight: "5%",
          paddingBottom: "10%", /* ← shift up/down */
        }}
      >
        <h1
          className="font-vollkorn text-2xl text-left leading-tight text-white whitespace-nowrap"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
        >
          what name do you want to be remembered by?
        </h1>

        <form id="name-form" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev: InstallationDraft) => ({ ...prev, name: e.target.value }))
              }
              className="w-xs rounded-full px-3 py-3 text-base text-black outline-none"
              style={{
                backgroundColor: "rgba(217, 217, 217, 0.7)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
              }}
            />
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105 disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.21)",
                boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
                backdropFilter: "blur(4.1px)",
                WebkitBackdropFilter: "blur(4.1px)",
                border: "1px solid rgba(255,255,255,0.2)",
                opacity: draft.name.trim() ? 1 : 0,
                pointerEvents: draft.name.trim() ? "auto" : "none",
                transition: "opacity 0.4s ease, transform 0.2s ease",
              }}
            >
              <Image src="/arrow.svg" alt="Next" width={18} height={16} style={{ opacity: 0.7 }} />
            </button>
          </div>
        </form>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    </main>
  );
}
