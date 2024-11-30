import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route for fetching talks
router.get('/', (req, res, next) => {
  if (req.query.public === 'true') {
    try {
      const db = getDatabase();
      const talks = db.prepare('SELECT * FROM talks').all();
      res.json(talks);
    } catch (error) {
      console.error('Error fetching talks:', error);
      res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch talks'
      });
    }
  } else {
    next(); // Pass to the protected route handler
  }
});

// Protected route for fetching talks (admin)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const talks = db.prepare('SELECT * FROM talks').all();
    res.json(talks);
  } catch (error) {
    console.error('Error fetching talks:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to fetch talks'
    });
  }
});

// Public route for fetching a single talk
router.get('/:id', (req, res, next) => {
  if (req.query.public === 'true') {
    try {
      const db = getDatabase();
      const talk = db.prepare('SELECT * FROM talks WHERE id = ?').get(req.params.id);
      if (!talk) {
        return res.status(404).json({ 
          error: 'Not found',
          message: 'Talk not found'
        });
      }
      res.json(talk);
    } catch (error) {
      console.error('Error fetching talk:', error);
      res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch talk'
      });
    }
  } else {
    next(); // Pass to the protected route handler
  }
});

// Protected route for fetching a single talk (admin)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const talk = db.prepare('SELECT * FROM talks WHERE id = ?').get(req.params.id);
    if (!talk) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Talk not found'
      });
    }
    res.json(talk);
  } catch (error) {
    console.error('Error fetching talk:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to fetch talk'
    });
  }
});

// Protected routes - require authentication
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, speaker_id, start_time, end_time, room } = req.body;
    const db = getDatabase();
    
    const result = db.prepare(
      'INSERT INTO talks (title, description, speaker_id, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title, description, speaker_id, start_time, end_time, room);

    if (result.changes > 0) {
      const newTalk = db.prepare('SELECT * FROM talks WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(newTalk);
    } else {
      res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to create talk'
      });
    }
  } catch (error) {
    console.error('Error creating talk:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to create talk'
    });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { title, description, speaker_id, start_time, end_time, room } = req.body;
    const db = getDatabase();
    
    const result = db.prepare(
      'UPDATE talks SET title = ?, description = ?, speaker_id = ?, start_time = ?, end_time = ?, room = ? WHERE id = ?'
    ).run(title, description, speaker_id, start_time, end_time, room, req.params.id);

    if (result.changes > 0) {
      const updatedTalk = db.prepare('SELECT * FROM talks WHERE id = ?').get(req.params.id);
      res.json(updatedTalk);
    } else {
      res.status(404).json({ 
        error: 'Not found',
        message: 'Talk not found'
      });
    }
  } catch (error) {
    console.error('Error updating talk:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to update talk'
    });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM talks WHERE id = ?').run(req.params.id);
    
    if (result.changes > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ 
        error: 'Not found',
        message: 'Talk not found'
      });
    }
  } catch (error) {
    console.error('Error deleting talk:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to delete talk'
    });
  }
});

export default router;