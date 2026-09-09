import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, TextField, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;
const API_URL = `${backendApiUrl}/api`;

const AuthForm = ({ setIsLoggedIn }) => {
  const [tab, setTab] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginData.email || !loginData.password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Login failed');
        return;
      }
      const data = await res.json();
      Cookies.set('token', data.token);
      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      sessionStorage.removeItem('signupData'); 
      navigate('/'); 
    } catch (err) {
        console.error(err);
      setError('Network error');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    // Basic validation
    if (!signupData.name || !signupData.email || !signupData.password) {
      setError('Please fill all fields.');
      return;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Save signup data and redirect to onboarding (do not call signup API here)
    sessionStorage.setItem('signupData', JSON.stringify(signupData));
    navigate('/onboarding');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#1E1E1E' }}>
      <Paper elevation={6} sx={{ p: 4, minWidth: 350, bgcolor: '#222', color: 'white', borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} centered textColor="inherit" TabIndicatorProps={{ style: { background: '#00FF9F' } }}>
          <Tab label="Login" sx={{ color: tab === 0 ? '#00FF9F' : 'white', fontWeight: 700 }} />
          <Tab label="Sign Up" sx={{ color: tab === 1 ? '#00FF9F' : 'white', fontWeight: 700 }} />
        </Tabs>
        {tab === 0 ? (
          <form onSubmit={handleLogin} style={{ marginTop: 24 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })}
              sx={{ input: { color: 'white' }, label: { color: 'wheat' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' }, '&:hover fieldset': { borderColor: '#00FF9F' } } }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              sx={{ input: { color: 'white' }, label: { color: 'wheat' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' }, '&:hover fieldset': { borderColor: '#00FF9F' } } }}
            />
            {error && <Typography color="#FF4D4D" mt={1}>{error}</Typography>}
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#00FF9F', color: 'black', fontWeight: 700, '&:hover': { bgcolor: '#00e68a' } }}>
              Login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={{ marginTop: 24, overflowY: 'auto', maxHeight: 400 }}>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={signupData.name}
              onChange={e => setSignupData({ ...signupData, name: e.target.value })}
              sx={{ input: { color: 'white' }, label: { color: 'wheat' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' }, '&:hover fieldset': { borderColor: '#00FF9F' } } }}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={signupData.email}
              onChange={e => setSignupData({ ...signupData, email: e.target.value })}
              sx={{ input: { color: 'white' }, label: { color: 'wheat' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' }, '&:hover fieldset': { borderColor: '#00FF9F' } } }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={signupData.password}
              onChange={e => setSignupData({ ...signupData, password: e.target.value })}
              sx={{ input: { color: 'white' }, label: { color: 'wheat' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' }, '&:hover fieldset': { borderColor: '#00FF9F' } } }}
            />
            {error && <Typography color="#FF4D4D" mt={1}>{error}</Typography>}
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#00FF9F', color: 'black', fontWeight: 700, '&:hover': { bgcolor: '#00e68a' } }}>
              Sign Up
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default AuthForm;
