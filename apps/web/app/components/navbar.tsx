"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@harmony/ui/components/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
] as const;

function MobileMenuButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpenMobile(true)}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-secondary ring-offset-background transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Open menu"
    >
      <span
        className="flex w-4 flex-col justify-center gap-[3px]"
        aria-hidden
      >
        <span className="h-0.5 w-full rounded-full bg-secondary" />
        <span className="h-0.5 w-full rounded-full bg-secondary" />
        <span className="h-0.5 w-full rounded-full bg-secondary" />
      </span>
    </button>
  );
}

function AppMobileSidebar() {
  const { setOpenMobile } = useSidebar();

  const close = () => setOpenMobile(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpenMobile(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setOpenMobile]);

  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="border-0"
    >
      <SidebarHeader className="shrink-0 border-b border-sidebar-border px-4 py-0 sm:px-6">
        <div className="flex h-[var(--nav-height)] items-center justify-between">
          <span className="font-[family-name:var(--font-headline)] text-[1.25rem] font-extrabold tracking-tight text-secondary">
            Menu
          </span>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary ring-offset-background transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close menu"
          >
            <X className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0 px-4 py-2 sm:px-6">
              {navLinks.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    size="lg"
                    className="h-auto min-h-12 rounded-none border-b border-sidebar-border/60 py-4 pr-0 pl-0 text-xl font-bold tracking-tight data-active:bg-sidebar-accent/50"
                    render={
                      <Link
                        href={item.href}
                        onClick={close}
                        className="font-[family-name:var(--font-headline)] text-secondary"
                      >
                        {item.label}
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-4 sm:px-6 sm:py-6">
        <Button asChild className="w-full" size="lg">
          <Link href="/menu" onClick={close}>
            Order Now
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function Navbar() {
  return (
    <SidebarProvider
      defaultOpen={false}
      className="!flex !min-h-0 !w-full !flex-col group/sidebar-wrapper"
    >
      <AppMobileSidebar />
      <header className="sticky top-0 z-100 shrink-0 bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur border-b border-border">
        <div className="w-full min-w-0 max-w-[1200px] mx-auto flex h-[var(--nav-height)] items-center justify-between gap-x-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-headline)] text-[1.5rem] font-extrabold tracking-tight whitespace-nowrap min-w-0 md:text-[2rem]"
          >
            <span className="text-secondary">Super</span>
            <span className="text-primary"> Wok</span>
          </Link>

          <div className="hidden md:block">
            <Button asChild size="sm">
              <Link href="/menu">Order Now</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <MobileMenuButton />
          </div>
        </div>
      </header>
    </SidebarProvider>
  );
}
