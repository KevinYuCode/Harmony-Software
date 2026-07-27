import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  MapPin,
  Navigation,
  Phone,
  ShoppingBag,
  Truck,
  Utensils,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { DealsTicker } from "./components/deals-ticker";
import { BuffetCarousel } from "./components/buffet-carousel";
import { OrderNowButton } from "./components/order-now-button";
import { Button } from "@harmony/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@harmony/ui/components/card";
import { Badge } from "@harmony/ui/components/badge";
import { PRICES, DINE_IN_ITEMS } from "@harmony/utils/prices";

const ctaButtonClassName =
  "h-8 min-h-0 gap-1.5 rounded-md px-3.5 text-[clamp(0.75rem,0.2rem+2.1vw,1rem)] leading-tight sm:h-9 sm:px-4 md:h-10 md:px-6";

/** One scale for the hero h1 so both lines match at every breakpoint (esp. mobile). */
const heroH1TextSize =
  "text-[clamp(1.9rem,5.2vw,3.4rem)] sm:text-[clamp(2.4rem,5.5vw,4rem)] lg:text-[clamp(2.8rem,5.5vw,4.5rem)]";
/** In-page section headings (Specials, Menu preview). */
const sectionH2TextSize = "text-[clamp(2rem,3.5vw,3rem)]";
/** About + dark CTA block title scale. */
const aboutH2TextSize = "text-[clamp(2.35rem,4.2vw,3.5rem)]";
/** Buffet detail lines — tighter line-height on small screens so blocks don’t feel overly tall. */
const specialsBuffetBodyText =
  "font-[family-name:var(--font-body)] text-sm max-sm:leading-snug sm:leading-relaxed";
/** Buffet price rows (Adult/Kid/Senior) — same weight/size across all three, no single row emphasized. */
const buffetPriceLabelClassName = `${specialsBuffetBodyText} font-semibold text-foreground`;
const buffetPriceValueClassName = `${specialsBuffetBodyText} font-semibold text-foreground tabular-nums whitespace-nowrap`;

/** Flat line icons (neutral black) stand in for emoji outside the Popular Dishes cards. */
const badgeIconClassName = "size-3.5 shrink-0 text-secondary";
const heroBuffetBadgeClassName =
  "h-auto gap-1.5 rounded-full border-accent-muted bg-accent px-3 py-1 font-semibold text-secondary shadow-sm [&>svg]:size-3.5!";
const contactIconClassName = "size-[1.05rem] shrink-0 text-white/85";

const STORE_ADDRESS_LINE = "91 Broadway Street, Tillsonburg, ON";
const STORE_MAP_QUERY = `${STORE_ADDRESS_LINE}, Canada`;
const STORE_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(STORE_MAP_QUERY)}&hl=en&z=16&output=embed`;
const STORE_MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`;
const STORE_PHONE_TEL = "tel:+15198427007";
const STORE_PHONE_TEL_ALT = "tel:+15198422493";
const contactLinkClassName =
  "font-[family-name:var(--font-body)] text-[0.95rem] text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 rounded-sm";

/** Buffet line items — from `DINE_IN_ITEMS` (packages/utils/src/prices.ts). */
const buffetDinnerAdult = DINE_IN_ITEMS.dinner_buffet;
const buffetDinnerSenior = DINE_IN_ITEMS.senior_dinner_buffet;
const buffetDinnerKid = DINE_IN_ITEMS.kid_dinner_buffet;
const buffetLunchAdult = DINE_IN_ITEMS.lunch_buffet;
const buffetLunchSenior = DINE_IN_ITEMS.senior_lunch_buffet;
const buffetLunchKid = DINE_IN_ITEMS.kid_lunch_buffet;

function priceLabel(n: number): string {
  return `$${n.toFixed(2)}`;
}

