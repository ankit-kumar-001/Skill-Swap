import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const MatchHistory = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setLoading(false);
      return;
    }
    let userId;
    try {
      const payload = jose.decodeJwt(token);
      userId = payload.user.id;
      if (!userId) throw new Error('No userId in token');
    } catch (e) {
      setLoading(false);
      return;
    }
    fetch('http://localhost:4000/api/matches?userId=' + userId, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: '#1E1E1E', color: 'white', p: 4 }}>
      <Typography variant="h4" sx={{ color: '#00FF9F', mb: 3, fontWeight: 700 }}>Match History</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress sx={{ color: '#00FF9F' }} />
        </Box>
      ) : matches.length === 0 ? (
        <Typography sx={{ color: '#888', fontSize: 22, mt: 4, textAlign: 'center' }}>Make some matches!</Typography>
      ) : (
        <List>
          {matches.map(match => (
            <ListItem key={match.id} sx={{ bgcolor: '#232323', borderRadius: 2, mb: 2, color: '#00FF9F', boxShadow: '0 0 4px #00FF9F22' }}>
              <ListItemText
                primary={<span style={{ color: '#00FF9F', fontWeight: 600 }}>{match.name}</span>}
                secondary={<span style={{ color: '#888' }}>Status: {match.status}</span>}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default MatchHistory;
