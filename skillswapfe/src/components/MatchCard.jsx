import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const MatchCard = ({ name, teachSkills, learnSkills, matchScore }) => (
  <Box sx={{ bgcolor: '#232323', color: '#00FF9F', borderRadius: 3, px: 4, py: 3, minWidth: 260, minHeight: 180, mb: 3, boxShadow: '0 0 8px #00FF9F22', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Typography variant="h6" sx={{ color: '#00FFF0', fontWeight: 700, mb: 1 }}>{name}</Typography>
    <Divider sx={{ width: '100%', bgcolor: '#00FF9F', mb: 1 }} />
    <Typography sx={{ color: '#00FF9F', fontWeight: 600, fontSize: 15, mb: 0.5 }}>Teaches:</Typography>
    <Typography sx={{ color: '#fff', fontSize: 14, mb: 1, textAlign: 'center' }}>{teachSkills.join(', ') || 'None'}</Typography>
    <Divider sx={{ width: '100%', bgcolor: '#00FF9F', mb: 1 }} />
    <Typography sx={{ color: '#00FF9F', fontWeight: 600, fontSize: 15, mb: 0.5 }}>Wants to Learn:</Typography>
    <Typography sx={{ color: '#fff', fontSize: 14, mb: 1, textAlign: 'center' }}>{learnSkills.join(', ') || 'None'}</Typography>
    <Divider sx={{ width: '100%', bgcolor: '#00FF9F', mb: 1 }} />
    <Typography sx={{ color: '#00FFF0', fontWeight: 700, fontSize: 18 }}>Match Score: <span style={{ color: '#fff' }}>{matchScore}</span></Typography>
  </Box>
);

export default MatchCard;
