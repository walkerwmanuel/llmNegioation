from typing import Optional
from database.db import get_db_connection


def create_or_get_user(oauth_id: str, email: str, name: str, avatar_url: str) -> dict:
    """Creates a new user or returns existing user by oauth_id"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Try to get existing user
    cursor.execute('SELECT * FROM users WHERE oauth_id = ?', (oauth_id,))
    row = cursor.fetchone()

    if row:
        user = dict(row)
        conn.close()
        return user

    # Create new user
    cursor.execute('''
        INSERT INTO users (oauth_id, email, name, avatar_url)
        VALUES (?, ?, ?, ?)
    ''', (oauth_id, email, name, avatar_url))

    conn.commit()
    user_id = cursor.lastrowid

    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = dict(cursor.fetchone())
    conn.close()

    return user


def get_user_by_id(user_id: int) -> Optional[dict]:
    """Returns user by id or None if not found"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None
