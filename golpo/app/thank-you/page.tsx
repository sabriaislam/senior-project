"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { createNewSession } from "@/lib/installation-cache";

export default function ThankYouPage() {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  function handleNewSession() {
    createNewSession();
    router.push("/welcome");
  }

  return (
    <PageShell videoSrc="/firstpage.mp4" brightness={0.7}>
      {/* 1. Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "#DB62A0", mixBlendMode: "multiply", zIndex: 3, opacity: 0.8 }}
      />

      {/* 2. Decorative stars */}
      <Image
        src="/buttons/star-1.svg"
        alt=""
        width={130}
        height={0}
        className="absolute pointer-events-none"
        style={{ left: "20%", top: "15%", zIndex: 10, height: "auto"}}
      />
      <Image
        src="/buttons/star-2.svg"
        alt=""
        width={150}
        height={0}
        className="absolute pointer-events-none"
        style={{ left: "70%", top: "45%", zIndex: 10, height: "auto" }}
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <h1
          className="text-white text-center font-[family-name:var(--font-blur)]"
          style={{
            fontSize: "10rem", // Adjusted size for impact
            lineHeight: 1.2,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            textTransform: "lowercase",
            letterSpacing: "-5%",
          }}
        >
          thank you
        </h1>

        {/* 4. Button */}
        <div className="pointer-events-auto" style={{ marginTop: "2rem", marginBottom: "2rem" }}>
          <button
            onClick={handleNewSession}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-block",
              transform: pressed ? "scale(0.88)" : "scale(1)",
              filter: pressed ? "brightness(0.8)" : "brightness(1)",
              transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
            }}
          >
            <Image 
              src="/buttons/start-new-button.svg" 
              alt="start a new story" 
              width={250} 
              height={60} 
            />
          </button>
        </div>
          <p className="text-white/75 text-xl font-[family-name:var(--font-gayatri)] italic pointer-events-auto mt-6 flex flex-col items-center text-center">
            to read more go to{" "}
            <a href="https://golpo.com" className="font-bold text-[#6298DB] hover:underline">
              golpo.com
            </a>
          </p>
      </div>
    </PageShell>
  );
}