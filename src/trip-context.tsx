import { createContext, useContext, type PropsWithChildren } from 'react';
import { useLocalTrip } from './hooks/local-state';
const TripContext = createContext<ReturnType<typeof useLocalTrip> | null>(null);
export function TripProvider({ children }: PropsWithChildren) {
  return (
    <TripContext.Provider value={useLocalTrip()}>
      {children}
    </TripContext.Provider>
  );
}
export function useTrip() {
  const value = useContext(TripContext);
  if (!value) throw new Error('TripProvider required');
  return value;
}
