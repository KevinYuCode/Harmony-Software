"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const slides = [
  {
    src: "/BuffetAll.jpeg",
    alt: "Full spread of hot dishes along the Harmony buffet line",
  },
  {
    src: "/BuffetLeft.jpeg",
    alt: "Fried appetizers and soup station on the Harmony buffet line",
  },
  {
    src: "/BuffetRight.jpeg",
    alt: "Stir-fry, noodles and salad on the Harmony buffet line",
  },
];

const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

export function BuffetCarousel({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  function restartAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
  }

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goTo(i: number) {
    setIndex(i);
    restartAutoplay();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const endX = e.changedTouches[0]?.clientX ?? startX;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    goTo(
      deltaX < 0
        ? (index + 1) % slides.length
        : (index - 1 + slides.length) % slides.length,
    );
  }

  return (
    <div
      className={cn(
        "relative w-full touch-pan-y select-none overflow-hidden rounded-xl border border-border shadow-md bg-card",
        className,
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className={cn(
            "object-cover transition-opacity duration-700 ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to buffet photo ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "h-2.5 rounded-full shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              i === index ? "w-7 bg-white" : "w-2.5 bg-white/50 hover:bg-white/75",
            )}
          />
        ))}
      </div>
    </div>
  );
}
