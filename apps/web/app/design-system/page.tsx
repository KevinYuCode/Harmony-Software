import { Button } from "@harmony/ui/components/button";
import { Badge } from "@harmony/ui/components/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@harmony/ui/components/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const colors = [
  { name: "Primary", var: "--primary", hex: "#d32f2f", tw: "bg-primary" },
  { name: "Primary Dark", var: "--primary-dark", hex: "#b71c1c", tw: "bg-primary-dark" },
  { name: "Secondary", var: "--secondary", hex: "#212121", tw: "bg-secondary" },
  { name: "Accent", var: "--tertiary", hex: "#ffd600", tw: "bg-accent" },
  { name: "Accent Muted", var: "--neutral", hex: "#fbc02d", tw: "bg-accent-muted" },
  { name: "Background", var: "--bg", hex: "#FFEFD5", tw: "bg-[var(--bg)]" },
  { name: "Card BG", var: "--card-bg", hex: "#fffef5", tw: "bg-card" },
  { name: "Canvas", var: "--background", hex: "#e8e0c4", tw: "bg-background" },
  { name: "Text", var: "--text", hex: "#212121", tw: "bg-foreground" },
  { name: "Text Muted", var: "--text-muted", hex: "#4a4a4a", tw: "bg-muted-foreground" },
  { name: "Border", var: "--border", hex: "#ddd2b4", tw: "bg-border" },
  { name: "Ring", var: "--ring", hex: "#d32f2f", tw: "bg-ring" },
  { name: "Muted", var: "--muted", hex: "#f5f0e0", tw: "bg-muted" },
];

const fontSamples = [
  {
    name: "Body (Plus Jakarta Sans)",
    family: "var(--font-body)",
    weights: ["400", "500", "600"],
  },
  {
    name: "Headline (Times / Serif)",
    family: "var(--font-headline)",
    weights: ["400", "700"],
  },
  {
    name: "Label (Segoe UI / System)",
    family: "var(--font-label)",
    weights: ["400", "600", "700"],
  },
  {
    name: "CJK Traditional (Noto Sans TC)",
    family: "var(--font-cjk-trad)",
    weights: ["700"],
  },
  {
    name: "Sans (Geist)",
    family: "var(--font-sans)",
    weights: ["400", "500"],
  },
];

