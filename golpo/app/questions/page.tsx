"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { updateUserDb } from "@/lib/firebase/user-db";

const QUESTIONS = [
  "What is the story behind your name?",
  "Who is someone who made you feel comfortable unexpectedly?",
  "Who was the first person who showed you what kindness looks like?",
  "Where is the first place that felt like home?",
  "What's a story you want to pass on?",
  "What word doesn’t exist in English but lives in you?",
  "When did you start recognizing yourself?",
  "What is something that you get yourself to throw out?",
  "What habit feels inherited?",
  "What did you believe about yourself as a child?",
  "What’s a meal you’ll never forget?",
  "Who do you feel most yourself around?",
  "What do you dream about most?",
  "When do you feel most connected to your roots?",
  "What do you want to do differently from the generation before you?",
  "What is a sound that reminds you of where your family comes from?",
  "Who makes you laugh most?",
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
        <h1 className="font-instrument text-4xl leading-tight md:text-5xl">Choose a Question</h1>
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
