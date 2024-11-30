import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
let db;

// Initialize the database connection
export function initializeRouter(database) {
  db = database;
}

// Get all events with stats
router.get('/', (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const events = db.prepare(`
      SELECT 
        e.*,
        es.total_registrations,
        es.confirmed_registrations,
        es.pending_registrations,
        es.total_revenue,
        COUNT(DISTINCT esp.speaker_id) as total_speakers,
        COUNT(DISTINCT t.id) as total_talks
      FROM events e
      LEFT JOIN event_stats es ON e.id = es.event_id
      LEFT JOIN event_speakers esp ON e.id = esp.event_id
      LEFT JOIN talks t ON e.id = t.event_id
      GROUP BY e.id
      ORDER BY e.start_date ASC
    `).all();

    // Parse JSON fields
    events.forEach(event => {
      if (event.ticket_types) {
        event.ticket_types = JSON.parse(event.ticket_types);
      }
      if (event.organizer_info) {
        event.organizer_info = JSON.parse(event.organizer_info);
      }
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get a single event with full details
router.get('/:id', (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Get event details with stats
    const event = db.prepare(`
      SELECT 
        e.*,
        es.total_registrations,
        es.confirmed_registrations,
        es.pending_registrations,
        es.total_revenue
      FROM events e
      LEFT JOIN event_stats es ON e.id = es.event_id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Parse JSON fields
    if (event.ticket_types) {
      event.ticket_types = JSON.parse(event.ticket_types);
    }
    if (event.organizer_info) {
      event.organizer_info = JSON.parse(event.organizer_info);
    }

    // Get speakers
    event.speakers = db.prepare(`
      SELECT s.*, es.speaker_type
      FROM speakers s
      JOIN event_speakers es ON s.id = es.speaker_id
      WHERE es.event_id = ?
      ORDER BY es.speaker_type, s.name
    `).all(event.id);

    // Get talks
    event.talks = db.prepare(`
      SELECT t.*, s.name as speaker_name
      FROM talks t
      LEFT JOIN speakers s ON t.speaker_id = s.id
      WHERE t.event_id = ?
      ORDER BY t.start_time
    `).all(event.id);

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

    const {
      title,
      description,
      type,
      location,
      venue,
      capacity,
      start_date,
      end_date,
      registration_start_date,
      registration_end_date,
      ticket_types,
      timezone,
      banner_image,
      organizer_info,
      speakers = []
    } = req.body;

    // Validate required fields
    if (!title || !type || !start_date || !end_date || !ticket_types) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Start transaction
    db.prepare('BEGIN').run();

    try {
      // Create event
      const eventResult = db.prepare(`
        INSERT INTO events (
          title, description, type, location, venue, capacity,
          start_date, end_date, registration_start_date, registration_end_date,
          ticket_types, timezone, banner_image, organizer_info, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        title, description, type, location, venue, capacity,
        start_date, end_date, registration_start_date, registration_end_date,
        JSON.stringify(ticket_types), timezone, banner_image,
        organizer_info ? JSON.stringify(organizer_info) : null,
        'draft'
      );

      // Initialize event stats
      db.prepare(`
        INSERT INTO event_stats (event_id)
        VALUES (?)
      `).run(eventResult.lastInsertRowid);

      // Add speakers if provided
      if (speakers.length > 0) {
        const addEventSpeaker = db.prepare(`
          INSERT INTO event_speakers (event_id, speaker_id, speaker_type)
          VALUES (?, ?, ?)
        `);

        speakers.forEach(({ speaker_id, speaker_type = 'speaker' }) => {
          addEventSpeaker.run(eventResult.lastInsertRowid, speaker_id, speaker_type);
        });
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      // Get the created event with full details
      const newEvent = db.prepare(`
        SELECT e.*, es.total_registrations, es.confirmed_registrations,
               es.pending_registrations, es.total_revenue
        FROM events e
        LEFT JOIN event_stats es ON e.id = es.event_id
        WHERE e.id = ?
      `).get(eventResult.lastInsertRowid);

      // Parse JSON fields
      if (newEvent.ticket_types) {
        newEvent.ticket_types = JSON.parse(newEvent.ticket_types);
      }
      if (newEvent.organizer_info) {
        newEvent.organizer_info = JSON.parse(newEvent.organizer_info);
      }

      res.status(201).json(newEvent);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Update event stats
router.post('/:id/stats/update', authenticateToken, (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const eventId = req.params.id;

    // Calculate current stats
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN r.status = 'confirmed' AND r.payment_status = 'paid' THEN 1 ELSE 0 END) as confirmed_registrations,
        SUM(CASE WHEN r.status = 'pending' OR r.payment_status = 'pending' THEN 1 ELSE 0 END) as pending_registrations,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue
      FROM registrations r
      LEFT JOIN event_registrations er ON r.id = er.registration_id
      LEFT JOIN payments p ON r.id = p.registration_id
      WHERE er.event_id = ?
    `).get(eventId);

    // Update stats
    db.prepare(`
      UPDATE event_stats
      SET 
        total_registrations = ?,
        confirmed_registrations = ?,
        pending_registrations = ?,
        total_revenue = ?,
        last_updated = CURRENT_TIMESTAMP
      WHERE event_id = ?
    `).run(
      stats.total_registrations,
      stats.confirmed_registrations,
      stats.pending_registrations,
      stats.total_revenue,
      eventId
    );

    res.json({ message: 'Stats updated successfully', stats });
  } catch (error) {
    console.error('Error updating event stats:', error);
    res.status(500).json({ message: 'Failed to update event stats' });
  }
});

// Update event status
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { status } = req.body;
    const validStatuses = ['draft', 'published', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = db.prepare(`
      UPDATE events
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event status updated successfully' });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: 'Failed to update event status' });
  }
});

// Update an event (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const {
      title,
      description,
      type,
      location,
      venue,
      capacity,
      start_date,
      end_date,
      registration_start_date,
      registration_end_date,
      ticket_types,
      timezone,
      banner_image,
      organizer_info,
      speakers = []
    } = req.body;

    // Validate required fields
    if (!title || !type || !start_date || !end_date || !ticket_types) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Start transaction
    db.prepare('BEGIN').run();

    try {
      // Update event
      const result = db.prepare(`
        UPDATE events
        SET title = ?, description = ?, type = ?, location = ?, venue = ?,
            capacity = ?, start_date = ?, end_date = ?,
            registration_start_date = ?, registration_end_date = ?,
            ticket_types = ?, timezone = ?, banner_image = ?,
            organizer_info = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title, description, type, location, venue, capacity,
        start_date, end_date, registration_start_date, registration_end_date,
        JSON.stringify(ticket_types), timezone, banner_image,
        organizer_info ? JSON.stringify(organizer_info) : null,
        req.params.id
      );

      if (result.changes === 0) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ message: 'Event not found' });
      }

      // Update speakers
      if (speakers.length > 0) {
        // Remove existing speakers
        db.prepare('DELETE FROM event_speakers WHERE event_id = ?').run(req.params.id);

        // Add new speakers
        const addEventSpeaker = db.prepare(`
          INSERT INTO event_speakers (event_id, speaker_id, speaker_type)
          VALUES (?, ?, ?)
        `);

        speakers.forEach(({ speaker_id, speaker_type = 'speaker' }) => {
          addEventSpeaker.run(req.params.id, speaker_id, speaker_type);
        });
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      // Get updated event with full details
      const updatedEvent = db.prepare(`
        SELECT e.*, es.total_registrations, es.confirmed_registrations,
               es.pending_registrations, es.total_revenue
        FROM events e
        LEFT JOIN event_stats es ON e.id = es.event_id
        WHERE e.id = ?
      `).get(req.params.id);

      // Parse JSON fields
      if (updatedEvent.ticket_types) {
        updatedEvent.ticket_types = JSON.parse(updatedEvent.ticket_types);
      }
      if (updatedEvent.organizer_info) {
        updatedEvent.organizer_info = JSON.parse(updatedEvent.organizer_info);
      }

      res.json(updatedEvent);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

export default router;
