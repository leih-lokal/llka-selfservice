'use client';

import { motion } from 'framer-motion';

export function AnimatedDotGrid() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute inset-0"
                animate={{
                    x: [0, -60, 0],
                    y: [0, -60, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.2) 2px, transparent 2px)`,
                    backgroundSize: '40px 40px',
                    width: 'calc(100% + 40px)',
                    height: 'calc(100% + 40px)',
                }}
            />
        </div>
    );
}
