import json
import os
import psycopg2
from datetime import datetime


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user(cur, session_id):
    cur.execute("""
        SELECT u.id, u.name, u.email, u.is_admin
        FROM sessions s JOIN users u ON s.user_id = u.id
        WHERE s.id = %s AND s.expires_at > NOW()
    """, (session_id,))
    return cur.fetchone()


def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def handler(event: dict, context) -> dict:
    """Личный кабинет: проекты, файлы, сообщения, счета"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    session_id = (event.get('headers') or {}).get('X-Session-Id', '')
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    project_id = params.get('project_id', '')

    conn = get_conn()
    cur = conn.cursor()
    user = get_user(cur, session_id)

    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    cur.execute("UPDATE users SET last_seen = NOW() WHERE id = %s", (user[0],))
    conn.commit()

    user_id, user_name, user_email, is_admin = user

    # GET ?action=projects — список проектов
    if method == 'GET' and action == 'projects':
        if is_admin:
            cur.execute("SELECT id, user_id, title, status, description, created_at, updated_at FROM projects ORDER BY updated_at DESC")
        else:
            cur.execute("SELECT id, user_id, title, status, description, created_at, updated_at FROM projects WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
        rows = cur.fetchall()
        conn.close()
        projects = [{'id': r[0], 'user_id': r[1], 'title': r[2], 'status': r[3], 'description': r[4], 'created_at': json_serial(r[5]), 'updated_at': json_serial(r[6])} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'projects': projects})}

    # GET ?action=files&project_id=X
    if method == 'GET' and action == 'files' and project_id:
        cur.execute("SELECT id, name, url, file_type, uploaded_at FROM project_files WHERE project_id = %s ORDER BY uploaded_at DESC", (project_id,))
        rows = cur.fetchall()
        conn.close()
        files = [{'id': r[0], 'name': r[1], 'url': r[2], 'file_type': r[3], 'uploaded_at': json_serial(r[4])} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'files': files})}

    # GET ?action=messages&project_id=X
    if method == 'GET' and action == 'messages' and project_id:
        cur.execute("""
            SELECT m.id, m.text, m.created_at, u.name, u.is_admin
            FROM messages m JOIN users u ON m.author_id = u.id
            WHERE m.project_id = %s ORDER BY m.created_at ASC
        """, (project_id,))
        rows = cur.fetchall()
        conn.close()
        msgs = [{'id': r[0], 'text': r[1], 'created_at': json_serial(r[2]), 'author': r[3], 'is_admin': r[4]} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'messages': msgs})}

    # POST action=send_message
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        act = body.get('action', '')
        if act == 'send_message':
            pid = body.get('project_id')
            text = body.get('text', '').strip()
            if not text or not pid:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id и text обязательны'})}
            cur.execute("INSERT INTO messages (project_id, author_id, text) VALUES (%s, %s, %s) RETURNING id, created_at", (pid, user_id, text))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': row[0], 'created_at': json_serial(row[1]), 'author': user_name, 'is_admin': is_admin, 'text': text})}

    # GET ?action=invoices&project_id=X
    if method == 'GET' and action == 'invoices' and project_id:
        cur.execute("SELECT id, title, amount, status, file_url, created_at FROM invoices WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
        rows = cur.fetchall()
        conn.close()
        invoices = [{'id': r[0], 'title': r[1], 'amount': float(r[2]), 'status': r[3], 'file_url': r[4], 'created_at': json_serial(r[5])} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'invoices': invoices})}

    conn.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}