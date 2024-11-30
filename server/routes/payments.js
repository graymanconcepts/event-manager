import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

const TICKET_PRICES = {
  'standard': 499.00,
  'vip': 799.00,
  'virtual': 199.00
};

// Mock payment processing function
const processMockPayment = async (amount, paymentMethod) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success rate (90% success)
  const success = Math.random() < 0.9;
  
  if (!success) {
    throw new Error('Payment failed');
  }
  
  return {
    success: true,
    transaction_id: 'mock_' + Date.now() + '_' + Math.random().toString(36).substring(7)
  };
};

// Initialize payment for registration
router.post('/init', async (req, res) => {
  const { registration_id, payment_method } = req.body;
  
  if (!registration_id || !payment_method) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Registration ID and payment method are required'
    });
  }
  
  try {
    const db = getDatabase();
    
    // Get registration details
    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(registration_id);
    if (!registration) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Registration not found'
      });
    }
    
    const ticketPrice = TICKET_PRICES[registration.ticket_type.toLowerCase()];
    if (!ticketPrice) {
      return res.status(400).json({
        error: 'Invalid ticket type',
        message: 'Invalid ticket type specified'
      });
    }
    
    // Create pending payment record
    const paymentResult = db.prepare(`
      INSERT INTO payments (registration_id, amount, currency, status, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `).run(registration_id, ticketPrice, 'USD', 'pending', payment_method);
    
    res.json({
      payment_id: paymentResult.lastInsertRowid,
      amount: ticketPrice,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to initialize payment'
    });
  }
});

// Process payment
router.post('/process', async (req, res) => {
  const { payment_id } = req.body;
  
  if (!payment_id) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Payment ID is required'
    });
  }
  
  try {
    const db = getDatabase();
    
    // Get payment details
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
    if (!payment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Payment not found'
      });
    }
    
    // Process mock payment
    const paymentResult = await processMockPayment(payment.amount, payment.payment_method);
    
    // Start transaction
    db.prepare('BEGIN').run();
    
    try {
      // Update payment status
      db.prepare(`
        UPDATE payments 
        SET status = ?, transaction_id = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run('completed', paymentResult.transaction_id, payment_id);
      
      // Update registration payment status
      db.prepare(`
        UPDATE registrations 
        SET payment_status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run('paid', payment.registration_id);
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      res.json({
        success: true,
        transaction_id: paymentResult.transaction_id
      });
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      error: 'Payment failed',
      message: error.message || 'Failed to process payment'
    });
  }
});

// Get payment status
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const payment = db.prepare(`
      SELECT p.*, r.ticket_type, r.name, r.email 
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      WHERE p.id = ?
    `).get(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Payment not found'
      });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch payment details'
    });
  }
});

export default router;
