'use client';

import { useEffect, useState } from 'react';

export function Clock() {
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!date) return null;

    return (
        <div className="flex flex-col items-end text-right">
            <div className="text-3xl font-bold tabular-nums tracking-tight">
                {date.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                {date.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                })}
            </div>
        </div>
    );
}
