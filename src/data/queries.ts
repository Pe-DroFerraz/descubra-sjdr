import { useQuery } from '@tanstack/react-query';
import { catalog, CatalogUnavailable } from './api';
const retry = (count: number, error: Error) =>
  !(error instanceof CatalogUnavailable) && count < 1;
export function usePlaces() {
  return useQuery({
    queryKey: ['public', 'places'],
    queryFn: ({ signal }) => catalog.places(signal),
    staleTime: 60_000,
    retry,
  });
}
export function useCategories() {
  return useQuery({
    queryKey: ['public', 'categories'],
    queryFn: ({ signal }) => catalog.categories(signal),
    staleTime: 300_000,
    retry,
  });
}
export function useRoutes() {
  return useQuery({
    queryKey: ['public', 'routes'],
    queryFn: ({ signal }) => catalog.routes(signal),
    staleTime: 60_000,
    retry,
  });
}
export function useEvents() {
  return useQuery({
    queryKey: ['public', 'events'],
    queryFn: ({ signal }) => catalog.events(signal),
    staleTime: 60_000,
    retry,
  });
}
export function useTips() {
  return useQuery({
    queryKey: ['public', 'tips'],
    queryFn: ({ signal }) => catalog.tips(signal),
    staleTime: 60_000,
    retry,
  });
}
export function useBenefits() {
  return useQuery({
    queryKey: ['public', 'benefits'],
    refetchInterval: 30_000,
    queryFn: ({ signal }) => catalog.benefits(signal),
    staleTime: 60_000,
    retry,
  });
}
export function useSponsors(id?: string) {
  return useQuery({
    queryKey: ['public', 'sponsors', id],
    queryFn: ({ signal }) => catalog.sponsors(id!, signal),
    enabled: !!id,
    staleTime: 60_000,
    retry,
  });
}
export function useDetails(id?: string) {
  return useQuery({
    queryKey: ['public', 'details', id],
    queryFn: ({ signal }) => catalog.details(id!, signal),
    enabled: !!id,
    staleTime: 60_000,
    retry,
  });
}
