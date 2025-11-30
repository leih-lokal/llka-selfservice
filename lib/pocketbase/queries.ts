import { collections } from './collections';
import type { Item } from '@/types';

// Item availability algorithm (CRITICAL)
export async function getItemAvailability(itemId: string) {
  const item = await collections.items().getOne(itemId);
  const totalCopies = item.copies || 1;

  const activeRentals = await collections.rentals().getFullList({
    filter: `items ~ '${itemId}' && returned_on = ""`,
  });

  let rentedCopies = 0;
  for (const rental of activeRentals) {
    const copyCount = rental.requested_copies?.[itemId] || 1;
    rentedCopies += copyCount;
  }

  const availableCopies = Math.max(0, totalCopies - rentedCopies);

  return { totalCopies, rentedCopies, availableCopies };
}

// Search customers by IID, name, or phone
export async function searchCustomers(query: string) {
  return collections.customers().getFullList({
    filter: `iid~"${query}" || firstname~"${query}" || lastname~"${query}" || phone~"${query}"`,
    sort: '-iid',
  });
}

// Search available items with optional category filter and sorting
export async function searchItems(
  query: string = '',
  category?: string,
  sortBy: 'name' | 'deposit' = 'name'
) {
  let filter = 'status="instock"';

  if (query) {
    filter += ` && (name~"${query}" || synonyms~"${query}")`;
  }

  if (category && category !== 'all') {
    filter += ` && category~"${category}"`;
  }

  const sort = sortBy === 'name' ? 'name' : '-deposit';

  return collections.items().getFullList({ filter, sort });
}

// Get today's reservations (not done)
export async function getTodayReservations() {
  const today = new Date().toISOString().split('T')[0];
  return collections.reservations().getFullList({
    filter: `done=false && pickup>="${today}"`,
    sort: 'pickup',
    expand: 'items',
  });
}

// Calculate total deposit
export function calculateDeposit(items: Item[], copyCounts: Record<string, number>) {
  let total = 0;
  for (const item of items) {
    const copies = copyCounts[item.id] || 1;
    total += item.deposit * copies;
  }
  return total;
}
