import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes - no authentication needed
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const registrations = db.prepare('SELECT * FROM registrations').all();
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to fetch registrations'
    });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
    if (!registration) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Registration not found'
      });
    }
    res.json(registration);
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to fetch registration'
    });
  }
});

// Public route for creating registrations
router.post('/', (req, res) => {
  try {
    const { name, email, company, dietary_requirements, ticket_type } = req.body;
    
    console.log('Received registration request:', req.body);
    
    if (!name || !email || !ticket_type) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, email, and ticket type are required'
      });
    }

    const db = getDatabase();
    
    const result = db.prepare(
      'INSERT INTO registrations (name, email, company, dietary_requirements, ticket_type, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, company || null, dietary_requirements || null, ticket_type, 'confirmed');

    const registration = {
      id: result.lastInsertRowid,
      name,
      email,
      company,
      dietary_requirements,
      ticket_type,
      status: 'confirmed'
    };

    console.log('Created registration:', registration);
    
    res.status(201).json(registration);
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to create registration'
    });
  }
});

// Protected routes for admin operations
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, email, company, dietary_requirements, ticket_type, status } = req.body;
    const db = getDatabase();
    
    const result = db.prepare(
      'UPDATE registrations SET name = ?, email = ?, company = ?, dietary_requirements = ?, ticket_type = ?, status = ? WHERE id = ?'
    ).run(name, email, company, dietary_requirements, ticket_type, status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Registration not found'
      });
    }

    res.json({
      id: parseInt(req.params.id),
      name,
      email,
      company,
      dietary_requirements,
      ticket_type,
      status
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to update registration'
    });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Registration not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to delete registration'
    });
  }
});

export default router;