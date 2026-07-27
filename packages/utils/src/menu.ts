import { MENU_ITEM_CATALOG, type MenuItemCatalogEntry } from "./menu-catalog";
import { PRICES, type MenuItemId } from "./prices";

export type MenuItem = MenuItemCatalogEntry & {
  id: MenuItemId;
  price: number;
};

/** Title-case words from a menu id. */
export function formatMenuItemName(id: MenuItemId): string {
  return id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getMenuItem(id: MenuItemId): MenuItem {
  return {
    ...MENU_ITEM_CATALOG[id],
    id,
    price: PRICES[id],
  };
}

/** Every priced item with catalog metadata joined in. */
export function getAllMenuItems(): MenuItem[] {
  return (Object.keys(PRICES) as MenuItemId[]).map(getMenuItem);
}

export { MENU_ITEM_CATALOG, type MenuItemCatalogEntry } from "./menu-catalog";
export { PRICES, type MenuItemId } from "./prices";
