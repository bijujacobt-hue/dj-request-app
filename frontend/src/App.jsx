import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import GuestEvent from './pages/GuestEvent';
import DJDashboard from './pages/DJDashboard';
import EventManager from './pages/EventManager';

function Home() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">DJ Request App</h1>
        <p className="text-slate-400 mb-8">Ask your DJ for an event link to request songs.</p>
        <Link
          to="/dj"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium"
        >
          DJ Login
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:eventId" element={<GuestEvent />} />
        <Route path="/dj" element={<DJDashboard />} />
        <Route path="/dj/event/:eventId" element={<EventManager />} />
      </Routes>
    </BrowserRouter>
  );
}
