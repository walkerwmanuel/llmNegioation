from typing import Optional, List
from database.db import get_db_connection


def create_debate(user_id: int, topic: str, debate_type: str) -> dict:
    """Creates a new debate and returns it with id"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO debates (user_id, topic, debate_type)
        VALUES (?, ?, ?)
    ''', (user_id, topic, debate_type))

    conn.commit()
    debate_id = cursor.lastrowid

    cursor.execute('SELECT * FROM debates WHERE id = ?', (debate_id,))
    debate = dict(cursor.fetchone())
    conn.close()

    return debate


def get_user_debates(user_id: int) -> List[dict]:
    """Returns list of user's debates ordered by updated_at DESC"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM debates
        WHERE user_id = ?
        ORDER BY updated_at DESC
    ''', (user_id,))

    debates = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return debates


def get_debate_with_messages(debate_id: int, user_id: int) -> Optional[dict]:
    """Returns debate with messages array, or None if not found or not owned by user"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get debate (verify ownership)
    cursor.execute('''
        SELECT * FROM debates
        WHERE id = ? AND user_id = ?
    ''', (debate_id, user_id))

    debate_row = cursor.fetchone()
    if not debate_row:
        conn.close()
        return None

    debate = dict(debate_row)

    # Get messages
    cursor.execute('''
        SELECT * FROM messages
        WHERE debate_id = ?
        ORDER BY created_at ASC
    ''', (debate_id,))

    debate['messages'] = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return debate


def delete_debate(debate_id: int, user_id: int) -> bool:
    """Deletes a debate if owned by user. Returns True if deleted, False otherwise."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        DELETE FROM debates
        WHERE id = ? AND user_id = ?
    ''', (debate_id, user_id))

    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()

    return deleted
