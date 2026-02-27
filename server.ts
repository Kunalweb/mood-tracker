import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('mood_tracker.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    email TEXT NOT NULL UNIQUE,
    has_mental_illness BOOLEAN NOT NULL,
    mood_disorder TEXT
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    sleep_hours REAL NOT NULL,
    energy_level INTEGER NOT NULL,
    mood_score INTEGER NOT NULL,
    mood_text TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    alarm_time TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try {
  db.exec('ALTER TABLE daily_logs ADD COLUMN mood_text TEXT;');
} catch (e) {
  // Ignore if column already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // Google OAuth
  app.get('/api/auth/google/url', (req, res) => {
    const redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;
    
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error('Failed to get access token');
      }

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', payload: ${JSON.stringify(userData)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });
  
  // User Onboarding
  app.post('/api/users', (req, res) => {
    const { name, age, email, has_mental_illness, mood_disorder } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO users (name, age, email, has_mental_illness, mood_disorder) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(name, age, email, has_mental_illness ? 1 : 0, mood_disorder || null);
      res.json({ id: info.lastInsertRowid, name, email });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        res.json(user);
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get('/api/users/:email', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.params.email);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Daily Logs
  app.post('/api/logs', (req, res) => {
    const { user_id, date, sleep_hours, energy_level, mood_score, mood_text } = req.body;
    try {
      // Check if log exists for date
      const existing = db.prepare('SELECT * FROM daily_logs WHERE user_id = ? AND date = ?').get(user_id, date);
      if (existing) {
        const stmt = db.prepare('UPDATE daily_logs SET sleep_hours = ?, energy_level = ?, mood_score = ?, mood_text = ? WHERE user_id = ? AND date = ?');
        stmt.run(sleep_hours, energy_level, mood_score, mood_text || null, user_id, date);
      } else {
        const stmt = db.prepare('INSERT INTO daily_logs (user_id, date, sleep_hours, energy_level, mood_score, mood_text) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(user_id, date, sleep_hours, energy_level, mood_score, mood_text || null);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/logs/:user_id', (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM daily_logs WHERE user_id = ? ORDER BY date ASC').all(req.params.user_id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Medicines
  app.post('/api/medicines', (req, res) => {
    const { user_id, name, time_of_day, alarm_time } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO medicines (user_id, name, time_of_day, alarm_time) VALUES (?, ?, ?, ?)');
      const info = stmt.run(user_id, name, time_of_day, alarm_time);
      res.json({ id: info.lastInsertRowid, user_id, name, time_of_day, alarm_time });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/medicines/:user_id', (req, res) => {
    try {
      const medicines = db.prepare('SELECT * FROM medicines WHERE user_id = ?').all(req.params.user_id);
      res.json(medicines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/medicines/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM medicines WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
