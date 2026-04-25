export type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  description?: string
  includes?: string[]
  spiceLevel?: number
  tags?: string[]
}

/**
 * Returns all menu items. Fill in with your actual menu data.
 */
export function getAllMenuItems(): MenuItem[] {
  return []
}
