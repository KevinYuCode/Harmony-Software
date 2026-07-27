"use client";

import { useState } from "react";
import { ClipboardList, Minus, Plus, RotateCcw, StickyNote, Trash2, XIcon } from "lucide-react";
import { Button } from "@harmony/ui/components/button";
import { Badge } from "@harmony/ui/components/badge";
import { Textarea } from "@harmony/ui/components/textarea";
import { ScrollArea } from "@harmony/ui/components/scroll-area";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@harmony/ui/components/popover";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@harmony/ui/components/alert-dialog";
import { useOrderList, type OrderListItem } from "@/app/components/order-list/order-list-context";

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function OrderListButton() {
  const {
    items,
    totalCount,
    totalPrice,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    updateNotes,
    clearAll,
  } = useOrderList();
  const [open, setOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [notesOpenFor, setNotesOpenFor] = useState<string | null>(null);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open your order list"
            className="fixed bottom-4 right-4 z-[120] size-11 cursor-pointer rounded-full border-border bg-card text-foreground shadow-sm transition-transform duration-200 ease-out hover:translate-y-px hover:bg-card hover:shadow-sm sm:bottom-6 sm:right-6 sm:size-14"
          >
            <ClipboardList className="size-5! sm:size-6!" />
            {totalCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full border-sky-600 bg-sky-500 px-1 text-[0.6rem] text-white shadow-sm sm:-top-1.5 sm:-right-1.5 sm:h-5 sm:min-w-5 sm:text-[0.7rem]">
                {totalCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={12}
          onInteractOutside={(e) => e.preventDefault()}
          className="w-[calc(100vw-2.5rem)] max-w-sm p-0 sm:w-96"
        >
          <PopoverHeader className="gap-1 p-3 pb-2.5">
            <PopoverTitle className="flex items-center justify-between text-base">
              Your order list
              <div className="flex items-center gap-0.5">
                {items.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setClearConfirmOpen(true)}
                  >
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                )}
                <PopoverClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Close your order list"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </PopoverClose>
              </div>
            </PopoverTitle>
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-2.5 py-2 text-xs leading-snug text-destructive">
              This isn&apos;t online ordering — it&apos;s just a list to help you keep track of
              what you want. Call the restaurant to actually place your order.
            </p>
          </PopoverHeader>

          {items.length === 0 ? (
            <p className="p-4 pt-0 text-sm text-muted-foreground">
              Nothing here yet. Browse the menu and tap &ldquo;Add to list&rdquo; on any dish.
            </p>
          ) : (
            <>
              <ScrollArea className="max-h-80 border-t border-border px-3">
                <ul className="flex flex-col divide-y divide-border">
                  {items.map((item) => (
                    <OrderListRow
                      key={item.id}
                      item={item}
                      isEditingNotes={notesOpenFor === item.id}
                      onToggleNotes={() =>
                        setNotesOpenFor((current) => (current === item.id ? null : item.id))
                      }
                      onRemove={() => removeItem(item.id)}
                      onIncrement={() => incrementQuantity(item)}
                      onDecrement={() => decrementQuantity(item.id)}
                      onNotesChange={(notes) => updateNotes(item.id, notes)}
                    />
                  ))}
                </ul>
              </ScrollArea>
              <div className="flex flex-col gap-0.5 border-t border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
                <p className="text-[0.7rem] leading-snug text-muted-foreground">
                  Approximate — final pricing is set by the restaurant when you call in your
                  order.
                </p>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your order list?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every item and note you&apos;ve added on this device. This can&apos;t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                clearAll();
                setClearConfirmOpen(false);
              }}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface OrderListRowProps {
  item: OrderListItem;
  isEditingNotes: boolean;
  onToggleNotes: () => void;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onNotesChange: (notes: string) => void;
}

function OrderListRow({
  item,
  isEditingNotes,
  onToggleNotes,
  onRemove,
  onIncrement,
  onDecrement,
  onNotesChange,
}: OrderListRowProps) {
  return (
    <li className="flex flex-col gap-1.5 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">
          {item.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${item.name} from your list`}
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label={`Decrease quantity of ${item.name}`}
            onClick={onDecrement}
            disabled={item.quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label={`Increase quantity of ${item.name}`}
            onClick={onIncrement}
          >
            <Plus className="size-3" />
          </Button>
        </div>
        <span className="text-sm font-bold text-primary">
          {formatPrice(item.price * item.quantity)}
        </span>
      </div>
      {isEditingNotes ? (
        <div className="flex flex-col items-end gap-1.5">
          <Textarea
            autoFocus
            value={item.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="e.g. no onions, extra spicy, sub fried rice for lo mein…"
            className="min-h-12 w-full text-xs"
          />
          <Button type="button" variant="outline" size="xs" onClick={onToggleNotes}>
            Done
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggleNotes}
          className="flex w-fit items-center gap-1 text-left text-xs text-muted-foreground hover:text-foreground"
        >
          <StickyNote className="size-3 shrink-0" />
          {item.notes ? item.notes : "Add note"}
        </button>
      )}
    </li>
  );
}
