"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { MenuItem, MenuItemId } from "@harmony/utils/menu";

const STORAGE_KEY = "harmony-order-list";

export type OrderListItem = {
  id: MenuItemId;
  name: string;
  price: number;
  quantity: number;
  notes: string;
};

/** Everything needed to add or bump a line — satisfied by a full `MenuItem` or an existing `OrderListItem`. */
type AddableItem = Pick<MenuItem, "id" | "name" | "price">;

type OrderListContextValue = {
  items: OrderListItem[];
  totalCount: number;
  totalPrice: number;
  getQuantity: (id: string) => number;
  addItem: (item: AddableItem) => void;
  removeItem: (id: string) => void;
  incrementQuantity: (item: AddableItem) => void;
  decrementQuantity: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  clearAll: () => void;
};

const OrderListContext = createContext<OrderListContextValue | null>(null);

export function OrderListProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const isFirstItemsEffect = useRef(true);

  // Load any saved list from this browser once on mount.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as OrderListItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // Ignore corrupt storage, start with an empty list.
    }
  }, []);

  // Save on every change, skipping the mount render so it can't race the load effect above.
  useEffect(() => {
    if (isFirstItemsEffect.current) {
      isFirstItemsEffect.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function getQuantity(id: string): number {
    return items.find((i) => i.id === id)?.quantity ?? 0;
  }

  function addItem(item: AddableItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, notes: "" }];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function incrementQuantity(item: AddableItem) {
    addItem(item);
  }

  function decrementQuantity(id: string) {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i];
        if (i.quantity <= 1) return [];
        return [{ ...i, quantity: i.quantity - 1 }];
      })
    );
  }

  function updateNotes(id: string, notes: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  }

  function clearAll() {
    setItems([]);
  }

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <OrderListContext.Provider
      value={{
        items,
        totalCount,
        totalPrice,
        getQuantity,
        addItem,
        removeItem,
        incrementQuantity,
        decrementQuantity,
        updateNotes,
        clearAll,
      }}
    >
      {children}
    </OrderListContext.Provider>
  );
}

export function useOrderList() {
  const ctx = useContext(OrderListContext);
  if (!ctx) throw new Error("useOrderList must be used within an OrderListProvider");
  return ctx;
}
