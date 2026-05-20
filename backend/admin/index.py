import json
import os
import hashlib
import base64
import mimetypes
import uuid
import psycopg2
import boto3
from datetime import datetime


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_admin(cur, session_id):
    cur.execute("""
        SELECT u.id, u.is_admin
        FROM sessions s JOIN users u ON s.user_id = u.id
        WHERE s.id = %s AND s.expires_at > NOW() AND u.is_admin = TRUE
    """, (session_id,))
    return cur.fetchone()


def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def handler(event: dict, context) -> dict:
    """Админка: управление клиентами и проектами"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    session_id = (event.get('headers') or {}).get('X-Session-Id', '')
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    conn = get_conn()
    cur = conn.cursor()
    admin = get_admin(cur, session_id)

    if not admin:
        conn.close()
        return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'Доступ запрещён'})}

    # GET ?action=users
    if method == 'GET' and action == 'users':
        cur.execute("SELECT id, name, email, created_at FROM users WHERE is_admin = FALSE ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        users = [{'id': r[0], 'name': r[1], 'email': r[2], 'created_at': json_serial(r[3])} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'users': users})}

    # GET ?action=projects
    if method == 'GET' and action == 'projects':
        cur.execute("""
            SELECT p.id, p.user_id, p.title, p.status, p.description, p.created_at, p.updated_at, u.name
            FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.updated_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        projects = [{'id': r[0], 'user_id': r[1], 'title': r[2], 'status': r[3], 'description': r[4], 'created_at': json_serial(r[5]), 'updated_at': json_serial(r[6]), 'client_name': r[7]} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'projects': projects})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        act = body.get('action', '')

        # create_user
        if act == 'create_user':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            password = body.get('password', '').strip()
            if not name or not email or not password:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Все поля обязательны'})}
            cur.execute("INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id", (name, email, hash_password(password)))
            user_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': user_id})}

        # create_project
        if act == 'create_project':
            user_id = body.get('user_id')
            title = body.get('title', '').strip()
            status = body.get('status', 'new')
            description = body.get('description', '').strip()
            if not user_id or not title:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'user_id и title обязательны'})}
            cur.execute("INSERT INTO projects (user_id, title, status, description) VALUES (%s, %s, %s, %s) RETURNING id", (user_id, title, status, description))
            project_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': project_id})}

        # update_status
        if act == 'update_status':
            project_id = body.get('project_id')
            status = body.get('status', '').strip()
            cur.execute("UPDATE projects SET status = %s, updated_at = NOW() WHERE id = %s", (status, project_id))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # add_file
        if act == 'add_file':
            project_id = body.get('project_id')
            name = body.get('name', '').strip()
            url = body.get('url', '').strip()
            file_type = body.get('file_type', '').strip()
            if not name or not url or not project_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id, name и url обязательны'})}
            cur.execute("INSERT INTO project_files (project_id, name, url, file_type) VALUES (%s, %s, %s, %s) RETURNING id", (project_id, name, url, file_type))
            file_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': file_id})}

        # add_invoice
        if act == 'add_invoice':
            project_id = body.get('project_id')
            title = body.get('title', '').strip()
            amount = body.get('amount', 0)
            file_url = body.get('file_url', '')
            if not title or not amount or not project_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id, title и amount обязательны'})}
            cur.execute("INSERT INTO invoices (project_id, title, amount, file_url) VALUES (%s, %s, %s, %s) RETURNING id", (project_id, title, amount, file_url))
            inv_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': inv_id})}

        # delete_user
        if act == 'delete_user':
            uid = body.get('user_id')
            if not uid:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'user_id обязателен'})}
            cur.execute("DELETE FROM messages WHERE project_id IN (SELECT id FROM projects WHERE user_id = %s)", (uid,))
            cur.execute("DELETE FROM project_files WHERE project_id IN (SELECT id FROM projects WHERE user_id = %s)", (uid,))
            cur.execute("DELETE FROM invoices WHERE project_id IN (SELECT id FROM projects WHERE user_id = %s)", (uid,))
            cur.execute("DELETE FROM projects WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM sessions WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM users WHERE id = %s AND is_admin = FALSE", (uid,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # update_user
        if act == 'update_user':
            uid = body.get('user_id')
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            password = body.get('password', '').strip()
            if not uid or not name or not email:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'user_id, name и email обязательны'})}
            if password:
                cur.execute("UPDATE users SET name = %s, email = %s, password_hash = %s WHERE id = %s AND is_admin = FALSE", (name, email, hash_password(password), uid))
            else:
                cur.execute("UPDATE users SET name = %s, email = %s WHERE id = %s AND is_admin = FALSE", (name, email, uid))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # upload_file — загрузка файла в S3, сохранение в project_files
        if act == 'upload_file':
            project_id = body.get('project_id')
            file_name = body.get('file_name', 'file')
            file_data = body.get('file_data', '')
            if not project_id or not file_data:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id и file_data обязательны'})}
            raw = base64.b64decode(file_data)
            ext = os.path.splitext(file_name)[1].lower()
            content_type = mimetypes.guess_type(file_name)[0] or 'application/octet-stream'
            key = f"chat/{project_id}/{uuid.uuid4().hex}{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            file_type = 'image' if content_type.startswith('image') else 'document'
            cur.execute("INSERT INTO project_files (project_id, name, url, file_type) VALUES (%s, %s, %s, %s) RETURNING id",
                (project_id, file_name, cdn_url, file_type))
            file_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': file_id, 'url': cdn_url, 'file_type': file_type, 'name': file_name})}

        # send_message (от имени админа)
        if act == 'send_message':
            admin_id = admin[0]
            project_id = body.get('project_id')
            text = body.get('text', '').strip()
            if not text or not project_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id и text обязательны'})}
            cur.execute("INSERT INTO messages (project_id, author_id, text) VALUES (%s, %s, %s) RETURNING id, created_at", (project_id, admin_id, text))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': row[0], 'created_at': json_serial(row[1])})}

    conn.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}