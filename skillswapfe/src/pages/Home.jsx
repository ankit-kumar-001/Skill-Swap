import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SkillAccordion from '../components/SkillAccordion';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Cookies from 'js-cookie';
import * as jose from 'jose';
import AllSkills from './AllSkills';

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  let userName = '';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => setLoading(false), 1000);
    const token = Cookies.get('token');
    let userId;
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        userId = payload.user.id;
        userName = payload.user.name || 'User';
        // Fetch recent chats
        fetch(`${backendApiUrl}/api/matches?userId=${userId}`)
          .then(res => res.json())
          .then(async matches => {
            // For each match, get the most recent message timestamp
            const chatPromises = matches.map(async match => {
              const res = await fetch(`${backendApiUrl}/api/messages/${match.id}`);
              const messages = await res.json();
              if (messages.length === 0) return null;
              const lastMsg = messages[messages.length - 1];
              return {
                matchId: match.id,
                name: match.name,
                lastTimestamp: lastMsg.timestamp
              };
            });
            const chats = (await Promise.all(chatPromises)).filter(Boolean);
            chats.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
            setRecentChats(chats.slice(0, 5));
          });
      } catch (e) {
        setLoading(false);
        return;
      }
      fetch(`${backendApiUrl}/api/skills?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setTeachSkills(data.teach || []);
          setLearnSkills(data.learn || []);
        });
    }
    fetch(`${backendApiUrl}/api/all-skills`)
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Defensive: handle empty/null learnSkills
  const learnSkillLinks = Array.isArray(learnSkills) && learnSkills.length > 0
    ? learnSkills.map(skill => (
        <Link
          key={skill.name}
          to={`/find-teachers/${encodeURIComponent(skill.name)}`}
          style={{ color: '#00FF9F', textDecoration: 'none', display: 'block', marginBottom: 5 }}
        >
          {skill.name} <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>({skill.level || 'intermediate'})</span>
        </Link>
      ))
    : <Typography sx={{ color: '#888', mb: 2 }}>No skills to learn yet.</Typography>;

  const teachSkillLinks = Array.isArray(teachSkills) && teachSkills.length > 0
    ? teachSkills.map(skill => (
        <span key={skill.name} style={{ display: 'block', marginBottom: 5, color: '#00FF9F' }}>
          {skill.name} <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>({skill.level || 'intermediate'})</span>
        </span>
      ))
    : <Typography sx={{ color: '#888', mb: 2 }}>No skills to teach yet.</Typography>;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#1E1E1E',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#00FF9F' }} size={60} thickness={5} />
      </Box>
    );
  }

  // Get name from token for greeting
  let name = '';
  try {
    const token = Cookies.get('token');
    if (token) {
      const payload = jose.decodeJwt(token);
      name = payload.user.name || payload.user.username || 'User';
    }
  } catch {}

  // Recent chats UI
  const recentChatsSection = (
    <div style={{ marginTop: 32 }}>
      <Typography variant="h4" sx={{ color: '#00FF9F', mb: 2, fontWeight: 700 }}>Recent Chats</Typography>
      {recentChats.length === 0 ? (
        <Typography sx={{ color: '#888', mb: 2 }}>No recent chats.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
          {recentChats.slice(0, 5).map(chat => (
            <Box key={chat.matchId} sx={{
              bgcolor: '#232323',
              color: '#00FF9F',
              borderRadius: 2,
              px: 3,
              py: 2,
              minWidth: 180,
              minHeight: 70,
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              transition: 'box-shadow 0.2s',
              '&:hover': { background: '#222' }
            }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#00FFF0' }}>{chat.name}</span>
              <span style={{ color: '#888', fontWeight: 400, fontSize: 14, marginTop: 6 }}>{new Date(chat.lastTimestamp).toLocaleString()}</span>
            </Box>
          ))}
        </Box>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', minHeight: '100vh', color: 'white', scrollBehavior: 'unset' }}>
      <h1 style={{ color: '#00FFF0', marginTop: 0, marginBottom: 24, fontWeight:"normal" }}>Hey! {name}</h1>
      <SkillAccordion title="Skills I Can Teach" items={teachSkillLinks} />
      <SkillAccordion title="Skills I Want to Learn" items={learnSkillLinks} />
      {recentChatsSection}
    </div>
  );
};

export default Home;
