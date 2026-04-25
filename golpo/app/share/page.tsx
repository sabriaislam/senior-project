"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from 'next/image';
import FinalImageOption1, { type FinalImageData } from "@/components/final-image-option-1";
import FinalImageOption2 from "@/components/final-image-option-2";
import { getUserDb } from "@/lib/firebase/user-db";
import { FilmGrain } from "@/components/film-grain";

const DEFAULT_DATA: FinalImageData = {
  storyCategory: "",
  chosenQuestion: "No question selected yet.",
  answerText: "No answer saved yet.",
  name: "Anonymous",
  pics: [null, null, null, null],
};

function SharePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layout = searchParams.get("layout") === "2" ? 2 : 1;

  const [data, setData] = useState<FinalImageData>(DEFAULT_DATA);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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

      router.push("/thank-you");
    } catch (err) {
      console.error("Send email failed:", err);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="relative grid min-h-screen w-full grid-cols-2 overflow-hidden" style={{ background: "black" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design3.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3)", zIndex: 1 }}
      />
      <FilmGrain />
      {/* Left — postcard preview */}
      <div className="relative flex items-center justify-center p-10 border-r border-white/10" style={{ zIndex: 20 }}>
        <div className="w-full max-w-lg">
          {layout === 1 ? (
            <FinalImageOption1 data={data} onImageReady={setCardImageUrl} />
          ) : (
            <FinalImageOption2 data={data} onImageReady={setCardImageUrl} />
          )}
        </div>
      </div>

      {/* Right — actions */}
      <div className="bg-[#6298DB] relative flex items-center justify-center p-10" style={{ zIndex: 20 }}>
        <FilmGrain/>
        {/* Top: heading + email form */}
        <div className="w-full max-w-lg flex flex-col justify-start gap-4">
          <Link href="/final-image">
            <button
              type="button"
              style={{
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "opacity 0.4s ease, transform 0.2s ease",
              }}
              className="hover:scale-105"
            >
              <Image src="/buttons/back-button.svg" alt="Back" width={100} height={47} />
            </button>
          </Link>

          <div className="flex flex-col gap-1">
            <span className="text-5xl"><span className="font-pixel">K</span><span className="font-gayatri" style={{ fontStyle: "italic" }}>eep your story</span></span>
              <p className="font-karla leading-tight text-lg" style={{ color: "#ede4e6" }}>
              email your postcard
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <form onSubmit={(e) => void handleSendEmail(e)} className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSendError(null); }}
                placeholder="youremail@example.com"
                className="font-roboto-mono px-2 py-2 text-base text-black outline-none"
                style={{
                  width: "280px",
                  backgroundColor: "rgba(217, 217, 217, 0.7)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                }}              />
              <button
                type="submit"
                disabled={isSending || !cardImageUrl}
                aria-label="Send"
              >
                {isSending ? (
                  <span className="text-xs">…</span>
                ) : (
                  <Image src="/buttons/next-button.svg" alt="Next" width={50} height={47} />
                )}
              </button>
            </form>
            {sendError ? <p className="text-xs text-red-300">{sendError}</p> : null}
            <button
              type="button"
              onClick={() => router.push("/thank-you")}
              className="font-karla text-sm font-medium text-white/70 hover:text-white transition self-start"
            >
              no thank you
            </button>
          </div>
        </div>
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
