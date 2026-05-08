"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateUserDb } from "@/lib/firebase/user-db";

const SHOTS_TOTAL = 4;
const COUNTDOWN_SECONDS = 3;
const FLASH_MS = 150;
const INTER_SHOT_MS = 500;

function wait(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

export default function PhotoboothPage() {
  const router = useRouter();
  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [photos,      setPhotos]      = useState<string[]>([]);
  const [phase,       setPhase]       = useState<"idle" | "capturing" | "review">("idle");
  const [hasCamera,   setHasCamera]   = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [countdown,   setCountdown]   = useState<number | null>(null);
  const [flash,       setFlash]       = useState(false);
  const [hasRedo,     setHasRedo]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [pressedBtn,  setPressedBtn]  = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (streamRef.current?.active) { setHasCamera(true); return; }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
      setHasCamera(true);
    } catch (e) {
      const err = e as DOMException;
      streamRef.current = null;
      console.error(err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission denied — allow webcam access in your browser settings and refresh.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found — connect a camera and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera is in use by another app — close it and try again.");
      } else {
        setError("Camera access failed — allow webcam permission and try again.");
      }
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = captureRef.current;
    if (!video || !canvas) return null;
    // Scale down to ~640px wide to stay under Firestore's 1MB document limit
    const srcW = video.videoWidth  || 1280;
    const srcH = video.videoHeight || 720;
    const scale = Math.min(1, 640 / srcW);
    canvas.width  = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75);
  }

  async function runInteraction(isRedo: boolean) {
    if (isCapturing || isSaving) return;
    setPhase("capturing");
    setError(null);
    setIsCapturing(true);
    if (isRedo) setPhotos([]);
    const captured: string[] = [];
    try {
      for (let shot = 1; shot <= SHOTS_TOTAL; shot++) {
        for (let tick = COUNTDOWN_SECONDS; tick >= 1; tick--) {
          setCountdown(tick);
          await wait(1000);
        }
        setCountdown(null);
        setFlash(true);
        await wait(FLASH_MS);
        setFlash(false);
        const frame = captureFrame();
        if (!frame) throw new Error("Capture failed");
        captured.push(frame);
        setPhotos([...captured]);
        await wait(INTER_SHOT_MS);
      }
      setIsSaving(true);
      await updateUserDb({
        pic01: captured[0], pic02: captured[1],
        pic03: captured[2], pic04: captured[3],
        webcamImageUrl: captured[0],
        photoboothRedoCount: isRedo ? 1 : 0,
      });
      if (isRedo) { setHasRedo(true); router.push("/final-image"); return; }
      setPhase("review");
    } catch (e) {
      console.error(e);
      setPhase("idle");
      setError("Could not complete the interaction. Please try again.");
    } finally {
      setCountdown(null);
      setFlash(false);
      setIsSaving(false);
      setIsCapturing(false);
    }
  }

  const shotNum  = Math.min(photos.length + 1, SHOTS_TOTAL);
  const isReview = phase === "review";

  return (
    <main
      className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ backgroundColor: "#DB62A0", gap: "2vh" }}
    >
      {/* design3 overlay — full page, 180°, below all content */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bg/design3.jpg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: "30%",
          transform: "rotate(180deg)",
          mixBlendMode: "screen",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* stamp-h — behind content, above design3 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bg/stamp-h.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          top: "1--%",
          left: "50%",
          transform: "translate(-50%, -3%) scale(1.8)",
          width: "min(90vw, 90vh)",
          height: "auto",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Content — sits above the overlay */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "2vh", width: "100%" }}>

      {/* Title */}
      <h1
        style={{
          color: "#6298DB",
          fontSize: "clamp(1.6rem, 4vw, 3rem)",
          lineHeight: 1.15,
        }}
      >
        <span className="font-pixel">T</span>
        <span className="font-gayatri" style={{ fontStyle: "italic" }}>
          he face of the storyteller
        </span>
      </h1>

      {/* Camera view */}
      <div style={{ position: "relative", width: "min(54vh, max(45vw, 280px))", height: "min(54vh, max(45vw, 280px))" }}>
        {/* Live video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: isReview ? "none" : "block",
            transform: "scaleX(-1)",
            border: "2px white"
          }}
        />

        {/* Review grid */}
        {isReview && (
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#2a2a2a", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photos[i] && <img src={photos[i]} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
            ))}
          </div>
        )}

        {/* Flash */}
        {flash && <div style={{ position: "absolute", inset: 0, background: "white", zIndex: 10 }} />}

        {/* Countdown */}
        {countdown !== null && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: "6rem", color: "rgba(255,255,255,0.92)", fontWeight: "bold",
              textShadow: "0 2px 16px rgba(0,0,0,0.9)", fontFamily: "monospace",
            }}>
              {countdown}
            </span>
          </div>
        )}

        {/* Shot counter */}
        {!isReview && (
          <div style={{
            position: "absolute", bottom: "10px", left: "12px",
            color: "rgba(255,255,255,0.7)", fontSize: "13px",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            zIndex: 2,
          }}>
            {shotNum}/{SHOTS_TOTAL}
          </div>
        )}

        {/* Corner star — top left */}
        <Image
          src="/buttons/corner-star-1.svg"
          alt=""
          aria-hidden
          width={80}
          height={80}
          style={{ position: "absolute", top: -20, left: -40, zIndex: 15, pointerEvents: "none" }}
        />

        {/* Corner star — bottom right */}
        <Image
          src="/buttons/corner-star-2.svg"
          alt=""
          aria-hidden
          width={80}
          height={80}
          style={{ position: "absolute", bottom: -30, right: -30, zIndex: 15, pointerEvents: "none" }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {phase === "idle" && (
          <button
            type="button"
            onClick={() => void runInteraction(false)}
            disabled={isCapturing || !hasCamera}
            onMouseDown={() => setPressedBtn("start")}
            onMouseUp={() => setPressedBtn(null)}
            onMouseLeave={() => setPressedBtn(null)}
            onTouchStart={() => setPressedBtn("start")}
            onTouchEnd={() => setPressedBtn(null)}
            style={{
              background: "none", border: "none", padding: 0,
              cursor: isCapturing || !hasCamera ? "not-allowed" : "pointer",
              opacity: isCapturing || !hasCamera ? 0.4 : 1,
              display: "inline-block",
              transform: pressedBtn === "start" ? "scale(0.88)" : "scale(1)",
              filter: pressedBtn === "start" ? "brightness(0.8)" : "brightness(1)",
              transition: pressedBtn === "start"
                ? "transform 0.08s ease, filter 0.08s ease"
                : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
            }}
          >
            <Image src="/buttons/blue-start-button.svg" alt="Start" width={100} height={56} />
          </button>
        )}

        {phase === "review" && (
          <>
            <button
              type="button"
              onClick={() => void runInteraction(true)}
              disabled={hasRedo || isCapturing || isSaving}
              onMouseDown={() => setPressedBtn("redo")}
              onMouseUp={() => setPressedBtn(null)}
              onMouseLeave={() => setPressedBtn(null)}
              onTouchStart={() => setPressedBtn("redo")}
              onTouchEnd={() => setPressedBtn(null)}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: hasRedo || isCapturing || isSaving ? "not-allowed" : "pointer",
                opacity: hasRedo || isCapturing || isSaving ? 0.4 : 1,
                display: "inline-block",
                transform: pressedBtn === "redo" ? "scale(0.88)" : "scale(1)",
                filter: pressedBtn === "redo" ? "brightness(0.8)" : "brightness(1)",
                transition: pressedBtn === "redo"
                  ? "transform 0.08s ease, filter 0.08s ease"
                  : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
              }}
            >
              <Image src="/buttons/redo.svg" alt="Redo" width={80} height={45} />
            </button>
            <button
              type="button"
              onClick={() => router.push("/final-image")}
              disabled={isSaving}
              onMouseDown={() => setPressedBtn("next")}
              onMouseUp={() => setPressedBtn(null)}
              onMouseLeave={() => setPressedBtn(null)}
              onTouchStart={() => setPressedBtn("next")}
              onTouchEnd={() => setPressedBtn(null)}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.4 : 1,
                display: "inline-block",
                transform: pressedBtn === "next" ? "scale(0.88)" : "scale(1)",
                filter: pressedBtn === "next" ? "brightness(0.8)" : "brightness(1)",
                transition: pressedBtn === "next"
                  ? "transform 0.08s ease, filter 0.08s ease"
                  : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
              }}
            >
              <Image src="/buttons/next-button.svg" alt="Next" width={59} height={47} />
            </button>
          </>
        )}
      </div>

      {/* Error — message is console-only; retry button still shown if no camera */}
      {error && !hasCamera && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          {!hasCamera && (
            <button
              type="button"
              onClick={() => void startCamera()}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: "pointer",
                transition: "opacity 0.2s ease, transform 0.15s ease",
                color: "white",
                fontSize: "clamp(0.8rem, 1.1vw, 1rem)",
              }}
              className="font-gayatri"
            >
              retry camera
            </button>
          )}
        </div>
      )}

      {/* Hidden capture canvas */}
      <canvas ref={captureRef} style={{ display: "none" }} />
      </div>
    </main>
  );
}
