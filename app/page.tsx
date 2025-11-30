'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingBag, Package, UserPlus, ArrowRight } from 'lucide-react';
import { LABELS } from '@/lib/constants/ui-labels';
import { motion } from 'framer-motion';
import { AnimatedDotGrid } from '@/components/ui/animated-dot-grid';
import Header from '@/components/header';
import Image from 'next/image';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated Dot Grid Background */}
      <AnimatedDotGrid />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 z-10 max-w-[100vw]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col gap-6"
        >

          <div className="flex-1 grid grid-rows-2 gap-6 min-h-0">
            {/* New Rental Button */}
            <Link href="/new-rental" className="h-full group">
              <motion.div
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Card className="border-3 h-full bg-card/80 backdrop-blur-sm border-primary hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden group-hover:bg-[#f20c0d]">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-full flex flex-col justify-center items-center bottom-10 text-center relative z-10">
                    <Image
                      className='group-hover:brightness-0 group-hover:invert'
                      src="/ausleihen.png"
                      alt="New Rental"
                      width={600}
                      height={100}
                    />
                  </div>
                </Card>
              </motion.div>
            </Link>

            {/* Pickup Reservation Button */}
            <Link href="/pickup-reservation" className="h-full group">
              <motion.div
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Card className="border-3 h-full bg-card/80 backdrop-blur-sm border-primary hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden group-hover:bg-[#f20c0d]">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-full flex flex-col justify-center items-center p-8 text-center relative z-10">
                    <Image
                      className='group-hover:brightness-0 group-hover:invert'
                      src="/abholen.png"
                      alt="New Rental"
                      width={600}
                      height={100}
                    />
                  </div>
                </Card>
              </motion.div>
            </Link>
          </div>

          {/* Footer */}
          <motion.div variants={item} className="text-center pb-4">
            <p className="text-sm text-muted-foreground/60 font-medium">
              Ein Projekt der Bürgerstiftung Karlsruhe
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
