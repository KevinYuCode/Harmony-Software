import Link from "next/link";
import { DiningCarousel } from "./components/dining-carousel";
import { Button } from "@harmony/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@harmony/ui/components/card";
import { Badge } from "@harmony/ui/components/badge";
import { PRICES } from "@harmony/utils/prices";

const ctaButtonClassName =
  "h-8 min-h-0 gap-1.5 rounded-md px-3.5 text-[clamp(0.75rem,0.2rem+2.1vw,1rem)] leading-tight sm:h-9 sm:px-4 md:h-10 md:px-6";

/** Constrained main column: use full width up to max, flush with section horizontal padding. */
const sectionShell =
  "w-full min-w-0 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8";

/** One scale for the hero h1 so both lines match at every breakpoint (esp. mobile). */
const heroH1TextSize =
  "text-[clamp(1.9rem,5.2vw,3.4rem)] sm:text-[clamp(2.4rem,5.5vw,4rem)] lg:text-[clamp(2.8rem,5.5vw,4.5rem)]";
/** In-page section headings (Specials, Menu preview). */
const sectionH2TextSize = "text-[clamp(2rem,3.5vw,3rem)]";
/** About + dark CTA block title scale. */
const aboutH2TextSize = "text-[clamp(2.35rem,4.2vw,3.5rem)]";
/** Body copy inside Specials cards — one size for list items, buffet details, and descriptions. */
const specialsBodyText =
  "font-[family-name:var(--font-body)] text-sm leading-relaxed";
/** Friday Buffet detail lines — tighter line-height on small screens so blocks don’t feel overly tall. */
const specialsBuffetBodyText =
  "font-[family-name:var(--font-body)] text-sm max-sm:leading-snug sm:leading-relaxed";

const STORE_ADDRESS_LINE = "287 Talbot St W #3, Aylmer, ON N5H 1J9";
const STORE_MAP_QUERY = `${STORE_ADDRESS_LINE}, Canada`;
const STORE_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(STORE_MAP_QUERY)}&hl=en&z=16&output=embed`;
const STORE_MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`;
const STORE_PHONE_TEL = "tel:+15197653184";
const contactLinkClassName =
  "font-[family-name:var(--font-body)] text-[0.95rem] text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 rounded-sm";

/** Buffet line items — from `PRICES` (packages/utils/src/prices.ts). */
const buffetAdult = PRICES.dinner_buffet;
const buffetSeniorStudent = PRICES.student_buffet; // same as `senior_buffet` in `PRICES`

function priceParts(n: number): { dollars: string; cents: string } {
  const [d = "0", c = "00"] = n.toFixed(2).split(".");
  return { dollars: d, cents: `.${c}` };
}
function priceLabel(n: number): string {
  return `$${n.toFixed(2)}`;
}
const adultParts = priceParts(buffetAdult);
const studentsSeniorsLunchParts = priceParts(
  PRICES.students_seniors_lunch_special
);

const featureCards = [
  {
    emoji: "🍽️",
    title: "Dine In",
    description:
      "Enjoy your meal in our welcoming dining room — perfect for families and gatherings.",
  },
  {
    emoji: "📦",
    title: "Take Out",
    description:
      "10% off pick-up orders over $36 before tax. Cash only, not valid with lunch special.",
  },
  {
    emoji: "🚗",
    title: "Free Delivery",
    description:
      "Free delivery on orders over $40 before tax. Town-limited area, cash only.",
  },
] as const;

const menuItems = [
  {
    emoji: "🍜",
    name: "Chicken Chow Mein",
    description:
      "Classic stir-fried noodles with vegetables and tender chicken",
    price: "$12.30",
  },
  {
    emoji: "🍚",
    name: "Chicken Fried Rice",
    description:
      "Wok-tossed rice with egg, green onions, and house seasonings",
    price: "$12.30",
  },
  {
    emoji: "🧆",
    name: "Sweet & Sour Chicken Balls",
    description:
      "Golden crispy chicken in our signature sweet and sour sauce",
    price: "$14.00",
  },
  {
    emoji: "🍲",
    name: "Sweet & Sour Spare Ribs",
    description: "Tender ribs glazed in our bold, tangy house sauce",
    price: "$13.30",
  },
  {
    emoji: "🍗",
    name: "General Tao's Chicken",
    description:
      "Crispy chicken tossed in our bold, slightly spicy house sauce",
    price: "$15.00",
  },
  {
    emoji: "🍯",
    name: "Honey Garlic Spare Ribs",
    description:
      "Succulent ribs coated in our sweet honey garlic glaze",
    price: "$15.00",
  },
  {
    emoji: "🥦",
    name: "Beef with Broccoli",
    description:
      "Tender sliced beef stir-fried with fresh broccoli in savoury sauce",
    price: "$15.00",
  },
  {
    emoji: "🍋",
    name: "Lemon Chicken",
    description:
      "Crispy chicken drizzled with our tangy lemon sauce",
    price: "$15.00",
  },
];

