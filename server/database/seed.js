import { initializeDatabase, getDatabase } from './init.js';

// Initialize database first
await initializeDatabase();
const db = getDatabase();

// Mock data for the main conference
const mainEvent = {
  title: 'TechConf 2024',
  description: 'Join us for three days of cutting-edge technology talks, workshops, and networking opportunities. TechConf brings together industry leaders, innovators, and developers to share knowledge and shape the future of technology.',
  type: 'conference',
  location: 'San Francisco, CA',
  venue: 'Moscone Center',
  capacity: 1000,
  start_date: '2024-06-15T09:00:00-07:00',
  end_date: '2024-06-17T17:00:00-07:00',
  registration_start_date: '2024-01-01T00:00:00-08:00',
  registration_end_date: '2024-06-01T23:59:59-07:00',
  ticket_types: JSON.stringify({
    standard: {
      price: 499.00,
      description: 'Full conference access including workshops',
      available: 600
    },
    vip: {
      price: 799.00,
      description: 'VIP access with exclusive networking events',
      available: 200
    },
    virtual: {
      price: 199.00,
      description: 'Online access to all talks',
      available: 1000
    }
  }),
  timezone: 'America/Los_Angeles',
  banner_image: 'https://example.com/techconf-banner.jpg',
  organizer_info: JSON.stringify({
    name: 'TechConf Organization',
    email: 'info@techconf.com',
    phone: '+1 (555) 123-4567',
    website: 'https://techconf.com'
  }),
  status: 'published'
};

// Mock speakers data
const speakers = [
  {
    name: 'Sarah Johnson',
    bio: 'AI Research Director at TechCorp',
    company: 'TechCorp',
    role: 'Director of AI Research',
    image_url: 'https://reqres.in/img/faces/1-image.jpg'
  },
  {
    name: 'Michael Chen',
    bio: 'Cloud Architecture Expert',
    company: 'CloudScale Solutions',
    role: 'Chief Architect',
    image_url: 'https://reqres.in/img/faces/5-image.jpg'
  },
  {
    name: 'Emily Rodriguez',
    bio: 'Cybersecurity Specialist',
    company: 'SecureNet',
    role: 'Head of Security',
    image_url: 'https://reqres.in/img/faces/8-image.jpg'
  },
  {
    name: 'David Kim',
    bio: 'Blockchain Innovation Leader',
    company: 'BlockChain Ventures',
    role: 'CTO',
    image_url: 'https://reqres.in/img/faces/11-image.jpg'
  }
];

// Mock talks data
const talks = [
  {
    title: 'The Future of AI in Enterprise',
    description: 'Exploring practical applications of AI in business contexts',
    room: 'Main Hall',
    start_time: '2024-06-15 09:00:00',
    end_time: '2024-06-15 10:30:00'
  },
  {
    title: 'Scaling Cloud Infrastructure',
    description: 'Best practices for building scalable cloud architecture',
    room: 'Room A',
    start_time: '2024-06-15 11:00:00',
    end_time: '2024-06-15 12:30:00'
  },
  {
    title: 'Modern Security Practices',
    description: 'Latest trends and practices in cybersecurity',
    room: 'Room B',
    start_time: '2024-06-16 09:00:00',
    end_time: '2024-06-16 10:30:00'
  },
  {
    title: 'Blockchain in Production',
    description: 'Real-world blockchain implementation strategies',
    room: 'Main Hall',
    start_time: '2024-06-16 14:00:00',
    end_time: '2024-06-16 15:30:00'
  }
];

// Mock registrations data with various statuses and payment states
const registrations = [
  {
    name: 'John Smith',
    email: 'john@example.com',
    company: 'Tech Solutions Inc',
    ticket_type: 'vip',
    status: 'active',
    payment_status: 'paid'
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    company: 'Dev Corp',
    ticket_type: 'standard',
    status: 'active',
    payment_status: 'paid'
  },
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    company: 'StartupX',
    ticket_type: 'virtual',
    status: 'cancelled',
    payment_status: 'refunded',
    refund_notes: 'Schedule conflict'
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    company: 'Innovation Labs',
    ticket_type: 'standard',
    status: 'active',
    payment_status: 'pending'
  },
  {
    name: 'David Lee',
    email: 'david@example.com',
    company: 'Cloud Systems',
    ticket_type: 'vip',
    status: 'cancelled',
    payment_status: 'refunded',
    refund_notes: 'Company policy change'
  },
  {
    name: 'Emma Wilson',
    email: 'emma@example.com',
    company: 'Data Analytics Ltd',
    ticket_type: 'standard',
    status: 'active',
    payment_status: 'paid'
  },
  {
    name: 'Frank Johnson',
    email: 'frank@example.com',
    company: 'Tech Innovators',
    ticket_type: 'virtual',
    status: 'active',
    payment_status: 'pending'
  },
  {
    name: 'Grace Kim',
    email: 'grace@example.com',
    company: 'Digital Solutions',
    ticket_type: 'vip',
    status: 'active',
    payment_status: 'paid'
  }
];

