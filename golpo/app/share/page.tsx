"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FinalImageOption1, { type FinalImageData } from "@/components/final-image-option-1";
import FinalImageOption2 from "@/components/final-image-option-2";
import { getUserDb } from "@/lib/firebase/user-db";

const DEFAULT_DATA: FinalImageData = {
  storyCategory: "",
  chosenQuestion: "No question selected yet.",
  answerText: "No answer saved yet.",
  name: "Anonymous",
  pics: [null, null, null, null],
};

function SharePageInner() {
  const searchParams = useSearchParams();
  const layout = searchParams.get("layout") === "2" ? 2 : 1;

  const [data, setData] = useState<FinalImageData>(DEFAULT_DATA);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const doc = await getUserDb();
        if (!mounted) return;
        setData({
          storyCategory: doc?.storyCategory ?? "",
          chosenQuestion: doc?.chosenQuestion ?? DEFAULT_DATA.chosenQuestion,
          answerText: doc?.answerText ?? DEFAULT_DATA.answerText,
          name: doc?.name ?? DEFAULT_DATA.name,
          pics: [doc?.pic01 ?? null, doc?.pic02 ?? null, doc?.pic03 ?? null, doc?.pic04 ?? null],
        });
      } catch (err) {
        console.error("Failed to load share page data:", err);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function handleSendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);
    setSendSuccess(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setSendError("Please enter in the format: youremail@example.com");
      return;
    }

    if (!cardImageUrl) {
      setSendError("Image is still rendering, please wait a moment.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: data.name, imageDataUrl: cardImageUrl }),
      });

      if (!response.ok) {
        let errorMsg = `Failed to send email (${response.status}).`;
        try {
          const body = (await response.json()) as { error?: string };
          errorMsg = body.error ?? errorMsg;
        } catch { /* not JSON */ }
        setSendError(errorMsg);
        return;
      }

      setSendSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Send email failed:", err);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main
      className="grid min-h-screen w-full grid-cols-2"
      style={{ backgroundColor: "#494949" }}
    >
      {/* Left — postcard preview */}
      <div className="flex items-center justify-center p-10 border-r border-white/10">
        <div className="w-full max-w-lg">
          {layout === 1 ? (
            <FinalImageOption1 data={data} onImageReady={setCardImageUrl} />
          ) : (
            <FinalImageOption2 data={data} onImageReady={setCardImageUrl} />
          )}
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex flex-col justify-between p-12 lg:p-24">
        {/* Top: heading + email form */}
        <div className="flex flex-col gap-8">
          <Link
            href={`/final-image`}
            className="text-sm font-semibold text-white/50 transition hover:text-white/80"
          >
            ← Back
          </Link>

          <div className="flex flex-col gap-2 mt-16">
            <h1
              className="text-3xl font-bold leading-tight text-white"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              keep your story
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-white/60">
              email your postcard
            </p>
            <form onSubmit={(e) => void handleSendEmail(e)} className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSendError(null); setSendSuccess(false); }}
                placeholder="youremail@example.com"
                className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/60 focus:bg-white/15"
              />
              <button
                type="submit"
                disabled={isSending || !cardImageUrl}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                {isSending ? (
                  <span className="text-xs">…</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </form>
            {sendError ? <p className="text-xs text-red-300">{sendError}</p> : null}
            {sendSuccess ? <p className="text-xs text-green-300">Postcard sent! Check your inbox.</p> : null}
          </div>
        </div>

        {/* Bottom: golpo link */}
        <p className="text-sm text-white/50">
          to read everyone else&apos;s story go to{" "}
          <span className="font-bold text-white">golpo.com</span>
        </p>
      </div>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <SharePageInner />
    </Suspense>
  );
}
