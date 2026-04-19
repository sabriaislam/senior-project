"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUserDb, updateUserDb } from "@/lib/firebase/user-db";

const MAX_WORDS = 100;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export default function AnswerPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordsUsed = useMemo(() => countWords(answer), [answer]);
  const isOverLimit = wordsUsed > MAX_WORDS;
  const hasContent = answer.trim().length > 0;

  useEffect(() => {
    let mounted = true;

    async function loadAnswerContext() {
      try {
        const doc = await getUserDb();
        if (!mounted) return;
        setCategory(doc?.storyCategory ?? "");
        setQuestion(doc?.chosenQuestion ?? "");
        setAnswer(doc?.answerText ?? "");
      } catch (err) {
        console.error("Failed to load answer context:", err);
      } finally {
        if (mounted) setIsBooting(false);
      }
    }

    void loadAnswerContext();
    return () => { mounted = false; };
  }, []);

  async function handleNext() {
    if (isOverLimit) {
      setError(`Please keep your response to ${MAX_WORDS} words or fewer.`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateUserDb({ answerText: answer.trim() });
      router.push("/photobooth");
    } catch (err) {
      console.error("Failed to save answer:", err);
      setError("Could not save your answer.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: "#3a3a3a" }}>
      {/* Background video */}
      <video
        src="/beach.mov"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.45)", zIndex: 1 }}
      />

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ zIndex: 10, padding: "0 20vw" }}
      >
        {/* Headings */}
        <div className="flex flex-col gap-1 mb-10">
          {!isBooting && category ? (
            <h1
              className="font-average text-3xl leading-tight"
              style={{ color: "#ede4e6" }}
            >
              {category.toLowerCase()}
            </h1>
          ) : null}
          {!isBooting && question ? (
            <h2
              className="font-light leading-tight"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 1.2rem)", color: "#ede4e6" }}
            >
              {question}
            </h2>
          ) : null}
        </div>

        {/* Textarea */}
        <textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (error) setError(null);
          }}
          placeholder=""
          className="w-full outline-none resize-none"
          style={{
            backgroundColor: "rgba(90,90,90,0.75)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "1.25rem",
            padding: "2rem",
            color: "#ede4e6",
            caretColor: "#ede4e6",
            fontSize: "1rem",
            minHeight: "340px",
          }}
        />

        {/* Controls — fade in once user starts typing */}
        <div
          className="flex items-center justify-end gap-3 mt-5"
          style={{
            opacity: hasContent ? 1 : 0,
            pointerEvents: hasContent ? "auto" : "none",
            transition: "opacity 0.4s ease",
          }}
        >
          <p
            className="text-xs mr-auto"
            style={{ color: isOverLimit ? "#ff6b6b" : "#ede4e6", opacity: isOverLimit ? 1 : 0.4 }}
          >
            {wordsUsed}/{MAX_WORDS}
          </p>

          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push("/questions")}
            className="glass-nav flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105"
          >
            <Image src="/arrow.svg" alt="Back" width={18} height={16} style={{ opacity: 0.7, transform: "rotate(180deg)" }} />
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={isSaving || isOverLimit}
            className="glass-nav flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105 disabled:opacity-40"
          >
            <Image src="/arrow.svg" alt="Next" width={18} height={16} style={{ opacity: 0.7 }} />
          </button>
        </div>

        {error ? <p className="text-sm text-red-400 mt-2">{error}</p> : null}
      </div>
    </main>
  );
}
