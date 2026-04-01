"use client";

import { useEffect, useState } from "react";
import { Check } from "@phosphor-icons/react";

type SnackbarItem = { id: number; message: string; phase: "entering" | "visible" | "exiting" };

let nextId = 0;

export function showSnackbar(message: string) {
  window.dispatchEvent(
    new CustomEvent("app:snackbar", { detail: { id: nextId++, message } }),
  );
}

export function Snackbar() {
  const [items, setItems] = useState<SnackbarItem[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const { id, message } = (e as CustomEvent<{ id: number; message: string }>).detail;
      setItems((prev) => [...prev, { id, message, phase: "entering" }]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, phase: "visible" } : i)));
        });
      });

      setTimeout(() => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, phase: "exiting" } : i)));
        setTimeout(() => {
          setItems((prev) => prev.filter((i) => i.id !== id));
        }, 300);
      }, 2700);
    }
    window.addEventListener("app:snackbar", handler);
    return () => window.removeEventListener("app:snackbar", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[70] flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-lg bg-[#D4D3DF] px-4 py-3 text-[13px] font-medium text-[#646373] shadow-lg transition-all duration-300 ease-out"
          style={{
            opacity: item.phase === "visible" ? 1 : 0,
            transform: item.phase === "entering"
              ? "translateY(12px)"
              : item.phase === "exiting"
                ? "translateY(8px)"
                : "translateY(0)",
          }}
        >
          <Check size={14} weight="bold" />
          {item.message}
        </div>
      ))}
    </div>
  );
}
