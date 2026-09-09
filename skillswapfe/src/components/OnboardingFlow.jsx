import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Grid, Paper, TextField, MenuItem, Fade } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;
const API_URL = `${backendApiUrl}/api`;

const OnboardingFlow = ({ setIsLoggedIn }) => {
  const [step, setStep] = useState(0);
  const [learnSkills, setLearnSkills] = useState([]);
  const [teachSkills, setTeachSkills] = useState([]);
  const [bio, setBio] = useState('');
  const [skillLevels, setSkillLevels] = useState({});
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    const signupData = sessionStorage.getItem('signupData');
    if (!signupData) {
      window.location.href = '/';
      return;
    }
    if (token) setIsLoggedIn(true);
    setShowWelcome(true);
    const timer1 = setTimeout(() => setShowWelcome(false), 2000); 
    const timer2 = setTimeout(() => setWelcomeVisible(false), 2600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  const handleSkillSelect = (skill, type) => {
    if (type === 'learn') {
      setLearnSkills((prev) => prev.includes(skill) ? prev : [...prev, skill]);
    } else {
      setTeachSkills((prev) => prev.includes(skill) ? prev : [...prev, skill]);
    }
  };
  const handleSkillRemove = (skill, type) => {
    if (type === 'learn') {
      setLearnSkills((prev) => prev.filter(s => s !== skill));
    } else {
      setTeachSkills((prev) => prev.filter(s => s !== skill));
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleLevelChange = (skill, value) => {
    setSkillLevels((prev) => ({ ...prev, [skill]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!bio.trim()) {
      setError('Please enter a short bio.');
      return;
    }
    const signupData = JSON.parse(sessionStorage.getItem('signupData'));
    if (!signupData) {
      setError('Signup data missing. Please sign up again.');
      return;
    }
    const payload = {
      ...signupData,
      bio,
      skills: [
        ...learnSkills.map(skill => ({ name: skill, type: 'learn', level: (skillLevels[skill] || 'intermediate').toLowerCase() })),
        ...teachSkills.map(skill => ({ name: skill, type: 'teach', level: (skillLevels[skill] || 'intermediate').toLowerCase() })),
      ]
    };
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Signup failed.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data && data.token) {
        document.cookie = `token=${data.token}; path=/;`;
        localStorage.setItem('token', data.token);
      }
      setIsLoggedIn(true);
      sessionStorage.removeItem('signupData');
      setLoading(false);
      window.location.href = '/';
    } catch (err) {
      setError('Signup failed.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#1E1E1E', width: '100vw', overflowX: 'hidden' }}>
      {loading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(0,0,0,0.7)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Paper elevation={8} sx={{ p: 6, borderRadius: 4, bgcolor: '#181F1F', border: '2px solid #00FF9F', color: '#00FF9F', fontWeight: 700, fontSize: 28 }}>
            Signing you up...
          </Paper>
        </Box>
      )}
      {welcomeVisible && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.7)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity 0.7s',
            opacity: showWelcome ? 1 : 0,
            pointerEvents: showWelcome ? 'auto' : 'none',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18, duration: 0.7 }}
            style={{
              background: '#181F1F',
              borderRadius: 14,
              boxShadow: '0 0 24px 2px #00FF9F33',
              padding: '36px 48px',
              minWidth: 280,
              textAlign: 'center',
              border: '1.5px solid #00FF9F33',
              fontWeight: 400,
            }}
          >
            <Typography sx={{ color: '#00FF9F', fontWeight: 500, fontSize: 30, mb: 1, letterSpacing: 1 }}>
              Welcome to SkillSwap!
            </Typography>
          </motion.div>
        </Box>
      )}
      <Paper elevation={1} sx={{ p: 3, minWidth: 350, bgcolor: '#232323', color: 'white', borderRadius: 2, width: 800, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden', zIndex: 1, boxShadow: '0 0 2px #00FF9F22', border: '1px solid #00FF9F22' }}>
        {!showWelcome && (
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Fade in={step === 0} key="learn">
                <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }}>
                  <Typography variant="h5" color="#00FF9F" mb={2}>What do you want to learn?</Typography>
                  <Box sx={{
                    bgcolor: '#232323',
                    borderRadius: 2,
                    boxShadow: '0 0 2px #00FF9F22',
                    border: '1px solid #00FF9F22',
                    p: 3,
                    mb: 2,
                    maxHeight: 320,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#00FF9F22 #222',
                    '&::-webkit-scrollbar': {
                      width: 8,
                      background: '#222',
                      borderRadius: 8,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#00FF9F22',
                      borderRadius: 8,
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#00e68c22',
                    },
                  }}>
                    {skillCategories.map(cat => (
                      <Box key={cat.category} mb={1}>
                        <Typography variant="subtitle1" color="#00FF9F" sx={{ fontWeight: 400 }}>{cat.category}</Typography>
                        <Grid container spacing={1}>
                          {cat.skills.map(skill => (
                            <Grid item key={skill}>
                              <Chip
                                label={skill}
                                color={learnSkills.includes(skill) ? 'success' : 'default'}
                                onClick={() => handleSkillSelect(skill, 'learn')}
                                onDelete={learnSkills.includes(skill) ? () => handleSkillRemove(skill, 'learn') : undefined}
                                sx={{ m: 0.5, bgcolor: learnSkills.includes(skill) ? '#00FF9F' : '#444', color: learnSkills.includes(skill) ? 'black' : 'white', fontWeight: 400 }}
                              />
                              {learnSkills.includes(skill) && (
                                <TextField
                                  select
                                  size="small"
                                  value={skillLevels[skill] || 'intermediate'}
                                  onChange={e => handleLevelChange(skill, e.target.value)}
                                  sx={{ ml: 1, width: 120, bgcolor: '#333', color: 'white',
                                    '& .MuiSelect-icon': { display: 'none' },
                                    '& .MuiInputBase-input': { pr: 0 },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00FF9F' },
                                    '& .MuiSelect-select': { color: 'white' },
                                  }}
                                  SelectProps={{
                                    IconComponent: () => null
                                  }}
                                >
                                  {levels.map(lvl => <MenuItem key={lvl} value={lvl}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</MenuItem>)}
                                </TextField>
                              )}
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                  {error && <Typography color="#FF4D4D" mt={2}>{error}</Typography>}
                  <Button variant="contained" sx={{ mt: 3, bgcolor: '#00FF9F', color: 'black', fontWeight: 700 }} onClick={handleNext}>Next</Button>
                </motion.div>
              </Fade>
            )}
            {step === 1 && (
              <Fade in={step === 1} key="teach">
                <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }}>
                  <Typography variant="h5" color="#00FF9F" mb={2}>What can you teach?</Typography>
                  <Box sx={{
                    bgcolor: '#232323',
                    borderRadius: 2,
                    boxShadow: '0 0 2px #00FF9F22',
                    border: '1px solid #00FF9F22',
                    p: 3,
                    mb: 2,
                    maxHeight: 320,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#00FF9F22 #222',
                    '&::-webkit-scrollbar': {
                      width: 8,
                      background: '#222',
                      borderRadius: 8,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#00FF9F22',
                      borderRadius: 8,
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#00e68c22',
                    },
                  }}>
                    {skillCategories.map(cat => (
                      <Box key={cat.category} mb={1}>
                        <Typography variant="subtitle1" color="#00FF9F" sx={{ fontWeight: 400 }}>{cat.category}</Typography>
                        <Grid container spacing={1}>
                          {cat.skills.map(skill => (
                            <Grid item key={skill}>
                              <Chip
                                label={skill}
                                color={teachSkills.includes(skill) ? 'primary' : 'default'}
                                onClick={() => handleSkillSelect(skill, 'teach')}
                                onDelete={teachSkills.includes(skill) ? () => handleSkillRemove(skill, 'teach') : undefined}
                                sx={{ m: 0.5, bgcolor: teachSkills.includes(skill) ? '#00FF9F' : '#444', color: teachSkills.includes(skill) ? 'black' : 'white', fontWeight: 400 }}
                              />
                              {teachSkills.includes(skill) && (
                                <TextField
                                  select
                                  size="small"
                                  value={skillLevels[skill] || 'intermediate'}
                                  onChange={e => handleLevelChange(skill, e.target.value)}
                                  sx={{ ml: 1, width: 120, bgcolor: '#333', color: 'white',
                                    '& .MuiSelect-icon': { display: 'none' }, 
                                    '& .MuiInputBase-input': { pr: 0 },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00FF9F' },
                                    '& .MuiSelect-select': { color: 'white' },
                                  }}
                                  SelectProps={{
                                    IconComponent: () => null 
                                  }}
                                >
                                  {levels.map(lvl => <MenuItem key={lvl} value={lvl}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</MenuItem>)}
                                </TextField>
                              )}
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                  {error && <Typography color="#FF4D4D" mt={2}>{error}</Typography>}
                  <Box display="flex" justifyContent="space-between" mt={3}>
                    <Button variant="outlined" sx={{ color: '#00FF9F', borderColor: '#00FF9F' }} onClick={handleBack}>Back</Button>
                    <Button variant="contained" sx={{ bgcolor: '#00FF9F', color: 'black', fontWeight: 700 }} onClick={handleNext}>Next</Button>
                  </Box>
                </motion.div>
              </Fade>
            )}
            {step === 2 && (
              <Fade in={step === 2} key="bio">
                <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }}>
                  <Typography variant="h5" color="#00FF9F" mb={2}>Tell us about yourself</Typography>
                  <TextField
                    label="Short Bio"
                    multiline
                    minRows={3}
                    fullWidth
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    sx={{ mt: 2, bgcolor: '#333', color: '#00FF9F', input: { color: '#00FF9F' }, label: { color: '#00FF9F' }, textarea: { color: '#00FF9F' } }}
                  />
                  {error && <Typography color="#FF4D4D" mt={2}>{error}</Typography>}
                  <Box display="flex" justifyContent="space-between" mt={3}>
                    <Button variant="outlined" sx={{ color: '#00FF9F', borderColor: '#00FF9F' }} onClick={handleBack}>Back</Button>
                    <Button variant="contained" sx={{ bgcolor: '#00FF9F', color: 'black', fontWeight: 700 }} onClick={handleSubmit}>Finish</Button>
                  </Box>
                </motion.div>
              </Fade>
            )}
          </AnimatePresence>
        )}
      </Paper>
    </Box>
  );
};

export default OnboardingFlow;
