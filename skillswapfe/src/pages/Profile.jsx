import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [skills, setSkills] = useState([]);
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

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
    // Fetch user profile
    fetch(`${backendApiUrl}/api/profile?userId=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setBio(data.user.bio || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch(`${backendApiUrl}/api/skills?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setSkills([
          ...(data.learn || []).map(s => ({ ...s, type: 'learn' })),
          ...(data.teach || []).map(s => ({ ...s, type: 'teach' }))
        ]);
      });
  }, []);

  const handleChangePassword = () => {
    setStatus('loading');
    setMessage('');
    fetch(`${backendApiUrl}/api/profile/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Cookies.get('token')}` },
      body: JSON.stringify({ userId: user.id, oldPassword, newPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message && data.message.toLowerCase().includes('success')) {
          setStatus('success');
          setMessage('Password changed successfully!');
          setOldPassword('');
          setNewPassword('');
        } else {
          setStatus('error');
          setMessage(data.message || 'Error changing password.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error.');
      });
  };

  const handleSaveBio = () => {
    fetch(`${backendApiUrl}/api/profile/update-bio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Cookies.get('token')}` },
      body: JSON.stringify({ userId: user.id, bio: bioDraft })
    })
      .then(res => res.json())
      .then(data => {
        setBio(data.bio);
        setEditingBio(false);
      })
      .catch(() => setError('Failed to update bio.'));
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(()=>{setStatus('idle');
    setMessage('');
    setOldPassword('');
    setNewPassword('');},150)
  };

  if (loading) {
    return <Box sx={{ color: '#00FF9F', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress sx={{ color: '#00FF9F' }} /></Box>;
  }

  return (
    <Box sx={{ color: 'white', backgroundColor: '#121212', p: 3, minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ p: 4, bgcolor: '#181F1F', borderRadius: 3, mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#00FFF0', fontWeight: 700, mb: 2 }}>Profile</Typography>
        <Typography variant="h6" sx={{ color: '#00FFF0', mb: 1 }}>Bio</Typography>
        {editingBio ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, maxWidth: 600 }}>
            <TextField
              value={bioDraft}
              onChange={e => setBioDraft(e.target.value)}
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              sx={{ input: { color: '#00FFF0' }, label: { color: '#00FFF0' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00FFF0' }, '&:hover fieldset': { borderColor: '#00FF9F' } }, fontSize: 18, textarea: { color: '#00FFF0' } }}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" sx={{ bgcolor: '#00FFF0', color: '#121212', fontWeight: 700, minWidth: 100 }} onClick={handleSaveBio}>Save</Button>
              <Button variant="outlined" sx={{ color: '#00FFF0', borderColor: '#00FFF0', minWidth: 100 }} onClick={() => { setEditingBio(false); setBioDraft(bio); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ color: '#00FFF0', fontWeight: 600, fontSize: 18, mr: 2 }}>
              {bio || 'No bio set.'}
            </Typography>
            <Button variant="text" sx={{ color: '#00FFF0', fontWeight: 700 }} onClick={() => { setEditingBio(true); setBioDraft(bio); }}>Edit</Button>
          </Box>
        )}
        <hr style={{ border: '1px solid #222', margin: '32px 0 16px 0' }} />
        <Typography variant="h6" sx={{ color: '#00FFF0', mb: 1 }}>Skills you want to learn</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Array.isArray(skills) && skills.filter(s => s.level === 'beginner' || s.level === 'intermediate' || s.level === 'advanced' || s.type === 'learn').map(skill => {
            const name = typeof skill === 'string' ? skill : skill.name;
            const level = typeof skill === 'string' ? '' : (skill.level || '');
            if (skill.type && skill.type !== 'learn') return null;
            return (
              <Chip 
                key={name + '-learn'} 
                label={
                  <span>
                    {name}
                    {level && (
                      <span style={{
                        background: '#232323',
                        color: '#00FFF0',
                        borderRadius: 8,
                        padding: '2px 8px',
                        marginLeft: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        display: 'inline-block',
                        verticalAlign: 'middle'
                      }}>
                        {level}
                      </span>
                    )}
                  </span>
                }
                sx={{ 
                  bgcolor: '#00FFF0', 
                  color: '#121212', 
                  fontWeight: 700, 
                  fontSize: 16, 
                  borderRadius: 2,
                  width: 'auto',
                  minWidth: 0,
                  maxWidth: '100%',
                  '.MuiChip-label': {
                    px: 2,
                    py: 0.5,
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                  }
                }} 
              />
            );
          })}
        </Box>
        <hr style={{ border: '1px solid #222', margin: '32px 0 16px 0' }} />
        <Typography variant="h6" sx={{ color: '#00FFF0', mb: 1 }}>Skills you can teach</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Array.isArray(skills) && skills.filter(s => s.type === 'teach' || (!s.type && (s.level === 'beginner' || s.level === 'intermediate' || s.level === 'advanced'))).map(skill => {
            const name = typeof skill === 'string' ? skill : skill.name;
            const level = typeof skill === 'string' ? '' : (skill.level || '');
            if (skill.type && skill.type !== 'teach') return null;
            return (
              <Chip 
                key={name + '-teach'} 
                label={
                  <span>
                    {name}
                    {level && (
                      <span style={{
                        background: '#232323',
                        color: '#00FFF0',
                        borderRadius: 8,
                        padding: '2px 8px',
                        marginLeft: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        display: 'inline-block',
                        verticalAlign: 'middle'
                      }}>
                        {level}
                      </span>
                    )}
                  </span>
                }
                sx={{ 
                  bgcolor: '#00FFF0', 
                  color: '#121212', 
                  fontWeight: 700, 
                  fontSize: 16, 
                  borderRadius: 2,
                  width: 'auto',
                  minWidth: 0,
                  maxWidth: '100%',
                  '.MuiChip-label': {
                    px: 2,
                    py: 0.5,
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                  }
                }} 
              />
            );
          })}
        </Box>
      </Paper>

      <Button
        variant="contained"
        sx={{ bgcolor: '#00FF9F', color: 'black', '&:hover': { bgcolor: '#00e68a' } }}
        onClick={() => setOpen(true)}
      >
        Change Password
      </Button>

      <Dialog
        open={open}
        onClose={() => status !== 'loading' && handleClose()}
        PaperProps={{
          sx: {
            bgcolor: '#2c2c2c',
            color: 'white',
            borderRadius: 2,
            minWidth: 400,
          }
        }}
      >
        <DialogTitle sx={{ color: '#00FF9F' }}>Change Password</DialogTitle>

        <DialogContent>
          {status === 'loading' ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 150,
              }}
            >
              <CircularProgress sx={{ color: '#00FF9F' }} size={60} thickness={5} />
            </Box>
          ) : (
            <>
              <TextField
                margin="dense"
                label="Old Password"
                type="password"
                fullWidth
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                sx={{
                  input: { color: 'white' },
                  label: { color: 'wheat' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'gray' },
                    '&:hover fieldset': { borderColor: '#00FF9F' },
                  }
                }}
              />
              <TextField
                margin="dense"
                label="New Password"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                sx={{
                  input: { color: 'white' },
                  label: { color: 'wheat' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'gray' },
                    '&:hover fieldset': { borderColor: '#00FF9F' },
                  }
                }}
              />

              {message && (
                <Typography
                  mt={2}
                  sx={{
                    color: status === 'success' ? '#00FF9F' : '#FF4D4D',
                    fontWeight: 'bold',
                  }}
                >
                  {message}
                </Typography>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            sx={{ color: '#ccc' }}
            disabled={status === 'loading'}
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </Button>

          {status !== 'success' && (
            <Button
              onClick={handleChangePassword}
              variant="contained"
              sx={{ bgcolor: '#00FF9F', color: 'black', '&:hover': { bgcolor: '#00e68a' } }}
              disabled={
                status === 'loading' ||
                !oldPassword ||
                !newPassword
              }
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
