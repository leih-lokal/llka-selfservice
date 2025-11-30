'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedDotGrid } from '@/components/ui/animated-dot-grid';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tag, User, Hash, Check, UserPlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { getItemImageUrl, getItemInitials } from '@/lib/utils/get-item-image-url';
import { collections } from '@/lib/pocketbase/collections';
import type { Item, Customer } from '@/types';
import { toast } from 'sonner';
import Image from 'next/image';

export default function CustomerIdentificationPage() {
  const router = useRouter();
  const [userInput, setUserInput] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNameSearch, setIsNameSearch] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Load data from sessionStorage on mount
  useEffect(() => {
    const itemsData = sessionStorage.getItem('selectedItems');
    const countsData = sessionStorage.getItem('copyCounts');

    if (itemsData) {
      setSelectedItems(JSON.parse(itemsData));
    }
    if (countsData) {
      setCopyCounts(JSON.parse(countsData));
    }

    // Redirect back if no items selected
    if (!itemsData || JSON.parse(itemsData).length === 0) {
      router.push('/new-rental');
    }
  }, [router]);

  // Calculate total deposit
  const totalDeposit = selectedItems.reduce((sum, item) => {
    const count = copyCounts[item.id] || 1;
    return sum + (item.deposit * count);
  }, 0);

  const handleConfirm = async () => {
    const input = userInput.trim();

    if (!input) {
      toast.error('Bitte geben Sie eine Kundennummer oder Ihren Namen ein');
      return;
    }

    setLoading(true);
    setFoundCustomer(null);

    try {
      // Check if input is a 4-digit number (IID lookup)
      const isFourDigits = /^\d{4}$/.test(input);

      if (isFourDigits) {
        // IID lookup - exact match only
        const iid = parseInt(input, 10);
        const customers = await collections.customers().getFullList({
          filter: `iid = ${iid}`,
        });

        if (customers.length === 0) {
          toast.error('Kundennummer nicht gefunden', {
            description: 'Bitte überprüfen Sie Ihre Eingabe oder geben Sie Ihren Namen ein.',
          });
          setLoading(false);
          return;
        }

        // Found customer by IID
        setFoundCustomer(customers[0]);
        setIsNameSearch(false);
        toast.success('Kunde gefunden!');
      } else {
        // Name lookup - try different combinations of firstname/lastname split
        const parts = input.split(' ').filter(p => p.length > 0);

        if (parts.length < 2) {
          toast.error('Bitte geben Sie Vor- und Nachname ein', {
            description: 'Format: Vorname Nachname',
          });
          setLoading(false);
          return;
        }

        // Try all possible splits between firstname and lastname
        // For "Ruby Morgan Voigt", try:
        // - firstname="Ruby" lastname="Morgan Voigt"
        // - firstname="Ruby Morgan" lastname="Voigt"
        // Case-insensitive comparison
        let customers: Customer[] = [];

        for (let i = 1; i < parts.length; i++) {
          const firstname = parts.slice(0, i).join(' ');
          const lastname = parts.slice(i).join(' ');

          // Get all customers and filter case-insensitively in JS
          // PocketBase filters are case-sensitive, so we need to do this client-side
          const allCustomers = await collections.customers().getFullList();

          const result = allCustomers.filter(customer =>
            customer.firstname.toLowerCase() === firstname.toLowerCase() &&
            customer.lastname.toLowerCase() === lastname.toLowerCase()
          );

          if (result.length > 0) {
            customers = result;
            break; // Found a match, stop trying
          }
        }

        if (customers.length === 0) {
          toast.error('Kunde nicht gefunden', {
            description: 'Bitte überprüfen Sie die Schreibweise oder klicken Sie auf "Ich bin neu hier".',
          });
          setIsNameSearch(true);
          setLoading(false);
          return;
        }

        // Found customer by name
        setFoundCustomer(customers[0]);
        setIsNameSearch(true);
        toast.success('Kunde gefunden!');
      }
    } catch (error) {
      console.error('Customer lookup error:', error);
      toast.error('Fehler bei der Suche', {
        description: 'Bitte versuchen Sie es erneut.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewCustomer = () => {
    // Show confirmation card for new customer
    setIsNewCustomer(true);
    setFoundCustomer(null);
    toast.success('Neuer Kunde', {
      description: 'Bereit für Registrierung',
    });
  };

  const handleSubmitReservation = async () => {
    setLoading(true);

    try {
      // Get selected items from sessionStorage
      const itemsData = sessionStorage.getItem('selectedItems');
      const selectedItems = itemsData ? JSON.parse(itemsData) : [];

      // Validate we have items
      if (selectedItems.length === 0) {
        toast.error('Keine Artikel ausgewählt', {
          description: 'Bitte wählen Sie mindestens einen Artikel aus.',
        });
        setLoading(false);
        return;
      }

      // Calculate pickup time (dev server workaround: next Monday at 16:00)
      const getPickupTime = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);

        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(16, 0, 0, 0);

        return nextMonday.toISOString();
      };

      // Prepare reservation data
      const reservationData = {
        // Customer identification
        customer_iid: foundCustomer?.iid.toString() || null,
        customer_name: foundCustomer
          ? `${foundCustomer.firstname} ${foundCustomer.lastname}`
          : userInput.trim(), // Use the entered name for new customers
        customer_phone: null,
        customer_email: null,

        // New customer flag
        is_new_customer: isNewCustomer,

        // Items
        items: selectedItems.map((item: Item) => item.id),

        // Timing (dev server workaround: next Monday 16:00)
        pickup: getPickupTime(),

        // On-premises flag
        on_premises: true,

        // Status
        done: false,
        comments: null,
      };

      // POST to PocketBase
      const reservation = await collections.reservations().create(reservationData);

      // Store reservation in sessionStorage for success page
      sessionStorage.setItem('completedReservation', JSON.stringify(reservation));

      // Navigate to success page
      router.push('/new-rental/success');

    } catch (error) {
      console.error('Reservation submission error:', error);
      toast.error('Fehler beim Absenden', {
        description: 'Bitte versuchen Sie es erneut.',
      });
    } finally {
      setLoading(false);
    }
  };

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
          { label: 'Kunde identifizieren' }
        ]}
      />

      <main className="flex-1 p-8 z-10">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Kunde identifizieren
            </h1>
            <p className="text-lg text-muted-foreground">
              Bitte geben Sie Ihre Kundennummer oder Ihren Namen ein
            </p>
          </div>

          {/* Selected Items Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Ausgewählte Artikel ({selectedItems.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {selectedItems.map((item) => {
                const copyCount = copyCounts[item.id] || 1;

                return (
                  <div key={item.id} className="flex gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    {/* Item Image Thumbnail */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-200 rounded-md overflow-hidden">
                      {getItemImageUrl(item) && !imageErrors[item.id] ? (
                        <Image
                          src={getItemImageUrl(item)!}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                          onError={() => {
                            setImageErrors((prev) => ({ ...prev, [item.id]: true }));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                          <span className="text-2xl font-black text-neutral-400 select-none">
                            {getItemInitials(item.name)}
                          </span>
                        </div>
                      )}

                      {/* IID Badge */}
                      <div className="absolute bottom-0.5 left-0.5 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                        {formatIID(item.iid)}
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
                        {item.name}
                      </div>
                      {(item.brand || item.model) && (
                        <div className="text-[11px] text-muted-foreground mb-2">
                          {[item.brand, item.model].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-red-600">
                          {formatCurrency(item.deposit)}
                        </div>
                        {copyCount > 1 && (
                          <div className="text-xs font-semibold text-neutral-600">
                            {copyCount}×
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Deposit - Prominent */}
            <div className="border-t-2 border-neutral-200 pt-4">
              <div className="flex items-center justify-between bg-red-600 text-white px-6 py-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 fill-white/20" />
                  <span className="text-lg font-semibold">Gesamtkaution</span>
                </div>
                <div className="text-4xl font-bold tracking-tight">
                  {formatCurrency(totalDeposit)}
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Input Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-muted-foreground" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Kundeninformation
                </h2>
              </div>

              {/* Input Field */}
              <div className="space-y-2">
                <label htmlFor="customer-input" className="text-sm font-medium text-foreground">
                  Kundennummer oder Name
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  <Input
                    id="customer-input"
                    type="text"
                    placeholder="z.B. 1234 oder Max Mustermann"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirm();
                      }
                    }}
                    className="pl-14 h-16 text-xl border-2 border-border focus:border-primary shadow-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Geben Sie Ihre 4-stellige Kundennummer oder Ihren vollständigen Namen ein
                </p>
              </div>

              {/* Action Buttons - Both grey until user types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Confirm Button */}
                {/* New Customer Button */}
                <Button
                  onClick={handleNewCustomer}
                  disabled={!userInput.trim() || loading}
                  size="lg"
                  variant="outline"
                  className={`h-16 text-xl font-bold transition-colors ${
                    userInput.trim()
                      ? 'border-2 border-primary text-primary hover:bg-primary/10'
                      : 'bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed hover:bg-neutral-300'
                  }`}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Ich bin neu hier
                </Button>
                
                <Button
                  onClick={handleConfirm}
                  disabled={!userInput.trim() || loading}
                  size="lg"
                  className={`h-16 text-xl font-bold transition-colors ${
                    userInput.trim()
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-neutral-300 text-neutral-500 cursor-not-allowed hover:bg-neutral-300'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      <span>Suche...</span>
                    </div>
                  ) : (
                    'Kunde bestätigen'
                  )}
                </Button>

                
              </div>

              {/* Customer Found Card */}
              {foundCustomer && (
                <Card className="p-6 bg-green-50 border-2 border-green-500 animate-in fade-in-50 zoom-in-95 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 text-white rounded-full p-3">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-900">
                        {foundCustomer.firstname} {foundCustomer.lastname}
                      </h3>
                      <p className="text-sm text-green-700">
                        Kundennummer: {String(foundCustomer.iid).padStart(4, '0')}
                      </p>
                    </div>
                  </div>

                  {/* Continue with this customer */}
                  <Button
                    onClick={handleSubmitReservation}
                    disabled={loading}
                    size="lg"
                    className="w-full mt-4 h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        <span>Wird abgesendet...</span>
                      </div>
                    ) : (
                      'Ausleihe absenden'
                    )}
                  </Button>
                </Card>
              )}

              {/* New Customer Card */}
              {isNewCustomer && !foundCustomer && (
                <Card className="p-6 bg-green-50 border-2 border-green-500 animate-in fade-in-50 zoom-in-95 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 text-white rounded-full p-3">
                      <UserPlus className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-900">
                        Neuer Kunde
                      </h3>
                      <p className="text-sm text-green-700">
                        Eingabe: {userInput}
                      </p>
                    </div>
                  </div>

                  {/* Continue with new customer registration */}
                  <Button
                    onClick={handleSubmitReservation}
                    disabled={loading}
                    size="lg"
                    className="w-full mt-4 h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        <span>Wird abgesendet...</span>
                      </div>
                    ) : (
                      'Ausleihe absenden'
                    )}
                  </Button>
                </Card>
              )}

            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}
