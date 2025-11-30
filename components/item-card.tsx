"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatting";
import {
  getItemImageUrl,
  getItemInitials,
} from "@/lib/utils/get-item-image-url";
import { Plus, Minus, Check, Tag } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { Item } from "@/types";

export default function ItemCard({
  item,
  available,
  selected,
  onToggle,
  copyCount,
  onUpdateCopyCount,
  disabled,
}: {
  item: Item;
  available: number;
  selected: boolean;
  onToggle: () => void;
  copyCount: number;
  onUpdateCopyCount: (count: number) => void;
  disabled?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getItemImageUrl(item);
  const showImage = imageUrl && !imageError;

  // Formatting the IID for the split view
  const iidString = item.iid ? String(item.iid).padStart(4, "0") : "0000";
  const iidPrefix = iidString.slice(0, 2);
  const iidSuffix = iidString.slice(2, 4);

  return (
    <motion.div
      layoutId={selected ? `item-${item.id}` : undefined}
      whileHover={{ y: disabled ? 0 : -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={`
          group relative flex flex-col h-full overflow-hidden transition-all duration-300 border-2
          ${
            selected
              ? ""
              : "border-red-400 bg-card shadow-sm hover:shadow-md hover:border-red-200"
          } 
          ${disabled ? "opacity-60 cursor-not-allowed grayscale" : "cursor-pointer"}
        `}
        onClick={disabled ? undefined : onToggle}
      >
        {/* --- Image Section --- */}
        <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <span className="text-5xl font-black text-neutral-300 select-none">
                {getItemInitials(item.name)}
              </span>
            </div>
          )}

          {/* Overlay: Selected State (Red Theme) */}
          {selected && (
            <div className="absolute inset-0 bg-red-600/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="bg-red-600 text-white rounded-full p-3 shadow-xl animate-in zoom-in-50 duration-200">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
            </div>
          )}

          {/* IID Badge (Strict Requirement) */}
          {item.iid && (
            <div className="absolute top-3 left-3 z-20 shadow-sm">
              <div className="flex items-stretch font-bold text-xs rounded-md overflow-hidden border border-white/20 select-none">
                {/* Prefix: Red Background */}
                <div className="bg-red-600 text-white px-2 py-1 flex items-center justify-center text-xl font-mono">
                  {iidPrefix}
                </div>
                {/* Suffix: White Background */}
                <div className="bg-white/95 backdrop-blur-sm text-red-900 px-2 py-1 flex items-center justify-center text-xl font-mono min-w-[24px]">
                  {iidSuffix}
                </div>
              </div>
            </div>
          )}

          {/* Availability Badge (Neutral to let Red pop) */}
          <div className="absolute bottom-2 right-2 z-20">
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/90 text-neutral-800 shadow-sm border border-neutral-200 hover:bg-white"
            >
              {available > 0 ? `${available} auf Lager` : "Nicht verfügbar"}
            </Badge>
          </div>
        </div>

        {/* --- Content Section --- */}
        <div className="flex flex-col flex-grow p-3 space-y-2">
          
          {/* Header */}
          <div className="space-y-1">
            {(item.brand || item.model) && (
              <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                {[item.brand, item.model].filter(Boolean).join(" · ")}
              </p>
            )}
            <h3 className="font-bold text-base leading-tight line-clamp-2 text-neutral-900 h-[2.5rem]">
              {item.name}
            </h3>
          </div>

          <div className="flex-grow" />

          {/* Footer: Red Price Tag & Actions */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">

            {/* The Price Tag */}
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg shadow-md">
              <Tag className="w-5 h-5 fill-white/20" />
              <span className="font-bold text-lg tracking-tight">
                {formatCurrency(item.deposit)}
              </span>
            </div>

            {/* Counter Controls */}
            {selected && item.copies > 1 ? (
              <div 
                className="flex items-center bg-neutral-100 rounded-lg p-1 animate-in slide-in-from-right-2 duration-200"
                onClick={(e) => e.stopPropagation()} 
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-md hover:bg-white hover:text-red-600 hover:shadow-sm transition-all"
                  onClick={() => onUpdateCopyCount(Math.max(1, copyCount - 1))}
                  disabled={copyCount <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-8 text-center text-sm font-semibold tabular-nums text-neutral-700">
                  {copyCount}
                </span>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-md hover:bg-white hover:text-red-600 hover:shadow-sm transition-all"
                  onClick={() => onUpdateCopyCount(Math.min(available, copyCount + 1))}
                  disabled={copyCount >= available}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
               <div className="w-8" />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}