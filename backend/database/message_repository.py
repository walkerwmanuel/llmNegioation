from typing import List
from database.db import get_db_connection


def add_message(debate_id: int, role: str, content: str) -> dict:
    """Adds a message to a debate and updates debate's updated_at timestamp"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert message
    cursor.execute('''
        INSERT INTO messages (debate_id, role, content)
        VALUES (?, ?, ?)
    ''', (debate_id, role, content))

    message_id = cursor.lastrowid

    # Update debate's updated_at
    cursor.execute('''
        UPDATE debates
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (debate_id,))

    conn.commit()

    # Fetch the created message
    cursor.execute('SELECT * FROM messages WHERE id = ?', (message_id,))
    message = dict(cursor.fetchone())
    conn.close()

    return message


def get_messages(debate_id: int) -> List[dict]:
    """Returns messages for a debate ordered by created_at ASC"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM messages
        WHERE debate_id = ?
        ORDER BY created_at ASC
    ''', (debate_id,))

    messages = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return messages
