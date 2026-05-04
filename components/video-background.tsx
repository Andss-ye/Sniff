"use client";

import { useEffect, useRef } from "react";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const FADE_DURATION = 0.5;
    let rafId: number | null = null;
    let restarting = false;

    function tick() {
      if (!video!.duration || restarting) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const t = video!.currentTime;
      const dur = video!.duration;
      let opacity = 1;

      if (t < FADE_DURATION) {
        opacity = t / FADE_DURATION;
      } else if (t > dur - FADE_DURATION) {
        opacity = (dur - t) / FADE_DURATION;
      }

      video!.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      restarting = false;
      video!.play().catch(() => {});
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function onEnded() {
      restarting = true;
      video!.style.opacity = "0";
      setTimeout(() => {
        video!.currentTime = 0;
        startLoop();
      }, 100);
    }

    function onCanPlay() {
      video!.removeEventListener("canplay", onCanPlay);
      startLoop();
    }

    video.addEventListener("ended", onEnded);
    video.addEventListener("canplay", onCanPlay);

    const fallback = setTimeout(() => {
      if (video!.paused && !restarting) startLoop();
    }, 800);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
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
