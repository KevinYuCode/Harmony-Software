import type { MenuItemId } from "./prices";

export type MenuItemCatalogEntry = {
  /** Display name shown to customers. */
  name: string;
  category: string;
  description?: string;
  /** Items included in combos, family dinners, lunch specials. */
  includes?: string[];
  /** Spice level indicator (1 = mild, 2 = medium, 3 = hot). */
  spiceLevel?: number;
  /** Tags for filtering/searching (e.g. "vegetarian", "gluten-free"). */
  tags?: string[];
};

/** Display metadata for each priced item. */
export const MENU_ITEM_CATALOG: Record<MenuItemId, MenuItemCatalogEntry> = {
  // ── Combo ──
  special_combo: {
    name: "Special Combo For One",
    category: "Special Combo",
    description: "Choose any 5 items & order by number.",
    includes: [
      "1. Spring Roll",
      "2. Egg Roll",
      "3. Wonton Soup",
      "4. Deep Fried Wontons",
      "5. Beef Fried Rice",
      "6. Chicken Fried Rice",
      "7. Chicken Balls",
      "8. Sweet & Sour Pork",
      "9. Chicken Wings",
      "10. Breaded Shrimp",
      "11. Lemon Chicken",
      "12. Almond Guy Ding",
      "13. Almond Beef Ding",
      "14. Beef Mixed Vegetables",
      "15. Beef Chop Suey",
      "16. Chicken Chop Suey",
      "17. Plain Lo Mein (extra $1)",
    ],
  },

  // ── Appetizers ──
  egg_roll: { name: "Delicious Egg Roll", category: "Appetizers" },
  spring_roll: { name: "Delicious Spring Roll", category: "Appetizers" },
  bbq_pork_ribs: { name: "B.B.Q Pork Ribs", category: "Appetizers" },
  bbq_pork_slices: { name: "B.B.Q Pork Slices", category: "Appetizers" },
  chicken_wings: { name: "Chicken Wings (Crispy)", category: "Appetizers" },
  almond_soo_guy: { name: "Almond Soo Guy", category: "Appetizers" },
  deep_fried_wontons: { name: "Deep Fried Wontons", category: "Appetizers" },
  chicken_teriyaki: { name: "Chicken Teriyaki", category: "Appetizers" },
  beef_teriyaki: { name: "Beef Teriyaki", category: "Appetizers" },
  breaded_shrimp: { name: "Breaded Shrimp", category: "Appetizers" },
  breaded_scallops: { name: "Breaded Scallops", category: "Appetizers" },
  bobo_tray_for_two: { name: "Bo Bo Tray for Two", category: "Appetizers" },
  bobo_tray_for_four: { name: "Bo Bo Tray for Four", category: "Appetizers" },

  // ── Soups ──
  chicken_noodle_soup: { name: "Chicken, Beef or Pork Noodle Soup", category: "Soups" },
  hot_and_sour_soup: { name: "Hot and Sour Soup", category: "Soups", spiceLevel: 2 },
  wonton_soup_l: { name: "Wonton Soup (Large)", category: "Soups" },
  wonton_soup_s: { name: "Wonton Soup (Small)", category: "Soups" },
  egg_flower_soup: { name: "Egg Flower Soup", category: "Soups" },
  fine_noodle_soup: { name: "Fine Noodle Soup", category: "Soups" },
  consomme_soup: { name: "Consomme Soup", category: "Soups" },
  miso_soup: { name: "Miso Soup", category: "Soups" },

  // ── Sweet and Sour ──
  sweet_and_sour_chicken_balls: { name: "Sweet and Sour Chicken Balls", category: "Sweet and Sour" },
  sweet_and_sour_pork: { name: "Sweet and Sour Pork", category: "Sweet and Sour" },
  sweet_and_sour_spare_ribs: { name: "Sweet and Sour Spare Ribs", category: "Sweet and Sour" },
  sweet_and_sour_breaded_shrimp: { name: "Sweet and Sour Breaded Shrimp", category: "Sweet and Sour" },
  sweet_and_sour_breaded_scallops: { name: "Sweet and Sour Breaded Scallops", category: "Sweet and Sour" },
  sweet_and_sour_beef: { name: "Sweet and Sour Beef", category: "Sweet and Sour" },

  // ── Chop Suey (Bean-Sprouts) ──
  chicken_chop_suey: { name: "Chicken and Mushroom Chop Suey", category: "Chop Suey" },
  beef_chop_suey: { name: "Beef and Mushroom Chop Suey", category: "Chop Suey" },
  pork_chop_suey: { name: "Pork and Mushroom Chop Suey", category: "Chop Suey" },
  shrimp_chop_suey: { name: "Shrimp and Mushroom Chop Suey", category: "Chop Suey" },
  vegetable_chop_suey: { name: "Vegetable and Mushroom Chop Suey", category: "Chop Suey", tags: ["vegetarian"] },
  harmony_chop_suey: { name: "Harmony Chop Suey", category: "Chop Suey", description: "Chicken, beef, and shrimp chop suey" },

  // ── Honey Garlic ──
  honey_garlic_chicken_wings: { name: "Honey Garlic Chicken Wings", category: "Honey Garlic" },
  honey_garlic_spare_ribs: { name: "Honey Garlic Spare Ribs", category: "Honey Garlic" },
  honey_garlic_shrimps: { name: "Honey Garlic Shrimps", category: "Honey Garlic" },
  honey_garlic_wontons: { name: "Honey Garlic Wontons", category: "Honey Garlic" },

  // ── Fried Rice ──
  chicken_fried_rice: { name: "Chicken Fried Rice", category: "Fried Rice" },
  beef_fried_rice: { name: "Beef Fried Rice", category: "Fried Rice" },
  pork_fried_rice: { name: "Pork Fried Rice", category: "Fried Rice" },
  mushroom_fried_rice: { name: "Mushroom Fried Rice", category: "Fried Rice", tags: ["vegetarian"] },
  vegetable_fried_rice: { name: "Vegetable Fried Rice", category: "Fried Rice", tags: ["vegetarian"] },
  shrimp_fried_rice: { name: "Shrimp Fried Rice", category: "Fried Rice" },
  harmony_special_fried_rice: { name: "Harmony Special Fried Rice", category: "Fried Rice", description: "Fried rice with chicken, beef, and shrimp" },
  steamed_rice_s: { name: "Steamed Rice (Small)", category: "Fried Rice" },
  steamed_rice_l: { name: "Steamed Rice (Large)", category: "Fried Rice" },

  // ── Vegetable Almond ──
  stir_fried_mixed_vegetables_almond: { name: "Stir Fried Mixed Vegetables Almond", category: "Vegetable Almond", tags: ["vegetarian"] },
  almond_guy_ding: { name: "Almond Guy Ding (Chicken)", category: "Vegetable Almond" },
  almond_beef_ding: { name: "Almond Beef Ding", category: "Vegetable Almond" },
  almond_bbq_pork_ding: { name: "Almond B.B.Q Pork Ding", category: "Vegetable Almond" },
  almond_shrimp_ding: { name: "Almond Shrimp Ding", category: "Vegetable Almond" },

  // ── Lo Mein ──
  plain_lo_mein: { name: "Plain Lo-Mein", category: "Lo Mein", tags: ["vegetarian"] },
  mixed_vegetable_lo_mein: { name: "Mixed Vegetable Lo-Mein", category: "Lo Mein", tags: ["vegetarian"] },
  chicken_lo_mein: { name: "Chicken Lo-Mein (with Mixed Vegetables)", category: "Lo Mein" },
  pork_lo_mein: { name: "Pork Lo-Mein (with Mixed Vegetables)", category: "Lo Mein" },
  beef_lo_mein: { name: "Beef Lo-Mein (with Mixed Vegetables)", category: "Lo Mein" },
  shrimp_lo_mein: { name: "Shrimp Lo-Mein (with Mixed Vegetables)", category: "Lo Mein" },
  harmony_special_lo_mein: { name: "Harmony Special Lo-Mein", category: "Lo Mein", description: "Lo mein with chicken, beef, and shrimp" },
  beef_shanghai: { name: "Shanghai Chow Mein (Chicken or Beef)", category: "Lo Mein" },
  singapore_chow_mein: { name: "Singapore Chow Mein", category: "Lo Mein", description: "With curry sauce", spiceLevel: 1 },

  // ── Egg Fu Young ──
  chicken_egg_fu_young: { name: "Chicken Egg Fu Young", category: "Egg Fu Young" },
  bbq_pork_egg_fu_young: { name: "B.B.Q Pork Egg Fu Young", category: "Egg Fu Young" },
  beef_egg_fu_young: { name: "Beef Egg Fu Young", category: "Egg Fu Young" },
  mushroom_egg_fu_young: { name: "Mushroom Egg Fu Young", category: "Egg Fu Young", tags: ["vegetarian"] },
  shrimp_egg_fu_young: { name: "Shrimp Egg Fu Young", category: "Egg Fu Young" },

  // ── Curry ──
  curry_chicken_with_vegetables: { name: "Curry Chicken with Vegetables", category: "Curry", spiceLevel: 1 },
  curry_beef_with_vegetables: { name: "Curry Beef with Vegetables", category: "Curry", spiceLevel: 1 },
  curry_shrimp_with_vegetables: { name: "Curry Shrimp with Vegetables", category: "Curry", spiceLevel: 1 },
  curry_chicken_wings_with_vegetables: { name: "Curry Chicken Wings with Vegetables", category: "Curry", spiceLevel: 1 },

  // ── Szechuan ──
  spicy_chicken: { name: "Spicy Chicken or Beef", category: "Szechuan", spiceLevel: 2 },
  kung_po_chicken: { name: "Kung Po (Chicken or Beef)", category: "Szechuan", spiceLevel: 1 },
  kung_pao_shrimps: { name: "Kung Pao Shrimps", category: "Szechuan", spiceLevel: 1 },
  ginger_beef: { name: "Ginger Beef", category: "Szechuan" },
  szechuan_chicken: { name: "Szechuan Chicken or Beef", category: "Szechuan", spiceLevel: 1 },
  beef_ma_po_tofu: { name: "Ma Po Tofu (Beef, Chicken or Pork)", category: "Szechuan", spiceLevel: 1 },

  // ── Seafood ──
  shrimp_lobster_sauce: { name: "Shrimp Lobster Sauce", category: "Seafood", description: "Stir fried shrimp with minced pork in special sauce" },
  seafood_platter: { name: "Seafood Platter", category: "Seafood", description: "Scallops, shrimp and mixed Chinese vegetables with our own sauce" },
  soo_chow_scallops: { name: "Soo Chow Scallops", category: "Seafood", description: "Breaded scallops cooked with Chinese vegetables" },
  soo_chow_har_kew: { name: "Soo Chow Har Kew", category: "Seafood", description: "Breaded shrimp and mixed Chinese vegetables" },
  seafood_delight: { name: "Seafood Delight", category: "Seafood" },

  // ── Popular Suggestions ──
  moo_goo_guy_pan: { name: "Moo Goo Guy Pan", category: "Popular Suggestions" },
  chicken_snow_peas: { name: "Chicken Snow Peas", category: "Popular Suggestions" },
  chicken_mushroom: { name: "Chicken Mushroom", category: "Popular Suggestions" },
  chicken_tomato: { name: "Chicken Tomato", category: "Popular Suggestions" },
  shrimp_with_green_pepper: { name: "Shrimp with Green Pepper", category: "Popular Suggestions" },
  pepper_steak: { name: "Pepper Steak", category: "Popular Suggestions" },
  beef_broccoli: { name: "Beef or Chicken Broccoli", category: "Popular Suggestions" },
  beef_snow_peas: { name: "Beef Snow Peas", category: "Popular Suggestions" },
  beef_tomato: { name: "Beef Tomato", category: "Popular Suggestions" },
  beef_chinese_green: { name: "Beef Chinese Green", category: "Popular Suggestions" },
  beef_mushroom: { name: "Beef Mushroom", category: "Popular Suggestions" },
  beef_mixed_vegetables: { name: "Beef Mixed Vegetables", category: "Popular Suggestions" },
  shrimp_snow_peas: { name: "Shrimp Snow Peas", category: "Popular Suggestions" },
  chicken_baby_corn: { name: "Chicken Baby Corn", category: "Popular Suggestions" },
  mixed_oriental_vegetables: { name: "Mixed Oriental Vegetables", category: "Popular Suggestions", tags: ["vegetarian"] },

  // ── Chef Suggestions ──
  tai_dop_voy: { name: "Tai Dop Voy", category: "Chef Suggestions", description: "Chicken, shrimp, B.B.Q pork and beef with Chinese vegetables" },
  satay_beef: { name: "Satay Beef or Chicken", category: "Chef Suggestions" },
  orange_chicken: { name: "Orange Chicken", category: "Chef Suggestions" },
  chicken_with_black_bean_sauce: { name: "Chicken or Beef with Black Bean Sauce", category: "Chef Suggestions", description: "Cubed with black bean sauce and garlic", spiceLevel: 1 },
  pepper_spare_ribs: { name: "Pepper Spare Ribs", category: "Chef Suggestions" },
  beef_mushroom_oyster_sauce: { name: "Beef Mushroom with Oyster Sauce", category: "Chef Suggestions" },
  wai_guy_kew: { name: "Wai Guy Kew", category: "Chef Suggestions", description: "Cubed chicken with Chinese vegetables and mushrooms cooked in a special hot sauce" },
  beef_and_onion: { name: "Beef and Onion", category: "Chef Suggestions", description: "Tender beef, onion with our own sauce" },
  beef_mushroom_and_broccoli: { name: "Beef or Chicken with Mushrooms and Broccoli", category: "Chef Suggestions", description: "Beef tenderloin in cubes combined with Chinese vegetables" },
  general_tao_chicken: { name: "General Tao Chicken", category: "Chef Suggestions", spiceLevel: 1 },
  woo_dip_har: { name: "Woo Dip Har", category: "Chef Suggestions", description: "Butterfly shrimp with special sauce" },
  hong_sew_guy_kew: { name: "Hong Sew Guy Kew", category: "Chef Suggestions", description: "Breaded chicken pieces with Chinese vegetables" },
  soo_chow_wonton: { name: "Soo Chow Wonton", category: "Chef Suggestions", description: "Crispy wonton, chicken and B.B.Q pork with Chinese greens" },
  golden_garlic_spare_ribs: { name: "Golden Garlic Spare Ribs", category: "Chef Suggestions" },
  cantonese_chow_mein: { name: "Cantonese Style Chow Mein", category: "Chef Suggestions", description: "A combination of sliced chicken, B.B.Q pork, shrimp and beef with mixed vegetables and fine egg noodles" },
  lemon_chicken: { name: "Lemon Chicken", category: "Chef Suggestions" },
  sesame_chicken: { name: "Sesame Chicken", category: "Chef Suggestions" },
  scallops_and_mixed_vegetables: { name: "Scallops and Mixed Vegetables", category: "Chef Suggestions" },

  // ── Canadian Dishes ──
  spicy_potato_wedges: { name: "Spicy Potato Wedges", category: "Canadian Dishes", spiceLevel: 1 },
  fish_and_chips: { name: "Fish and Chips", category: "Canadian Dishes" },
  french_fries: { name: "French Fries", category: "Canadian Dishes", tags: ["vegetarian"] },
  onion_rings: { name: "Onion Rings", category: "Canadian Dishes", tags: ["vegetarian"] },

  // ── Family Meals (Take-Out) ──
  dinner_for_2: {
    name: "Dinner for Two",
    category: "Family Meals",
    includes: ["2 Egg Rolls", "Chicken Chop Suey", "Chicken Fried Rice", "Sweet & Sour Chicken Balls", "Fortune Cookies"],
  },
  dinner_for_3: {
    name: "Dinner for Three",
    category: "Family Meals",
    includes: ["3 Egg Rolls", "Beef Chop Suey", "Chicken Fried Rice", "Sweet & Sour Chicken Balls", "Sweet & Sour Spare Ribs", "Chicken Wings", "Fortune Cookies"],
  },
  dinner_for_4: {
    name: "Dinner for Four",
    category: "Family Meals",
    includes: ["4 Egg Rolls", "Fried Wontons", "Beef Chop Suey", "Moo Goo Guy Pan", "Chicken Fried Rice", "Sweet & Sour Chicken Balls", "Chicken Wings", "Fortune Cookies"],
  },
  dinner_for_5: {
    name: "Dinner for Five",
    category: "Family Meals",
    includes: ["5 Egg Rolls", "Sweet & Sour Chicken Balls", "Beef Chop Suey", "Tai Dop Voy", "Harmony Fried Rice", "Fried Wontons", "Chicken Wings", "Fortune Cookies"],
  },
  dinner_for_6: {
    name: "Dinner for Six",
    category: "Family Meals",
    includes: ["6 Egg Rolls", "Fried Wonton", "Sweet & Sour Chicken Balls", "Sweet & Sour Shrimp", "Harmony Fried Rice", "Cantonese Chow Mein", "Guy Ding", "Beef Chop Suey", "Chicken Wings", "Fortune Cookies"],
  },
  dinner_for_8: {
    name: "Dinner for Eight",
    category: "Family Meals",
    includes: ["8 Egg Rolls", "Chicken Balls", "Chicken Fried Rice", "Lemon Chicken", "Beef Broccoli", "Beef Chop Suey", "Harmony Lo Mein", "Sweet & Sour Pork", "Chicken Wings"],
  },

  // ── Extras ──
  sweet_and_sour_sauce_s: { name: "Sweet and Sour Sauce (Small)", category: "Extras" },
  sweet_and_sour_sauce_l: { name: "Sweet and Sour Sauce (Large)", category: "Extras" },
  lemon_sauce_s: { name: "Lemon Sauce (Small)", category: "Extras" },
  lemon_sauce_l: { name: "Lemon Sauce (Large)", category: "Extras" },
  gravy_s: { name: "Gravy (Small)", category: "Extras" },
  honey_sauce: { name: "Honey Sauce", category: "Extras" },
  chop_sticks: { name: "Chop Sticks", category: "Extras" },
  utensils: { name: "Utensils", category: "Extras" },
  extra_soy_sauce: { name: "Extra Soy Sauce", category: "Extras" },
  extra_plum_sauce: { name: "Extra Plum Sauce", category: "Extras" },
  extra_hot_sauce: { name: "Extra Hot Sauce", category: "Extras" },
  extra_mustard: { name: "Extra Mustard", category: "Extras" },
  dry_noodles: { name: "Dry Noodles", category: "Extras" },
  extra_fortune_cookies: { name: "Extra Fortune Cookies", category: "Extras" },
  extra_spicy: { name: "Extra Spicy", category: "Extras" },
  out_of_town_delivery: { name: "Out of Town Delivery", category: "Extras" },
};
