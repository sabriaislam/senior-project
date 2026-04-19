"use client";

import { useState } from "react";
import { updateUserDb } from "@/lib/firebase/user-db";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";

const STORY_PROMPTS = [
  {
    category: "THE STORY OF LANGUAGE",
    question:
      "tell me a phrase from your native language that doesn't quite translate in English. who taught it to you and when did you learn it?",
  },
  {
    category: "THE STORY OF FRIENDSHIP",
    question: "tell me about a friend who makes you feel like home",
  },
  {
    category: "THE STORY OF THINGS",
    question: "what's an object that carries a story only you understand?",
  },
  {
    category: "THE STORY OF A PLACE",
    question:
      "tell me about a place you carry with you, one you could close your eyes and still be inside.",
  },
  {
    category: "THE STORY OF CHANGE",
    question:
      "when did you first feel like the person you always suspected you could be?",
  },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <PageShell videoSrc="/question.mp4">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-10"
        style={{ zIndex: 20 }}
      >
        <h1
          className="text-center font-average text-3xl text-white"
          style={{ maxWidth: "520px" }}
        >
          what story do you want to tell the most?
        </h1>

        <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: "440px", padding: "0 1.5rem" }}>
          {STORY_PROMPTS.map((prompt) => (
            <button
              key={prompt.category}
              type="button"
              disabled={saving}
              onClick={() => void handleSelect(prompt)}
              className="w-full font-average text-2xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.12)",
                boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "9999px",
                padding: "0.85rem 2rem",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
              }}
            >
              {prompt.category.toLowerCase()}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </PageShell>
  );
}
