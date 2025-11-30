'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedDotGrid } from '@/components/ui/animated-dot-grid';
import Header from '@/components/header';
import OTPInput from '@/components/otp-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { collections } from '@/lib/pocketbase/collections';
import { calculateDeposit } from '@/lib/pocketbase/queries';
import { formatCurrency } from '@/lib/utils/formatting';
import { CheckCircle, User, Package, Loader2 } from 'lucide-react';
import type { ReservationExpanded, Item } from '@/types';

type FlowState = 'otp' | 'details' | 'confirmed';

export default function PickupReservationPage() {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>('otp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<ReservationExpanded | null>(null);
  const [deposit, setDeposit] = useState(0);

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError('');

    try {
      // Build filter to find reservation by OTP
      // NOTE: Filter by pickup date = today for production
      // For testing, this filter is commented out - uncomment for production:
      // const today = new Date().toISOString().split('T')[0];
      // const filter = `otp = "${otp}" && pickup = "${today}" && done = false`;

      // TESTING VERSION (no date filter):
      const filter = `otp = "${otp}" && done = false`;

      const reservations = await collections.reservations().getFullList({
        filter,
        expand: 'items',
      });

      if (reservations.length === 0) {
        setError('Ungültiger Code oder keine Reservierung für heute gefunden.');
        setLoading(false);
        return;
      }

      const foundReservation = reservations[0] as ReservationExpanded;
      setReservation(foundReservation);

      // Calculate deposit
      const totalDeposit = calculateDeposit(foundReservation.expand.items, {});
      setDeposit(totalDeposit);

      // Move to details state
      setFlowState('details');
    } catch (err) {
      console.error('Error fetching reservation:', err);
      setError('Fehler beim Abrufen der Reservierung. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!reservation) return;

    setLoading(true);
    try {
      // Update reservation to set on_premises = true
      // NOTE: This will error if the field doesn't exist yet - this is expected behavior
      await collections.reservations().update(reservation.id, {
        on_premises: true,
      });

      // Move to confirmed state
      setFlowState('confirmed');
    } catch (err) {
      console.error('Error updating reservation:', err);
      // For now, still move to confirmed state even if update fails
      // This is expected behavior as mentioned by user
      setFlowState('confirmed');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col overflow-hidden">
      <AnimatedDotGrid />

      <Header
        breadcrumbs={[
          { label: 'Startseite', href: '/' },
          { label: 'Reservierung abholen' }
        ]}
      />

      <main className="flex-1 flex items-center justify-center p-8 z-10">
        <AnimatePresence mode="wait">
          {flowState === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-6xl px-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-20"
              >
                <h1 className="text-6xl font-bold mb-6">
                  Reservierung abholen
                </h1>
                <p className="text-3xl text-muted-foreground">
                  Gib hier den Code aus der Email ein, die du bekommen hast
                </p>
              </motion.div>

              <OTPInput
                length={6}
                onComplete={handleOTPComplete}
                error={error}
                loading={loading}
              />

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mt-12"
                >
                  <Loader2 className="w-16 h-16 animate-spin text-primary" />
                </motion.div>
              )}
            </motion.div>
          )}

          {flowState === 'details' && reservation && (
            <motion.div
              key="details"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-3xl"
            >
              <Card className="">
                <CardContent className="pt-12 pb-10 px-10">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                  >
                    <h1 className="text-4xl font-bold mb-4">
                      Reservierung gefunden!
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      Bitte überprüfen Sie die Details
                    </p>
                  </motion.div>

                  <div className="space-y-8">
                    {/* Customer Info */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-muted/50 rounded-lg p-6"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <User className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Nutzer:in</h2>
                      </div>
                      <p className="text-2xl font-bold ml-9">
                        {reservation.customer_name}
                      </p>
                      {reservation.customer_iid && (
                        <p className="text-lg text-muted-foreground ml-9">
                          ID: {reservation.customer_iid}
                        </p>
                      )}
                    </motion.div>

                    {/* Items List */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-muted/50 rounded-lg p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Package className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">
                          Artikel ({reservation.expand.items.length})
                        </h2>
                      </div>
                      <ul className="space-y-3 ml-9">
                        {reservation.expand.items.map((item: Item) => (
                          <li key={item.id} className="flex justify-between items-center">
                            <span className="text-xl">{item.name}</span>
                            <span className="text-lg text-muted-foreground">
                              IID: {item.iid}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* Deposit */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-primary/10 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-semibold">Kaution:</span>
                        <span className="text-4xl font-bold text-primary">
                          {formatCurrency(deposit)}
                        </span>
                      </div>
                    </motion.div>

                    {/* Confirm Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        size="lg"
                        className="w-full h-20 text-2xl font-bold bg-primary hover:bg-primary/90
                          shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {loading ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          'Bestätigen'
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {flowState === 'confirmed' && reservation && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl"
            >
              <Card className="border-3 bg-card/80 backdrop-blur-sm shadow-2xl">
                <CardContent className="pt-12 pb-10 px-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="text-center mb-10"
                  >
                    <CheckCircle className="w-32 h-32 text-green-500 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4">
                      Reservierung bestätigt!
                    </h1>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="bg-muted/50 rounded-lg p-6 text-center">
                      <p className="text-2xl font-semibold mb-4">
                        Bitte wenden Sie sich an unser Personal
                      </p>
                      <p className="text-xl text-muted-foreground mb-6">
                        um die Ausleihe abzuschließen.
                      </p>
                      <div className="bg-primary/10 rounded-lg p-6 border-2 border-primary/30">
                        <p className="text-lg font-semibold mb-2">
                          Bitte halten Sie bereit:
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {formatCurrency(deposit)}
                        </p>
                        <p className="text-lg text-muted-foreground mt-1">
                          Kaution
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleReturnToHome}
                      size="lg"
                      className="w-full h-16 text-xl font-bold"
                    >
                      Zur Startseite
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
