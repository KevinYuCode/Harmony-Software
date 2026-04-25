"use client";

import { useState } from "react";
import { Button } from "@harmony/ui/components/button";
import { Badge } from "@harmony/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@harmony/ui/components/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@harmony/ui/components/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@harmony/ui/components/accordion";
import { getAllMenuItems, type MenuItem } from "@harmony/utils/menu";
import { PRICES } from "@harmony/utils/prices";

const STORE_ADDRESS_LINE = "287 Talbot St W #3, Aylmer, ON N5H 1J9";
const STORE_MAP_QUERY = `${STORE_ADDRESS_LINE}, Canada`;
const STORE_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(STORE_MAP_QUERY)}&hl=en&z=16&output=embed`;

/** Categories to exclude from the public menu page. */
const EXCLUDED_CATEGORY_PREFIXES = ["Dine-in", "Modifications", "Extras"];

/** Display order for categories. Unlisted categories appear at the end. */
const CATEGORY_ORDER = [
  "Lunch Special",
  "Soup",
  "Appetizers",
  "Sweet & sour",
  "Rice",
  "Chow mein & chop suey",
  "Egg foo young",
  "Honey garlic",
  "Beef",
  "Chicken",
  "Shrimp",
  "Noodles",
  "Szechuan & curry",
  "Plain",
  "Family dinners",
  "Combos",
];

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/** Lowest dine-in lunch special price (student/senior plate or combo A–D). */
const lunchSpecialFromPrice = Math.min(
  PRICES.students_seniors_lunch_special,
  PRICES.lunch_special_combo_a,
  PRICES.lunch_special_combo_b,
  PRICES.lunch_special_combo_c,
  PRICES.lunch_special_combo_d
);

/** Shown in the “Special offers” dialog — keep in sync with the home page Specials; prices from `PRICES` (packages/utils/src/prices.ts). */
const SPECIAL_OFFER_SECTIONS = [
  {
    emoji: "🚗",
    title: "Free delivery",
    lines: [
      "On orders of $40 or more before tax.",
      "Available within our town-limited delivery area. Cash only.",
    ],
  },
  {
    emoji: "💰",
    title: "10% off pick-up",
    lines: [
      "On pick-up orders over $36 before tax.",
      "Cash only. Not valid with lunch special.",
    ],
  },
  {
    emoji: "🎓",
    title: "Students & seniors lunch",
    lines: [
      `Lunch specials from ${formatPrice(lunchSpecialFromPrice)} — see the Lunch Special section of the menu for included items.`,
      "Valid student or senior ID may be required. Ask when you order.",
    ],
  },
  {
    emoji: "🍽️",
    title: "Friday buffet",
    lines: [
      "All-you-can-eat every Friday. Kids under 3 eat free.",
      `Lunch 11:30 am – 1:30 pm: adult ${formatPrice(PRICES.dinner_buffet)}; senior & student ${formatPrice(PRICES.student_buffet)}.`,
      `Dinner 5:00 pm – 8:00 pm: adult ${formatPrice(PRICES.dinner_buffet)}; senior & student ${formatPrice(PRICES.senior_buffet)}.`,
    ],
  },
] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  "Lunch Special": "🍱",
  "Soup": "🍜",
  "Appetizers": "🥟",
  "Sweet & sour": "🍗",
  "Rice": "🍚",
  "Chow mein & chop suey": "🥡",
  "Egg foo young": "🥚",
  "Honey garlic": "🍯",
  "Beef": "🥩",
  "Chicken": "🐔",
  "Shrimp": "🦐",
  "Noodles": "🍝",
  "Szechuan & curry": "🌶️",
  "Plain": "🥬",
  "Family dinners": "👨‍👩‍👧‍👦",
  "Combos": "🎁",
};

function spiceIndicator(level: number): string {
  return "\u{1F336}\uFE0F".repeat(level);
}

function categorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
}

function getFilteredGroupedItems(): [string, MenuItem[]][] {
  const all = getAllMenuItems();

  const filtered = all.filter(
    (item) =>
      !EXCLUDED_CATEGORY_PREFIXES.some((prefix) =>
        item.category.startsWith(prefix)
      )
  );

  const grouped = new Map<string, MenuItem[]>();
  for (const item of filtered) {
    const list = grouped.get(item.category);
    if (list) {
      list.push(item);
    } else {
      grouped.set(item.category, [item]);
    }
  }

  return [...grouped.entries()].sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function MenuPage() {
  const groups = getFilteredGroupedItems();
  const [specialOffersOpen, setSpecialOffersOpen] = useState(false);

  return (
    <>
      <Dialog open={specialOffersOpen} onOpenChange={setSpecialOffersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-headline)] text-xl italic text-secondary sm:text-2xl">
              Special offers
            </DialogTitle>
            <DialogDescription className="text-left text-[0.95rem] leading-relaxed text-muted-foreground">
              How our current deals work. Call to confirm details before you order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 font-[family-name:var(--font-body)] text-sm text-foreground">
            {SPECIAL_OFFER_SECTIONS.map((section) => (
              <section key={section.title} className="space-y-2.5">
                <h3 className="m-0 flex items-start gap-2.5 text-base font-semibold leading-tight text-secondary">
                  <span className="shrink-0 text-lg leading-none" aria-hidden>
                    {section.emoji}
                  </span>
                  {section.title}
                </h3>
                <ul className="m-0 list-none space-y-1.5 pl-0 sm:pl-[2.125rem] text-muted-foreground leading-relaxed">
                  {section.lines.map((line) => (
                    <li key={line} className="pl-0">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,440px)] gap-10 lg:gap-14 items-center">
          <div className="flex flex-col items-start gap-5">
            <div>
              <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
                Full Menu
              </p>
              <h1 className="font-[family-name:var(--font-headline)] text-[clamp(2rem,4vw,3.2rem)] font-extrabold italic text-secondary tracking-tight mb-3">
                Our Menu
              </h1>
              <p className="font-[family-name:var(--font-body)] text-lg text-muted-foreground max-w-[520px] leading-relaxed">
                Chinese &amp; Canadian favourites — take out or delivery. Call to
                order.
              </p>
            </div>
            <div className="flex w-full max-w-[520px] flex-col gap-3">
              <p className="m-0 font-[family-name:var(--font-body)] text-sm leading-relaxed text-muted-foreground">
                Delivery, pick-up deals, value lunch, and our Friday buffet — get full
                details and buffet times below.
              </p>
              <div className="w-full max-w-[520px] max-sm:grid max-sm:grid-cols-2 max-sm:items-stretch max-sm:gap-2 sm:flex sm:min-w-0 sm:flex-nowrap sm:items-center sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full min-w-0 max-sm:px-2.5 max-sm:text-xs sm:w-auto sm:shrink-0"
                  onClick={() => setSpecialOffersOpen(true)}
                >
                  Special offers
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="h-10 w-full min-w-0 p-0 sm:w-auto sm:shrink-0"
                >
                  <a
                    href="tel:+15197653184"
                    className="inline-flex h-10 w-full min-w-0 max-sm:px-1.5 max-sm:text-[0.7rem] max-sm:leading-tight items-center justify-center gap-1 text-center sm:px-6 sm:text-sm whitespace-normal! sm:whitespace-nowrap!"
                  >
                    <span aria-hidden>📞</span>
                    (519) 765-3184
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="relative w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[300px] rounded-xl overflow-hidden border border-border shadow-md">
            <iframe
              title="Map: Super Wok Restaurant, Aylmer"
              src={STORE_MAP_EMBED_URL}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Category quick-jump */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <p className="font-[family-name:var(--font-body)] text-sm text-muted-foreground mb-3">
          Jump to section:
        </p>
        <div className="flex flex-wrap gap-2">
          {groups.map(([category]) => (
            <a
              key={category}
              href={`#${categorySlug(category)}`}
              className="no-underline"
            >
              <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 hover:shadow-md">
                {category}
                <span className="text-[0.65rem] opacity-60">↓</span>
              </Badge>
            </a>
          ))}
        </div>
      </section>

      {/* Menu sections */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Accordion
          type="multiple"
          defaultValue={[]}
        >
          {groups.map(([category, items]) => (
            <AccordionItem
              key={category}
              value={categorySlug(category)}
              id={categorySlug(category)}
              className="border-b-0 mb-6 rounded-xl border border-border bg-card px-5 shadow-sm"
            >
              <AccordionTrigger className="py-2 hover:no-underline">
                <h2 className="font-[family-name:var(--font-headline)] text-[clamp(1.6rem,3vw,2.4rem)] font-bold italic text-secondary tracking-tight">
                  {CATEGORY_EMOJI[category] && (
                    <span className="mr-2 not-italic">{CATEGORY_EMOJI[category]}</span>
                  )}
                  {category}
                </h2>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {/* Grid for combo/dinner items with includes */}
                {items.some((i) => i.includes) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item) => (
                      <Card key={item.id} className="bg-[#fffef5]">
                        <CardHeader className="pb-2">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <CardTitle className="min-w-0 flex-1 break-words pr-1">{item.name}</CardTitle>
                            <span className="font-[family-name:var(--font-label)] text-base font-bold text-primary whitespace-nowrap shrink-0">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          {item.description && (
                            <CardDescription>{item.description}</CardDescription>
                          )}
                        </CardHeader>
                        {item.includes && (
                          <CardContent>
                            <ul className="list-none flex flex-col gap-[0.35rem] pl-1">
                              {item.includes.map((inc) => (
                                <li
                                  key={inc}
                                  className="font-[family-name:var(--font-body)] text-[0.85rem] text-foreground flex items-center gap-2"
                                >
                                  <span className="text-primary font-bold text-[0.8rem] shrink-0">
                                    ✓
                                  </span>
                                  {inc}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Simple list for regular items */
                  <div className="flex flex-col">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col py-2"
                      >
                        <div className="flex w-full min-w-0 items-end gap-1">
                          <span className="min-w-0 flex-[0_1_auto] break-words font-[family-name:var(--font-label)] text-[0.95rem] font-semibold text-foreground">
                            {item.name}
                            {item.spiceLevel ? (
                              <span className="ml-2 text-[0.85rem]" title={`Spice level ${item.spiceLevel}`}>
                                {spiceIndicator(item.spiceLevel)}
                              </span>
                            ) : null}
                            {item.tags?.includes("vegetarian") ? (
                              <span className="ml-1.5 text-[0.85rem]" title="Vegetarian">
                                🥬
                              </span>
                            ) : null}
                          </span>
                          <span className="mb-[0.2em] min-w-[1rem] flex-1 border-b-2 border-dotted border-secondary/40" />
                          <span className="font-[family-name:var(--font-label)] text-[0.95rem] font-bold text-primary whitespace-nowrap shrink-0">
                            {item.price === 0 ? "Free" : formatPrice(item.price)}
                          </span>
                        </div>
                        {item.description && (
                          <span className="font-[family-name:var(--font-body)] text-[0.82rem] text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* CTA */}
      <section className="bg-secondary py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,440px)] gap-10 lg:gap-14 items-center">
          <div className="flex flex-col items-start gap-5">
            <h2 className="font-[family-name:var(--font-headline)] text-[clamp(1.6rem,3vw,2.4rem)] font-bold italic text-white tracking-tight">
              Ready to Order?
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base text-white/70 max-w-[480px] leading-relaxed">
              Call us for take out or free delivery on orders over $40 before tax
              (town-limited area, cash only).
            </p>
            <p className="m-0 max-w-[520px] text-sm leading-relaxed text-white/80">
              Same special offers as on this page — full details, area limits, and buffet
              times in one place.
            </p>
            <div className="mt-1 flex w-full max-w-[520px] flex-col gap-3 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="tel:+15197653184">
                  <span>📞</span> (519) 765-3184
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full border-white/45 bg-white/5 text-white hover:border-white/55 hover:bg-white/12 sm:w-auto"
                onClick={() => setSpecialOffersOpen(true)}
              >
                Special offers
              </Button>
            </div>
          </div>
          <div className="relative w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[300px] rounded-xl overflow-hidden border border-white/10 shadow-md">
            <iframe
              title="Map: Super Wok Restaurant, Aylmer"
              src={STORE_MAP_EMBED_URL}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

    </>
  );
}
