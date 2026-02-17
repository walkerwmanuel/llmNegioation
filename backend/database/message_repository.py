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


def get_message_by_id(message_id: int) -> dict | None:
    """Returns a single message by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM messages WHERE id = ?', (message_id,))
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def update_message_content(message_id: int, new_content: str) -> dict | None:
    """
    Updates message content and tracks the edit.
    On first edit, original_content is preserved.
    edited_at is always updated.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get current message
    cursor.execute('SELECT * FROM messages WHERE id = ?', (message_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    message = dict(row)

    # If this is the first edit, preserve original content
    if message.get('original_content') is None:
        cursor.execute('''
            UPDATE messages
            SET content = ?,
                edited_at = CURRENT_TIMESTAMP,
                original_content = ?
            WHERE id = ?
        ''', (new_content, message['content'], message_id))
    else:
        # Subsequent edits just update content and edited_at
        cursor.execute('''
            UPDATE messages
            SET content = ?,
                edited_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (new_content, message_id))

    conn.commit()

    # Fetch updated message
    cursor.execute('SELECT * FROM messages WHERE id = ?', (message_id,))
    updated = dict(cursor.fetchone())
    conn.close()

    return updated
