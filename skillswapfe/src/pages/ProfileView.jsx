import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;

const ProfileView = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${backendApiUrl}/api/profile/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Profile not found');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;
  if (error) return <Box p={4} textAlign="center" color="red">{error}</Box>;
  if (!profile) return null;

  return (
    <Box maxWidth={500} mx="auto" mt={4} p={3} bgcolor="#1E1E1E" borderRadius={2} color="white">
      <Typography variant="h4" sx={{ color: '#00FF9F', mb: 2 }}>
        {profile.username || profile.name}
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 2, color: 'gray' }}>
        {profile.bio || 'No bio provided.'}
      </Typography>
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Skills
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(profile.skills || []).length === 0 ? (
          <Typography color="gray">No skills listed.</Typography>
        ) : (
          profile.skills.map((skill, idx) => (
            <Chip
              key={idx}
              label={`${skill.name} (${skill.level})`}
              sx={{ bgcolor: '#00FF9F', color: 'black', fontWeight: 'bold' }}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ProfileView;
