import cors from 'cors';
import dotenv from 'dotenv';
import pgl from './db.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());


const API_PREFIX = process.env.API_PREFIX || '/api';
const ml_API = process.env.VITE_ML_API_URL;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

app.post(`${API_PREFIX}/auth/login`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pgl.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    let valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (valid) {
      const user = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email
      };
      const token = jwt.sign({ user }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
      res.json({ token });
    } else {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post(`${API_PREFIX}/auth/signup`, async (req, res) => {
  let { name, email, password, bio, skills } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }
  const hashedPassword = await bcrypt.hash(password, 11);
  const client = await pgl.connect();
  try {
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const userRes = await client.query(
      'INSERT INTO users (name, email, password_hash, bio) VALUES ($1, $2, $3, $4) RETURNING id, name, email, bio',
      [name, email, hashedPassword, bio]
    );
    const user = { id: userRes.rows[0].id, name: userRes.rows[0].name, email: userRes.rows[0].email };
    const userId = user.id;
    
    skills = (skills || []).map(skill => ({
      ...skill,
      name: toTitleCase(skill.name.trim()),
      type: skill.type.toLowerCase(),
      level: (skill.level || 'intermediate').toLowerCase()
    }));
    for (const skill of skills) {
      const skillRes = await client.query('SELECT id FROM skills WHERE name = $1', [skill.name]);
      if (skillRes.rows.length === 0) continue;
      const skillId = skillRes.rows[0].id;
      await client.query(
        'INSERT INTO user_skills (user_id, skill_id, type, level) VALUES ($1, $2, $3, $4)',
        [userId, skillId, skill.type, skill.level || 'intermediate']
      );
    }
    client.release();

    const token = jwt.sign({ user }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.status(201).json({ token });
    try {
  let ml_embed = await fetch(`${ml_API}/embed/${userId}`, {method:"POST"});
  if (!ml_embed.ok) {
    const errText = await ml_embed.text();
    console.error(`Embedding failed: ${errText}`);
  }
} catch (mlErr) {
  console.error('Error calling ML backend:', mlErr);
}

  } catch (err) {
    client.release();
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


app.post(`${API_PREFIX}/profile/change-password`, async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const result = await pgl.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    
    const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }
    
    const newHashed = await bcrypt.hash(newPassword, 11);
    await pgl.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashed, userId]);
    return res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});


app.get(`${API_PREFIX}/profile`, async (req, res) => {
  const { userId } = req.query;
  try {
    const userRes = await pgl.query('SELECT id, name, email, bio FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
   
    const skillsRes = await pgl.query('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({ user: userRes.rows[0], skills: skillsRes.rows.map(r => r.name) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


app.post(`${API_PREFIX}/profile/update-bio`, async (req, res) => {
  const { userId, bio } = req.body;
  try {
    await pgl.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId]);
    res.json({ bio });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


app.get(`${API_PREFIX}/matches`, async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pgl.query(`
      SELECT m.id,
             CASE WHEN m.user1_id = $1 THEN u2.name ELSE u1.name END as other_user_name,
             m.match_score, m.feedback_user1, m.feedback_user2,
             COUNT(msg.id) as message_count
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      LEFT JOIN messages msg ON msg.match_id = m.id
      WHERE m.user1_id = $1 OR m.user2_id = $1
      GROUP BY m.id, u1.name, u2.name, m.match_score, m.feedback_user1, m.feedback_user2, m.user1_id, m.user2_id
    `, [userId]);
    res.json(result.rows.map(row => {
      let status = 'pending';
      if (parseInt(row.message_count, 10) > 0) {
        status = 'chatted';
      } else if (!row.match_score || Number(row.match_score) === 0) {
        status = 'ignored';
      }
      return {
        id: row.id,
        name: row.other_user_name,
        status,
        match_score: row.match_score,
        feedback_user1: row.feedback_user1,
        feedback_user2: row.feedback_user2
      };
    }));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


app.post(`${API_PREFIX}/matches`, async (req, res) => {
  const { user1Id, user2Id } = req.body;
  if (!user1Id || !user2Id) {
    return res.status(400).json({ message: 'user1Id and user2Id are required.' });
  }
  try {
    // Check for existing match (both user orders)
    const query = 'SELECT id FROM matches WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)';
    const params = [user1Id, user2Id];
    const result = await pgl.query(query, params);
    if (result.rows.length > 0) {
      return res.json({ matchId: result.rows[0].id, created: false });
    }
    // Create new match with match_score 0
    const newMatch = await pgl.query(
      'INSERT INTO matches (user1_id, user2_id, status, match_score) VALUES ($1, $2, $3, $4) RETURNING id',
      [user1Id, user2Id, 'pending', 0]
    );
    const matchId = newMatch.rows[0].id;
    res.status(201).json({ matchId, created: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


app.post(`${API_PREFIX}/matches/feedback`, async (req, res) => {
  const { matchId, userId, skillId, score, comment } = req.body;
  try {
    
    const match = await pgl.query('SELECT id, user1_id, user2_id FROM matches WHERE id = $1', [matchId]);
    if (match.rows.length === 0) return res.status(404).json({ message: 'Match not found.' });
    const { user1_id, user2_id } = match.rows[0];
    if (userId !== user1_id && userId !== user2_id) {
      return res.status(403).json({ message: 'You are not authorized to provide feedback for this match.' });
    }
   
    const existingFeedback = await pgl.query('SELECT id FROM match_feedback WHERE match_id = $1 AND user_id = $2', [matchId, userId]);
    if (existingFeedback.rows.length > 0) {
      return res.status(409).json({ message: 'Feedback already submitted.' });
    }
    await pgl.query(
      'INSERT INTO match_feedback (match_id, user_id, skill_id, score, comment) VALUES ($1, $2, $3, $4, $5)',
      [matchId, userId, skillId, score, comment]
    );
    const matchFeedback = await pgl.query('SELECT AVG(score) as average_score FROM match_feedback WHERE match_id = $1', [matchId]);
    const averageScore = matchFeedback.rows[0].average_score;
    await pgl.query('UPDATE matches SET match_score = $1 WHERE id = $2', [averageScore, matchId]);
    res.json({ message: 'Feedback submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get(`${API_PREFIX}/messages/:matchId`, async (req, res) => {
  const { matchId } = req.params;
  try {
    const result = await pgl.query(
      `SELECT id, sender_id, receiver_id, content, timestamp, delivered_at, read_at
       FROM messages
       WHERE match_id = $1
       ORDER BY timestamp ASC`,
      [matchId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post(`${API_PREFIX}/messages/:matchId`, async (req, res) => {
  const { matchId } = req.params;
  const { senderId, receiverId, content } = req.body;
  try {
    const result = await pgl.query(
      `INSERT INTO messages (match_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [matchId, senderId, receiverId, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get(`${API_PREFIX}/all-skills`, async (req, res) => {
  try {
    const result = await pgl.query('SELECT id, name, category FROM skills ORDER BY category, name');
    return res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get(`${API_PREFIX}/skills`, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    const teachRes = await pgl.query(
      `SELECT s.name, us.level
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1 AND us.type = 'teach'
       ORDER BY s.name`,
      [userId]
    );
    const learnRes = await pgl.query(
      `SELECT s.name, us.level
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1 AND us.type = 'learn'
       ORDER BY s.name`,
      [userId]
    );
    res.json({ teach: teachRes.rows, learn: learnRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get(`${API_PREFIX}/profile/:id`, async (req, res) => {
  const userId = req.params.id;
  try {
    const userRes = await pgl.query('SELECT id, name, email, bio FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const skillsRes = await pgl.query('SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({
      id: userRes.rows[0].id,
      username: userRes.rows[0].name,
      bio: userRes.rows[0].bio,
      skills: skillsRes.rows.map(r => ({ name: r.name, level: r.level }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get(`${API_PREFIX}/teachers`, async (req, res) => {
  const { skill } = req.query;
  if (!skill) return res.status(400).json({ message: 'Skill is required.' });
  try {
    const skillRes = await pgl.query('SELECT id FROM skills WHERE LOWER(name) = $1', [skill.toLowerCase()]);
    if (skillRes.rows.length === 0) return res.json([]);
    const skillId = skillRes.rows[0].id;
    const teachersRes = await pgl.query(`
      SELECT u.id, u.name,
        COALESCE(AVG(mf.score), 0) as rating
      FROM user_skills us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN match_feedback mf ON mf.user_id = u.id AND mf.skill_id = $1
      WHERE us.skill_id = $1 AND us.type = 'teach'
      GROUP BY u.id, u.name
      ORDER BY rating DESC, u.name
    `, [skillId]);
    res.json(teachersRes.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Route: Get best matches with skills for all matches
app.get(`${API_PREFIX}/best-matches`, async (req, res) => {
  const { userId, top_k = 5 } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    // 1. Call Python backend for matches
    const pyRes = await fetch(`${ml_API}/matches/${userId}?top_k=${top_k}`);
    const pyData = await pyRes.json();
    const matches = (pyData.matches || pyData);

    // 2. For each match, get their teach/learn skills from DB
    const userIds = matches.map(m => m.user_id || m.id);
    let skillsMap = {};
    if (userIds.length > 0) {
      const skillsRes = await pgl.query(`
        SELECT us.user_id, us.type, s.name FROM user_skills us
        JOIN skills s ON us.skill_id = s.id
        WHERE us.user_id = ANY($1::uuid[])
      `, [userIds]);
      for (const row of skillsRes.rows) {
        if (!skillsMap[row.user_id]) skillsMap[row.user_id] = { teachSkills: [], learnSkills: [] };
        if (row.type === 'teach') skillsMap[row.user_id].teachSkills.push(row.name);
        if (row.type === 'learn') skillsMap[row.user_id].learnSkills.push(row.name);
      }
    }

    // 3. Merge skills into matches for all
    const result = matches.map(m => ({
      user_id: m.user_id || m.id,
      name: m.name,
      match_score: m.similarity || m.score || m.match_score,
      teach_skills: (skillsMap[m.user_id || m.id]?.teachSkills) || [],
      learn_skills: (skillsMap[m.user_id || m.id]?.learnSkills) || []
    }));
    res.json({ matches: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
