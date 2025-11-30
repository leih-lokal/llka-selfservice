'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { LABELS } from '@/lib/constants/ui-labels';

export default function CustomerForm({
  onSubmit
}: {
  onSubmit: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    street: '',
    postal_code: '',
    city: '',
    newsletter: false,
    heard: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstname">{LABELS.firstname} *</Label>
          <Input
            id="firstname"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            required
            className="h-14 text-lg"
          />
        </div>

        <div>
          <Label htmlFor="lastname">{LABELS.lastname} *</Label>
          <Input
            id="lastname"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            required
            className="h-14 text-lg"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">{LABELS.email}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="h-14 text-lg"
        />
      </div>

      <div>
        <Label htmlFor="phone">{LABELS.phone}</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="h-14 text-lg"
        />
      </div>

      <div>
        <Label htmlFor="street">{LABELS.street}</Label>
        <Input
          id="street"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="h-14 text-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postal_code">{LABELS.postal_code}</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            className="h-14 text-lg"
          />
        </div>

        <div>
          <Label htmlFor="city">{LABELS.city}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="h-14 text-lg"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="heard">{LABELS.heard}</Label>
        <Textarea
          id="heard"
          value={formData.heard}
          onChange={(e) => setFormData({ ...formData, heard: e.target.value })}
          className="min-h-24 text-lg"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="newsletter"
          checked={formData.newsletter}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, newsletter: checked as boolean })
          }
        />
        <Label htmlFor="newsletter" className="cursor-pointer">
          {LABELS.newsletter}
        </Label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 text-lg"
      >
        {loading ? 'Wird gespeichert...' : 'Registrieren'}
      </Button>
    </form>
  );
}
