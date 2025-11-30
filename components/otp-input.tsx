'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Delete, ArrowLeft } from 'lucide-react';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: string;
  loading?: boolean;
}

export default function OTPInput({
  length = 6,
  onComplete,
  error,
  loading = false
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Clear OTP when error changes
  useEffect(() => {
    if (error) {
      setOtp(Array(length).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [error, length]);

  const handleKeypadClick = (digit: string) => {
    if (loading) return;

    const firstEmptyIndex = otp.findIndex(val => val === '');
    if (firstEmptyIndex !== -1) {
      const newOtp = [...otp];
      newOtp[firstEmptyIndex] = digit;
      setOtp(newOtp);

      // Check if OTP is complete
      if (firstEmptyIndex === length - 1) {
        onComplete(newOtp.join(''));
      } else {
        inputRefs.current[firstEmptyIndex + 1]?.focus();
      }
    }
  };

  const handleBackspace = () => {
    if (loading) return;

    const lastFilledIndex = otp.findIndex(val => val === '');
    const indexToDelete = lastFilledIndex === -1 ? length - 1 : lastFilledIndex - 1;

    if (indexToDelete >= 0) {
      const newOtp = [...otp];
      newOtp[indexToDelete] = '';
      setOtp(newOtp);
      inputRefs.current[indexToDelete]?.focus();
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (loading) return;

    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste
    if (value.length > 1) {
      const digits = value.slice(0, length).split('');
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus next empty or last input
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      // Check if complete
      if (!newOtp.includes('')) {
        onComplete(newOtp.join(''));
      }
    } else {
      // Single digit input
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if complete
      if (!newOtp.includes('')) {
        onComplete(newOtp.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (loading) return;

    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-16">
      {/* OTP Display */}
      <div className="flex justify-center gap-6">
        {otp.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              ...(digit ? {
                scale: [1, 1.15, 1],
              } : {})
            }}
            transition={{
              delay: index * 0.05,
              scale: { duration: 0.3, ease: "easeOut" }
            }}
          >
            <motion.input
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInputChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={loading}
              animate={{
                borderColor: digit
                  ? ['hsl(var(--border))', 'hsl(var(--primary))', 'hsl(var(--primary))']
                  : 'hsl(var(--border))'
              }}
              transition={{ duration: 0.3 }}
              className={`w-32 h-40 text-center font-mono font-bold border-3 rounded-xl
                bg-card/80 backdrop-blur-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-primary/50 focus:border-primary
                shadow-lg hover:shadow-xl
                ${error ? 'border-destructive animate-shake' : 'border-border'}
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${digit ? 'digit-glow shadow-primary/20' : ''}`}
              style={{
                willChange: 'transform, border-color',
                fontSize: '64px',
                lineHeight: '1'
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-destructive font-semibold text-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* On-Screen Keypad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-6 max-w-lg mx-auto"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <motion.div
            key={num}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
          >
            <Button
              onClick={() => handleKeypadClick(num.toString())}
              disabled={loading || !otp.includes('')}
              size="lg"
              variant="outline"
              className="h-28 w-full text-4xl font-bold border-3 hover:bg-primary hover:text-primary-foreground
                transition-all duration-200 shadow-lg hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </Button>
          </motion.div>
        ))}

        {/* Backspace Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          <Button
            onClick={handleBackspace}
            disabled={loading || otp.every(val => val === '')}
            size="lg"
            variant="outline"
            className="h-28 w-full border-3 hover:bg-destructive/10 hover:border-destructive
              transition-all duration-200 shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Delete className="" />
          </Button>
        </motion.div>

        {/* Zero Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          <Button
            onClick={() => handleKeypadClick('0')}
            disabled={loading || !otp.includes('')}
            size="lg"
            variant="outline"
            className="h-28 w-full text-4xl font-bold border-3 hover:bg-primary hover:text-primary-foreground
              transition-all duration-200 shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </Button>
        </motion.div>

        {/* Clear All Button - represented as back arrow */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          <Button
            onClick={() => {
              setOtp(Array(length).fill(''));
              inputRefs.current[0]?.focus();
            }}
            disabled={loading || otp.every(val => val === '')}
            size="lg"
            variant="outline"
            className="h-28 w-full text-4xl font-bold border-3 hover:bg-destructive/10 hover:border-destructive
              transition-all duration-200 shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            C
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
