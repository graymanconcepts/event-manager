import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Constants for ticket prices and refund policies
const TICKET_PRICES = {
  'standard': 499.00,
  'vip': 799.00,
  'virtual': 199.00
};

// Initialize database tables if they don't exist
const initializeTables = async () => {
  try {
    const db = getDatabase();
    
    // Create payments table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        type VARCHAR(20) DEFAULT 'payment',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id)
      )
    `).run();
    
    // Add new columns to registrations table if they don't exist
    const tableInfo = db.prepare("PRAGMA table_info(registrations)").all();
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('payment_status')) {
      db.prepare("ALTER TABLE registrations ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'").run();
    }
    if (!columns.includes('status')) {
      db.prepare("ALTER TABLE registrations ADD COLUMN status VARCHAR(20) DEFAULT 'active'").run();
    }
    if (!columns.includes('payment_amount')) {
      db.prepare("ALTER TABLE registrations ADD COLUMN payment_amount DECIMAL(10,2)").run();
    }
    if (!columns.includes('refund_notes')) {
      db.prepare("ALTER TABLE registrations ADD COLUMN refund_notes TEXT").run();
    }
    if (!columns.includes('updated_at')) {
      db.prepare("ALTER TABLE registrations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
    }
  } catch (error) {
    console.error('Error initializing registration tables:', error);
    throw error;
  }
};

// Export initialization function
export const initializeRouter = async () => {
  await initializeTables();
};

// Public routes - no authentication needed
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // First get all registrations
    const registrations = db.prepare(`
      SELECT r.*, e.title as event_title
      FROM registrations r
      LEFT JOIN event_registrations er ON r.id = er.registration_id
      LEFT JOIN events e ON er.event_id = e.id
      ORDER BY r.created_at DESC
    `).all();

    // Then get the latest payment for each registration
    const registrationsWithPayments = registrations.map(reg => {
      const latestPayment = db.prepare(`
        SELECT amount, status, created_at
        FROM payments
        WHERE registration_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(reg.id);

      return {
        ...reg,
        payment_amount: latestPayment?.amount || reg.payment_amount,
        payment_status: latestPayment?.status || reg.payment_status
      };
    });
    
    console.log('Registrations:', JSON.stringify(registrationsWithPayments, null, 2));
    res.json(registrationsWithPayments);
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
    const registration = db.prepare(`
      SELECT r.*, e.title as event_title
      FROM registrations r
      LEFT JOIN event_registrations er ON r.id = er.registration_id
      LEFT JOIN events e ON er.event_id = e.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Registration not found'
      });
    }

    // Get the latest payment
    const latestPayment = db.prepare(`
      SELECT amount, status, created_at
      FROM payments
      WHERE registration_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(registration.id);

    const registrationWithPayment = {
      ...registration,
      payment_amount: latestPayment?.amount || registration.payment_amount,
      payment_status: latestPayment?.status || registration.payment_status
    };

    res.json(registrationWithPayment);
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
    const { name, email, company, dietary_requirements, ticket_type, payment_method } = req.body;
    
    if (!name || !email || !ticket_type || !payment_method) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, email, ticket type, and payment method are required'
      });
    }

    const ticketPrice = TICKET_PRICES[ticket_type.toLowerCase()];
    if (!ticketPrice) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid ticket type'
      });
    }

    const db = getDatabase();
    
    // Start a transaction
    db.prepare('BEGIN').run();
    
    try {
      // Create the registration
      const registrationResult = db.prepare(`
        INSERT INTO registrations (
          name, email, company, dietary_requirements, ticket_type,
          status, payment_status, payment_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, email, company || null, dietary_requirements || null,
        ticket_type, 'active', 'pending', ticketPrice
      );

      // Get the main event
      const event = db.prepare('SELECT id FROM events WHERE type = ? LIMIT 1').get('conference');
      
      if (event) {
        // Create event registration
        db.prepare(
          'INSERT INTO event_registrations (registration_id, event_id) VALUES (?, ?)'
        ).run(registrationResult.lastInsertRowid, event.id);
      }

      // Initialize payment
      const paymentResult = db.prepare(`
        INSERT INTO payments (registration_id, amount, currency, status, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `).run(registrationResult.lastInsertRowid, ticketPrice, 'USD', 'pending', payment_method);

      // Commit the transaction
      db.prepare('COMMIT').run();

      const registration = {
        id: registrationResult.lastInsertRowid,
        name,
        email,
        company,
        dietary_requirements,
        ticket_type,
        status: 'active',
        payment_status: 'pending',
        payment_amount: ticketPrice,
        payment: {
          id: paymentResult.lastInsertRowid,
          amount: ticketPrice,
          currency: 'USD'
        }
      };

      res.status(201).json(registration);
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to create registration'
    });
  }
});

// Cancel registration and process refund
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { refundNotes } = req.body;
    const db = getDatabase();
    
    // Start a transaction
    db.prepare('BEGIN').run();
    
    try {
      // Get the registration and its payment status
      const registration = db.prepare(`
        SELECT r.*, p.id as payment_id, p.status as payment_status, p.amount as payment_amount
        FROM registrations r
        LEFT JOIN payments p ON r.id = p.registration_id AND p.type = 'payment'
        WHERE r.id = ?
      `).get(req.params.id);

      if (!registration) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Registration not found'
        });
      }

      if (registration.status === 'cancelled') {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'Registration is already cancelled'
        });
      }

      // Update registration status
      db.prepare(`
        UPDATE registrations 
        SET status = 'cancelled',
            refund_notes = ?,
            updated_at = DATETIME('now')
        WHERE id = ?
      `).run(refundNotes || null, req.params.id);

      // If payment exists and was paid, process refund
      if (registration.payment_id && registration.payment_status === 'paid') {
        // Create refund record
        db.prepare(`
          INSERT INTO payments (
            registration_id,
            amount,
            currency,
            status,
            payment_method,
            type,
            notes
          ) VALUES (?, ?, 'USD', 'completed', 'refund', 'refund', ?)
        `).run(registration.id, -registration.payment_amount, refundNotes);

        // Update original payment status
        db.prepare(`
          UPDATE payments 
          SET status = 'refunded',
              updated_at = DATETIME('now')
          WHERE id = ?
        `).run(registration.payment_id);
      }

      // Commit the transaction
      db.prepare('COMMIT').run();

      // Get updated registration
      const updatedRegistration = db.prepare(`
        SELECT r.*, e.title as event_title,
               p.amount as payment_amount, p.status as payment_status
        FROM registrations r
        LEFT JOIN event_registrations er ON r.id = er.registration_id
        LEFT JOIN events e ON er.event_id = e.id
        LEFT JOIN (
          SELECT p1.*
          FROM payments p1
          LEFT JOIN payments p2 ON p1.registration_id = p2.registration_id 
            AND p1.created_at < p2.created_at
          WHERE p2.id IS NULL
        ) p ON r.id = p.registration_id
        WHERE r.id = ?
      `).get(req.params.id);

      res.json(updatedRegistration);
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to cancel registration'
    });
  }
});

// Protected routes for admin operations
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, email, company, dietary_requirements, ticket_type, status } = req.body;
    const db = getDatabase();
    
    const result = db.prepare(`
      UPDATE registrations 
      SET name = ?, 
          email = ?, 
          company = ?, 
          dietary_requirements = ?, 
          ticket_type = ?, 
          status = ?,
          updated_at = DATETIME('now')
      WHERE id = ?
    `).run(name, email, company, dietary_requirements, ticket_type, status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Registration not found'
      });
    }

    const updatedRegistration = db.prepare(`
      SELECT r.*, e.title as event_title,
             p.amount as payment_amount, p.status as payment_status
      FROM registrations r
      LEFT JOIN event_registrations er ON r.id = er.registration_id
      LEFT JOIN events e ON er.event_id = e.id
      LEFT JOIN (
        SELECT p1.*
        FROM payments p1
        LEFT JOIN payments p2 ON p1.registration_id = p2.registration_id 
          AND p1.created_at < p2.created_at
        WHERE p2.id IS NULL
      ) p ON r.id = p.registration_id
      WHERE r.id = ?
    `).get(req.params.id);

    res.json(updatedRegistration);
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to update registration'
    });
  }
});

// Delete registration (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Start a transaction
    db.prepare('BEGIN').run();
    
    try {
      // Delete event registrations
      db.prepare('DELETE FROM event_registrations WHERE registration_id = ?').run(req.params.id);
      
      // Delete the registration
      const result = db.prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);
      
      // Commit the transaction
      db.prepare('COMMIT').run();

      if (result.changes === 0) {
        return res.status(404).json({ 
          error: 'Not found',
          message: 'Registration not found'
        });
      }

      res.json({ success: true });
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'Failed to delete registration'
    });
  }
});

export default router;