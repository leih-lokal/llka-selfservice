'use client';

import { useState, useEffect } from 'react';
import { getTodayReservations } from '@/lib/pocketbase/queries';
import ReservationCard from './reservation-card';
import LoadingSpinner from './loading-spinner';
import type { ReservationExpanded } from '@/types';

export default function ReservationSearch({
  onSelect,
}: {
  onSelect: (reservation: ReservationExpanded) => void;
}) {
  const [reservations, setReservations] = useState<ReservationExpanded[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await getTodayReservations();
      setReservations(data as ReservationExpanded[]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">
          Keine offenen Reservierungen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          onPickup={() => onSelect(reservation)}
        />
      ))}
    </div>
  );
}
