import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all registrations for a specific talk
router.get('/talk/:talkId', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const registrations = db.prepare(`
      SELECT r.*, tr.created_at as registration_date 
      FROM talk_registrations tr
      JOIN registrations r ON r.id = tr.registration_id
      WHERE tr.talk_id = ?
    `).all(req.params.talkId);
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching talk registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Get all talks for a specific registration
router.get('/registration/:registrationId', (req, res) => {
  try {
    const db = getDatabase();
    const talks = db.prepare(`
      SELECT t.*, tr.created_at as registration_date 
      FROM talk_registrations tr
      JOIN talks t ON t.id = tr.talk_id
      WHERE tr.registration_id = ?
    `).all(req.params.registrationId);
    
    res.json(talks);
  } catch (error) {
    console.error('Error fetching registered talks:', error);
    res.status(500).json({ error: 'Failed to fetch registered talks' });
  }
});

// Register for a talk
router.post('/', async (req, res) => {
  const { registration_id, talk_id } = req.body;
  
  if (!registration_id || !talk_id) {
    return res.status(400).json({ 
      error: 'Validation error',
      message: 'Registration ID and Talk ID are required'
    });
  }

  try {
    const db = getDatabase();
    
    // Check if the talk exists
    const talk = db.prepare('SELECT * FROM talks WHERE id = ?').get(talk_id);
    if (!talk) {
      return res.status(404).json({ error: 'Talk not found' });
    }

    // Check if already registered
    const existingRegistration = db.prepare(
      'SELECT * FROM talk_registrations WHERE registration_id = ? AND talk_id = ?'
    ).get(registration_id, talk_id);

    if (existingRegistration) {
      return res.status(400).json({ error: 'Already registered for this talk' });
    }

    // Add the registration
    const result = db.prepare(
      'INSERT INTO talk_registrations (registration_id, talk_id) VALUES (?, ?)'
    ).run(registration_id, talk_id);

    res.status(201).json({
      id: result.lastInsertRowid,
      registration_id,
      talk_id,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registering for talk:', error);
    res.status(500).json({ error: 'Failed to register for talk' });
  }
});

// Cancel a talk registration
router.delete('/:registrationId/:talkId', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare(
      'DELETE FROM talk_registrations WHERE registration_id = ? AND talk_id = ?'
    ).run(req.params.registrationId, req.params.talkId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Talk registration not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error canceling talk registration:', error);
    res.status(500).json({ error: 'Failed to cancel talk registration' });
  }
});

export default router;