// Function to seed the database
async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Start transaction
    db.prepare('BEGIN').run();

    // Check for existing data
    const existingRegistrations = db.prepare('SELECT COUNT(*) as count FROM registrations').get();
    if (existingRegistrations.count > 0) {
      console.log('Database already has registrations. Clearing existing data...');
      db.prepare('DELETE FROM payments').run();
      db.prepare('DELETE FROM event_registrations').run();
      db.prepare('DELETE FROM registrations').run();
      db.prepare('DELETE FROM talks').run();
      db.prepare('DELETE FROM event_speakers').run();
      db.prepare('DELETE FROM speakers').run();
      db.prepare('DELETE FROM event_stats').run();
      db.prepare('DELETE FROM events').run();
    }

    // Insert main event
    console.log('Creating main event...');
    const eventResult = db.prepare(`
      INSERT INTO events (
        title, description, type, location, venue, capacity,
        start_date, end_date, registration_start_date, registration_end_date,
        ticket_types, timezone, banner_image, organizer_info, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mainEvent.title,
      mainEvent.description,
      mainEvent.type,
      mainEvent.location,
      mainEvent.venue,
      mainEvent.capacity,
      mainEvent.start_date,
      mainEvent.end_date,
      mainEvent.registration_start_date,
      mainEvent.registration_end_date,
      mainEvent.ticket_types,
      mainEvent.timezone,
      mainEvent.banner_image,
      mainEvent.organizer_info,
      mainEvent.status
    );

    // Initialize event stats
    console.log('Initializing event stats...');
    db.prepare(`
      INSERT INTO event_stats (event_id)
      VALUES (?)
    `).run(eventResult.lastInsertRowid);

    // Insert speakers
    console.log('Creating speakers...');
    const speakerIds = speakers.map(speaker => {
      const result = db.prepare(`
        INSERT INTO speakers (name, bio, company, role, image_url)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        speaker.name,
        speaker.bio,
        speaker.company,
        speaker.role,
        speaker.image_url
      );
      return result.lastInsertRowid;
    });

    // Link speakers to event
    console.log('Linking speakers to event...');
    speakerIds.forEach((speakerId, index) => {
      db.prepare(`
        INSERT INTO event_speakers (event_id, speaker_id, speaker_type)
        VALUES (?, ?, ?)
      `).run(
        eventResult.lastInsertRowid,
        speakerId,
        index === 0 ? 'keynote' : 'speaker'
      );
    });

    // Insert talks
    console.log('Creating talks...');
    talks.forEach((talk, index) => {
      db.prepare(`
        INSERT INTO talks (
          title, description, speaker_id, room,
          start_time, end_time, event_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        talk.title,
        talk.description,
        speakerIds[index % speakerIds.length],
        talk.room,
        talk.start_time,
        talk.end_time,
        eventResult.lastInsertRowid
      );
    });

    // Insert registrations
    console.log('Creating registrations...');
    registrations.forEach(reg => {
      // Create registration
      const regResult = db.prepare(`
        INSERT INTO registrations (
          name, email, company, ticket_type,
          status, payment_status, refund_notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        reg.name,
        reg.email,
        reg.company,
        reg.ticket_type,
        reg.status,
        reg.payment_status,
        reg.refund_notes || null
      );

      // Link to event
      db.prepare(`
        INSERT INTO event_registrations (registration_id, event_id)
        VALUES (?, ?)
      `).run(regResult.lastInsertRowid, eventResult.lastInsertRowid);

      // Create payment records based on status
      const ticketTypes = JSON.parse(mainEvent.ticket_types);
      const amount = ticketTypes[reg.ticket_type].price;
      
      if (reg.payment_status === 'paid' || reg.payment_status === 'refunded') {
        // Insert original payment
        db.prepare(`
          INSERT INTO payments (
            registration_id, amount, currency,
            status, payment_method, type, transaction_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          regResult.lastInsertRowid,
          amount,
          'USD',
          reg.payment_status === 'refunded' ? 'refunded' : 'completed',
          'credit_card',
          'payment',
          'mock_' + Date.now() + '_' + Math.random().toString(36).substring(7)
        );

        // If refunded, add refund record
        if (reg.payment_status === 'refunded') {
          db.prepare(`
            INSERT INTO payments (
              registration_id, amount, currency,
              status, payment_method, type, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            regResult.lastInsertRowid,
            -amount,
            'USD',
            'completed',
            'refund',
            'refund',
            reg.refund_notes
          );
        }
      }
    });

    // Update event stats
    console.log('Updating event stats...');
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
    `).get(eventResult.lastInsertRowid);

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
      eventResult.lastInsertRowid
    );

    // Commit transaction
    db.prepare('COMMIT').run();
    console.log('Database seeding completed successfully!');

  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seeding
seedDatabase().catch(console.error);
