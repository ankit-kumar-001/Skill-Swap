import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = ({ isLoggedIn, setIsLoggedIn }) => (
  <AppBar position="static" sx={{ bgcolor: '#00FF9F' }}>
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1, color: 'black', fontWeight: 700, cursor: 'default' }}>
        SkillSwap
      </Typography>
      {isLoggedIn ? (
        <>
          <Button component={Link} to="/messages" sx={{ color: 'black', fontWeight: 700, px: 2, py: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive' } }}>
            Messages
          </Button>
          <Button component={Link} to="/" sx={{ color: 'black', fontWeight: 700, px: 2, py: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive' } }}>
            Home
          </Button>
          <Button component={Link} to="/matches" sx={{ color: 'black', fontWeight: 700, px: 2, py: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive' } }}>
            Matches
          </Button>
          <Button component={Link} to="/profile" sx={{ color: 'black', fontWeight: 700, px: 2, py: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive' } }}>
            Profile
          </Button>
          <Button component={Link} to="/all-skills" sx={{ color: 'black', fontWeight: 700, px: 2, py: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive' } }}>
            All Skills
          </Button>
          <Button component={Link} to="/best-matches" sx={{ color: 'black', fontWeight: 700, px: 2, py: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive' } }}>
            Best Matches
          </Button>
          <Button onClick={() => {
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            setIsLoggedIn(false);
          }} sx={{ color: 'wheat', fontWeight: 700, px: 2, py: 1, borderRadius: 2, ml: 2, bgcolor: '#1E1E1E', '&:hover': {color: '#00FF9F' } }}>
            Logout
          </Button>
        </>
      ) : (
        <>
        </>
      )}
    </Toolbar>
  </AppBar>
);

export default Navbar;
