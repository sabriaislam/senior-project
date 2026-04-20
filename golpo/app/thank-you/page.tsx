"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { GlassButton } from "@/components/glass-button";
import { createNewSession } from "@/lib/installation-cache";

export default function ThankYouPage() {
  const router = useRouter();

  function handleNewSession() {
    createNewSession();
    router.push("/welcome");
  }

  return (
    <PageShell videoSrc="/firstpage.mp4">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        style={{ zIndex: 20 }}
      >
        <p
          className="text-white text-center"
          style={{
            fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          thank you for sharing your story
        </p>
        <GlassButton onClick={handleNewSession} className="transition-all hover:scale-105 font-bold">
          start a new story
        </GlassButton>
        {/* Bottom: golpo link */}
        <p className="text-sm font-medium text-white/75">
          to read more go to{" "}
          <span className="font-bold text-white">golpo.com</span>
        </p>
      </div>
    </PageShell>
  );
}
