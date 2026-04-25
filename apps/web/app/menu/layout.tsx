import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the full Super Wok Restaurant menu — Chinese and Canadian dishes including soups, appetizers, chow mein, fried rice, chicken, beef, shrimp, noodles, Szechuan, and more. Dine in or take out in Aylmer, ON.",
  openGraph: {
    title: "Menu | Super Wok Restaurant",
    description:
      "Full menu of Chinese and Canadian dishes. Dine in or take out in Aylmer, Ontario.",
    url: "https://superwokrestaurant.ca/menu",
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