const typographyScale = [
  { label: "Hero H1", className: "text-[clamp(1.9rem,5.2vw,3.4rem)] font-headline font-extrabold italic leading-[1.08] tracking-tight" },
  { label: "Section H2", className: "text-[clamp(2rem,3.5vw,3rem)] font-[family-name:var(--font-headline)] font-bold italic tracking-tight leading-[1.15]" },
  { label: "About H2", className: "text-[clamp(2.35rem,4.2vw,3.5rem)] font-[family-name:var(--font-headline)] font-bold italic tracking-tight" },
  { label: "Card Title", className: "text-base font-bold leading-tight tracking-tight" },
  { label: "Body", className: "text-[1.05rem] font-[family-name:var(--font-body)] leading-[1.7]" },
  { label: "Body Small", className: "text-sm font-[family-name:var(--font-body)] leading-relaxed" },
  { label: "Label", className: "text-xs font-[family-name:var(--font-label)] font-semibold uppercase tracking-[0.08em]" },
  { label: "Label (sm)", className: "text-[0.85rem] font-[family-name:var(--font-label)] font-semibold uppercase tracking-[0.08em]" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-[family-name:var(--font-headline)] text-[clamp(2rem,3.5vw,3rem)] font-bold italic text-secondary tracking-tight leading-[1.15] mb-1">
        {children}
      </h2>
      <Separator className="mt-3" />
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h3 className="text-lg font-bold tracking-tight text-secondary mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-12">
      {/* Page Header */}
      <div className="mb-16">
        <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
          Internal Reference
        </p>
        <h1 className="font-headline font-extrabold italic leading-[1.08] text-secondary tracking-tight text-[clamp(1.9rem,5.2vw,3.4rem)]">
          Design System
        </h1>
        <p className="font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.7] text-muted-foreground mt-3 max-w-[600px]">
          A quick reference for all colours, typography, and components used across the Harmony website.
        </p>
      </div>

      {/* Colours */}
      <section className="mb-20">
        <SectionTitle>Colours</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {colors.map((c) => (
            <div key={c.name} className="flex flex-col gap-2">
              <div
                className="h-20 rounded-xl border border-border shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
              <div>
                <p className="text-sm font-bold text-secondary">{c.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{c.hex}</p>
                <p className="text-xs text-muted-foreground font-mono">{c.var}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-20">
        <SectionTitle>Typography</SectionTitle>

        <SubSection title="Font Families">
          <div className="flex flex-col gap-6">
            {fontSamples.map((font) => (
              <div key={font.name} className="flex flex-col gap-2 border-b border-border/60 pb-6 last:border-0">
                <p className="text-sm font-bold text-secondary">{font.name}</p>
                <p className="text-xs text-muted-foreground font-mono mb-1">
                  font-family: {font.family}
                </p>
                <div className="flex flex-col gap-1">
                  {font.weights.map((w) => (
                    <p
                      key={w}
                      className="text-2xl"
                      style={{ fontFamily: font.family, fontWeight: Number(w) }}
                    >
                      The quick brown fox jumps over the lazy dog
                      <span className="text-sm text-muted-foreground ml-3">({w})</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Type Scale">
          <div className="flex flex-col gap-6">
            {typographyScale.map((t) => (
              <div key={t.label} className="border-b border-border/60 pb-5 last:border-0">
                <p className="text-xs text-muted-foreground font-mono mb-2">{t.label}</p>
                <p className={`text-secondary ${t.className}`}>
                  Harmony Restaurant
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </section>

      {/* Components */}
      <section className="mb-20">
        <SectionTitle>Components</SectionTitle>

        {/* Buttons */}
        <SubSection title="Buttons">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-3">Variants</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-3">Sizes</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">W</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-3">States</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Enabled</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </SubSection>

        {/* Badges */}
        <SubSection title="Badges">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </SubSection>

        {/* Cards */}
        <SubSection title="Cards">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                  A brief description of the card content goes here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-[family-name:var(--font-body)]">
                  Card body content with some example text to show spacing and typography.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>With Footer</CardTitle>
                <CardDescription>
                  Cards can include footer actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-[family-name:var(--font-body)]">
                  Some example content to demonstrate the card layout.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card className="border border-primary shadow-specials-glow">
              <CardHeader>
                <CardTitle>Specials Card</CardTitle>
                <CardDescription>
                  With primary border and glow shadow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-[family-name:var(--font-body)]">
                  Used for promotional / featured content.
                </p>
              </CardContent>
            </Card>
          </div>
        </SubSection>

        {/* Input */}
        <SubSection title="Input">
          <div className="max-w-sm space-y-3">
            <Input placeholder="Default input" />
            <Input placeholder="Disabled input" disabled />
          </div>
        </SubSection>

        {/* Separator */}
        <SubSection title="Separator">
          <div className="space-y-4 max-w-md">
            <p className="text-sm text-muted-foreground">Content above separator</p>
            <Separator />
            <p className="text-sm text-muted-foreground">Content below separator</p>
          </div>
        </SubSection>

        {/* Skeleton */}
        <SubSection title="Skeleton">
          <div className="space-y-3 max-w-sm">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </SubSection>
      </section>

      {/* Spacing & Radius */}
      <section className="mb-20">
        <SectionTitle>Border Radius</SectionTitle>
        <div className="flex flex-wrap gap-5 items-end">
          {[
            { label: "sm", class: "rounded-sm" },
            { label: "md", class: "rounded-md" },
            { label: "lg", class: "rounded-lg" },
            { label: "xl", class: "rounded-xl" },
            { label: "2xl", class: "rounded-2xl" },
            { label: "3xl", class: "rounded-3xl" },
            { label: "4xl", class: "rounded-4xl" },
          ].map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <div
                className={`h-16 w-16 border-2 border-primary bg-accent/30 ${r.class}`}
              />
              <p className="text-xs text-muted-foreground font-mono">{r.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section className="mb-20">
        <SectionTitle>Shadows</SectionTitle>
        <div className="flex flex-wrap gap-6 items-end">
          {[
            { label: "shadow-sm", class: "shadow-sm" },
            { label: "shadow-md", class: "shadow-md" },
            { label: "shadow-lg", class: "shadow-lg" },
            { label: "specials-glow", class: "shadow-specials-glow" },
            { label: "specials-glow-hover", class: "shadow-specials-glow-hover" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2">
              <div
                className={`h-20 w-28 rounded-xl bg-card border border-border ${s.class}`}
              />
              <p className="text-xs text-muted-foreground font-mono">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Patterns */}
      <section className="mb-20">
        <SectionTitle>Common Patterns</SectionTitle>

        <SubSection title="Section Header">
          <div className="max-w-lg">
            <p className="font-[family-name:var(--font-label)] text-[0.85rem] font-semibold text-primary uppercase tracking-[0.08em] mb-2">
              Overline Label
            </p>
            <h2 className="font-[family-name:var(--font-headline)] text-[clamp(2rem,3.5vw,3rem)] font-bold italic text-secondary tracking-tight leading-[1.15] mb-1">
              Section Title
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base text-muted-foreground max-w-[480px] m-0 leading-relaxed">
              A supporting description that provides additional context
            </p>
          </div>
        </SubSection>

        <SubSection title="Dark Section (About-style)">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-lg">
            <p className="font-[family-name:var(--font-label)] text-[0.95rem] font-semibold text-accent-muted uppercase tracking-[0.08em] mb-2">
              Overline Label
            </p>
            <h2 className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,3vw,2.2rem)] font-bold italic text-white tracking-tight mb-3">
              Dark Section Title
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base leading-[1.75] text-white/70">
              Body text on dark backgrounds uses white with 70% opacity for comfortable reading contrast.
            </p>
          </div>
        </SubSection>
      </section>
    </div>
  );
}
