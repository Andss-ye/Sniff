"use client";

import { useEffect, useRef } from "react";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const FADE = 0.5;
    let raf: number | null = null;
    let restarting = false;

    function tick() {
      if (!video!.duration || restarting) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = video!.currentTime;
      const d = video!.duration;
      let opacity = 1;
      if (t < FADE) opacity = t / FADE;
      else if (t > d - FADE) opacity = (d - t) / FADE;
      video!.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      raf = requestAnimationFrame(tick);
    }

    function start() {
      restarting = false;
      video!.play().catch(() => {});
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onEnded() {
      restarting = true;
      video!.style.opacity = "0";
      setTimeout(() => { video!.currentTime = 0; start(); }, 100);
    }

    function onCanPlay() {
      video!.removeEventListener("canplay", onCanPlay);
      start();
    }

    video.addEventListener("ended", onEnded);
    video.addEventListener("canplay", onCanPlay);
    const fallback = setTimeout(() => { if (video!.paused && !restarting) start(); }, 800);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(fallback);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  return (
    <div className="video-layer">
      <video
        ref={videoRef}
        className="bg-video"
        src="/uploads/hero-bg.mp4"
        muted
        playsInline
        preload="auto"
      />
      <div className="video-gradient" />
    </div>
  );
}
