'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Clock } from '@/components/ui/clock';
import Link from 'next/link';
import { Fragment } from 'react';

interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Header({ breadcrumbs }: HeaderProps) {
  return (
    <header className="sticky top-0 w-full p-8 flex justify-between items-start z-20 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/">
          <Image
            src="/leihlokal.svg"
            alt="leih.lokal"
            width={180}
            height={60}
            className="h-16 w-auto"
            priority
          />
        </Link>
        <div className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <Fragment key={index}>
                {index > 0 && <span>&gt;</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </Fragment>
            ))
          ) : (
            <p>Selbstbedienungs-Terminal</p>
          )}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Clock />
      </motion.div>
    </header>
  );
}
