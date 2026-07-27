import Image from "next/image";

const STORE_ADDRESS_LINE = "91 Broadway Street, Tillsonburg, ON";
const STORE_MAP_QUERY = `${STORE_ADDRESS_LINE}, Canada`;
const STORE_MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`;

export function Footer() {
  return (
    <footer className="bg-[#111] pt-16 px-3 sm:px-4 lg:px-6 pb-8" id="contact">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 font-headline text-[1.8rem] font-extrabold mb-1">
              <Image
                src="/Harmony_Logo.png"
                alt=""
                width={40}
                height={40}
                className="size-9 shrink-0"
              />
              <span className="text-white">Harmony Restaurant</span>
            </div>
            <p className="font-[family-name:var(--font-body)] text-[0.85rem] text-white/45">
              Chinese &amp; Canadian Food
            </p>
            <p className="font-[family-name:var(--font-body)] text-[0.85rem] text-white/45">
              Fully Licensed Under L.L.B.O.
            </p>
            <a
              href="tel:+15198427007"
              className="inline-block mt-2 font-[family-name:var(--font-label)] text-[1.05rem] font-semibold text-accent-muted transition-colors hover:text-accent"
            >
              📞 (519) 842-7007
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
              <span>Sun – Thu</span>
              <span>11:30 am – 8:00 pm</span>
              <span>Fri &amp; Sat</span>
              <span>11:30 am – 9:00 pm</span>
            </div>
            <p className="font-[family-name:var(--font-body)] text-[0.75rem] text-white/35 italic">
              *Most Mondays are closed — call ahead to confirm.
            </p>
          </div>
          <div>
            <h4 className="font-[family-name:var(--font-headline)] text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/35 mb-4">
              Great Value
            </h4>
            <ul className="list-none flex flex-col gap-[0.65rem] font-[family-name:var(--font-body)] text-[0.88rem] text-white/65">
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  🍽️
                </span>
                <span>All-you-can-eat buffet available</span>
              </li>
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  📦
                </span>
                <span>10% off pick-up over $55</span>
              </li>
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  🚗
                </span>
                <span>$6 in-town delivery fee</span>
              </li>
              <li className="flex items-start gap-[0.6rem]">
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  🎂
                </span>
                <span>Free buffet on your birthday (min party of 4)</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.07] pt-6">
          <p className="font-[family-name:var(--font-body)] text-[0.78rem] text-white/25 text-left">
            © {new Date().getFullYear()} Harmony Restaurant. All rights
            reserved. ·{" "}
            <a
              href={STORE_MAP_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/25 hover:text-white/50 transition-colors"
            >
              91 Broadway Street, Tillsonburg, ON
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
