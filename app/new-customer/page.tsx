'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import CustomerForm from '@/components/customer-form';
import { collections } from '@/lib/pocketbase/collections';
import { dateToLocalString } from '@/lib/utils/formatting';
import { useToast } from '@/hooks/use-toast';
import { LABELS } from '@/lib/constants/ui-labels';

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const handleSubmit = async (formData: any) => {
    try {
      const customer = await collections.customers().create({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        street: formData.street || undefined,
        postal_code: formData.postal_code || undefined,
        city: formData.city || undefined,
        registered_on: dateToLocalString(new Date()),
        newsletter: formData.newsletter || false,
        heard: formData.heard || undefined,
      });

      setCustomerName(`${customer.firstname} ${customer.lastname}`);
      setSuccess(true);

      toast({
        title: LABELS.success_customer,
        description: `Willkommen, ${customer.firstname}!`,
      });

      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Fehler',
        description: LABELS.error_network,
        variant: 'destructive',
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header title={LABELS.mode_new_customer} showBack={false} />
        <div className="pt-24 px-6 text-center">
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            {LABELS.success_customer}
          </h2>
          <p className="text-xl">Willkommen, {customerName}!</p>
          <p className="text-muted-foreground mt-4">
            Weiterleitung zum Hauptmenü...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title={LABELS.mode_new_customer} />
      <div className="pt-24 px-6 pb-12 max-w-2xl mx-auto">
        <CustomerForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
