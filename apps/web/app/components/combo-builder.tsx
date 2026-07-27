"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@harmony/ui/components/button";
import { Input } from "@harmony/ui/components/input";
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
import type { MenuItem } from "@harmony/utils/menu";

const STORAGE_KEY = "harmony-combo-tabs";
const MAX_SELECTIONS = 5;

/** Emoji shown per item number — purely decorative, keyed to `special_combo`'s `includes` order. */
const ITEM_EMOJI: Record<number, string> = {
  1: "🥠",
  2: "🌯",
  3: "🍲",
  4: "🥟",
  5: "🍚",
  6: "🍛",
  7: "🍗",
  8: "🍖",
  9: "🍗",
  10: "🍤",
  11: "🍋",
  12: "🥜",
  13: "🥩",
  14: "🥦",
  15: "🥡",
  16: "🥡",
  17: "🍜",
};

type ComboItem = {
  number: number;
  name: string;
  emoji: string;
};

type ComboTab = {
  id: string;
  customName: string;
  selected: number[];
};

/** Parses "1. Spring Roll" style strings from the catalog into structured combo items. */
function parseComboItems(includes: string[]): ComboItem[] {
  return includes
    .map((line) => {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (!match) return null;
      const number = Number(match[1]);
      return { number, name: match[2], emoji: ITEM_EMOJI[number] ?? "🍽️" };
    })
    .filter((item): item is ComboItem => item !== null);
}

function makeTab(name = ""): ComboTab {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customName: name,
    selected: [],
  };
}

function tabLabel(tab: ComboTab, index: number): string {
  return tab.customName.trim() || `Combo ${index + 1}`;
}

export function ComboBuilder({ item }: { item: MenuItem }) {
  const comboItems = parseComboItems(item.includes ?? []);
  const [tabs, setTabs] = useState<ComboTab[]>([makeTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0]!.id);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const isFirstTabsEffect = useRef(true);

  // Load any saved tabs from this browser once on mount.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ComboTab[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          setActiveTabId(parsed[0]!.id);
        }
      } catch {
        // Ignore corrupt storage, fall back to the default empty tab.
      }
    }
  }, []);

  // Save on every change, skipping the mount render so the load effect's own update (which
  // fires as a separate effect in the same pass) can't be raced and overwritten with the
  // pre-load default tab.
  useEffect(() => {
    if (isFirstTabsEffect.current) {
      isFirstTabsEffect.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]!;

  function addTab() {
    const tab = makeTab();
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }

  function removeTab(id: string) {
    setTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== id);
      return next.length > 0 ? next : [makeTab()];
    });
    setActiveTabId((current) => {
      if (current !== id) return current;
      const remaining = tabs.filter((tab) => tab.id !== id);
      return remaining[0]?.id ?? tabs[0]!.id;
    });
  }

  function renameTab(id: string, customName: string) {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, customName } : tab))
    );
  }

  function confirmRemoveTab() {
    if (pendingDeleteId) removeTab(pendingDeleteId);
    setPendingDeleteId(null);
  }

  function confirmClearAll() {
    const tab = makeTab();
    setTabs([tab]);
    setActiveTabId(tab.id);
    setClearAllOpen(false);
  }

  function toggleItem(number: number) {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTab.id) return tab;
        const isSelected = tab.selected.includes(number);
        if (isSelected) {
          return { ...tab, selected: tab.selected.filter((n) => n !== number) };
        }
        if (tab.selected.length >= MAX_SELECTIONS) return tab;
        return { ...tab, selected: [...tab.selected, number] };
      })
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 rounded-full border pl-3 text-sm transition-colors ${
              tabs.length > 1 ? "pr-1" : "pr-3"
            } ${
              tab.id === activeTab.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary/50"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className="py-1.5"
            >
              {tabLabel(tab, index)}
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={() => setPendingDeleteId(tab.id)}
                aria-label={`Remove ${tabLabel(tab, index)}`}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none ${
                  tab.id === activeTab.id
                    ? "hover:bg-primary-foreground/20"
                    : "hover:bg-muted"
                }`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addTab}>
          + New combo
        </Button>
        {(tabs.length > 1 || activeTab.selected.length > 0 || activeTab.customName) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setClearAllOpen(true)}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this combo?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteId &&
                `"${tabLabel(
                  tabs.find((t) => t.id === pendingDeleteId) ?? activeTab,
                  tabs.findIndex((t) => t.id === pendingDeleteId)
                )}" and its selections will be deleted. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemoveTab}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation */}
      <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all combos?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every combo tab you&apos;ve made on this device and starts over with
              one empty combo. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmClearAll}>
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active tab name + selection count */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="combo-name" className="text-sm text-muted-foreground shrink-0">
            Name (optional):
          </label>
          <Input
            id="combo-name"
            value={activeTab.customName}
            onChange={(e) => renameTab(activeTab.id, e.target.value)}
            placeholder={tabLabel(activeTab, tabs.indexOf(activeTab))}
            className="max-w-[220px]"
          />
        </div>
        <span className="text-sm font-semibold text-secondary">
          {activeTab.selected.length} / {MAX_SELECTIONS} selected
        </span>
      </div>

      {/* Item picker */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {comboItems.map((comboItem) => {
          const isSelected = activeTab.selected.includes(comboItem.number);
          const isDisabled = !isSelected && activeTab.selected.length >= MAX_SELECTIONS;
          return (
            <button
              key={comboItem.number}
              type="button"
              disabled={isDisabled}
              onClick={() => toggleItem(comboItem.number)}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 text-center transition-colors ${
                isSelected ? "border-primary bg-primary/10" : "border-border bg-[#fffef5]"
              } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {comboItem.emoji}
              </span>
              <span className="font-[family-name:var(--font-label)] text-base font-bold text-secondary">
                {comboItem.number}
              </span>
              <span className="font-[family-name:var(--font-body)] text-[0.7rem] leading-tight text-muted-foreground">
                {comboItem.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="font-[family-name:var(--font-body)] text-[0.8rem] italic leading-relaxed text-muted-foreground">
        This is just for your convenience to keep track of what you want — it does not place
        an order. Your combo isn&apos;t confirmed until you call it in.
      </p>
    </div>
  );
}
