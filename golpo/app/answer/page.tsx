"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUserDb, updateUserDb } from "@/lib/firebase/user-db";

const MAX_WORDS = 200;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export default function AnswerPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("Loading question...");
  const [answer, setAnswer] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const wordsUsed = useMemo(() => countWords(answer), [answer]);
  const isOverLimit = wordsUsed > MAX_WORDS;

  useEffect(() => {
    let mounted = true;

    async function loadAnswerContext() {
      try {
        const doc = await getUserDb();
        if (!mounted) {
          return;
        }

        setQuestion(doc?.chosenQuestion ?? "No question selected yet.");
        setAnswer(doc?.answerText ?? "");
      } catch (err) {
        console.error("Failed to load answer context:", err);
        if (mounted) {
          setQuestion("No question selected yet.");
        }
      } finally {
        if (mounted) {
          setIsBooting(false);
        }
      }
    }

    void loadAnswerContext();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveAnswer() {
    if (isOverLimit) {
      setError(`Please keep your response to ${MAX_WORDS} words or fewer.`);
      return false;
    }

    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      await updateUserDb({ answerText: answer.trim() });
      setStatus("Answer saved.");
      return true;
    } catch (err) {
      console.error("Failed to save answer:", err);
      setError("Could not save your answer.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNext() {
    const ok = await saveAnswer();
    if (ok) {
      router.push("/photobooth");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.18em] opacity-80">Step 4</p>
        <h1 className="font-instrument text-3xl leading-tight md:text-4xl">{question}</h1>
        <p className="max-w-2xl opacity-90">Write your response in 200 words or fewer.</p>
      </div>

      <section className="space-y-3">
        <textarea
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setStatus(null);
            if (error) {
              setError(null);
            }
          }}
          placeholder="Write your answer here..."
          rows={10}
          className="w-full border border-black/25 bg-white/85 px-4 py-3 text-black outline-none transition focus:border-black/55"
        />
        <p className={`text-sm ${isOverLimit ? "text-red-100" : "text-white/80"}`}>
          {wordsUsed}/{MAX_WORDS} words
        </p>
      </section>

      <div className="flex items-center gap-3">
        <Link
          href="/questions"
          className="inline-flex rounded-full border border-black/20 bg-black/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/10"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={() => void saveAnswer()}
          disabled={isSaving || isOverLimit}
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Answer"}
        </button>
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={isSaving || isOverLimit}
          className="inline-flex rounded-full border border-black/20 bg-black/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>

      {isBooting ? <p className="text-sm text-white/80">Loading answer page...</p> : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
      {status ? <p className="text-sm text-green-100">{status}</p> : null}
    </main>
  );
}
