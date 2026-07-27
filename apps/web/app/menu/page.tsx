"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Navigation,
  ShoppingBag,
  Tag,
  Truck,
  Utensils,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
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
import { DINE_IN_ITEMS } from "@harmony/utils/prices";
import { ComboBuilder } from "@/app/components/combo-builder";
import { OrderNowButton } from "@/app/components/order-now-button";

const STORE_ADDRESS_LINE = "91 Broadway Street, Tillsonburg, ON";
const STORE_MAP_QUERY = `${STORE_ADDRESS_LINE}, Canada`;
const STORE_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(STORE_MAP_QUERY)}&hl=en&z=16&output=embed`;
const STORE_MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`;

/** Matches the home page hero badge row (see badgeIconClassName/heroBuffetBadgeClassName in app/page.tsx). */
const badgeIconClassName = "size-3.5 shrink-0 text-secondary";
const heroBuffetBadgeClassName =
  "h-auto gap-1.5 rounded-full border-accent-muted bg-accent px-3 py-1 font-semibold text-secondary shadow-sm [&>svg]:size-3.5!";

/** Categories to exclude from the public menu page. */
const EXCLUDED_CATEGORY_PREFIXES = ["Extras"];

/** Display order for categories. Unlisted categories appear at the end. */
const CATEGORY_ORDER = [
  "Special Combo",
  "Appetizers",
  "Soups",
  "Sweet and Sour",
  "Chop Suey",
  "Honey Garlic",
  "Fried Rice",
  "Vegetable Almond",
  "Lo Mein",
  "Egg Fu Young",
  "Curry",
  "Szechuan",
  "Seafood",
  "Popular Suggestions",
  "Chef Suggestions",
  "Canadian Dishes",
  "Family Meals",
];

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/** Shown in the “Special offers” dialog — keep in sync with the home page Specials; prices from `DINE_IN_ITEMS` (packages/utils/src/prices.ts). */
const SPECIAL_OFFER_SECTIONS = [
  {
    emoji: "💰",
    title: "10% off pick-up",
    lines: ["On pick-up orders over $55 before tax. Cash only."],
  },
  {
    emoji: "🚗",
    title: "Delivery",
    lines: ["$6 delivery fee within our limited delivery area."],
  },
  {
    emoji: "🍽️",
    title: "All-you-can-eat buffet",
    priceGroups: [
      {
        label: "Lunch",
        detail: "Sun only, 11:30 am – 2:30 pm",
        prices: [
          { name: "Adult", price: DINE_IN_ITEMS.lunch_buffet },
          { name: "Senior", price: DINE_IN_ITEMS.senior_lunch_buffet },
          { name: "Kids", price: DINE_IN_ITEMS.kid_lunch_buffet },
        ],
      },
      {
        label: "Dinner",
        detail: "Fri – Sun, 4:30 pm – 8:30 pm",
        prices: [
          { name: "Adult", price: DINE_IN_ITEMS.dinner_buffet },
          { name: "Senior", price: DINE_IN_ITEMS.senior_dinner_buffet },
          { name: "Kids", price: DINE_IN_ITEMS.kid_dinner_buffet },
        ],
      },
    ],
  },
  {
    emoji: "🎂",
    title: "Birthday buffet",
    lines: ["Free buffet on your birthday (minimum 4 people dine-in)."],
  },
] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  "Special Combo": "🍱",
  "Appetizers": "🥟",
  "Soups": "🍜",
  "Sweet and Sour": "🍋",
  "Chop Suey": "🥡",
  "Honey Garlic": "🍯",
  "Fried Rice": "🍚",
  "Vegetable Almond": "🥦",
  "Lo Mein": "🍝",
  "Egg Fu Young": "🥚",
  "Curry": "🍛",
  "Szechuan": "🌶️",
  "Seafood": "🦐",
  "Popular Suggestions": "⭐",
  "Chef Suggestions": "👨‍🍳",
  "Canadian Dishes": "🍟",
  "Family Meals": "👨‍👩‍👧‍👦",
};

