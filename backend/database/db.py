import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'negotiations.db')


def get_db_connection():
    """Returns a SQLite connection to negotiations.db"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Creates all tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            oauth_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create negotiations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS negotiations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            topic TEXT NOT NULL,
            negotiation_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            negotiation_id INTEGER REFERENCES negotiations(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            edited_at TIMESTAMP,
            original_content TEXT
        )
    ''')

    conn.commit()
    conn.close()

    # Run migrations for existing databases
    run_migrations()


def run_migrations():
    """Run database migrations to add new columns to existing tables"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if edited_at column exists in messages table
    cursor.execute("PRAGMA table_info(messages)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'edited_at' not in columns:
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP')
            print("Migration: Added edited_at column to messages table")
        except Exception as e:
            print(f"Migration warning (edited_at): {e}")

    if 'original_content' not in columns:
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN original_content TEXT')
            print("Migration: Added original_content column to messages table")
        except Exception as e:
            print(f"Migration warning (original_content): {e}")

    conn.commit()
    conn.close()
