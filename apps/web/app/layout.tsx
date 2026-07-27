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
  "Harmony Restaurant in Tillsonburg, Ontario serves authentic Chinese food and Canadian cuisine. Craving Chinese food in Tillsonburg? Dine in, take out, or get free delivery on orders over $40. Friday all-you-can-eat buffet. Call (519) 842-7007.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Chinese & Canadian Food | Tillsonburg, ON`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Chinese restaurant Tillsonburg",
    "Canadian food Tillsonburg",
    "Harmony Restaurant",
    "Chinese food Tillsonburg Ontario",
    "restaurant Tillsonburg ON",
    "Friday buffet Tillsonburg",
    "take out Tillsonburg",
    "delivery Tillsonburg Ontario",
    "L.L.B.O. restaurant Tillsonburg",
    "91 Broadway St Tillsonburg",
    "all you can eat Tillsonburg",
    "Chinese food delivery Tillsonburg",
    "Tillsonburg Ontario restaurant",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Chinese & Canadian Food | Tillsonburg, ON`,
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
    title: `${SITE_NAME} — Chinese & Canadian Food | Tillsonburg, ON`,
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Harmony Restaurant",
  alternateName: "Harmony",
  url: SITE_URL,
  telephone: "+15198427007",
  servesCuisine: ["Chinese", "Canadian"],
  priceRange: "$$",
  hasMenu: `${SITE_URL}/menu`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "91 Broadway Street",
    addressLocality: "Tillsonburg",
    addressRegion: "ON",
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
