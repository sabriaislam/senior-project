"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUserDb, updateUserDb } from "@/lib/firebase/user-db";

const MAX_WORDS = 150;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function extractSubject(category: string) {
  const match = category.match(/the story of (.+)/i);
  return match ? match[1].toLowerCase() : category.toLowerCase();
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
    return () => {
      mounted = false;
    };
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

  const subject = extractSubject(category);

  return (
    <main
      className="w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: "#636363" }}
    >
      {/* Pink card */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "61vw",
          height: "60vh",
          backgroundColor: "#DB62A0",
        }}
      >
        {/* Grain overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.25 1.25' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='luminanceToAlpha'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0'/%3E%3C/feComponentTransfer%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.18,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Inner content */}
        <div
          style={{
            position: "absolute",
            inset: "7.7%",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Heading: "The story of [subject]" */}
          {!isBooting && (
            <h1
              style={{
                color: "white",
                fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)",
                lineHeight: 1.15,
                marginBottom: "0.6rem",
              }}
            >
              <span className="font-pixel">T</span>
              <span
                className="font-gayatri"
                style={{ fontStyle: "italic" }}
              >
                he story of {subject}
              </span>
            </h1>
          )}

          {/* Supporting question */}
          {!isBooting && question && (
            <p
              style={{
                color: "white",
                fontFamily: "'Roboto Mono', monospace",
                fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)",
                fontWeight: 700,
                marginBottom: "1.25rem",
                lineHeight: 1.4,
              }}
            >
              {question}
            </p>
          )}

          {/* Textarea */}
          <textarea
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (error) setError(null);
            }}
            className="font-roboto-mono outline-none resize-none"
            style={{
              height: "65%",
              backgroundColor: "rgba(214, 214, 214, 0.6)",
              border: "none",
              padding: "1.5rem",
              fontSize: "clamp(0.8rem, 1vw, 1rem)",
              color: "#1a1a1a",
              caretColor: "#1a1a1a",
            }}
          />

          {/* Bottom row: word count / error + next button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1rem",
              paddingBottom: "0.5rem",
            }}
          >
            <div>
              {answer.trim() ? (
                <p
                  className="text-xs"
                  style={{
                    color: isOverLimit ? "#ff4444" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {wordsUsed}/{MAX_WORDS}
                </p>
              ) : null}
              {error ? (
                <p className="text-sm mt-1" style={{ color: "#ff4444" }}>
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={isSaving || isOverLimit}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: isSaving || isOverLimit ? "not-allowed" : "pointer",
                opacity: isSaving || isOverLimit ? 0.4 : 1,
                transition: "opacity 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSaving && !isOverLimit)
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              <Image
                src="/buttons/next-button.svg"
                alt="Next"
                width={40}
                height={50}
              />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
