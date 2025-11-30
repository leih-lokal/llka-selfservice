'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedDotGrid } from '@/components/ui/animated-dot-grid';
import Header from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { getItemImageUrl, getItemInitials } from '@/lib/utils/get-item-image-url';
import type { Item, Reservation } from '@/types';
import Image from 'next/image';

export default function SuccessPage() {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load from sessionStorage
    const reservationData = sessionStorage.getItem('completedReservation');
    const itemsData = sessionStorage.getItem('selectedItems');
    const countsData = sessionStorage.getItem('copyCounts');

    if (reservationData) setReservation(JSON.parse(reservationData));
    if (itemsData) setSelectedItems(JSON.parse(itemsData));
    if (countsData) setCopyCounts(JSON.parse(countsData));

    // Redirect if no data
    if (!reservationData) {
      router.push('/new-rental');
    }
  }, [router]);

  const totalDeposit = selectedItems.reduce((sum, item) => {
    const count = copyCounts[item.id] || 1;
    return sum + (item.deposit * count);
  }, 0);

  const formatIID = (iid: number) => {
    const iidString = String(iid).padStart(4, '0');
    return `${iidString.slice(0, 2)}/${iidString.slice(2, 4)}`;
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <AnimatedDotGrid />

      <Header
        breadcrumbs={[
          { label: 'Startseite', href: '/' },
          { label: 'Neue Ausleihe', href: '/new-rental' },
          { label: 'Kunde identifizieren', href: '/new-rental/customer' },
          { label: 'Bestätigung' }
        ]}
      />

      <main className="flex-1 p-8 z-10">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-green-500 text-white rounded-full p-6 mb-4">
              <Check className="w-16 h-16 stroke-[3]" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Reservierung erstellt</h1>
          </div>

          {/* OTP Card - PROMINENT */}
          <Card className="p-8 mb-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <p className="text-lg mb-2 opacity-90">Ihr Abholcode</p>
              <div className="text-8xl font-bold tracking-widest font-mono">
                {reservation?.otp || '----'}
              </div>
              <p className="text-sm mt-4 opacity-80">
                Bitte notieren Sie sich diesen Code
              </p>
            </div>
          </Card>

          {/* Reservation Details */}
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Details</h2>

            {/* Customer */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Kunde</p>
              <p className="text-lg font-semibold text-foreground">
                {reservation?.customer_name || 'Neuer Kunde'}
              </p>
              {reservation?.customer_iid && (
                <p className="text-sm text-muted-foreground">
                  Kundennummer: {reservation.customer_iid}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Artikel ({selectedItems.length})
              </p>
              <div className="space-y-2">
                {selectedItems.map((item) => {
                  const count = copyCounts[item.id] || 1;
                  return (
                    <div key={item.id} className="flex gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      {/* Item Image Thumbnail */}
                      <div className="relative w-16 h-16 flex-shrink-0 bg-neutral-200 rounded-md overflow-hidden">
                        {getItemImageUrl(item) && !imageErrors[item.id] ? (
                          <Image
                            src={getItemImageUrl(item)!}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                            onError={() => {
                              setImageErrors((prev) => ({ ...prev, [item.id]: true }));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                            <span className="text-xl font-black text-neutral-400 select-none">
                              {getItemInitials(item.name)}
                            </span>
                          </div>
                        )}

                        {/* IID Badge */}
                        <div className="absolute bottom-0.5 left-0.5 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                          {formatIID(item.iid)}
                        </div>
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.name}
                          </p>
                          {(item.brand || item.model) && (
                            <p className="text-xs text-muted-foreground">
                              {[item.brand, item.model].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(item.deposit * count)}
                          </p>
                          {count > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {count}×
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between bg-red-600 text-white px-6 py-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 fill-white/20" />
                  <span className="text-lg font-semibold">Gesamtkaution</span>
                </div>
                <span className="text-3xl font-bold tracking-tight">
                  {formatCurrency(totalDeposit)}
                </span>
              </div>
            </div>
          </Card>

          {/* Action Button */}
          <Button
            onClick={() => {
              // Clear sessionStorage
              sessionStorage.removeItem('selectedItems');
              sessionStorage.removeItem('copyCounts');
              sessionStorage.removeItem('completedReservation');
              router.push('/');
            }}
            size="lg"
            variant="outline"
            className="w-full h-16 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Zurück zur Startseite
          </Button>

        </div>
      </main>
    </div>
  );
}
