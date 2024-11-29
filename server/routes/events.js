import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
let db;

// Initialize the database connection
export function initializeRouter(database) {
  db = database;
}

// Get all events
router.get('/', (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const events = db.prepare(`
      SELECT * FROM events
      ORDER BY start_time ASC
    `).all();

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get a single event
router.get('/:id', (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const event = db.prepare(`
      SELECT * FROM events WHERE id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// Create a new event (admin only)
router.post('/', authenticateToken, (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { title, description, type, location, start_time, end_time } = req.body;

    // Validate required fields
    if (!title || !type || !start_time || !end_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO events (title, description, type, location, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, description, type, location, start_time, end_time);

    const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Update an event (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { title, description, type, location, start_time, end_time } = req.body;

    // Validate required fields
    if (!title || !type || !start_time || !end_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = db.prepare(`
      UPDATE events
      SET title = ?, description = ?, type = ?, location = ?, start_time = ?, end_time = ?
      WHERE id = ?
    `).run(title, description, type, location, start_time, end_time, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updatedEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete an event (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

export default router;
