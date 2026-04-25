import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://superwokrestaurant.ca";
const SITE_NAME = "Super Wok Restaurant";
const SITE_DESCRIPTION =
  "Super Wok Restaurant in Aylmer, Ontario serves authentic Chinese and Canadian cuisine. Dine in, take out, or get free delivery on orders over $40. Friday all-you-can-eat buffet. Call (519) 765-3184.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Chinese & Canadian Food | Aylmer, ON`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Chinese restaurant Aylmer",
    "Canadian food Aylmer",
    "Super Wok Restaurant",
    "Chinese food Aylmer Ontario",
    "restaurant Aylmer ON",
    "Friday buffet Aylmer",
    "take out Aylmer",
    "delivery Aylmer Ontario",
    "L.L.B.O. restaurant Aylmer",
    "287 Talbot St Aylmer",
  ],
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Chinese & Canadian Food | Aylmer, ON`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/Dine-1.webp",
        width: 1200,
        height: 630,
        alt: "Super Wok Restaurant — Chinese & Canadian Cuisine in Aylmer, ON",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Chinese & Canadian Food | Aylmer, ON`,
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
  name: "Super Wok Restaurant",
  alternateName: "Super Wok",
  url: SITE_URL,
  telephone: "+15197653184",
  servesCuisine: ["Chinese", "Canadian"],
  priceRange: "$$",
  hasMenu: `${SITE_URL}/menu`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "287 Talbot St W #3",
    addressLocality: "Aylmer",
    addressRegion: "ON",
    postalCode: "N5H 1J9",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 42.7726,
    longitude: -80.9845,
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Dine-in", value: true },
    { "@type": "LocationFeatureSpecification", name: "Takeout", value: true },
    { "@type": "LocationFeatureSpecification", name: "Delivery", value: true },
    { "@type": "LocationFeatureSpecification", name: "Alcohol", value: true },
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
          <div className="flex w-full min-w-0 min-h-screen flex-col bg-[var(--bg)] text-left">
            <Navbar />
            {children}
            <Footer />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
