"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateUserDb } from "@/lib/firebase/user-db";
import { PageShell } from "@/components/page-shell";

const STORY_PROMPTS = [
  {
    category: "THE STORY OF CHANGE",
    question:
      "When did you first feel like the person you always suspected you could be?",
  },
  {
    category: "THE STORY OF FRIENDSHIP",
    question: "Tell me about a friend who makes you feel like home",
  },
  {
    category: "THE STORY OF A PLACE",
    question:
      "Tell me about a place you carry with you, one you could close your eyes and still be inside.",
  },
  {
    category: "THE STORY OF AN OBJECT",
    question: "What's an object that carries a story only you understand?",
  },
  {
    category: "THE STORY OF LANGUAGE",
    question:
      "Tell me a phrase from your native language that doesn't quite translate in English. who taught it to you and when did you learn it?",
  },
];

const PROMPT_COLORS = ["#69B568", "#DB62A0", "#F0CA57", "#6298DB", "#C19574"];

export default function QuestionsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pressedNext, setPressedNext] = useState(false);

  async function handleNext() {
    if (selectedIdx === null || saving) return;
    const prompt = STORY_PROMPTS[selectedIdx];
    setSaving(true);
    setError(null);
    try {
      await updateUserDb({
        storyCategory: prompt.category,
        chosenQuestion: prompt.question,
      });
      router.push("/user-answer");
    } catch (err) {
      console.error("Failed to save story prompt:", err);
      setError("Could not save your selection. Please try again.");
      setSaving(false);
    }
  }

  return (
    <PageShell videoSrc="/bg/questions-compressed.mp4" brightness={1} grain={false}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#C19574", opacity: 0.22, mixBlendMode: "screen", zIndex: 3, pointerEvents: "none" }} />
      <div className="absolute inset-0 flex items-center justify-center sm:justify-end" style={{ zIndex: 20, paddingRight: "5%", paddingLeft: "5%", paddingTop: "6vh" }}>
        {/* Paper card — everything inside uses % of card width so it all scales together */}
        <div style={{ position: "relative", width: "min(90vw, 560px)" }}>

          {/* paper.png — top offset is 6.4% of card width (≈36px at max 560px) */}
          <Image
            src="/paper.png"
            alt=""
            width={400}
            height={0}
            className="w-full h-auto block"
            style={{ display: "block", marginTop: "0%", height: "auto" }}
            priority
          />

          {/* Content overlay — centered within the full paper bounds */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "12% 10%",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(0.85rem, 2.4vw, 1.5rem)",
                lineHeight: 1.25,
                color: "#1a1a1a",
                display: "flex",
                justifyContent: "center",
                marginBottom: "clamp(1rem, 3.5vh, 2.5rem)",
              }}
            >
              <span className="font-pixel">W</span>
              <span className="font-gayatri" style={{ fontStyle: "italic" }}>
                hat story do you want to tell?
              </span>
            </h1>

            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(0.8rem, 1.8vh, 1.25rem)", padding: "0 20%" }}>
              {STORY_PROMPTS.map((prompt, idx) => (
                <button
                  key={prompt.category}
                  type="button"
                  disabled={saving}
                  onClick={() => setSelectedIdx(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseDown={() => setPressedIdx(idx)}
                  onMouseUp={() => setPressedIdx(null)}
                  onMouseLeave={() => { setPressedIdx(null); setHoveredIdx(null); }}
                  onTouchStart={() => setPressedIdx(idx)}
                  onTouchEnd={() => setPressedIdx(null)}
                  className="font-roboto-mono text-center"
                  style={{
                    background: selectedIdx === idx ? `${PROMPT_COLORS[idx]}80` : "white",
                    border: selectedIdx === idx
                      ? `2px solid ${PROMPT_COLORS[idx]}`
                      : hoveredIdx === idx
                        ? `2px solid ${PROMPT_COLORS[idx]}`
                        : "2px solid transparent",
                    borderRadius: "9999px",
                    padding: "0.5em 0.5em",
                    fontSize: "clamp(0.65rem, 2vw, 0.85rem)",
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                    color: "#1a1a1a",
                    transform: pressedIdx === idx ? "scale(0.88)" : "scale(1)",
                    filter: pressedIdx === idx ? "brightness(0.8)" : "brightness(1)",
                    transition:
                      pressedIdx === idx
                        ? "transform 0.08s ease, filter 0.08s ease"
                        : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
                    opacity: saving ? 0.55 : 1,
                  }}
                >
                  {prompt.category.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Bottom row: next button on the left */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 20%", marginTop: "clamp(1.2rem, 3.5vh, 2.5rem)" }}>
              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={selectedIdx === null || saving}
                onMouseDown={() => setPressedNext(true)}
                onMouseUp={() => setPressedNext(false)}
                onMouseLeave={() => setPressedNext(false)}
                onTouchStart={() => setPressedNext(true)}
                onTouchEnd={() => setPressedNext(false)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: selectedIdx === null || saving ? "not-allowed" : "pointer",
                  opacity: selectedIdx === null || saving ? 0.3 : 1,
                  display: "inline-block",
                  transform: pressedNext ? "scale(0.88)" : "scale(1)",
                  filter: pressedNext ? "brightness(0.8)" : "brightness(1)",
                  transition: pressedNext
                    ? "transform 0.08s ease, filter 0.08s ease"
                    : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
                }}
              >
                <Image src="/buttons/next-button.svg" alt="Next" width={50} height={40} />
              </button>
            </div>

            {error ? (
              <p className="font-roboto-mono text-xs text-red-600 mt-2">{error}</p>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
