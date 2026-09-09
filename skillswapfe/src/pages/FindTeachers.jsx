import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Rating, Button, CircularProgress } from '@mui/material';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;

const FindTeachers = () => {
  const { skillName } = useParams();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`${backendApiUrl}/api/teachers?skill=${encodeURIComponent(skillName)}`)
      .then(res => res.json())
      .then(data => {
        setTeachers(data);
        setLoading(false);
      });
  }, [skillName]);

  const handleMessage = async (teacher) => {
    // Get current user ID from token
    const token = Cookies.get('token') || localStorage.getItem('token');
    let userId;
    try {
      const payload = jose.decodeJwt(token);
      userId = payload.user.id;
    } catch {
      alert('Could not get user ID. Please log in again.');
      return;
    }
    if (userId === teacher.id) {
      alert('You cannot message yourself.');
      return;
    }
    // Create or get match
    try {
      const res = await fetch(`${backendApiUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user1Id: userId, user2Id: teacher.id, skill: skillName })
      });
      const data = await res.json();
      if (!data.matchId) throw new Error('No matchId returned');
      // Navigate to messages page and open the chat
      navigate('/messages', { state: { openMatchId: data.matchId } });
    } catch (err) {
      alert('Failed to start chat: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#121212',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#00FF9F' }} size={60} thickness={5} />
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ minHeight: '100vh', bgcolor: '#121212', color: 'white' }}>
      <Typography variant="h4" color="#00FF9F" mb={3}>
        Teachers for {skillName}
      </Typography>

      {teachers.length === 0 ? (
        <Typography>No teachers found for this skill.</Typography>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {teachers.map((teacher) => (
            <Box
              key={teacher.id}
              sx={{
                border: '1px solid #333',
                borderRadius: 3,
                p: 2,
                width: 250,
                bgcolor: '#1e1e1e',
                boxShadow: 2,
              }}
            >
              <Typography variant="h6" mb={1}>
                {teacher.name}
              </Typography>

              <Rating
                value={teacher.rating || 0}
                precision={0.5}
                readOnly
                sx={{
                  color: '#00FF9F',
                  '& .MuiRating-iconEmpty': {
                    color: 'white',
                  },
                }}
              />

              <Box mt={2} display="flex" gap={1}>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#00FF9F',
                    color: '#00FF9F',
                    '&:hover': {
                      bgcolor: '#00FF9F',
                      color: 'black',
                    },
                  }}
                  onClick={() => handleMessage(teacher)}
                >
                  Message
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#00FFF0',
                    color: '#00FFF0',
                    '&:hover': {
                      bgcolor: '#00FFF0',
                      color: 'black',
                    },
                  }}
                  onClick={() => navigate(`/profile/${teacher.id}`)}
                >
                  Profile
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FindTeachers;
