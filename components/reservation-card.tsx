import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ReservationExpanded } from '@/types';

export default function ReservationCard({
  reservation,
  onPickup,
}: {
  reservation: ReservationExpanded;
  onPickup: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{reservation.customer_name}</span>
          {reservation.is_new_customer && (
            <Badge variant="outline">Neue:r Nutzer:in</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reservation.customer_phone && (
          <p className="text-sm">Tel: {reservation.customer_phone}</p>
        )}

        <div>
          <p className="text-sm text-muted-foreground">Gegenstände:</p>
          <ul className="list-disc list-inside">
            {reservation.expand.items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>

        {reservation.comments && (
          <p className="text-sm text-muted-foreground italic">
            &quot;{reservation.comments}&quot;
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onPickup} className="w-full h-12 text-lg">
          Abholen
        </Button>
      </CardFooter>
    </Card>
  );
}
