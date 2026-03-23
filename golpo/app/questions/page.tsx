"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { updateUserDb } from "@/lib/firebase/user-db";

const QUESTIONS = [
  "Tell me a time you tried to say a phrase from your native language in English, but it didn’t translate well",
  "Tell me about a friend who makes you feel at home",
  "Tell me about the moment you realized you’re breaking a negative cycle",
  "Tell me about the greatest compliment you’ve been given, and who gave it",
  "Tell me about a family tradition you’ll never stop doing",
  "Tell me what your childhood home looked like",
  "Teach me your favorite phrase in your native language and use it in a sentence",
  "What is the story behind something you own that you can’t get yourself to throw out",
  "Tell me why you love your favorite song and what memory you associate it with",
];

const ITEM_HEIGHT = 88;
const WINDOW_HEIGHT = 360;
const WINDOW_PADDING = (WINDOW_HEIGHT - ITEM_HEIGHT) / 2;

export default function QuestionsPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedQuestion = useMemo(() => QUESTIONS[selectedIndex], [selectedIndex]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scrollTop = event.currentTarget.scrollTop;
    const next = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, next));
    if (clamped !== selectedIndex) {
      setSelectedIndex(clamped);
      setSaved(false);
    }
  }

  async function handleSaveQuestion() {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateUserDb({ chosenQuestion: selectedQuestion });
      setSaved(true);
    } catch (err) {
      console.error("Failed to save chosenQuestion:", err);
      setError("Could not save your selected question.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.18em] opacity-80">Step 2</p>
        <h1 className="font-average text-4xl leading-tight md:text-5xl">Choose a Question</h1>
      </div>

      <section className="relative">
        <div
          onScroll={handleScroll}
          className="hide-scrollbar relative z-10 mx-auto h-[360px] w-full max-w-3xl snap-y snap-mandatory overflow-y-auto rounded-3xl"
          style={{ paddingTop: WINDOW_PADDING, paddingBottom: WINDOW_PADDING }}
        >
          {QUESTIONS.map((question, index) => {
            const delta = index - selectedIndex;
            const distance = Math.min(Math.abs(delta), 4);
            const isSelected = index === selectedIndex;

            return (
              <button
                key={question}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`block h-[88px] w-full snap-center transition duration-300 ${
                  isSelected ? "bg-[#b87ea0]/45" : "bg-transparent"
                }`}
                style={{
                  opacity: 1 - distance * 0.14,
                  transform: `perspective(950px) rotateX(${delta * -12}deg) scale(${1 - distance * 0.06})`,
                }}
              >
                <span
                  className={`flex h-full w-full items-center justify-center px-5 text-center text-sm leading-relaxed md:px-6 md:text-base ${
                    isSelected
                      ? "font-semibold text-white"
                      : "text-white/60 blur-[1.25px]"
                  }`}
                >
                  {question}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Link
          href="/name"
          className="inline-flex rounded-full border border-black/20 bg-black/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/10"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={handleSaveQuestion}
          disabled={isSaving}
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Question"}
        </button>
        <Link
          href="/answer"
          className="inline-flex rounded-full border border-black/20 bg-black/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/25"
        >
          Next
        </Link>
      </div>

      {error ? <p className="text-sm text-red-100">{error}</p> : null}
      {saved ? <p className="text-sm text-green-100">Question saved to user-db.</p> : null}
    </main>
  );
}