function spiceIndicator(level: number): string {
  return "\u{1F336}️".repeat(level);
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
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  /** Deep link from Popular Dishes (home page) — /menu#<item.id> opens that item's category and scrolls to it. */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const item = groups
      .flatMap(([, items]) => items)
      .find((i) => i.id === hash);
    if (!item) return;
    setOpenCategories((prev) =>
      prev.includes(categorySlug(item.category))
        ? prev
        : [...prev, categorySlug(item.category)]
    );
    // Wait for the accordion's expand animation before scrolling.
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Dialog open={specialOffersOpen} onOpenChange={setSpecialOffersOpen}>
        <DialogContent className="max-w-3xl! max-h-[90vh]! overflow-y-auto p-6!">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-headline)] text-2xl italic text-secondary sm:text-3xl">
              Special offers
            </DialogTitle>
            <DialogDescription className="text-left text-base leading-relaxed text-muted-foreground">
              How our current deals work. Call to confirm details before you order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 font-[family-name:var(--font-body)] text-base text-foreground">
            {SPECIAL_OFFER_SECTIONS.map((section) => (
              <section key={section.title} className="space-y-2">
                <h3 className="m-0 flex items-start gap-2.5 text-lg font-semibold leading-tight text-secondary">
                  <span className="shrink-0 text-xl leading-none" aria-hidden>
                    {section.emoji}
                  </span>
                  {section.title}
                </h3>
                {"priceGroups" in section ? (
                  <div className="space-y-3 pl-0 sm:pl-[2.125rem]">
                    {section.priceGroups.map((group) => (
                      <div key={group.label}>
                        <p className="m-0 text-[0.95rem] text-foreground">
                          <span className="font-medium">{group.label}</span>{" "}
                          <span className="text-muted-foreground">({group.detail})</span>
                        </p>
                        <p className="m-0 flex flex-wrap gap-x-1.5 text-[0.95rem] text-muted-foreground">
                          {group.prices.map((p, i) => (
                            <span key={p.name}>
                              {p.name} {formatPrice(p.price)}
                              {i < group.prices.length - 1 && " ·"}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="m-0 list-none space-y-1.5 pl-0 sm:pl-[2.125rem] text-[0.95rem] text-muted-foreground leading-relaxed">
                    {section.lines.map((line) => (
                      <li key={line} className="pl-0">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <section className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,640px)] lg:gap-12 lg:items-stretch">
          <div className="flex flex-col items-start gap-5">
            <div>
              <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
                Full Menu
              </p>
              <h1 className="font-[family-name:var(--font-headline)] text-[clamp(2rem,4vw,3.2rem)] font-extrabold italic text-secondary tracking-tight mb-3">
                Our Menu
              </h1>
              <p className="font-[family-name:var(--font-body)] text-lg text-muted-foreground max-w-[520px] leading-relaxed">
                Family-owned since 1996 — Chinese &amp; Canadian favourites made
                fresh for dine in, take out, or delivery. Call to order.
              </p>
            </div>
            <div className="flex w-full max-w-[520px] flex-col gap-3">
              <div className="w-full max-w-[520px] max-sm:grid max-sm:grid-cols-2 max-sm:items-stretch max-sm:gap-2 sm:flex sm:min-w-0 sm:flex-nowrap sm:items-center sm:gap-2">
                <OrderNowButton
                  size="lg"
                  variant="secondary"
                  className="h-10 w-full min-w-0 max-sm:px-2.5 max-sm:text-xs sm:w-auto sm:shrink-0"
                  iconClassName="size-4 shrink-0"
                />
                <Button
                  type="button"
                  className="h-10 w-full min-w-0 max-sm:px-2.5 max-sm:text-xs sm:w-auto sm:shrink-0"
                  onClick={() => setSpecialOffersOpen(true)}
                >
                  <Tag className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  Deals
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={heroBuffetBadgeClassName}>
                <UtensilsCrossed className={badgeIconClassName} aria-hidden />
                All-You-Can-Eat Buffet
              </Badge>
              <Badge variant="outline" className={heroBuffetBadgeClassName}>
                <Utensils className={badgeIconClassName} aria-hidden />
                Dine In
              </Badge>
              <Badge variant="outline" className={heroBuffetBadgeClassName}>
                <ShoppingBag className={badgeIconClassName} aria-hidden />
                Take Out
              </Badge>
              <Badge variant="outline" className={heroBuffetBadgeClassName}>
                <Truck className={badgeIconClassName} aria-hidden />
                $6 In-Town Delivery Fee
              </Badge>
              <Badge variant="outline" className={heroBuffetBadgeClassName}>
                <Wine className={badgeIconClassName} aria-hidden />
                L.L.B.O.
              </Badge>
            </div>
          </div>
          <div className="relative w-full min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] lg:h-full rounded-xl overflow-hidden border border-border shadow-md bg-card">
            <Image
              src="/harmony-front.webp"
              alt="The front of Harmony Restaurant on Broadway Street in Tillsonburg"
              fill
              priority
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
            <a
              href={STORE_MAP_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="peer absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-secondary shadow-md backdrop-blur transition-all duration-300 ease-out hover:bg-white hover:scale-95 hover:shadow-sm"
            >
              <Navigation className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Directions
            </a>
            <iframe
              title="Map: Harmony Restaurant, Tillsonburg"
              src={STORE_MAP_EMBED_URL}
              className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-0 transition-opacity duration-300 peer-hover:pointer-events-auto peer-hover:opacity-100"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Category quick-jump */}
      <section className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pb-8">
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
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pb-20">
        <Accordion
          type="multiple"
          value={openCategories}
          onValueChange={setOpenCategories}
        >
          {groups.map(([category, items]) => (
            <AccordionItem
              key={category}
              value={categorySlug(category)}
              id={categorySlug(category)}
              className="scroll-mt-[var(--nav-height)] border-b-0 mb-6 rounded-xl border border-border bg-card px-5 shadow-sm"
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
                {category === "Special Combo" && items[0] ? (
                  <Card className="bg-[#fffef5] ring-0">
                    <CardHeader className="pb-2">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <CardTitle className="min-w-0 flex-1 break-words pr-1">
                          {items[0].name}
                        </CardTitle>
                        <span className="font-[family-name:var(--font-label)] text-base font-bold text-primary whitespace-nowrap shrink-0">
                          {formatPrice(items[0].price)}
                        </span>
                      </div>
                      {items[0].description && (
                        <CardDescription>{items[0].description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ComboBuilder item={items[0]} />
                    </CardContent>
                  </Card>
                ) : /* Grid for combo/dinner items with includes */
                items.some((i) => i.includes) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        id={item.id}
                        className="scroll-mt-[var(--nav-height)] bg-[#fffef5]"
                      >
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
                        id={item.id}
                        className="scroll-mt-[var(--nav-height)] flex flex-col py-2"
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
      <section className="bg-secondary py-16 px-3 sm:px-4 lg:px-6">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,440px)] gap-10 lg:gap-14 items-center">
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
              <Button asChild size="lg" className="h-10 w-full rounded-md px-6 sm:w-auto">
                <a href="tel:+15198427007">
                  <span>📞</span> (519) 842-7007
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10 w-full rounded-md px-6 border-white/45 bg-white/5 text-white hover:border-white/55 hover:bg-white/12 sm:w-auto"
                onClick={() => setSpecialOffersOpen(true)}
              >
                Special offers
              </Button>
            </div>
          </div>
          <div className="relative w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[300px] rounded-xl overflow-hidden border border-white/10 shadow-md">
            <iframe
              title="Map: Harmony Restaurant, Tillsonburg"
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
