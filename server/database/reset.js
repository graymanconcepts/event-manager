import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'conference.db');

// Delete existing database if it exists
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Existing database deleted');
}

const db = new Database(DB_PATH);

// Create tables
db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE speakers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT,
        image_url TEXT,
        company TEXT,
        role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE talks (
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

    CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        location TEXT,
        venue TEXT,
        capacity INTEGER,
        start_date DATETIME,
        end_date DATETIME,
        registration_start_date DATETIME,
        registration_end_date DATETIME,
        ticket_types TEXT,
        timezone TEXT,
        banner_image TEXT,
        organizer_info TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE event_speakers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        speaker_id INTEGER NOT NULL,
        speaker_type TEXT DEFAULT 'speaker',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (speaker_id) REFERENCES speakers (id),
        UNIQUE(event_id, speaker_id)
    );

    CREATE TABLE event_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        total_registrations INTEGER DEFAULT 0,
        confirmed_registrations INTEGER DEFAULT 0,
        pending_registrations INTEGER DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id)
    );

    CREATE TABLE registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        dietary_requirements TEXT,
        ticket_type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        payment_status TEXT DEFAULT 'pending',
        payment_amount DECIMAL(10,2),
        refund_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id),
        FOREIGN KEY (event_id) REFERENCES events (id),
        UNIQUE(registration_id, event_id)
    );

    CREATE TABLE talk_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        talk_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id),
        FOREIGN KEY (talk_id) REFERENCES talks (id),
        UNIQUE(registration_id, talk_id)
    );

    CREATE TABLE payments (
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
    );

    CREATE TABLE content_blocks (
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
`);

// Create default admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);

console.log('Database reset complete. Default admin user created (username: admin, password: admin123)');

// Close the database connection
db.close();
