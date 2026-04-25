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
      "when did you first feel like the person you always suspected you could be?",
  },
  {
    category: "THE STORY OF FRIENDSHIP",
    question: "tell me about a friend who makes you feel like home",
  },
  {
    category: "THE STORY OF A PLACE",
    question:
      "tell me about a place you carry with you, one you could close your eyes and still be inside.",
  },
  {
    category: "THE STORY OF AN OBJECT",
    question: "what's an object that carries a story only you understand?",
  },
  {
    category: "THE STORY OF LANGUAGE",
    question:
      "tell me a phrase from your native language that doesn't quite translate in English. who taught it to you and when did you learn it?",
  },
];

const SPROCKET_COUNT = 14;

export default function QuestionsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);

  async function handleSelect(prompt: (typeof STORY_PROMPTS)[number]) {
    setSaving(true);
    setError(null);
    try {
      await updateUserDb({
        storyCategory: prompt.category,
        chosenQuestion: prompt.question,
      });
      router.push("/answer");
    } catch (err) {
      console.error("Failed to save story prompt:", err);
      setError("Could not save your selection. Please try again.");
      setSaving(false);
    }
  }

  return (
    <PageShell videoSrc="/firstpage.mp4" brightness={0.45}>
      <div className="absolute inset-0 flex items-center justify-end" style={{ zIndex: 20, paddingRight: "5%" }}>
        {/* Paper card */}
        <div
          style={{
            position: "relative",
            width: "min(52%, 560px)",
          }}
        >                       

          {/* paper.png */}
          <Image
            src="/paper.png"
            alt=""
            width={400}
            height={0}
            className="w-full h-auto block"
            style={{ display: "block", marginTop: "36px", height: "auto" }}
            priority
          />

          {/* Content over paper */}
          <div
            style={{
              position: "absolute",
              top: "36px",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "8% 10% 8% 10%",
            }}
          >
            <h1
              className="mb-7"
              style={{ fontSize: "1.5rem", lineHeight: 1.25, color: "#1a1a1a", display:"flex", justifyContent: "center"}}
            >
              <span className="font-pixel">W</span>
              <span className="font-gayatri" style={{ fontStyle: "italic" }}>
                hat story do you want to tell?
              </span>
            </h1>

            <div className="flex flex-col gap-4 px-20">
              {STORY_PROMPTS.map((prompt, idx) => (
                <button
                  key={prompt.category}
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSelect(prompt)}
                  onMouseDown={() => setPressedIdx(idx)}
                  onMouseUp={() => setPressedIdx(null)}
                  onMouseLeave={() => setPressedIdx(null)}
                  onTouchStart={() => setPressedIdx(idx)}
                  onTouchEnd={() => setPressedIdx(null)}
                  className="font-roboto-mono text-center"
                  style={{
                    background: "white",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "0.4rem 0.5rem",
                    fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)",
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                    color: "#1a1a1a",
                    transform: pressedIdx === idx ? "scale(0.95)" : "scale(1)",
                    filter: pressedIdx === idx ? "brightness(0.92)" : "brightness(1)",
                    transition:
                      pressedIdx === idx
                        ? "transform 0.08s ease, filter 0.08s ease"
                        : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease",
                    opacity: saving ? 0.55 : 1,
                  }}
                >
                  {prompt.category.toLowerCase()}
                </button>
              ))}
            </div>
</div>
            {error ? (
              <p className="font-roboto-mono text-xs text-red-600 mt-3">{error}</p>
            ) : null}
          </div>
        </div>
    </PageShell>
  );
}
