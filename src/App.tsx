import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import GameChart from './components/GameChart';
import GameResult from './components/GameResult';
import CreateGame from './components/CreateGame';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<GameResult />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create-game" element={<CreateGame />} />
          <Route path="/chart" element={<GameChart />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
