"use client";

import { SuccessPop } from "@/components/ui/motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { motion } from "framer-motion";

export function SuccessMark({
  size = "lg",
  className,
  label = "Saved successfully",
}: {
  size?: "md" | "lg";
  className?: string;
  label?: string;
}) {
  const box = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const icon = size === "lg" ? 28 : 22;

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <SuccessPop className={cn("relative flex items-center justify-center rounded-2xl bg-success-muted text-success", box)}>
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
        >
          <Check size={icon} strokeWidth={2.5} />
        </motion.div>
      </SuccessPop>
      {label && (
        <motion.p
          className="mt-4 font-semibold"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
