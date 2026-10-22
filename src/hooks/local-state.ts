import { useState } from 'react';
import { z } from 'zod';
const item = z.object({
  id: z.string().uuid(),
  day: z.number().int().min(1).max(30),
});
export const itinerarySchema = z
  .array(item)
  .max(100)
  .refine((items) => new Set(items.map((i) => i.id)).size === items.length);
export type ItineraryItem = z.infer<typeof item>;
export function parseItinerary(value: string | null): ItineraryItem[] {
  try {
    const parsed = itinerarySchema.safeParse(JSON.parse(value ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
export function encodeItinerary(items: ItineraryItem[]) {
  return encodeURIComponent(JSON.stringify(itinerarySchema.parse(items)));
}
export function decodeItinerary(value: string): ItineraryItem[] {
  try {
    return itinerarySchema.parse(JSON.parse(value));
  } catch {
    return [];
  }
}
export function useLocalTrip() {
  const [storageError, setStorageError] = useState(false);
  const [items, setItems] = useState<ItineraryItem[]>(() => {
    try {
      return parseItinerary(localStorage.getItem('sjdr-trip-v1'));
    } catch {
      return [];
    }
  });
  function save(next: ItineraryItem[]) {
    const validated = itinerarySchema.safeParse(next);
    if (!validated.success) return;
    setItems(validated.data);
    try {
      localStorage.setItem('sjdr-trip-v1', JSON.stringify(validated.data));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  return {
    items,
    save,
    storageError,
    toggle: (id: string) =>
      save(
        items.some((i) => i.id === id)
          ? items.filter((i) => i.id !== id)
          : [...items, { id, day: 1 }],
      ),
  };
}
export function useLocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>(
    'idle',
  );
  function locate() {
    if (!navigator.geolocation) {
      setState('error');
      return;
    }
    setState('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setState('success');
      },
      () => setState('error'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }
  return { position, state, locate };
}
