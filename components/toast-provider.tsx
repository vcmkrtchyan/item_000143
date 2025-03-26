"use client"

import { Toaster } from "@/components/ui/toaster"

export function ToastProvider() {
  return (
    <Toaster
      toastOptions={{
        duration: 5000, // Show toast for 5 seconds
      }}
    />
  )
}

