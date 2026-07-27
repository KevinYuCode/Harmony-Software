"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@harmony/ui/components/button";
import type { MenuItem } from "@harmony/utils/menu";
import { useOrderList } from "@/app/components/order-list/order-list-context";
import { cn } from "@/lib/utils";

interface OrderListItemControlProps {
  item: MenuItem;
  className?: string;
}

/** Add-to-list button that swaps into a quantity stepper once the item has been added. */
export function OrderListItemControl({ item, className }: OrderListItemControlProps) {
  const { getQuantity, incrementQuantity, decrementQuantity } = useOrderList();
  const quantity = getQuantity(item.id);

  if (quantity === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="xs"
        className={cn(
          "cursor-pointer border-accent-muted bg-accent text-accent-foreground hover:bg-accent/80",
          className
        )}
        onClick={() => incrementQuantity(item)}
      >
        <Plus className="size-3.5" />
        Add to list
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 py-0.5 pl-1 pr-2 dark:border-sky-800 dark:bg-sky-950",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Decrease quantity of ${item.name}`}
        className="cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900"
        onClick={() => decrementQuantity(item.id)}
      >
        <Minus className="size-3 text-sky-700 dark:text-sky-300" />
      </Button>
      <span className="min-w-3.5 text-center text-xs font-bold text-sky-700 dark:text-sky-300">
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Increase quantity of ${item.name}`}
        className="cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900"
        onClick={() => incrementQuantity(item)}
      >
        <Plus className="size-3 text-sky-700 dark:text-sky-300" />
      </Button>
      <span className="text-xs font-medium text-sky-700 dark:text-sky-300">on your list</span>
    </div>
  );
}
