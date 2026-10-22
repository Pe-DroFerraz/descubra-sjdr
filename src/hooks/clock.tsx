import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
const Clock = createContext<number | null>(null);
export function ClockProvider({ children }: PropsWithChildren) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return <Clock.Provider value={now}>{children}</Clock.Provider>;
}
export function useClock() {
  return new Date(useContext(Clock) ?? Date.now());
}
