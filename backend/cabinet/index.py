import json
import os
import base64
import mimetypes
import uuid
import psycopg2
import boto3
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

    # GET ?action=unread — число сообщений от команды по проектам пользователя одним запросом
    if method == 'GET' and action == 'unread':
        cur.execute("""
            SELECT m.project_id, COUNT(*)
            FROM messages m
            JOIN users u ON m.author_id = u.id
            JOIN projects p ON m.project_id = p.id
            WHERE u.is_admin = TRUE AND p.user_id = %s
            GROUP BY m.project_id
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        counts = {str(r[0]): r[1] for r in rows}
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'counts': counts})}

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

        if act == 'typing':
            pid = body.get('project_id')
            if pid:
                cur.execute("""
                    INSERT INTO typing_indicators (project_id, user_id, is_admin, updated_at)
                    VALUES (%s, %s, FALSE, NOW())
                    ON CONFLICT (project_id, user_id) DO UPDATE SET updated_at = NOW()
                """, (pid, user_id))
                conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        if act == 'get_typing':
            pid = body.get('project_id')
            if not pid:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id обязателен'})}
            cur.execute("""
                SELECT is_admin FROM typing_indicators
                WHERE project_id = %s AND user_id != %s AND updated_at > NOW() - INTERVAL '4 seconds'
            """, (pid, user_id))
            rows = cur.fetchall()
            conn.close()
            is_typing = any(r[0] for r in rows)
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'is_typing': is_typing})}

        if act == 'upload_file':
            pid = body.get('project_id')
            file_name = body.get('file_name', 'file')
            file_data = body.get('file_data', '')
            if not pid or not file_data:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id и file_data обязательны'})}
            cur.execute("SELECT id FROM projects WHERE id = %s AND user_id = %s", (pid, user_id))
            if not cur.fetchone():
                conn.close()
                return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'Доступ запрещён'})}
            raw = base64.b64decode(file_data)
            ext = os.path.splitext(file_name)[1].lower()
            content_type = mimetypes.guess_type(file_name)[0] or 'application/octet-stream'
            key = f"chat/{pid}/{uuid.uuid4().hex}{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            file_type = 'image' if content_type.startswith('image') else 'document'
            cur.execute("INSERT INTO project_files (project_id, name, url, file_type) VALUES (%s, %s, %s, %s) RETURNING id",
                (pid, file_name, cdn_url, file_type))
            file_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': file_id, 'url': cdn_url, 'file_type': file_type, 'name': file_name})}

    # GET ?action=invoices&project_id=X
    if method == 'GET' and action == 'invoices' and project_id:
        cur.execute("SELECT id, title, amount, status, file_url, created_at FROM invoices WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
        rows = cur.fetchall()
        conn.close()
        invoices = [{'id': r[0], 'title': r[1], 'amount': float(r[2]), 'status': r[3], 'file_url': r[4], 'created_at': json_serial(r[5])} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'invoices': invoices})}

    conn.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}