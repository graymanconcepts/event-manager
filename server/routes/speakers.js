import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes - no authentication needed
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const speakers = db.prepare('SELECT * FROM speakers').all();
    res.json(speakers);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to fetch speakers'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const speaker = db.prepare('SELECT * FROM speakers WHERE id = ?').get(req.params.id);
    if (!speaker) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Speaker not found'
      });
    }
    res.json(speaker);
  } catch (error) {
    console.error('Error fetching speaker:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to fetch speaker'
    });
  }
});

// Protected routes - require authentication
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, bio, image_url, company, role } = req.body;
    const db = getDatabase();
    
    const result = db.prepare(
      'INSERT INTO speakers (name, bio, image_url, company, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, bio, image_url, company, role);

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      bio,
      image_url,
      company,
      role
    });
  } catch (error) {
    console.error('Error creating speaker:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to create speaker'
    });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, bio, image_url, company, role } = req.body;
    const db = getDatabase();
    
    const result = db.prepare(
      'UPDATE speakers SET name = ?, bio = ?, image_url = ?, company = ?, role = ? WHERE id = ?'
    ).run(name, bio, image_url, company, role, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Speaker not found'
      });
    }

    res.json({
      id: parseInt(req.params.id),
      name,
      bio,
      image_url,
      company,
      role
    });
  } catch (error) {
    console.error('Error updating speaker:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to update speaker'
    });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM speakers WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Speaker not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting speaker:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to delete speaker'
    });
  }
});

export default router;