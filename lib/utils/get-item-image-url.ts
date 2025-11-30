import type { Item } from '@/types';

/**
 * Get the URL for an item's image from PocketBase
 * @param item - The item record
 * @param index - Index of the image in the images array (default: 0)
 * @returns The full URL to the image, or null if no images exist
 */
export function getItemImageUrl(item: Item, index: number = 0): string | null {
    if (!item.images || item.images.length === 0) return null;

    const filename = item.images[index];
    const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

    return `${baseUrl}/api/files/item/${item.id}/${filename}`;
}

/**
 * Get initials from item name for placeholder
 */
export function getItemInitials(itemName: string): string {
    return itemName.charAt(0).toUpperCase();
}
