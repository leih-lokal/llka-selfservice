import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import type { Customer, Item } from '@/types';

export default function RentalSummary({
  customer,
  items,
  copyCounts,
  totalDeposit,
  rentedOn,
  expectedOn,
}: {
  customer: Customer;
  items: Item[];
  copyCounts: Record<string, number>;
  totalDeposit: number;
  rentedOn: string;
  expectedOn: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zusammenfassung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Nutzer:in</p>
          <p className="text-lg font-semibold">
            {customer.firstname} {customer.lastname}
          </p>
          <p className="text-sm text-muted-foreground">
            ID: #{customer.iid.toString().padStart(4, '0')}
          </p>
        </div>

        <Separator />

        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Gegenstände ({items.length})
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.name}
                  {copyCounts[item.id] > 1 && ` (${copyCounts[item.id]}×)`}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.deposit * (copyCounts[item.id] || 1))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div className="flex justify-between text-xl">
          <span className="font-semibold">Gesamtkaution:</span>
          <span className="font-bold">{formatCurrency(totalDeposit)}</span>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Ausleihdatum</p>
            <p className="font-medium">{formatDate(rentedOn)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rückgabe bis</p>
            <p className="font-medium">{formatDate(expectedOn)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
