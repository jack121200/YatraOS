import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import TripBuilder from "./pages/traveller/TripBuilder";
import ItineraryView from "./pages/traveller/ItineraryView";
import DisruptionModal from "./pages/traveller/DisruptionModal";
import RecoveryPicker from "./pages/traveller/RecoveryPicker";
import Dashboard from "./pages/operator/Dashboard";
import TripsList from "./pages/operator/TripsList";
import AlertsPanel from "./pages/operator/AlertsPanel";
import VendorView from "./pages/operator/VendorView";

export default function App() {
  return (
    <div className="min-h-dvh bg-canvas">
      <Nav />

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/plan" element={<TripBuilder />} />
          <Route path="/itinerary" element={<ItineraryView />} />
          <Route path="/disruption" element={<DisruptionModal />} />
          <Route path="/recovery" element={<RecoveryPicker />} />

          <Route path="/operator" element={<Dashboard />} />
          <Route path="/operator/trips" element={<TripsList />} />
          <Route path="/operator/alerts" element={<AlertsPanel />} />
          <Route path="/operator/vendor" element={<VendorView />} />
        </Routes>
      </main>

      <footer className="border-t border-border px-4 py-8">
        <p className="mx-auto max-w-6xl text-xs text-slate">
          YatraOS — HackCelestial 3.0. Demo runs on hand-curated data for 7 cities.
        </p>
      </footer>
    </div>
  );
}
