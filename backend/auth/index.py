import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Авторизация: login, me, logout"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    session_id = (event.get('headers') or {}).get('X-Session-Id', '')

    # GET — вернуть текущего пользователя по сессии
    if method == 'GET':
        if not session_id:
            return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.name, u.email, u.is_admin
            FROM sessions s JOIN users u ON s.user_id = u.id
            WHERE s.id = %s AND s.expires_at > NOW()
        """, (session_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Сессия истекла'})}
        uid, name, email, is_admin = row
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': uid, 'name': name, 'email': email, 'is_admin': is_admin})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'login')

        # logout
        if action == 'logout':
            if session_id:
                conn = get_conn()
                cur = conn.cursor()
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
                conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # login
        email = body.get('email', '').strip().lower()
        password = body.get('password', '').strip()
        if not email or not password:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Email и пароль обязательны'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, is_admin FROM users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Неверный email или пароль'})}

        user_id, name, is_admin = row
        new_session = secrets.token_hex(32)
        expires_at = datetime.now() + timedelta(days=30)
        cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (new_session, user_id, expires_at))
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'session_id': new_session, 'user': {'id': user_id, 'name': name, 'email': email, 'is_admin': is_admin}})}

    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}