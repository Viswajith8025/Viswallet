"use client"

import { useEffect, useRef, useSyncExternalStore, type ComponentPropsWithoutRef } from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function formatTicker(value: number, decimalPlaces: number) {
  return Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const reduce = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false)
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (reduce) return
    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [motionValue, isInView, delay, value, direction, startValue, reduce])

  useEffect(() => {
    if (reduce) return
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatTicker(Number(latest.toFixed(decimalPlaces)), decimalPlaces)
      }
    })
  }, [springValue, decimalPlaces, reduce])

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums text-inherit", className)}
      {...props}
    >
      {formatTicker(reduce ? value : startValue, decimalPlaces)}
    </span>
  )
}
