import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboardV2 from './components/AdminDashboardV2';
import CreateGame from './components/CreateGame';
import GameResult from './components/GameResult';
import GameResultsPage from './components/GameResultsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ArchivesPage from './components/ArchivesPage';
import { getHomeComponentForHost } from './sites/siteRouter';

function App() {
  const Home = getHomeComponentForHost(window.location.hostname);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard-v2" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />

        <Route path="/admin/create-game" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
        <Route path="/admin/edit-game/:gameId" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
        <Route path="/admin/game-result/:gameId" element={<ProtectedRoute><GameResult /></ProtectedRoute>} />
        <Route path="/admin/game-results" element={<ProtectedRoute><GameResultsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
