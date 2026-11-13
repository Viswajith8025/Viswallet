"use client";

import { motion } from "motion/react";
import { LogoMark } from "@/components/brand/logo-mark";
import { BrandTagline } from "@/components/brand/brand-tagline";

export function SplashScreen() {
  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center"
      >
        <div className="shadow-[0_24px_56px_-28px_rgba(13,13,11,0.45)]">
          <LogoMark size={64} />
        </div>
        <BrandTagline className="mt-5 max-w-[14rem] text-center" />
      </motion.div>
    </div>
  );
}
