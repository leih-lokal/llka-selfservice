'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import ItemCard from './item-card';
import { searchItems, getItemAvailability } from '@/lib/pocketbase/queries';
import { CATEGORY_LABELS } from '@/lib/constants/categories';
import type { Item } from '@/types';

const MAX_ITEMS = 3;

export default function ItemSearch({
  selectedItems,
  onToggleItem,
  copyCounts,
  onUpdateCopyCount,
}: {
  selectedItems: Item[];
  onToggleItem: (item: Item) => void;
  copyCounts: Record<string, number>;
  onUpdateCopyCount: (itemId: string, count: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [results, setResults] = useState<Item[]>([]);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load all items on mount
  useEffect(() => {
    loadItems();
  }, [selectedCategory]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function loadItems() {
    setLoading(true);
    try {
      const items = await searchItems(query, selectedCategory);
      setResults(items);

      // Fetch availability for all results
      const avail: Record<string, number> = {};
      for (const item of items) {
        const { availableCopies } = await getItemAvailability(item.id);
        avail[item.id] = availableCopies;
      }
      setAvailability(avail);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { key: 'all', label: 'Alle' },
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
  ];

  return (
    <div className="space-y-4 pb-64">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Gegenstand suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 text-lg pl-12"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.key)}
            className="rounded-full"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Results Grid */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {query ? 'Keine Gegenstände gefunden' : 'Keine verfügbaren Gegenstände'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
            {results.map((item) => {
              const isSelected = selectedItems.some((i) => i.id === item.id);
              const isDisabled = !isSelected && selectedItems.length >= MAX_ITEMS;

              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  available={availability[item.id] || 0}
                  selected={isSelected}
                  onToggle={() => onToggleItem(item)}
                  copyCount={copyCounts[item.id] || 1}
                  onUpdateCopyCount={(count) => onUpdateCopyCount(item.id, count)}
                  disabled={isDisabled}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