const menuItems = [
  { id: "egg_roll", image: "/dishes/egg-roll.webp", name: "Delicious Egg Roll", description: "Crispy rolls packed with cabbage and savoury filling", price: priceLabel(PRICES.egg_roll) },
  { id: "sweet_and_sour_chicken_balls", image: "/dishes/sweet-and-sour-chicken-balls.webp", name: "Sweet and Sour Chicken Balls", description: "Golden fried chicken balls with sweet & sour sauce", price: priceLabel(PRICES.sweet_and_sour_chicken_balls) },
  { id: "wonton_soup_l", image: "/dishes/wonton-soup.webp", name: "Wonton Soup", description: "Pork wontons and BBQ pork in a savoury broth", price: priceLabel(PRICES.wonton_soup_l) },
  { id: "spring_roll", image: "/dishes/spring-roll.webp", name: "Spring Roll", description: "Light, crispy rolls with a savoury vegetable filling", price: priceLabel(PRICES.spring_roll) },
  { id: "chicken_wings", image: "/dishes/chicken-wings.webp", name: "Chicken Wings", description: "Crispy fried wings, a Harmony favourite", price: priceLabel(PRICES.chicken_wings) },
  { id: "chicken_chop_suey", image: "/dishes/chicken-chop-suey.webp", name: "Chicken Chop Suey", description: "Chicken stir-fried with bean sprouts and fresh vegetables", price: priceLabel(PRICES.chicken_chop_suey) },
  { id: "plain_lo_mein", image: "/dishes/plain-lo-mein.webp", name: "Plain Lo Mein", description: "Soft egg noodles tossed with garden vegetables", price: priceLabel(PRICES.plain_lo_mein) },
  { id: "shrimp_fried_rice", image: "/dishes/shrimp-fried-rice.webp", name: "Shrimp Fried Rice", description: "Wok-fried rice tossed with shrimp and scallions", price: priceLabel(PRICES.shrimp_fried_rice) },
  { id: "beef_shanghai", image: "/dishes/beef-shanghai.webp", name: "Beef Shanghai", description: "Thick noodles stir-fried with beef and vegetables", price: priceLabel(PRICES.beef_shanghai) },
  { id: "tai_dop_voy", image: "/dishes/tai-dop-voy.webp", name: "Tai Dop Voy", description: "Beef, chicken, shrimp and BBQ pork stir-fried with broccoli", price: priceLabel(PRICES.tai_dop_voy) },
  { id: "spicy_potato_wedges", image: "/dishes/potato-wedges.webp", name: "Spicy Potato Wedges", description: "Crispy seasoned wedges with a spicy kick", price: priceLabel(PRICES.spicy_potato_wedges) },
];

const TICKER_ITEMS = [
  { emoji: "🥡", label: "Special Combo For One", price: priceLabel(PRICES.special_combo) },
  { emoji: "📦", label: "10% off pick-up orders over $55" },
  { emoji: "🍗", label: "General Tao Chicken", price: priceLabel(PRICES.general_tao_chicken) },
  { emoji: "🌶️", label: "Kung Pao Shrimps", price: priceLabel(PRICES.kung_pao_shrimps) },
  { emoji: "🚚", label: "$6 delivery fee, town-limited area" },
  { emoji: "🍋", label: "Lemon Chicken", price: priceLabel(PRICES.lemon_chicken) },
  { emoji: "🎂", label: "Free buffet on your birthday, min. 4 dine-in" },
];

