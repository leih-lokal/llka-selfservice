'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collections } from '@/lib/pocketbase/collections';
import { Item } from '@/types';
import { AnimatedDotGrid } from '@/components/ui/animated-dot-grid';
import Header from '@/components/header';
import ItemCard from '@/components/item-card';
import SelectionBar, { SelectionBarRef } from '@/components/selection-bar';
import { Loader2, Search, X, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NewRentalPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [itemsCache, setItemsCache] = useState<Map<string, Item>>(new Map());
  const selectionBarRef = useRef<SelectionBarRef>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Build filter based on search query
      let filter = 'status = "instock"';

      if (searchQuery) {
        const query = searchQuery.trim();
        // Search by IID or name
        // For IID: exact match or partial match
        // For name: case-insensitive partial match using ~
        filter += ` && (iid ~ "${query}" || name ~ "${query}")`;
      }

      let result = await collections.items().getFullList({
        sort: '-created',
        filter: filter,
      });

      // Shuffle if shuffle was triggered and no search query
      if (!searchQuery && shuffleKey > 0) {
        result = result.sort(() => Math.random() - 0.5);
      }

      setItems(result);

      // Update cache with all fetched items
      setItemsCache(prev => {
        const newCache = new Map(prev);
        result.forEach(item => newCache.set(item.id, item));
        return newCache;
      });
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load items on mount and when shuffle is triggered
  useEffect(() => {
    fetchItems();
  }, [shuffleKey]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        // Remove item
        setCopyCounts(counts => {
          const { [itemId]: _, ...rest } = counts;
          return rest;
        });
        return prev.filter(id => id !== itemId);
      } else {
        // Check max limit (3 items)
        if (prev.length >= 3) {
          // Trigger shake animation and toast
          selectionBarRef.current?.triggerShake();
          toast.error("Maximal 3 Artikel", {
            description: "Sie können maximal 3 Artikel gleichzeitig ausleihen."
          });
          return prev;
        }
        // Add item
        setCopyCounts(counts => ({ ...counts, [itemId]: 1 }));
        return [...prev, itemId];
      }
    });
  };

  const handleUpdateCopyCount = (itemId: string, count: number) => {
    setCopyCounts(counts => ({ ...counts, [itemId]: count }));
  };

  const handleSearch = () => {
    fetchItems();
  };

  const handleShuffle = () => {
    setSearchQuery('');
    setShuffleKey(prev => prev + 1);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(id => id !== itemId));
    setCopyCounts(counts => {
      const { [itemId]: _, ...rest } = counts;
      return rest;
    });
  };

  const handleContinue = () => {
    // Store selected items and copy counts in sessionStorage
    const selectedItemObjects = selectedItems.map(id => itemsCache.get(id)).filter(Boolean) as Item[];

    sessionStorage.setItem('selectedItems', JSON.stringify(selectedItemObjects));
    sessionStorage.setItem('copyCounts', JSON.stringify(copyCounts));

    // Navigate to customer identification page
    router.push('/new-rental/customer');
  };

  // Get selected item objects from cache
  const selectedItemObjects = selectedItems.map(id => itemsCache.get(id)).filter(Boolean) as Item[];

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <AnimatedDotGrid />

      <Header
        breadcrumbs={[
          { label: 'Startseite', href: '/' },
          { label: 'Neue Ausleihe' }
        ]}
      />

      <main className="flex-1 p-8 z-10">
        <div className="space-y-6">
          {/* Search Bar - Full Width */}
          <div className="w-full">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ausleihinventar durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="h-16 text-lg border-2 border-border focus:border-primary shadow-lg bg-card/80 backdrop-blur-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                disabled={loading}
                className="h-16 px-8 text-lg font-bold bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Search />
                    <span className="hidden sm:inline">Suchen</span>
                  </>
                )}
              </Button>
              <Button
                onClick={handleShuffle}
                size="lg"
                variant="outline"
                disabled={loading}
                className="h-16 px-6 border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Shuffle className="w-12 h-12" />
              </Button>
            </div>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-2">
                {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'} {searchQuery ? 'gefunden' : 'verfügbar'}
              </p>
            )}
          </div>

          {/* Items Grid with Loading Overlay */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="bg-card p-6 rounded-lg shadow-xl border-2 border-border flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg font-semibold text-foreground">Wird geladen...</p>
                </div>
              </div>
            )}

            {items.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">
                  {searchQuery ? `Keine Artikel gefunden für "${searchQuery}"` : 'Keine Artikel verfügbar'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32 md:pb-36">
                {items.map((item) => (
                  <div key={item.id}>
                    <ItemCard
                      item={item}
                      available={item.copies || 1}
                      selected={selectedItems.includes(item.id)}
                      onToggle={() => handleToggleItem(item.id)}
                      copyCount={copyCounts[item.id] || 1}
                      onUpdateCopyCount={(count) => handleUpdateCopyCount(item.id, count)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Selection Bar */}
      <SelectionBar
        ref={selectionBarRef}
        selectedItems={selectedItemObjects}
        onRemove={handleRemoveItem}
        onContinue={handleContinue}
        copyCounts={copyCounts}
        onUpdateCopyCount={handleUpdateCopyCount}
      />
    </div>
  );
}
