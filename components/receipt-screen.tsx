'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import type { Customer, Item } from '@/types';

export default function ReceiptScreen({
  customer,
  items,
  deposit,
  dueDate,
}: {
  customer: Customer;
  items: Item[];
  deposit: number;
  dueDate: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Erfolgreich ausgeliehen!</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-muted-foreground">Nutzer:in</p>
              <p className="text-xl font-semibold">
                {customer.firstname} {customer.lastname}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Gegenstände ({items.length})</p>
              <ul className="list-disc list-inside">
                {items.map(item => (
                  <li key={item.id} className="text-lg">{item.name}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Kaution:</span>
              <span className="font-bold text-2xl">{formatCurrency(deposit)}</span>
            </div>

            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Rückgabe bis:</span>
              <span className="font-semibold">{formatDate(dueDate)}</span>
            </div>
          </div>

          <Button
            onClick={() => router.push('/')}
            className="w-full h-14 text-lg"
          >
            Fertig
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Automatische Weiterleitung in 30 Sekunden
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
