"use client";



import { motion } from "framer-motion";

import { EASE_OUT } from "@/components/ui/motion";



export function SplashScreen({ label = "Preparing your vault..." }: { label?: string }) {

  return (

    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(95,74,139,0.08),transparent)]" />

      <motion.div

        className="absolute h-64 w-64 rounded-full bg-primary/5 blur-3xl"

        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}

        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}

      />

      <motion.div

        className="relative flex flex-col items-center gap-6"

        initial={{ opacity: 0, y: 12 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ duration: 0.5, ease: EASE_OUT }}

      >

        <motion.div

          className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl font-semibold text-primary-foreground shadow-glow"

          animate={{ scale: [1, 1.02, 1] }}

          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}

        >

          V

          <motion.span

            className="absolute inset-0 rounded-xl ring-1 ring-primary/25"

            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}

            transition={{ duration: 2.5, repeat: Infinity }}

          />

        </motion.div>

        <div className="flex flex-col items-center gap-3">

          <div className="flex gap-1">

            {[0, 1, 2].map((i) => (

              <motion.span

                key={i}

                className="h-1.5 w-1.5 rounded-full bg-primary"

                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}

                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}

              />

            ))}

          </div>

          <p className="text-sm text-muted-foreground">{label}</p>

        </div>

      </motion.div>

    </div>

  );

}


