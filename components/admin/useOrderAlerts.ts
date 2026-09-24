"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_KEY = "tia-admin-sound";

/** A short two-tone chime made with the browser's own audio — no sound file needed. */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const tone = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.45);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.5);
    };
    tone(880, 0);
    tone(1175, 0.3);
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // Audio unavailable — the vibration / title alert still work.
  }
}

/**
 * Alerts the admin when a NEW pending order appears in the list: chime, phone
 * vibration and a flashing browser-tab title. The very first load never
 * alerts (those orders aren't new). Sound must be switched on once with a
 * tap, because browsers block audio until the person interacts with the page.
 */
export function useOrderAlerts(orders: { id: string; status: string }[], loaded: boolean) {
  const [soundOn, setSoundOn] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const baseTitle = useRef<string>("");

  useEffect(() => {
    try {
      setSoundOn(localStorage.getItem(SOUND_KEY) === "1");
    } catch {
      // ignore
    }
    baseTitle.current = document.title;
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      if (next) chime(); // confirms sound works, and unlocks audio for later alerts
      return next;
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const ids = new Set(orders.map((o) => o.id));
    if (seen.current === null) {
      seen.current = ids; // first load: remember, don't alert
      return;
    }
    const fresh = orders.filter((o) => o.status === "PENDING" && !seen.current!.has(o.id));
    seen.current = ids;
    if (fresh.length === 0) return;

    if (soundOn) chime();
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      // ignore
    }
    // Flash the tab title until the admin looks at the page again.
    const original = baseTitle.current || document.title;
    let on = true;
    const timer = setInterval(() => {
      document.title = on ? `🔔 ${fresh.length} new order${fresh.length > 1 ? "s" : ""}!` : original;
      on = !on;
    }, 1000);
    const stop = () => {
      clearInterval(timer);
      document.title = original;
      window.removeEventListener("focus", stop);
    };
    if (document.hasFocus()) setTimeout(stop, 8000);
    else window.addEventListener("focus", stop);
  }, [orders, loaded, soundOn]);

  return { soundOn, toggleSound };
}
