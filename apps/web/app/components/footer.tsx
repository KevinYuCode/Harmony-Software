import { PRICES } from "@harmony/utils/prices";

const STORE_ADDRESS_LINE = "287 Talbot St W #3, Aylmer, ON N5H 1J9";
/** Lowest published buffet price — from `PRICES` (same source as the home / menu). */
const lowestBuffetPrice = Math.min(
  PRICES.dinner_buffet,
  PRICES.student_buffet,
  PRICES.senior_buffet
);
const lowestBuffetLabel = `$${lowestBuffetPrice.toFixed(2)}`;
const STORE_MAP_QUERY = `${STORE_ADDRESS_LINE}, Canada`;
const STORE_MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`;

export function Footer() {
  return (
    <footer className="w-full min-w-0 bg-[#111] pt-16 px-4 sm:px-6 lg:px-8 pb-8" id="contact">
      <div className="w-full min-w-0 max-w-[1200px] mx-auto flex flex-col gap-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="flex flex-col gap-2">
            <div className="font-headline text-[1.8rem] font-extrabold mb-1">
              <span className="text-white">Super</span>
              <span className="text-primary"> Wok</span>
            </div>
            <p className="font-[family-name:var(--font-body)] text-[0.85rem] text-white/45">
              Chinese &amp; Canadian Food
            </p>
            <p className="font-[family-name:var(--font-body)] text-[0.85rem] text-white/45">
              Fully Licensed Under L.L.B.O.
            </p>
            <a
              href="tel:+15197653184"
              className="inline-block mt-2 font-[family-name:var(--font-label)] text-[1.05rem] font-semibold text-accent-muted transition-colors hover:text-accent"
            >
              📞 (519) 765-3184
            </a>
            <a
              href={STORE_MAP_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-body)] text-[0.85rem] text-white/50 mt-[0.15rem] transition-colors hover:text-white/80"
            >
              📍 {STORE_ADDRESS_LINE}
            </a>
          </div>
          <div>
            <h4 className="font-[family-name:var(--font-headline)] text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/35 mb-4">
              Business Hours
            </h4>
            <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-[0.4rem] font-[family-name:var(--font-body)] text-[0.85rem] text-white/70 mb-3">
              <span>Monday</span>
              <span>Closed*</span>
              <span>Tue – Thu</span>
              <span>11:00 am – 9:00 pm</span>
              <span>Fri &amp; Sat</span>
              <span>11:00 am – 10:00 pm</span>
              <span>Sunday</span>
              <span>11:00 am – 9:00 pm</span>
            </div>
            <p className="font-[family-name:var(--font-body)] text-[0.75rem] text-white/35 italic">
              *Open holiday Mondays: 4:00 pm – 9:00 pm
            </p>
          </div>
          <div>
            <h4 className="font-[family-name:var(--font-headline)] text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/35 mb-4">
              Great Value
            </h4>
            <ul className="list-none flex flex-col gap-[0.65rem] font-[family-name:var(--font-body)] text-[0.88rem] text-white/65">
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  🎓
                </span>
                <span>{`Students & Seniors Lunch $${PRICES.students_seniors_lunch_special.toFixed(2)}`}</span>
              </li>
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  🍽️
                </span>
                <span>Friday buffet from {lowestBuffetLabel}</span>
              </li>
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  📦
                </span>
                <span>10% off pick-up over $36</span>
              </li>
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  🚗
                </span>
                <span>Free delivery over $40</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.07] pt-6">
          <p className="font-[family-name:var(--font-body)] text-[0.78rem] text-white/25 text-left">
            © {new Date().getFullYear()} Super Wok Restaurant. All rights
            reserved. ·{" "}
            <a
              href={STORE_MAP_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/25 hover:text-white/50 transition-colors"
            >
              287 Talbot St. W, Aylmer, ON
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