export default function Home() {
  return (
    <>
      {/* Landing: nav + this block = first viewport; hero + cards vertically centered in the column */}
      <div className="flex min-h-[calc(100dvh_-_var(--nav-height))] flex-col text-left">
        <div className="flex h-[85dvh] shrink-0 flex-col justify-center gap-10 min-h-0 max-w-[1440px] w-full mx-auto px-3 sm:px-4 lg:px-6 pt-2 pb-10 lg:pt-3 lg:pb-[25px]">
        <section className="shrink-0">
          <div className="my-10 grid w-full min-w-0 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,640px)] lg:gap-12 lg:items-stretch">
          <div className="flex w-full min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-[family-name:var(--font-label)] text-xs font-semibold text-primary uppercase tracking-[0.08em] sm:text-sm md:text-base">
                Chinese &amp; Canadian Food · L.L.B.O. · Family-Owned Since 1996
              </p>
              <h1
                className={`font-headline font-extrabold italic leading-[1.08] text-secondary tracking-tight ${heroH1TextSize}`}
              >
                <span className="whitespace-nowrap font-[Times]">
                  Tillsonburg&apos;s Local
                </span>
                <br />
                <span className="text-primary relative inline-block pb-[0.16em]">
                  Chinese Food.
                  <span className="absolute left-0 right-0 bottom-[0.08em] h-[3px] bg-accent rounded-sm" />
                </span>
              </h1>
            </div>
            <p className="font-[family-name:var(--font-body)] w-full min-w-0 text-[1.05rem] leading-[1.7] text-[#555]">
              Family-owned and serving Tillsonburg delicious Chinese food
              since 1996. From classic Chinese dishes to hearty Canadian
              favourites — dine in or take out, made fresh with care every
              time.
            </p>
            <div className="flex gap-3 flex-wrap sm:gap-4">
              <OrderNowButton
                variant="secondary"
                className={ctaButtonClassName}
                iconClassName="size-4 shrink-0"
              />
              <Button asChild className={ctaButtonClassName}>
                <a href="/menu">
                  <FileText className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  Menu
                </a>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
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
              title={`Map: ${STORE_ADDRESS_LINE}`}
              src={STORE_MAP_EMBED_URL}
              className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-0 transition-opacity duration-300 peer-hover:pointer-events-auto peer-hover:opacity-100"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
        </section>
        </div>
        <DealsTicker items={TICKER_ITEMS} className="mt-auto" />
      </div>

      {/* Specials */}
      <section
        className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pt-8 pb-20"
        id="specials"
      >
        <div className="text-left mb-12">
          <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
            Feeling Hungry
          </p>
          <h2
            className={`font-[family-name:var(--font-headline)] ${sectionH2TextSize} font-bold italic text-secondary tracking-tight leading-[1.15] mb-1`}
          >
            All-You-Can-Eat Buffet
          </h2>
          <p className="font-[family-name:var(--font-body)] m-0 max-w-[480px] text-base leading-snug text-muted-foreground">
            Lunch Sundays, dinner Friday through Sunday
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-stretch">
          <BuffetCarousel className="min-h-[280px] w-full lg:min-h-0" />
          <div className="flex flex-col gap-6">
          {/* Lunch Buffet */}
          <Card className="relative flex h-full min-h-0 flex-col overflow-hidden border border-primary shadow-specials-glow hover:shadow-specials-glow-hover">
            <div className="absolute top-0 right-0 bg-primary text-white font-[family-name:var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.07em] py-1.5 px-4 rounded-bl-xl">
              Sundays Only
            </div>
            <CardHeader className="shrink-0">
              <div className="flex items-start gap-4 max-sm:flex-wrap">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--feature-icon-bg)] text-secondary">
                  <Utensils className="size-6" strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <CardTitle>Lunch Buffet</CardTitle>
                  <CardDescription>All-you-can-eat · Kids half price</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col min-h-0 max-sm:items-stretch max-sm:text-left">
              <div className="flex min-h-0 flex-1 flex-col max-sm:items-stretch">
                <div className="flex w-full flex-1 flex-col max-sm:py-2.5 sm:py-4 pl-0 pr-0 text-left sm:pl-5 sm:pr-5">
                  <p
                    className={`${specialsBuffetBodyText} text-foreground`}
                  >
                    11:00 am – 3:00 pm
                  </p>
                  <div className="mt-2 sm:mt-2.5 space-y-2.5">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <span className={buffetPriceLabelClassName}>Adult</span>
                      <span className={buffetPriceValueClassName}>
                        {priceLabel(buffetLunchAdult)}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border/60 pt-2.5">
                      <span className={buffetPriceLabelClassName}>Kids</span>
                      <span className={buffetPriceValueClassName}>
                        {priceLabel(buffetLunchKid)}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border/60 pt-2.5">
                      <span className={buffetPriceLabelClassName}>Senior</span>
                      <span className={buffetPriceValueClassName}>
                        {priceLabel(buffetLunchSenior)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dinner Buffet */}
          <Card className="relative flex h-full min-h-0 flex-col overflow-hidden border border-primary shadow-specials-glow hover:shadow-specials-glow-hover">
            <div className="absolute top-0 right-0 bg-primary text-white font-[family-name:var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.07em] py-1.5 px-4 rounded-bl-xl">
              Fri – Sun
            </div>
            <CardHeader className="shrink-0">
              <div className="flex items-start gap-4 max-sm:flex-wrap">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--feature-icon-bg)] text-secondary">
                  <Utensils className="size-6" strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <CardTitle>Dinner Buffet</CardTitle>
                  <CardDescription>
                    All-you-can-eat · Kids half price · Free on your birthday
                    (min. 4 dine-in)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col min-h-0 max-sm:items-stretch max-sm:text-left">
              <div className="flex min-h-0 flex-1 flex-col max-sm:items-stretch">
                <div className="flex w-full flex-1 flex-col max-sm:py-2.5 sm:py-4 pl-0 pr-0 text-left sm:pl-5 sm:pr-5">
                  <p
                    className={`${specialsBuffetBodyText} text-foreground`}
                  >
                    4:00 pm – 8:00 pm
                  </p>
                  <div className="mt-2 sm:mt-2.5 space-y-2.5">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <span className={buffetPriceLabelClassName}>Adult</span>
                      <span className={buffetPriceValueClassName}>
                        {priceLabel(buffetDinnerAdult)}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border/60 pt-2.5">
                      <span className={buffetPriceLabelClassName}>Kids</span>
                      <span className={buffetPriceValueClassName}>
                        {priceLabel(buffetDinnerKid)}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border/60 pt-2.5">
                      <span className={buffetPriceLabelClassName}>Senior</span>
                      <span className={buffetPriceValueClassName}>
                        {priceLabel(buffetDinnerSenior)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </section>

      {/* Menu Preview */}
      <section className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pt-8 pb-20" id="menu">
        <div className="text-left mb-12">
          <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
            Customer Favourites
          </p>
          <h2
            className={`font-[family-name:var(--font-headline)] ${sectionH2TextSize} font-bold italic text-secondary tracking-tight leading-[1.15] mb-1`}
          >
            Popular Dishes
          </h2>
          <p className="font-[family-name:var(--font-body)] text-base text-muted-foreground max-w-[480px] m-0 leading-relaxed">
            A selection of our most-loved Chinese and Canadian classics
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={`/menu#${item.id}`}
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Card className="h-full items-center text-center transition-shadow hover:shadow-md">
                <CardHeader className="w-full items-center justify-items-center pb-2">
                  <div className="relative mb-2 size-44 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="176px"
                      className="object-contain"
                    />
                  </div>
                  <CardTitle className="line-clamp-2 min-h-11">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <span className="font-[family-name:var(--font-label)] text-base font-bold text-primary">
                    {item.price}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="flex justify-start">
          <Button asChild className={ctaButtonClassName}>
            <Link href="/menu">
              <FileText className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              Menu
            </Link>
          </Button>
        </div>
      </section>

      {/* About — dark two-tone (deeper section vs lifted card) */}
      <section className="bg-[#1a1a1a] py-20 px-3 sm:px-4 lg:px-6" id="about">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-stretch">
          <div className="flex flex-col gap-5 min-h-0">
            <p className="font-[family-name:var(--font-label)] text-[0.95rem] font-semibold text-accent-muted uppercase tracking-[0.08em] mb-2">
              About Us
            </p>
            <h2
              className={`font-[family-name:var(--font-headline)] ${aboutH2TextSize} font-bold italic text-white tracking-tight mb-3`}
            >
              A Local Favourite Since 1996
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base leading-[1.75] text-white/70">
              Family-owned and operated, Harmony Restaurant has been a
              cornerstone of the Tillsonburg community since 1996, serving
              generations of families delicious Chinese food alongside beloved
              Canadian comfort food. Our kitchen blends tradition with fresh,
              local ingredients — every plate is made with care.
            </p>
            <p className="font-[family-name:var(--font-body)] text-base leading-[1.75] text-white/70">
              Three decades in, we&apos;re still the same family behind the
              counter. Whether you&apos;re stopping in for a weekday lunch or
              gathering with the whole family for dinner, our doors are open
              and the wok is hot.
            </p>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3">
                <MapPin className={contactIconClassName} strokeWidth={1.75} aria-hidden />
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
                <Phone className={contactIconClassName} strokeWidth={1.75} aria-hidden />
                <div className="flex items-center gap-2">
                  <a href={STORE_PHONE_TEL} className={contactLinkClassName}>
                    (519) 842-7007
                  </a>
                  <span className="text-white/40">/</span>
                  <a href={STORE_PHONE_TEL_ALT} className={contactLinkClassName}>
                    (519) 842-2493
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 font-[family-name:var(--font-body)] text-[0.95rem] text-white/85">
                <Wine className={contactIconClassName} strokeWidth={1.75} aria-hidden />
                <span>Fully Licensed Under L.L.B.O.</span>
              </div>
              <div className="flex items-center gap-3 font-[family-name:var(--font-body)] text-[0.95rem] text-white/85">
                <Truck className={contactIconClassName} strokeWidth={1.75} aria-hidden />
                <span>Dine In, Take Out &amp; Delivery</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center w-full min-h-0 order-first lg:order-none">
            <div className="w-full h-full min-h-0 flex flex-col bg-[#2b2b2b] border border-white/[0.08] rounded-[20px] pt-9 px-8 pb-8 max-sm:bg-transparent max-sm:border-0 max-sm:rounded-none max-sm:pt-3 max-sm:px-0 max-sm:pb-0">
              <div className="text-center flex flex-col items-center gap-2.5 pb-6 max-sm:pb-5 shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <p className="font-[family-name:'PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] text-[clamp(2rem,4.2vw,2.75rem)] font-black text-accent leading-tight tracking-[0.15em]">
                    和諧軒
                  </p>
                  <p className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.8vw,1.85rem)] font-bold text-white leading-tight">
                    Harmony Restaurant
                  </p>
                  <p className="font-[family-name:var(--font-body)] text-[1.05rem] sm:text-[1.1rem] text-white/65 leading-snug">
                    Chinese &amp; Canadian Cuisine
                  </p>
                </div>
              </div>
              <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-3 pt-2">
                <div className="w-full max-h-full rounded-[14px] max-sm:rounded-md overflow-hidden border border-white/10 max-sm:border-white/[0.06] aspect-video min-h-[200px] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] max-sm:shadow-none">
                  <iframe
                    title="Map: Harmony Restaurant, Tillsonburg"
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
