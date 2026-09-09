import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import MatchCard from '../components/MatchCard';
import Cookies from 'js-cookie';
import * as jose from 'jose';
import { useNavigate } from 'react-router-dom';
const backendurl = import.meta.env.VITE_BACKEND_API_URL;
const BestMatches = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {   
    const fetchMatches = async () => {
      setLoading(true);
      const token = Cookies.get('token');
      let userId = null;
      try {
        if (token) {
          const payload = jose.decodeJwt(token);
          userId = payload.user.id;
        }
      } catch {}
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${backendurl}/api/best-matches?userId=${userId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        setMatches((Array.isArray(data) ? data : data.matches).map(u => ({
          user_id: u.id || u.user_id,
          name: u.name,
          matchScore: Math.round((u.match_score || u.similarity || u.score) * 100),
          teachSkills: u.teachSkills || u.teach_skills || [],
          learnSkills: u.learnSkills || u.learn_skills || []
        })));
        setLoading(false);
      } catch (e) {
        setMatches([]);
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: '#1E1E1E', color: 'white', p: 4 }}>
      <Typography variant="h4" sx={{ color: '#00FF9F', mb: 3, fontWeight: 700 }}>Best Matches For You</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress sx={{ color: '#00FF9F' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {matches.map((user, idx) => {
            const handleMessage = async () => {
              const token = Cookies.get('token');
              let senderId = null;
              try {
                if (token) {
                  const payload = jose.decodeJwt(token);
                  senderId = payload.user.id;
                }
              } catch {}
              if (!senderId) return alert('Not logged in');
              // Call backend to get or create matchId
              const res = await fetch(`${backendurl}/api/matches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user1Id: senderId, user2Id: user.user_id })
              });
              const data = await res.json();
              if (data.matchId) {
                // Use navigate and pass matchId in state
                navigate('/messages', { state: { openMatchId: data.matchId } });
              } else {
                alert('Could not initiate chat');
              }
            };
            const handleProfile = () => {
              window.location.href = `/profile/${user.user_id}`;
            };
            return (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <MatchCard {...user} />
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <button
                    style={{
                      background: '#00FF9F', color: '#232323', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 15
                    }}
                    onClick={handleMessage}
                  >Message</button>
                  <button
                    style={{
                      background: '#232323', color: '#00FF9F', border: '2px solid #00FF9F', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 15
                    }}
                    onClick={handleProfile}
                  >Profile</button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default BestMatches;
