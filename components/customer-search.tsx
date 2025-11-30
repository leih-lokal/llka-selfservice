'use client';

import { useState, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { searchCustomers } from '@/lib/pocketbase/queries';
import type { Customer } from '@/types';

export default function CustomerSearch({
  onSelect
}: {
  onSelect: (customer: Customer) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const customers = await searchCustomers(query);
        setResults(customers);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Command className="border rounded-lg">
      <CommandInput
        placeholder="Suche nach Name, Telefon oder ID..."
        value={query}
        onValueChange={setQuery}
        className="h-14 text-lg"
      />
      <CommandList className="max-h-96">
        <CommandEmpty>
          {loading ? 'Suche...' : 'Keine Nutzer:innen gefunden'}
        </CommandEmpty>
        {results.map((customer) => (
          <CommandItem
            key={customer.id}
            onSelect={() => onSelect(customer)}
            className="p-4 cursor-pointer"
          >
            <div>
              <p className="font-semibold text-lg">
                {customer.firstname} {customer.lastname}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: #{customer.iid.toString().padStart(4, '0')}
                {customer.phone && ` • ${customer.phone}`}
              </p>
            </div>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
