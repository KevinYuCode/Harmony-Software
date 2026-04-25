"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@harmony/ui/components/dialog";
import { Button } from "@harmony/ui/components/button";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./carousel";

const slides = [
  {
    src: "/Dine-3.webp",
    alt: "Menu page: Sweet & Sour Chicken Balls, ribs, fried rice & more",
    width: 2764,
    height: 3749,
  },
  {
    src: "/Dine-4.webp",
    alt: "Menu page: soups, egg rolls, chicken wings & appetizers",
    width: 2839,
    height: 3886,
  },
  {
    src: "/Dine-1.webp",
    alt: "Menu page: noodles, rice dishes & stir fries",
    width: 2737,
    height: 3728,
  },
  {
    src: "/Dine-2.webp",
    alt: "Menu page: Szechuan beef, kung po chicken & mixed vegetables",
    width: 2627,
    height: 3598,
  },
];

export function DiningCarousel() {
  const [selected, setSelected] = useState<(typeof slides)[number] | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
    onSelect();

    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <>
      {/* Mobile: carousel */}
      <div className="w-full min-w-0 sm:hidden">
        <Carousel
          opts={{ align: "start" }}
          setApi={setApi}
          className="space-y-4"
        >
          <CarouselContent>
            {slides.map((s, i) => (
              <CarouselItem key={s.src}>
                <button
                  onClick={() => setSelected(s)}
                  aria-label={`View larger: ${s.alt}`}
                  className="relative w-full overflow-hidden rounded-xl shadow-md aspect-3/4 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    className="object-cover object-top transition-transform duration-500 hover:scale-105"
                    sizes="100vw"
                    priority={i < 2}
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex items-center justify-center gap-2 pb-1">
            {Array.from({ length: count }).map((_, index) => {
              const isActive = current === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to menu image ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={[
                    "h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                    isActive
                      ? "w-7 bg-primary"
                      : "w-2.5 bg-primary/30 hover:bg-primary/50",
                  ].join(" ")}
                />
              );
            })}
          </div>
        </Carousel>
      </div>

      {/* sm+: grid */}
      <div className="hidden sm:grid w-full grid-cols-2 gap-5 lg:grid-cols-4">
        {slides.map((s, i) => (
          <button
            key={s.src}
            onClick={() => setSelected(s)}
            aria-label={`View larger: ${s.alt}`}
            className="relative w-full min-w-0 overflow-hidden rounded-xl shadow-md aspect-3/4 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              className="object-cover object-top transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 1024px) 50vw, 25vw"
              priority={i < 2}
            />
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent
          showCloseButton={false}
          className="w-fit sm:w-fit max-w-[calc(100vw-1.5rem)] sm:max-w-[min(92vw,44rem)] max-h-[90dvh] p-2 sm:p-3 bg-white border-border overflow-hidden"
        >
          <DialogTitle className="sr-only">
            {selected ? `Image preview: ${selected.alt}` : "Image preview"}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2.5 top-2.5 z-10 h-7 w-7 rounded-full bg-black/15 text-white/80 hover:bg-black/25 hover:text-white focus-visible:ring-white/70"
              aria-label="Close image preview"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </Button>
          </DialogClose>
          {selected && (
            <div className="relative w-fit max-w-full mx-auto">
              <Image
                src={selected.src}
                alt={selected.alt}
                width={selected.width}
                height={selected.height}
                className="block h-auto w-auto max-h-[82dvh] max-w-[min(90vw,42rem)] object-contain"
                sizes="(max-width: 768px) 90vw, 672px"
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
