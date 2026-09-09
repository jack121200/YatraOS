import { create } from "zustand";

export interface DayPlanItem {
  id: string;
  name: string;
  category: string;
  avg_cost: number;
  avg_duration_min: number | null;
  start_minutes: number;
}

export interface BuiltTrip {
  city: string;
  currency: string;
  budget: number;
  dayPlan: DayPlanItem[];
  totalCost: number;
  interests: string[];
  pace: string;
}

interface TripState {
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;
  lastBuiltTrip: BuiltTrip | null;
  setLastBuiltTrip: (trip: BuiltTrip | null) => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTripId: null,
  setActiveTripId: (id) => set({ activeTripId: id }),
  lastBuiltTrip: null,
  setLastBuiltTrip: (trip) => set({ lastBuiltTrip: trip }),
}));
