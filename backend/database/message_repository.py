from typing import List
from database.db import get_db_connection


def add_message(negotiation_id: int, role: str, content: str) -> dict:
    """Adds a message to a negotiation and updates negotiation's updated_at timestamp"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert message
    cursor.execute('''
        INSERT INTO messages (negotiation_id, role, content)
        VALUES (?, ?, ?)
    ''', (negotiation_id, role, content))

    message_id = cursor.lastrowid

    # Update negotiation's updated_at
    cursor.execute('''
        UPDATE negotiations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (negotiation_id,))

    conn.commit()

    # Fetch the created message
    cursor.execute('SELECT * FROM messages WHERE id = ?', (message_id,))
    message = dict(cursor.fetchone())
    conn.close()

    return message


def get_messages(negotiation_id: int) -> List[dict]:
    """Returns messages for a negotiation ordered by created_at ASC"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM messages
        WHERE negotiation_id = ?
        ORDER BY created_at ASC
    ''', (negotiation_id,))

    messages = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return messages
