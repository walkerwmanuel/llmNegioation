import json
from typing import Optional, List
from database.db import get_db_connection


def create_negotiation(user_id: int, topic: str, negotiation_type: str, settings: Optional[dict] = None) -> dict:
    """Creates a new negotiation and returns it with id"""
    conn = get_db_connection()
    cursor = conn.cursor()

    settings_json = json.dumps(settings) if settings else None

    cursor.execute('''
        INSERT INTO negotiations (user_id, topic, negotiation_type, settings)
        VALUES (?, ?, ?, ?)
    ''', (user_id, topic, negotiation_type, settings_json))

    conn.commit()
    negotiation_id = cursor.lastrowid

    cursor.execute('SELECT * FROM negotiations WHERE id = ?', (negotiation_id,))
    row = cursor.fetchone()
    negotiation = dict(row)
    conn.close()

    # Parse settings JSON back to dict
    if negotiation.get('settings'):
        negotiation['settings'] = json.loads(negotiation['settings'])

    return negotiation


def get_user_negotiations(user_id: int) -> List[dict]:
    """Returns list of user's negotiations ordered by updated_at DESC"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM negotiations
        WHERE user_id = ?
        ORDER BY updated_at DESC
    ''', (user_id,))

    negotiations = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return negotiations


def get_negotiation_by_id(negotiation_id: int, user_id: int) -> Optional[dict]:
    """Returns negotiation if owned by user, or None"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM negotiations
        WHERE id = ? AND user_id = ?
    ''', (negotiation_id, user_id))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_negotiation_with_messages(negotiation_id: int, user_id: int) -> Optional[dict]:
    """Returns negotiation with messages array, or None if not found or not owned by user"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get negotiation (verify ownership)
    cursor.execute('''
        SELECT * FROM negotiations
        WHERE id = ? AND user_id = ?
    ''', (negotiation_id, user_id))

    negotiation_row = cursor.fetchone()
    if not negotiation_row:
        conn.close()
        return None

    negotiation = dict(negotiation_row)

    # Parse settings JSON if present
    if negotiation.get('settings'):
        try:
            negotiation['settings'] = json.loads(negotiation['settings'])
        except json.JSONDecodeError:
            negotiation['settings'] = None

    # Get messages (always returns an array, even if empty)
    cursor.execute('''
        SELECT id, negotiation_id, role, content, created_at, edited_at, original_content
        FROM messages
        WHERE negotiation_id = ?
        ORDER BY created_at ASC
    ''', (negotiation_id,))

    messages_rows = cursor.fetchall()
    # Always ensure messages is an array (never None)
    negotiation['messages'] = [dict(row) for row in messages_rows] if messages_rows else []
    conn.close()

    return negotiation


def update_negotiation_settings(negotiation_id: int, user_id: int, settings: dict) -> Optional[dict]:
    """Updates negotiation settings if owned by user. Returns updated negotiation or None."""
    conn = get_db_connection()
    cursor = conn.cursor()

    settings_json = json.dumps(settings)

    cursor.execute('''
        UPDATE negotiations
        SET settings = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ''', (settings_json, negotiation_id, user_id))

    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return None

    cursor.execute('SELECT * FROM negotiations WHERE id = ?', (negotiation_id,))
    row = cursor.fetchone()
    negotiation = dict(row)
    conn.close()

    # Parse settings JSON back to dict
    if negotiation.get('settings'):
        negotiation['settings'] = json.loads(negotiation['settings'])

    return negotiation


def delete_negotiation(negotiation_id: int, user_id: int) -> bool:
    """Deletes a negotiation if owned by user. Returns True if deleted, False otherwise."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        DELETE FROM negotiations
        WHERE id = ? AND user_id = ?
    ''', (negotiation_id, user_id))

    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()

    return deleted
