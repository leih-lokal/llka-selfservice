'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/formatting';
import type { Item } from '@/types';

const MAX_ITEMS = 3;

export default function ItemSelectionPanel({
    selectedItems,
    copyCounts,
    onRemoveItem,
    totalDeposit,
}: {
    selectedItems: Item[];
    copyCounts: Record<string, number>;
    onRemoveItem: (itemId: string) => void;
    totalDeposit: number;
}) {
    // Create array of 3 slots
    const slots = Array.from({ length: MAX_ITEMS }, (_, i) => selectedItems[i] || null);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-primary shadow-2xl z-50">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">
                        Ausgewählte Gegenstände ({selectedItems.length}/{MAX_ITEMS})
                    </h3>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Gesamtkaution</p>
                        <p className="text-2xl font-bold text-primary">
                            {formatCurrency(totalDeposit)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {slots.map((item, index) => (
                        <div key={index} className="relative">
                            <AnimatePresence mode="wait">
                                {item ? (
                                    <motion.div
                                        key={item.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="bg-primary/5 border-primary/30 p-4 relative">
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                                                onClick={() => onRemoveItem(item.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>

                                            <div className="space-y-2">
                                                <p className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">
                                                        {copyCounts[item.id] || 1}×
                                                    </span>
                                                    <span className="font-bold text-primary">
                                                        {formatCurrency(item.deposit * (copyCounts[item.id] || 1))}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={`empty-${index}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <Card className="bg-muted/30 border-dashed border-2 border-muted-foreground/20 p-4 h-full flex items-center justify-center">
                                            <p className="text-muted-foreground text-sm">Slot {index + 1}</p>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
