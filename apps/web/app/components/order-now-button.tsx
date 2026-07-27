"use client";

import { Phone } from "lucide-react";
import { Button } from "@harmony/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@harmony/ui/components/dropdown-menu";
import { cn } from "@/lib/utils";

const PHONE_LINES = [
  { label: "(519) 842-7007", tel: "tel:+15198427007" },
  { label: "(519) 842-2493", tel: "tel:+15198422493" },
] as const;

interface OrderNowButtonProps {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  iconClassName?: string;
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"];
  contentClassName?: string;
}

export function OrderNowButton({
  className,
  variant,
  size,
  iconClassName = "size-4 shrink-0",
  align = "end",
  contentClassName,
}: OrderNowButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Phone className={iconClassName} strokeWidth={2} aria-hidden />
          Order Now
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("z-[110]", contentClassName)}>
        {PHONE_LINES.map((line) => (
          <DropdownMenuItem
            key={line.tel}
            asChild
            className="focus:bg-muted focus:text-foreground"
          >
            <a href={line.tel}>
              <Phone className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {line.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
