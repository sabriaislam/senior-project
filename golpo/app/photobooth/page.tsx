"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlassButton } from "@/components/glass-button";
import { FilmGrain } from "@/components/film-grain";
import { updateUserDb } from "@/lib/firebase/user-db";

const SHOTS_TOTAL = 4;
const COUNTDOWN_SECONDS = 3;
const FLASH_MS = 150;
const INTER_SHOT_MS = 500;

function wait(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

// ─── WebGL shaders (CRT broadcast effect) ───────────────────────
const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_cam;
uniform float u_time;
uniform float u_curvature;
uniform float u_scanlines;
uniform float u_scanIntensity;
uniform float u_phosphor;
uniform float u_brightness;
uniform float u_chroma;
uniform float u_rgbShift;
uniform float u_noise;
uniform float u_lineDisp;
uniform float u_syncErr;
uniform float u_interfere;
uniform float u_size;
uniform vec2  u_camAspect;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float hash1(float n){ return fract(sin(n)*43758.5453); }

vec2 barrel(vec2 uv, float amount){
  vec2 cc = uv - 0.5;
  return uv + cc * dot(cc,cc) * amount;
}
float vignette(vec2 uv){
  uv = uv * 2.0 - 1.0;
  return 1.0 - dot(uv*0.65, uv*0.65);
}
vec2 cropUV(vec2 uv){
  float aspect = u_camAspect.x;
  float show = 1.0 / aspect;
  float offset = (1.0 - show) * 0.5;
  return vec2(offset + uv.x * show, uv.y);
}
vec3 phosphorSample(vec2 uv, float spread){
  float px = 1.0 / u_size;
  vec3 col  = texture2D(u_cam, uv).rgb;
  vec3 colL = texture2D(u_cam, uv - vec2(px * spread, 0.0)).rgb;
  vec3 colR = texture2D(u_cam, uv + vec2(px * spread, 0.0)).rgb;
  return mix(col, (col + colL*0.4 + colR*0.4) / 1.8, u_phosphor);
}

void main(){
  float t = u_time;
  vec2 uv = v_uv;
  uv.x = 1.0 - uv.x;
  uv.y = 1.0 - uv.y;

  float lineRow  = floor(uv.y * 200.0);
  float dispSeed = hash1(lineRow * 0.1 + floor(t * 3.0) * 7.3);
  uv.x += step(0.97, dispSeed) * (hash1(lineRow + t) * 2.0 - 1.0) * u_lineDisp;

  float syncSeed   = hash1(floor(t * 1.5));
  float syncActive = step(1.0 - u_syncErr * 5.0, syncSeed);
  float syncRow    = hash1(floor(t * 1.5) * 13.7);
  float syncZone   = step(0.0, uv.y - syncRow) * step(0.0, syncRow + 0.04 - uv.y);
  uv.x += syncActive * syncZone * (hash1(syncRow) * 2.0 - 1.0) * 0.08;

  vec2 curved = barrel(uv, u_curvature * 0.04);
  if(curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return;
  }

  vec2 camUV  = cropUV(curved);
  vec2 camUVL = cropUV(curved + vec2( u_chroma + u_rgbShift, 0.0));
  vec2 camUVR = cropUV(curved - vec2( u_chroma + u_rgbShift, 0.0));

  float r = phosphorSample(camUVL, 2.0).r;
  float g = phosphorSample(camUV,  2.0).g;
  float b = phosphorSample(camUVR, 2.0).b;

  if(u_rgbShift > 0.001){
    float rs = u_rgbShift;
    r = texture2D(u_cam, cropUV(curved + vec2( rs,  rs * 0.3))).r;
    b = texture2D(u_cam, cropUV(curved + vec2(-rs, -rs * 0.3))).b;
  }

  vec3 col = vec3(r, g, b);
  float scan = sin(curved.y * u_scanlines * 3.14159) * 0.5 + 0.5;
  col *= 1.0 - u_scanIntensity * (1.0 - pow(scan, 1.2));

  float interfereY    = fract(curved.y - t * 0.3);
  float interfereLine = smoothstep(0.0, 0.02, interfereY) * smoothstep(0.04, 0.02, interfereY);
  col += vec3(0.4, 0.8, 0.4) * interfereLine * hash(vec2(curved.x * 10.0, floor(t * 10.0))) * u_interfere;

  float n = hash(curved * (u_size / 3.0) + vec2(t * 97.3, t * 13.7));
  col += (n - 0.5) * u_noise;

  col *= u_brightness;
  col *= vignette(curved) * 1.1;
  col.g *= 1.02;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// BROADCAST preset (default — no user controls needed)
const PRESET = {
  curvature: 0.9, scanlines: 498, scanIntensity: 0.23, phosphor: 0.24,
  brightness: 1.05, chroma: 0.0059, rgbShift: 0.002, noise: 0.13,
  lineDisp: 0, syncErr: 0.006, interfere: 0.02,
};

type GlState = {
  gl: WebGLRenderingContext;
  tex: WebGLTexture;
  u: { [k: string]: WebGLUniformLocation | null };
  t: number;
};

export default function PhotoboothPage() {
  const router = useRouter();
  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const crtRef     = useRef<HTMLCanvasElement | null>(null);
  const bgRef      = useRef<HTMLCanvasElement | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const glRef      = useRef<GlState | null>(null);
  const animRef    = useRef<number>(0);
  const camWRef    = useRef(1280);
  const camHRef    = useRef(720);

  const [photos,      setPhotos]      = useState<string[]>([]);
  const [phase,       setPhase]       = useState<"idle" | "capturing" | "review">("idle");
  const [hasCamera,   setHasCamera]   = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [countdown,   setCountdown]   = useState<number | null>(null);
  const [flash,       setFlash]       = useState(false);
  const [hasRedo,     setHasRedo]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const initGL = useCallback(() => {
    const canvas = crtRef.current;
    if (!canvas || glRef.current) return;
    canvas.width = 600;
    canvas.height = 600;
    const gl = canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true });
    if (!gl) return;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    glRef.current = {
      gl, tex, t: 0,
      u: {
        cam:   U("u_cam"),   time:  U("u_time"),  size:  U("u_size"),
        asp:   U("u_camAspect"),
        curv:  U("u_curvature"), scan:  U("u_scanlines"), scanI: U("u_scanIntensity"),
        phos:  U("u_phosphor"),  bri:   U("u_brightness"), chrom: U("u_chroma"),
        rgb:   U("u_rgbShift"),  noise: U("u_noise"),     lineD: U("u_lineDisp"),
        sync:  U("u_syncErr"),   inter: U("u_interfere"),
      },
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) { setHasCamera(true); return; }
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
        camWRef.current = v.videoWidth  || 1280;
        camHRef.current = v.videoHeight || 720;
      }
      setHasCamera(true);
    } catch (e) {
      console.error(e);
      setError("Camera access failed. Allow webcam permission and try again.");
    }
  }, []);

  // Mount: size canvases, start camera, init GL
  useEffect(() => {
    const bg = bgRef.current;
    if (bg) { bg.width = window.innerWidth; bg.height = window.innerHeight; }

    void startCamera().then(() => initGL());

    return () => {
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera, initGL]);

  // Render loop
  useEffect(() => {
    let running = true;
    function loop() {
      if (!running) return;
      animRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      // CRT WebGL render
      const gx = glRef.current;
      const crtCanvas = crtRef.current;
      if (gx && crtCanvas) {
        const { gl, tex, u } = gx;
        gl.viewport(0, 0, crtCanvas.width, crtCanvas.height);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video); } catch { /* skip if not ready */ }
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1i(u.cam, 0);
        gl.uniform1f(u.time, gx.t);
        gl.uniform1f(u.size, crtCanvas.width);
        gl.uniform2f(u.asp, camWRef.current / camHRef.current, 1.0);
        gl.uniform1f(u.curv,  PRESET.curvature);
        gl.uniform1f(u.scan,  PRESET.scanlines);
        gl.uniform1f(u.scanI, PRESET.scanIntensity);
        gl.uniform1f(u.phos,  PRESET.phosphor);
        gl.uniform1f(u.bri,   PRESET.brightness);
        gl.uniform1f(u.chrom, PRESET.chroma);
        gl.uniform1f(u.rgb,   PRESET.rgbShift);
        gl.uniform1f(u.noise, PRESET.noise);
        gl.uniform1f(u.lineD, PRESET.lineDisp);
        gl.uniform1f(u.sync,  PRESET.syncErr);
        gl.uniform1f(u.inter, PRESET.interfere);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gx.t += 0.016;
      }

      // Background canvas: tiled camera preview
      const bg = bgRef.current;
      if (bg) {
        const ctx = bg.getContext("2d");
        if (ctx) {
          const TILE = 116;
          const GAP  = 3;
          const STEP = TILE + GAP;

          // Source: crop video to square from center
          const vw = video.videoWidth  || 640;
          const vh = video.videoHeight || 480;
          let srcX = 0, srcY = 0, srcW = vw, srcH = vh;
          if (vw / vh > 1) { srcW = vh; srcX = (vw - srcW) / 2; }
          else              { srcH = vw; srcY = (vh - srcH) / 2; }

          ctx.fillStyle = "#646362";
          ctx.fillRect(0, 0, bg.width, bg.height);

          const cols = Math.ceil(bg.width  / STEP) + 1;
          const rows = Math.ceil(bg.height / STEP) + 1;

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const x = col * STEP;
              const y = row * STEP;
              ctx.save();
              ctx.beginPath();
              ctx.rect(x, y, TILE, TILE);
              ctx.clip();
              // mirror horizontally inside tile
              ctx.translate(x + TILE, y);
              ctx.scale(-1, 1);
              ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, TILE, TILE);
              ctx.restore();
            }
          }
        }
      }
    }
    loop();
    return () => { running = false; };
  }, []);

  function captureFrame() {
    // Capture directly from the CRT WebGL canvas (preserveDrawingBuffer: true)
    const crtCanvas = crtRef.current;
    if (!crtCanvas) return null;
    return crtCanvas.toDataURL("image/jpeg", 0.85);
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
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "black" }}>
      {/* design1 background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design1.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3)", zIndex: 1 }}
      />

      {/* Film grain overlay */}
      
      <FilmGrain />

      {/* Hidden camera video */}
      <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline muted />

      {/* Unused bg canvas kept to avoid breaking the render loop ref */}
      <canvas ref={bgRef} style={{ display: "none" }} />
      {/* Centre content */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 20,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "20px",
      }}>
        <h1
          className="text-center font-average text-3xl text-white"
          style={{ maxWidth: "520px" }}
        >
          the face of the storyteller
        </h1>
        {/* Camera view or review grid */}
        <div style={{ position: "relative", width: "min(64vh, 60vw)", height: "min(64vh, 60vw)" }}>
          {/* CRT canvas — always mounted to preserve the WebGL context across redo */}
          <canvas ref={crtRef} style={{ width: "100%", height: "100%", display: "block", visibility: isReview ? "hidden" : "visible" }} />

          {/* Review grid — overlaid on top when in review phase */}
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
              position: "absolute", bottom: "10px", right: "12px",
              color: "rgba(255,255,255,0.7)", fontSize: "13px",
              fontFamily: "font-average",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}>
              {shotNum}/{SHOTS_TOTAL}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {phase === "idle" && (
            <>
              <GlassButton
                onClick={() => void runInteraction(false)}
                disabled={isCapturing || !hasCamera}
              >
                start
              </GlassButton>
            </>
          )}

          {phase === "review" && (
            <>
              <GlassButton
                onClick={() => void runInteraction(true)}
                disabled={hasRedo || isCapturing || isSaving}
              >
                redo
              </GlassButton>
              <GlassButton
                onClick={() => router.push("/final-image")}
                disabled={isSaving}
              >
                next
              </GlassButton>
            </>
          )}
        </div>

        {error && (
          <p style={{ color: "rgba(255,180,180,0.9)", fontSize: "12px", fontFamily: "monospace" }}>
            {error}
          </p>
        )}
      </div>

      {/* Hidden capture canvas */}
      <canvas ref={captureRef} style={{ display: "none" }} />
    </div>
  );
}
