"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect} from "react";
import { updateUserDb } from "@/lib/firebase/user-db";
import { useRouter } from "next/navigation";


const QUESTIONS = [
  "Tell me a phrase from your native language, that doesn’t quite translate well in English. What does it mean?",
  "Tell me about a friend who makes you feel at home",
  "Tell me about the greatest compliment you've been given, and who gave it",
  "Tell me about a family tradition you'll never stop doing",
  "What is the story behind something you own that you can't get yourself to throw out",
  "Tell me why you love your favorite song and what memory you associate it with",
];

const ITEM_HEIGHT = 88;
const WINDOW_HEIGHT = 360;
const WINDOW_PADDING = (WINDOW_HEIGHT - ITEM_HEIGHT) / 2;

export default function QuestionsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedQuestion = useMemo(() => QUESTIONS[selectedIndex], [selectedIndex]);

  useEffect(() => {
  scrollRef.current?.focus(); 
  }, []);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
  const scrollTop = event.currentTarget.scrollTop;
  const next = Math.round(scrollTop / ITEM_HEIGHT);
  const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, next));
  if (clamped !== selectedIndex) {
  setSelectedIndex(clamped);
  }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const next = Math.min(selectedIndex + 1, QUESTIONS.length - 1);
    scrollRef.current?.scrollTo({ top: next * ITEM_HEIGHT, behavior: "smooth" });
    setSelectedIndex(next);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    const next = Math.max(selectedIndex - 1, 0);
    scrollRef.current?.scrollTo({ top: next * ITEM_HEIGHT, behavior: "smooth" });
    setSelectedIndex(next);
  } else if (event.key === "Enter") {
    handleConfirm();
    }
  }

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      await updateUserDb({ chosenQuestion: selectedQuestion });
      router.push("/answer");
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
      ref={scrollRef}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="hide-scrollbar relative z-10 mx-auto h-[360px] w-full max-w-3xl snap-y snap-mandatory overflow-y-auto rounded-3xl outline-none"
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
        onClick={() => {
          if (index === selectedIndex) {
            handleConfirm();
          } else {
            setSelectedIndex(index);
            scrollRef.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
          }
        }}
        className={`block h-[88px] w-full snap-center transition duration-300 ${
          isSelected ? "bg-[#b87ea0]/45" : "bg-transparent"
        }`}
        style={{
          opacity: 1 - distance * 0.14,
          transform: `perspective(950px) rotateX(${delta * -12}deg) scale(${1 - distance * 0.06})`,
        }}
      >
        <span
          className={`flex h-full w-full items-center justify-center px-5 text-center text-base leading-relaxed md:px-6 md:text-base ${
            isSelected ? "font-semibold text-white" : "text-white/60 blur-[1.25px]"
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
        onClick={handleConfirm}
        disabled={isSaving}
        className="inline-flex rounded-full border border-black/20 bg-black/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
        {isSaving ? "Saving..." : "Next"}
      </button>
  </div>

  {error ? <p className="text-sm text-red-100">{error}</p> : null}
  </main>
  );
}