export default function Home() {
  return (
    <>
      {/* Landing: nav + this block = first viewport; hero + feature cards share the height */}
      <div
        className={`flex min-h-[calc(100dvh_-_var(--nav-height))] flex-col gap-10 ${sectionShell} pt-4 pb-8 lg:pt-5 lg:pb-[17px] text-left`}
      >
        <section className="w-full min-w-0 shrink-0">
          <div className="my-10 grid w-full min-w-0 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] lg:gap-12 lg:items-stretch">
          <div className="flex w-full min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-[family-name:var(--font-label)] text-xs font-semibold text-primary uppercase tracking-[0.08em] sm:text-sm md:text-base">
                Chinese &amp; Canadian Food · L.L.B.O.
              </p>
              <h1
                className={`font-headline font-extrabold italic leading-[1.08] text-secondary tracking-tight ${heroH1TextSize}`}
              >
                <span className="whitespace-nowrap font-[Times]">
                  Authentic Flavours,
                </span>
                <br />
                <span className="text-primary relative inline-block pb-[0.16em]">
                  Right Here.
                  <span className="absolute left-0 right-0 bottom-[0.08em] h-[3px] bg-accent rounded-sm" />
                </span>
              </h1>
            </div>
            <p className="font-[family-name:var(--font-body)] w-full min-w-0 text-[1.05rem] leading-[1.7] text-[#555]">
              From classic Chinese dishes to hearty Canadian favourites — dine
              in or take out. We&apos;ve been serving Aylmer with fresh,
              flavourful food you can count on.
            </p>
            <div className="flex gap-3 flex-wrap sm:gap-4">
              <Button asChild className={ctaButtonClassName}>
                <a href={STORE_PHONE_TEL}>
                  <span>📞</span> (519) 765-3184
                </a>
              </Button>
              <Button asChild variant="secondary" className={ctaButtonClassName}>
                <a href="/menu">View Menu</a>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <Badge>
                <span aria-hidden>🍽️</span> Dine In
              </Badge>
              <Badge>
                <span aria-hidden>📦</span> Take Out
              </Badge>
              <Badge>
                <span aria-hidden>🚗</span> Free Delivery over $40
              </Badge>
              <Badge>
                <span aria-hidden>🍷</span> L.L.B.O.
              </Badge>
            </div>
          </div>
          <div className="relative w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] lg:h-full rounded-xl overflow-hidden border border-border shadow-md bg-card">
            <iframe
              title={`Map: ${STORE_ADDRESS_LINE}`}
              src={STORE_MAP_EMBED_URL}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
        </section>

        {/* Feature Bar — same first-screen block as hero */}
        <section className="w-full min-w-0 shrink-0 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {featureCards.map((item) => (
          <Card
            key={item.title}
            className="w-full min-w-0"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex w-full min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-5">
                <div className="flex w-full min-w-0 items-center gap-2.5 lg:w-auto lg:shrink-0">
                  <div
                    className="flex h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[var(--feature-icon-bg)] text-lg leading-none lg:h-14 lg:min-w-14 lg:text-2xl"
                    aria-hidden
                  >
                    {item.emoji}
                  </div>
                  <CardTitle className="min-w-0 lg:hidden">{item.title}</CardTitle>
                </div>
                <div className="min-w-0 flex w-full flex-1 flex-col gap-1">
                  <CardTitle className="min-w-0 max-lg:hidden">
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </section>
        {/* Fills remaining first-screen height below cards — keeps hero + cards top-aligned */}
        <div className="min-h-0 flex-1" aria-hidden="true" />
      </div>

      {/* Specials */}
      <section className={`${sectionShell} pt-8 pb-20`} id="specials">
        <div className="w-full min-w-0 text-left mb-12">
          <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
            Today&apos;s Deals
          </p>
          <h2
            className={`font-[family-name:var(--font-headline)] ${sectionH2TextSize} font-bold italic text-secondary tracking-tight leading-[1.15] mb-1`}
          >
            Specials &amp; Promotions
          </h2>
          <p className="font-[family-name:var(--font-body)] m-0 max-w-[480px] text-base leading-snug text-muted-foreground">
            Great value every day of the week
          </p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Students & Seniors Lunch */}
          <Card className="flex h-full min-h-0 flex-col border border-primary shadow-specials-glow hover:shadow-specials-glow-hover lg:justify-center">
            <CardHeader className="shrink-0">
              <div className="flex max-sm:flex-wrap max-sm:items-start sm:items-center gap-4">
                <div className="text-4xl leading-none shrink-0">🎓</div>
                <div>
                  <CardTitle>
                    Students &amp; Seniors Lunch Special
                  </CardTitle>
                  <CardDescription>
                    Dine in only · 11:00 am – 3:00 pm · No substitutions
                  </CardDescription>
                </div>
                <div className="ml-auto font-[family-name:var(--font-headline)] text-[2.5rem] font-extrabold text-primary leading-none whitespace-nowrap shrink-0 max-sm:ml-0">
                  ${studentsSeniorsLunchParts.dollars}
                  <span className="text-[1.2rem] align-super">
                    {studentsSeniorsLunchParts.cents}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-none flex flex-col gap-[0.45rem] pl-1">
                <li
                  className={`${specialsBodyText} text-foreground flex items-center gap-2`}
                >
                  <span className="text-primary font-bold text-sm shrink-0">
                    ✓
                  </span>
                  Sweet &amp; Sour Chicken Balls
                </li>
                <li
                  className={`${specialsBodyText} text-foreground flex items-center gap-2`}
                >
                  <span className="text-primary font-bold text-sm shrink-0">
                    ✓
                  </span>
                  Sweet &amp; Sour Spare Ribs
                </li>
                <li
                  className={`${specialsBodyText} text-foreground flex items-center gap-2`}
                >
                  <span className="text-primary font-bold text-sm shrink-0">
                    ✓
                  </span>
                  Plain Fried Rice
                </li>
                <li
                  className={`${specialsBodyText} text-foreground flex items-center gap-2`}
                >
                  <span className="text-primary font-bold text-sm shrink-0">
                    ✓
                  </span>
                  One soft drink or hot tea
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Friday Buffet */}
          <Card className="relative flex h-full min-h-0 flex-col overflow-hidden border border-primary shadow-specials-glow hover:shadow-specials-glow-hover">
            <div className="absolute top-0 right-0 bg-primary text-white font-[family-name:var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.07em] py-1.5 px-4 rounded-bl-xl">
              Every Friday
            </div>
            <CardHeader className="shrink-0">
              <div className="flex items-start gap-4 max-sm:flex-wrap">
                <div className="text-4xl leading-none shrink-0">🍽️</div>
                <div>
                  <CardTitle>Friday Buffet</CardTitle>
                  <CardDescription>
                    All-you-can-eat · Kids under 3 eat free
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col min-h-0 max-sm:items-stretch max-sm:text-left">
              <div className="flex min-h-0 flex-1 flex-col max-sm:items-stretch">
                <div className="flex w-full flex-1 flex-col max-sm:py-2.5 sm:py-4 pl-0 pr-0 text-left sm:pl-5 sm:pr-5">
                  <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-bold text-primary uppercase tracking-[0.05em] mb-0.5 sm:mb-[0.2rem]">
                    Lunch
                  </p>
                  <p
                    className={`${specialsBuffetBodyText} text-foreground`}
                  >
                    11:30 am – 1:30 pm
                  </p>
                  <div className="mt-2 sm:mt-2.5 space-y-2.5">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <span
                        className={`${specialsBuffetBodyText} font-medium text-foreground`}
                      >
                        Adult
                      </span>
                      <div className="shrink-0 text-left font-[family-name:var(--font-headline)] text-[2rem] font-extrabold text-secondary whitespace-nowrap">
                        ${adultParts.dollars}
                        <span className="text-[1.2rem] align-super">
                          {adultParts.cents}
                        </span>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border/60 pt-2.5">
                      <span
                        className={`${specialsBuffetBodyText} min-w-0 text-muted-foreground`}
                      >
                        Senior &amp; Student
                      </span>
                      <span
                        className={`${specialsBuffetBodyText} font-medium text-muted-foreground tabular-nums whitespace-nowrap`}
                      >
                        {priceLabel(buffetSeniorStudent)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-1 flex-col max-sm:py-2.5 sm:py-4 pl-0 pr-0 text-left sm:pl-5 sm:pr-5">
                  <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-bold text-primary uppercase tracking-[0.05em] mb-0.5 sm:mb-[0.2rem]">
                    Dinner
                  </p>
                  <p
                    className={`${specialsBuffetBodyText} text-foreground`}
                  >
                    5:00 pm – 8:00 pm
                  </p>
                  <div className="mt-2 sm:mt-2.5 space-y-2.5">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <span
                        className={`${specialsBuffetBodyText} font-medium text-foreground`}
                      >
                        Adult
                      </span>
                      <div className="shrink-0 text-left font-[family-name:var(--font-headline)] text-[2rem] font-extrabold text-secondary whitespace-nowrap">
                        ${adultParts.dollars}
                        <span className="text-[1.2rem] align-super">
                          {adultParts.cents}
                        </span>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border/60 pt-2.5">
                      <span
                        className={`${specialsBuffetBodyText} min-w-0 text-muted-foreground`}
                      >
                        Senior &amp; Student
                      </span>
                      <span
                        className={`${specialsBuffetBodyText} font-medium text-muted-foreground tabular-nums whitespace-nowrap`}
                      >
                        {priceLabel(buffetSeniorStudent)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deals column */}
          <div className="flex h-full min-h-0 flex-col gap-5">
            <Card className="flex min-h-0 flex-1 flex-col border border-primary shadow-specials-glow hover:shadow-specials-glow-hover">
              <CardContent className="flex flex-1 flex-col gap-3 p-6 sm:flex-row sm:items-center sm:gap-5">
                <div className="inline-flex shrink-0 max-sm:self-start items-center font-[family-name:var(--font-headline)] text-[2.5rem] font-extrabold text-primary leading-none whitespace-nowrap sm:self-center">
                  10
                  <span className="text-[1.4rem] leading-none">%</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <CardTitle>Off Pick-Up</CardTitle>
                  <CardDescription>
                    On orders over $36 before tax. Cash only. Not valid with
                    lunch special.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
            <Card className="flex min-h-0 flex-1 flex-col border border-primary shadow-specials-glow hover:shadow-specials-glow-hover">
              <CardContent className="flex flex-1 flex-col gap-3 p-6 sm:flex-row sm:items-center sm:gap-5">
                <div className="shrink-0 max-sm:self-start sm:self-center font-[family-name:var(--font-label)] text-base font-extrabold text-white bg-primary py-1.5 px-2.5 rounded-lg whitespace-nowrap tracking-[0.03em]">
                  FREE
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <CardTitle>Delivery</CardTitle>
                  <CardDescription>
                    On orders over $40 before tax. Town-limited area, cash only.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className={`${sectionShell} pt-8 pb-20`}>
        <div className="w-full min-w-0 text-left mb-8">
          <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
            Browse Our Menu
          </p>
          <h2
            className={`font-[family-name:var(--font-headline)] ${sectionH2TextSize} font-bold italic text-secondary tracking-tight leading-[1.15] mb-1`}
          >
            See What&apos;s Cooking
          </h2>
          <p className="font-[family-name:var(--font-body)] text-base text-muted-foreground max-w-[480px] m-0 leading-relaxed">
            Flip through our full menu of Chinese &amp; Canadian dishes
          </p>
        </div>
        <DiningCarousel />
      </section>

      {/* Menu Preview */}
      <section className={`${sectionShell} pt-8 pb-20`} id="menu">
        <div className="w-full min-w-0 text-center mb-12 max-w-2xl mx-auto">
          <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
            Customer Favourites
          </p>
          <h2
            className={`font-[family-name:var(--font-headline)] ${sectionH2TextSize} font-bold italic text-secondary tracking-tight leading-[1.15] mb-1`}
          >
            Popular Dishes
          </h2>
          <p className="font-[family-name:var(--font-body)] text-base text-muted-foreground max-w-[480px] mx-auto m-0 leading-relaxed text-pretty">
            A selection of our most-loved Chinese and Canadian classics
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 items-stretch w-full">
          {menuItems.map((item) => (
            <Card
              key={item.name}
              className="h-full min-h-0"
            >
              <CardHeader className="flex min-h-0 flex-1 flex-col gap-1.5 text-center pb-0">
                <div
                  className="mb-0.5 flex h-12 w-full shrink-0 items-center justify-center text-4xl leading-none"
                  aria-hidden
                >
                  {item.emoji}
                </div>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="flex-1 text-pretty">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="pt-2 text-center">
                  <span className="font-[family-name:var(--font-label)] text-base font-bold text-primary">
                    {item.price}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <Button asChild className={ctaButtonClassName}>
            <Link href="/menu">View Menu</Link>
          </Button>
        </div>
      </section>

      {/* About — dark two-tone (deeper section vs lifted card) */}
      <section className="w-full min-w-0 bg-[#1a1a1a] py-20 px-4 sm:px-6 lg:px-8" id="about">
        <div className="w-full min-w-0 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-stretch">
          <div className="flex flex-col gap-5 min-h-0">
            <p className="font-[family-name:var(--font-label)] text-[0.95rem] font-semibold text-accent-muted uppercase tracking-[0.08em] mb-2">
              About Us
            </p>
            <h2
              className={`font-[family-name:var(--font-headline)] ${aboutH2TextSize} font-bold italic text-white tracking-tight mb-3`}
            >
              A Local Favourite
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base leading-[1.75] text-white/70">
              Super Wok Restaurant has been a cornerstone of the Aylmer
              community, serving generations of families with authentic Chinese
              cuisine alongside beloved Canadian comfort food. Our kitchen
              blends tradition with fresh, local ingredients — every plate is
              made with care.
            </p>
            <p className="font-[family-name:var(--font-body)] text-base leading-[1.75] text-white/70">
              Whether you&apos;re stopping in for a weekday lunch or gathering
              with the whole family for dinner, our doors are open and the wok
              is hot.
            </p>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3">
                <span className="text-[1.1rem] text-white/85" aria-hidden>
                  📍
                </span>
                <a
                  href={STORE_MAP_OPEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClassName}
                >
                  {STORE_ADDRESS_LINE}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[1.1rem] text-white/85" aria-hidden>
                  📞
                </span>
                <a href={STORE_PHONE_TEL} className={contactLinkClassName}>
                  (519) 765-3184
                </a>
              </div>
              <div className="flex items-center gap-3 font-[family-name:var(--font-body)] text-[0.95rem] text-white/85">
                <span className="text-[1.1rem]">🍷</span>
                <span>Fully Licensed Under L.L.B.O.</span>
              </div>
              <div className="flex items-center gap-3 font-[family-name:var(--font-body)] text-[0.95rem] text-white/85">
                <span className="text-[1.1rem]">🚗</span>
                <span>Dine In, Take Out &amp; Delivery</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center w-full min-h-0 order-first lg:order-none">
            <div className="w-full h-full min-h-0 flex flex-col bg-[#2b2b2b] border border-white/[0.08] rounded-[20px] pt-9 px-8 pb-8 max-sm:bg-transparent max-sm:border-0 max-sm:rounded-none max-sm:pt-3 max-sm:px-0 max-sm:pb-0">
              <div className="text-center flex flex-col items-center gap-2.5 pb-6 max-sm:pb-5 shrink-0">
                <div className="text-6xl sm:text-7xl leading-[1.05] text-accent font-[family-name:var(--font-cjk-trad)] font-bold">
                  富食軒
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.8vw,1.85rem)] font-bold text-white leading-tight">
                    Super Wok Restaurant
                  </p>
                  <p className="font-[family-name:var(--font-body)] text-[1.05rem] sm:text-[1.1rem] text-white/65 leading-snug">
                    Chinese &amp; Canadian Cuisine
                  </p>
                </div>
              </div>
              <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-3 pt-2">
                <div className="w-full max-h-full rounded-[14px] max-sm:rounded-md overflow-hidden border border-white/10 max-sm:border-white/[0.06] aspect-video min-h-[200px] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] max-sm:shadow-none">
                  <iframe
                    title="Map: Super Wok Restaurant, Aylmer"
                    src={STORE_MAP_EMBED_URL}
                    className="w-full h-full border-0 block"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a
                  href={STORE_MAP_OPEN_URL}
                  className="font-[family-name:var(--font-label)] text-[0.8rem] font-semibold text-accent-muted underline underline-offset-[3px] transition-colors text-center self-center shrink-0 hover:text-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
