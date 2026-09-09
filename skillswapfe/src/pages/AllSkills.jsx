import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;

const AllSkills = () => {
  const [skills, setSkills] = useState([]);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const token = Cookies.get('token');

  useEffect(() => {
    if (!token) return;
    let uid;
    try {
      const payload = jose.decodeJwt(token);
      uid = payload.user.id;
      setUserId(uid);
    } catch {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${backendApiUrl}/api/all-skills`).then(res => res.json()),
      fetch(`${backendApiUrl}/api/skills?userId=${uid}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
    ]).then(([allSkills, userSkills]) => {
      setSkills(allSkills);
      setTeachSkills(userSkills.teach || []);
      setLearnSkills(userSkills.learn || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const hasSkill = (skillName, type) => {
  const arr = type === 'teach' ? teachSkills : learnSkills;
  return arr.some(s => s.name === skillName);
};

const handleAddSkill = (skillName, type) => {
  if (!userId) return;
  fetch(`${backendApiUrl}/api/profile/add-skill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ userId, skill: skillName, level: 'intermediate', type : type  })
  })
    .then(res => res.json())
    .then(() => {
      // Refresh teach/learn skills
      fetch(`${backendApiUrl}/api/skills?userId=${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(userSkills => {
          setTeachSkills(userSkills.teach || []);
          setLearnSkills(userSkills.learn || []);
        });
    });
};

const handleRemoveSkill = (skillName, type) => {
  if (!userId) return;
  fetch(`${backendApiUrl}/api/profile/remove-skill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ userId, skill: skillName, type : type })
  })
    .then(res => res.json())
    .then(() => {
      // Refresh teach/learn skills
      fetch(`${backendApiUrl}/api/skills?userId=${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(userSkills => {
          setTeachSkills(userSkills.teach || []);
          setLearnSkills(userSkills.learn || []);
        });
    });
};

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#1E1E1E' }}><CircularProgress sx={{ color: '#00FF9F' }} size={60} thickness={5} /></Box>;
  }

  return (
    <div style={{ padding: 24, color: 'white', minHeight: '100vh', maxHeight: '100vh', overflowY: 'auto' }}>
      <Typography variant="h4" sx={{ color: '#00FF9F', mb: 3, fontWeight: 700 }}>All Skills on SkillSwap</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {skills.map(skill => (
          <Box key={skill.id || skill.name} sx={{ bgcolor: '#232323', color: '#00FF9F', borderRadius: 2, px: 3, py: 1, fontWeight: 600, mb: 2, boxShadow: '0 0 4px #00FF9F22', minWidth: 220 }}>
            <span>{skill.name} <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>({skill.category})</span></span>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              {hasSkill(skill.name, 'teach') ? (
                <Button size="small" variant="outlined" color="error" onClick={() => handleRemoveSkill(skill.name, 'teach')}>
                  Remove from Teach
                </Button>
              ) : (
                <Button size="small" variant="contained" color="success" onClick={() => handleAddSkill(skill.name, 'teach')}>
                  Add to Teach
                </Button>
              )}
              {hasSkill(skill.name, 'learn') ? (
                <Button size="small" variant="outlined" color="error" onClick={() => handleRemoveSkill(skill.name, 'learn')}>
                  Remove from Learn
                </Button>
              ) : (
                <Button size="small" variant="contained" color="primary" onClick={() => handleAddSkill(skill.name, 'learn')}>
                  Add to Learn
                </Button>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </div>
  );
};

export default AllSkills;
