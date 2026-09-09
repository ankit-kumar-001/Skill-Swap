import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MatchHistory from './pages/MatchHistory';
import Profile from './pages/Profile';
import FindTeachers from './pages/FindTeachers';
import Messages from './pages/Messages';
import AuthForm from './components/AuthForm';
import OnboardingFlow from './components/OnboardingFlow';
import ProfileView from './pages/ProfileView';
import AllSkills from './pages/AllSkills';
import BestMatches from './pages/BestMatches';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = (window && window.localStorage && localStorage.getItem('token')) || (window && window.document && document.cookie.match(/token=([^;]+)/)?.[1]);
    return !!token;
  });

  return (
    <Router>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            {!isLoggedIn ? (
              <>
                <Route path="/onboarding" element={<OnboardingFlow setIsLoggedIn={setIsLoggedIn} />} />
                <Route path="*" element={<AuthForm setIsLoggedIn={setIsLoggedIn} />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/matches" element={<MatchHistory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<ProfileView />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/find-teachers/:skillName" element={<FindTeachers />} />
                <Route path="/all-skills" element={<AllSkills />} />
                <Route path="/best-matches" element={<BestMatches />} />
              </>
            )}
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
