import { getDatabase, initializeDatabase } from '../database/init.js';
import mockPaymentService from '../services/mockPaymentService.js';
import { initializeRouter } from '../routes/registrations.js';

const TICKET_TYPES = ['standard', 'vip', 'virtual'];
const PAYMENT_METHODS = ['credit_card', 'bank_transfer', 'paypal'];
const COMPANIES = ['Tech Corp', 'Innovate Inc', 'Digital Solutions', 'Cloud Systems', 'Data Analytics Ltd'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateTestData() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    await initializeRouter();
    
    const db = getDatabase();
    
    console.log('Starting test data generation...');
    
    // Start a transaction
    db.prepare('BEGIN').run();

    // Generate 20 test registrations
    for (let i = 1; i <= 20; i++) {
      const ticketType = getRandomElement(TICKET_TYPES);
      const paymentMethod = getRandomElement(PAYMENT_METHODS);
      const company = getRandomElement(COMPANIES);
      const registrationDate = getRandomDate(new Date(2024, 0, 1), new Date());
      
      // Determine ticket price
      const ticketPrices = {
        'standard': 499.00,
        'vip': 799.00,
        'virtual': 199.00
      };
      const amount = ticketPrices[ticketType];

      // Insert registration
      const registrationResult = db.prepare(`
        INSERT INTO registrations (
          name,
          email,
          company,
          ticket_type,
          status,
          payment_status,
          payment_amount,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `Test User ${i}`,
        `testuser${i}@example.com`,
        company,
        ticketType,
        'active',
        'pending',
        amount,
        registrationDate.toISOString(),
        registrationDate.toISOString()
      );

      const registrationId = registrationResult.lastInsertRowid;

      // Simulate payment processing
      try {
        const paymentResult = await mockPaymentService.processPayment(amount);
        
        // Insert successful payment
        db.prepare(`
          INSERT INTO payments (
            registration_id,
            amount,
            currency,
            status,
            payment_method,
            type,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          registrationId,
          amount,
          'USD',
          'paid',
          paymentMethod,
          'payment',
          registrationDate.toISOString(),
          registrationDate.toISOString()
        );

        // Update registration payment status
        db.prepare(`
          UPDATE registrations 
          SET payment_status = 'paid'
          WHERE id = ?
        `).run(registrationId);

        // Randomly cancel some registrations (20% chance)
        if (Math.random() < 0.2) {
          const cancellationDate = getRandomDate(registrationDate, new Date());
          
          // Process refund
          const refundResult = await mockPaymentService.processRefund(paymentResult.transactionId, amount);
          
          // Update registration status
          db.prepare(`
            UPDATE registrations 
            SET status = 'cancelled',
                payment_status = 'refunded',
                refund_notes = ?,
                updated_at = ?
            WHERE id = ?
          `).run(
            'Test cancellation',
            cancellationDate.toISOString(),
            registrationId
          );

          // Insert refund payment
          db.prepare(`
            INSERT INTO payments (
              registration_id,
              amount,
              currency,
              status,
              payment_method,
              type,
              notes,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            registrationId,
            -amount,
            'USD',
            'completed',
            'refund',
            'refund',
            'Test refund',
            cancellationDate.toISOString(),
            cancellationDate.toISOString()
          );
        }
      } catch (error) {
        console.log(`Payment failed for registration ${registrationId}`);
      }
    }

    // Commit the transaction
    db.prepare('COMMIT').run();
    console.log('Test data generation completed successfully!');
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('Error generating test data:', error);
    throw error;
  }
}

// Run the generator
generateTestData().catch(console.error);
