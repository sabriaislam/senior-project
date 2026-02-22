"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserDb, updateUserDb } from "@/lib/firebase/user-db";

const SHOTS_TOTAL = 3;
const COUNTDOWN_SECONDS = 3;
const FLASH_DURATION_MS = 140;
const INTER_SHOT_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function PhotoboothPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [isStartingCamera, setIsStartingCamera] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeShot, setActiveShot] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasCompletedFirstTry, setHasCompletedFirstTry] = useState(false);
  const [hasUsedRedo, setHasUsedRedo] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      setHasCamera(true);
      setIsStartingCamera(false);
      return;
    }

    setError(null);
    setStatus(null);
    setIsStartingCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCamera(true);
    } catch (err) {
      console.error("Could not start camera:", err);
      setError("Camera access failed. Allow webcam permission and try again.");
    } finally {
      setIsStartingCamera(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadExisting() {
      try {
        const doc = await getUserDb();
        if (!mounted || !doc) {
          return;
        }

        const existing = [doc.pic01, doc.pic02, doc.pic03].filter(
          (value): value is string => Boolean(value)
        );
        if (existing.length > 0) {
          setPhotos(existing);
        }
      } catch (err) {
        console.error("Failed to load existing photobooth fields:", err);
      } finally {
        if (mounted) {
          setIsBooting(false);
          void startCamera();
        }
      }
    }

    void loadExisting();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setHasCamera(false);
    };
  }, [startCamera]);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.72);
  }

  async function runInteraction(isRedoAttempt: boolean) {
    if (isCapturing || isSaving) {
      return;
    }

    if (!hasCamera) {
      await startCamera();
      if (!streamRef.current) {
        return;
      }
    }

    if (!isRedoAttempt && hasCompletedFirstTry) {
      setStatus("First try is already complete. Use Redo for your second chance.");
      return;
    }

    if (isRedoAttempt && (!hasCompletedFirstTry || hasUsedRedo)) {
      setStatus("Redo is only available once after the first completed try.");
      return;
    }

    setError(null);
    setStatus(null);
    setIsCapturing(true);
    if (isRedoAttempt) {
      setPhotos([]);
    }
    const nextPhotos: string[] = [];

    try {
      for (let shotNumber = 1; shotNumber <= SHOTS_TOTAL; shotNumber += 1) {
        setActiveShot(shotNumber);
        for (let tick = COUNTDOWN_SECONDS; tick >= 1; tick -= 1) {
          setCountdown(tick);
          setStatus(`Shot ${shotNumber} in ${tick}...`);
          await wait(1000);
        }
        setCountdown(null);
        setFlashVisible(true);
        await wait(FLASH_DURATION_MS);
        setFlashVisible(false);

        const frame = captureFrame();
        if (!frame) {
          throw new Error("Failed to capture frame");
        }

        nextPhotos.push(frame);
        setPhotos([...nextPhotos]);
        setStatus(`Captured ${nextPhotos.length} of ${SHOTS_TOTAL}...`);
        await wait(INTER_SHOT_DELAY_MS);
      }

      setIsSaving(true);
      await updateUserDb({
        pic01: nextPhotos[0],
        pic02: nextPhotos[1],
        pic03: nextPhotos[2],
        webcamImageUrl: nextPhotos[0],
        photoboothRedoCount: isRedoAttempt ? 1 : 0,
      });
      if (isRedoAttempt) {
        setHasUsedRedo(true);
        setStatus("Second try complete. Moving to final image...");
        router.push("/final-image");
      } else {
        setHasCompletedFirstTry(true);
        setStatus("First try complete. Press Redo for your second and final try.");
      }
    } catch (err) {
      console.error("Photobooth capture failed:", err);
      setError("Could not complete the interaction. Please try again.");
    } finally {
      setActiveShot(null);
      setCountdown(null);
      setFlashVisible(false);
      setIsSaving(false);
      setIsCapturing(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.18em] opacity-80">Step 5</p>
        <h1 className="font-instrument text-4xl leading-tight md:text-5xl">Photobooth</h1>
        <p className="max-w-2xl opacity-90">
          Camera access starts immediately. You get two chances: Start for the first try, then
          Redo for your second and final try.
        </p>
      </div>

      <section className="space-y-5">
        <div className="relative block aspect-square w-full max-w-[520px] overflow-hidden border border-white/25 bg-black/35 text-left">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
          <div className="absolute left-4 top-4 border border-white/30 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/85">
            {!hasCamera
              ? "Waiting for camera permission..."
              : photos.length >= SHOTS_TOTAL
                ? "All 3 shots captured"
                : isCapturing
                  ? `Capturing shot ${activeShot} of ${SHOTS_TOTAL}`
                  : "Ready to start interaction"}
          </div>
          {flashVisible ? <div className="absolute inset-0 bg-white/95" /> : null}
          {isCapturing ? (
            <div className="absolute inset-0 grid place-items-center bg-black/25">
              <div className="flex flex-col items-center gap-2 border border-white/35 bg-black/40 px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.15em]">Capturing shot {activeShot}</p>
                {countdown ? <p className="text-4xl font-semibold leading-none">{countdown}</p> : null}
              </div>
            </div>
          ) : null}
        </div>

      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/answer"
          className="inline-flex border border-black/20 bg-black/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/10"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={() => void runInteraction(false)}
          disabled={isCapturing || isSaving || hasCompletedFirstTry}
          className="inline-flex border border-black/20 bg-black/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => void runInteraction(true)}
          disabled={!hasCompletedFirstTry || hasUsedRedo || !hasCamera || isCapturing || isSaving || photos.length < SHOTS_TOTAL}
          className="inline-flex border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Redo
        </button>
      </div>

      <p className="text-sm text-white/80">Chances used: {hasUsedRedo ? "2 of 2" : hasCompletedFirstTry ? "1 of 2" : "0 of 2"}</p>
      {isBooting ? <p className="text-sm text-white/80">Loading previous photobooth data...</p> : null}
      {isStartingCamera ? <p className="text-sm text-white/80">Opening camera...</p> : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
      {status ? <p className="text-sm text-green-100">{status}</p> : null}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
