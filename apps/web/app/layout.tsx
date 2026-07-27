import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { OrderListProvider } from "@/app/components/order-list/order-list-context";
import { OrderListButton } from "@/app/components/order-list/order-list-button";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://harmonyrestaurant.ca";
const SITE_NAME = "Harmony Restaurant";
const SITE_DESCRIPTION =
  "Harmony Restaurant serves Tillsonburg's favourite Chinese food since 1996 — takeout, fast food, dine-in and delivery in Tillsonburg, Ontario, plus an all-you-can-eat buffet. Order at (519) 842-7007.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Chinese Food Takeout & Delivery | Tillsonburg, ON`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Chinese food Tillsonburg",
    "Tillsonburg Chinese food",
    "Chinese restaurant Tillsonburg",
    "Chinese takeout Tillsonburg",
    "takeout Tillsonburg",
    "fast food Tillsonburg",
    "Chinese food delivery Tillsonburg",
    "food delivery Tillsonburg",
    "delivery Tillsonburg Ontario",
    "Chinese food Tillsonburg Ontario",
    "Harmony Restaurant",
    "Harmony Chinese Food Restaurant",
    "Canadian food Tillsonburg",
    "restaurant Tillsonburg ON",
    "buffet Tillsonburg",
    "all you can eat buffet Tillsonburg",
    "Friday buffet Tillsonburg",
    "L.L.B.O. restaurant Tillsonburg",
    "91 Broadway St Tillsonburg",
    "Tillsonburg Ontario restaurant",
    "Chinese food near me",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Chinese Food Takeout & Delivery | Tillsonburg, ON`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/Dine-1.webp",
        width: 1200,
        height: 630,
        alt: "Harmony Restaurant — Chinese & Canadian Cuisine in Tillsonburg, ON",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Chinese Food Takeout & Delivery | Tillsonburg, ON`,
    description: SITE_DESCRIPTION,
    images: ["/Dine-1.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  other: {
    "geo.region": "CA-ON",
    "geo.placename": "Tillsonburg",
    "geo.position": "42.8667;-80.7333",
    ICBM: "42.8667, -80.7333",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": `${SITE_URL}/#restaurant`,
  name: "Harmony Restaurant",
  alternateName: ["Harmony", "Harmony Chinese Food Restaurant", "和諧軒"],
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  telephone: "+15198427007",
  servesCuisine: ["Chinese", "Canadian"],
  priceRange: "$$",
  hasMenu: `${SITE_URL}/menu`,
  menu: `${SITE_URL}/menu`,
  foundingDate: "1996",
  keywords:
    "Chinese food, takeout, fast food, delivery, dine-in, all-you-can-eat buffet, Tillsonburg, Ontario",
  address: {
    "@type": "PostalAddress",
    streetAddress: "91 Broadway Street",
    addressLocality: "Tillsonburg",
    addressRegion: "ON",
    postalCode: "N4G 3P5",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 42.8667,
    longitude: -80.7333,
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Dine-in", value: true },
    { "@type": "LocationFeatureSpecification", name: "Takeout", value: true },
    { "@type": "LocationFeatureSpecification", name: "Delivery", value: true },
    { "@type": "LocationFeatureSpecification", name: "Alcohol", value: true },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Sunday"],
      opens: "11:30",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Friday", "Saturday"],
      opens: "11:30",
      closes: "21:00",
    },
  ],
  areaServed: {
    "@type": "City",
    name: "Tillsonburg",
    addressRegion: "ON",
    addressCountry: "CA",
  },
  paymentAccepted: "Cash",
  currenciesAccepted: "CAD",
  sameAs: [
    "https://www.yelp.com/biz/harmony-chinese-food-restaurant-tillsonburg",
    "https://www.tripadvisor.com/Restaurant_Review-g499299-d769594-Reviews-Harmony_Restaurant-Tillsonburg_Ontario.html",
    "https://www.yellowpages.ca/bus/Ontario/Tillsonburg/Harmony-Chinese-Restaurant/2722098.html",
  ],
  image: [
    `${SITE_URL}/Dine-1.webp`,
    `${SITE_URL}/Dine-2.webp`,
    `${SITE_URL}/Dine-3.webp`,
    `${SITE_URL}/Dine-4.webp`,
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={jakarta.variable}>
        <TooltipProvider>
          <OrderListProvider>
            <div className="flex flex-col min-h-screen bg-[var(--bg)] text-left">
              <Navbar />
              {children}
              <Footer />
            </div>
            <OrderListButton />
          </OrderListProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
