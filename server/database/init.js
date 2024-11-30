import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'conference.db');

let db;

export async function initializeDatabase() {
  try {
    db = new Database(DB_PATH);

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS speakers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT,
        image_url TEXT,
        company TEXT,
        role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS talks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        speaker_id INTEGER,
        event_id INTEGER NOT NULL,
        start_time DATETIME,
        end_time DATETIME,
        room TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (speaker_id) REFERENCES speakers (id),
        FOREIGN KEY (event_id) REFERENCES events (id)
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        dietary_requirements TEXT,
        ticket_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS talk_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        talk_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id),
        FOREIGN KEY (talk_id) REFERENCES talks (id),
        UNIQUE(registration_id, talk_id)
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        location TEXT,
        venue TEXT,
        capacity INTEGER,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        registration_start_date DATE,
        registration_end_date DATE,
        status TEXT DEFAULT 'draft',
        ticket_types TEXT NOT NULL,  
        timezone TEXT DEFAULT 'UTC',
        banner_image TEXT,
        organizer_info TEXT,  
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS event_speakers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        speaker_id INTEGER NOT NULL,
        speaker_type TEXT DEFAULT 'speaker',  
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (speaker_id) REFERENCES speakers (id),
        UNIQUE(event_id, speaker_id)
      );

      CREATE TABLE IF NOT EXISTS event_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        total_registrations INTEGER DEFAULT 0,
        confirmed_registrations INTEGER DEFAULT 0,
        pending_registrations INTEGER DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        UNIQUE(event_id)
      );

      CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id),
        FOREIGN KEY (event_id) REFERENCES events (id),
        UNIQUE(registration_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS content_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier TEXT UNIQUE NOT NULL,
        title TEXT,
        content TEXT,
        image_url TEXT,
        section TEXT NOT NULL,
        order_index INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        type VARCHAR(20) DEFAULT 'payment',
        transaction_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id)
      )
    `);

    // Add payment_status to registrations if it doesn't exist
    const registrationsColumns = db.prepare(`PRAGMA table_info(registrations)`).all();
    if (!registrationsColumns.find(col => col.name === 'payment_status')) {
      db.prepare(`ALTER TABLE registrations ADD COLUMN payment_status TEXT DEFAULT 'pending'`).run();
    }

    // Check if admin user exists, if not create one
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!adminUser) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
    }

    // Insert default content blocks if they don't exist
    const defaultContentBlocks = [
      {
        identifier: 'hero_title',
        title: 'TechConf 2024',
        section: 'hero',
        order_index: 1
      },
      {
        identifier: 'hero_subtitle',
        title: 'Where Innovation Meets Implementation',
        section: 'hero',
        order_index: 2
      },
      {
        identifier: 'stats_experts',
        title: '50+',
        content: 'Industry Experts|Learn from the best minds in tech',
        section: 'stats',
        order_index: 1
      },
      {
        identifier: 'stats_days',
        title: '3',
        content: 'Days of Learning|Packed with workshops and talks',
        section: 'stats',
        order_index: 2
      },
      {
        identifier: 'stats_attendees',
        title: '1000+',
        content: 'Attendees|Network with global tech leaders',
        section: 'stats',
        order_index: 3
      },
      {
        identifier: 'featured_date',
        title: 'June 15-17, 2024',
        section: 'featured',
        order_index: 1
      },
      {
        identifier: 'featured_location',
        title: 'San Francisco Convention Center',
        section: 'featured',
        order_index: 2
      },
      {
        identifier: 'featured_keynotes',
        title: 'Keynotes from Industry Leaders',
        section: 'featured',
        order_index: 3
      },
      {
        identifier: 'featured_workshops',
        title: 'Hands-on Workshops',
        section: 'featured',
        order_index: 4
      },
      {
        identifier: 'featured_networking',
        title: 'Networking Events',
        section: 'featured',
        order_index: 5
      }
    ];

    for (const block of defaultContentBlocks) {
      const exists = db.prepare('SELECT id FROM content_blocks WHERE identifier = ?').get(block.identifier);
      if (!exists) {
        db.prepare(`
          INSERT INTO content_blocks (identifier, title, content, section, order_index)
          VALUES (?, ?, ?, ?, ?)
        `).run(block.identifier, block.title, block.content, block.section, block.order_index);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export both named exports and a default export
export default {
  initialize: initializeDatabase,
  get: getDatabase
};