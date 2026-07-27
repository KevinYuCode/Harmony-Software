import type { Metadata } from "next";

const MENU_URL = "https://harmonyrestaurant.ca/menu";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the full Harmony Restaurant menu — Chinese and Canadian dishes including soups, appetizers, chow mein, fried rice, chicken, beef, shrimp, noodles, Szechuan, and more. Takeout, fast food, dine-in and delivery in Tillsonburg, ON.",
  keywords: [
    "Harmony menu",
    "Chinese food menu Tillsonburg",
    "Chinese takeout menu Tillsonburg",
    "takeout Tillsonburg",
    "fast food Tillsonburg",
    "Chinese food delivery Tillsonburg",
    "chow mein Tillsonburg",
    "fried rice Tillsonburg",
    "General Tao chicken Tillsonburg",
    "sweet and sour chicken Tillsonburg",
    "beef with broccoli Tillsonburg",
    "Szechuan food Tillsonburg",
    "combination plates Tillsonburg",
    "Canadian dishes Tillsonburg restaurant",
  ],
  alternates: {
    canonical: MENU_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Harmony Restaurant",
    title: "Menu | Harmony Restaurant",
    description:
      "Full menu of Chinese and Canadian dishes. Dine in or take out in Tillsonburg, Ontario.",
    url: MENU_URL,
    images: [
      {
        url: "/Dine-1.webp",
        width: 1200,
        height: 630,
        alt: "Harmony Restaurant — Chinese & Canadian Cuisine in Tillsonburg, ON",
      },
    ],
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
