"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, X, Plus, Minus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Item } from "@/types";
import { getItemImageUrl, getItemInitials } from "@/lib/utils/get-item-image-url";
import { formatCurrency } from "@/lib/utils/formatting";
import Image from "next/image";

export interface SelectionBarRef {
  triggerShake: () => void;
}

interface SelectionBarProps {
  selectedItems: Item[];
  onRemove: (itemId: string) => void;
  onContinue: () => void;
  copyCounts: Record<string, number>;
  onUpdateCopyCount: (itemId: string, count: number) => void;
  maxItems?: number;
}

const SelectionBar = forwardRef<SelectionBarRef, SelectionBarProps>(
  ({ selectedItems, onRemove, onContinue, copyCounts, onUpdateCopyCount, maxItems = 3 }, ref) => {
    const [isShaking, setIsShaking] = useState(false);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useImperativeHandle(ref, () => ({
      triggerShake: () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      },
    }));

    const formatIID = (iid: number) => {
      const iidString = String(iid).padStart(4, "0");
      return `${iidString.slice(0, 2)}/${iidString.slice(2, 4)}`;
    };

    // Calculate total deposit
    const totalDeposit = selectedItems.reduce((sum, item) => {
      const count = copyCounts[item.id] || 1;
      return sum + (item.deposit * count);
    }, 0);

    return (
      <motion.div
        className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-lg border-t-2 border-border shadow-2xl"
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Title - mobile only */}
            <div className="sm:hidden text-sm font-semibold text-muted-foreground mb-1">
              Ausgewählte Artikel
            </div>

            {/* 3 Slots */}
            <div className="flex gap-2 flex-1">
              {[0, 1, 2].map((index) => {
                const item = selectedItems[index];
                const copyCount = item ? (copyCounts[item.id] || 1) : 0;

                return (
                  <div key={index} className="flex-1">
                    {item ? (
                      <motion.div
                        layoutId={`item-${item.id}`}
                        className="relative group cursor-pointer aspect-square bg-neutral-100 rounded-lg overflow-hidden border-2 border-red-400 hover:border-red-500 transition-colors"
                        onClick={() => onRemove(item.id)}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      >
                        {/* Item Image */}
                        {getItemImageUrl(item) && !imageErrors[item.id] ? (
                          <Image
                            src={getItemImageUrl(item)!}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 30vw, 150px"
                            className="object-cover"
                            onError={() => {
                              setImageErrors((prev) => ({ ...prev, [item.id]: true }));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                            <span className="text-3xl sm:text-4xl font-black text-neutral-400 select-none">
                              {getItemInitials(item.name)}
                            </span>
                          </div>
                        )}

                        {/* Remove Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>

                        {/* IID Badge */}
                        <div className="absolute bottom-1 left-1 bg-red-600 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs sm:text-sm font-bold font-mono shadow-sm">
                          {formatIID(item.iid)}
                        </div>

                        {/* Copy Counter Controls - Overlaid on bottom right */}
                        {item.copies > 1 && (
                          <div
                            className="absolute bottom-1 right-1 flex gap-2 items-center bg-white/95 backdrop-blur-sm rounded-md px-1 shadow-sm z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 rounded-sm hover:bg-red-100 hover:text-red-600 transition-all"
                              onClick={() => onUpdateCopyCount(item.id, Math.max(1, copyCount - 1))}
                              disabled={copyCount <= 1}
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>

                            <span className="px-1 text-xs font-bold tabular-nums text-neutral-900">
                              {copyCount}
                            </span>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 rounded-sm hover:bg-red-100 hover:text-red-600 transition-all"
                              onClick={() => onUpdateCopyCount(item.id, Math.min(item.copies, copyCount + 1))}
                              disabled={copyCount >= item.copies}
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="aspect-square bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl font-bold text-neutral-300 select-none">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Deposit Display with Continue Button */}
            <div className="flex flex-col justify-between bg-red-600 text-white px-4 py-4 rounded-lg min-w-[180px] sm:min-w-[200px] gap-3">
              {/* Total Amount */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 fill-white/20" />
                  <span className="text-xs font-medium opacity-90">Gesamt</span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {formatCurrency(totalDeposit)}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={onContinue}
                disabled={selectedItems.length === 0}
                size="lg"
                className="w-full bg-white hover:bg-white/90 text-red-600 font-bold text-base sm:text-lg h-12 sm:h-14"
              >
                <span>Weiter</span>
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

          </div>
        </div>
      </motion.div>
    );
  }
);

SelectionBar.displayName = "SelectionBar";

export default SelectionBar;
