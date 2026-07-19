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

    # ПУБЛИЧНЫЙ доступ (без авторизации): активные разделы и акции для главной
    if method == 'GET' and action == 'public':
        cur.execute("SELECT key, enabled FROM site_sections")
        sections = {r[0]: r[1] for r in cur.fetchall()}
        promos = []
        if sections.get('promo'):
            cur.execute("""
                SELECT id, title, description, badge, old_price, new_price
                FROM promos WHERE active = TRUE ORDER BY sort_order ASC, id ASC
            """)
            promos = [{'id': r[0], 'title': r[1], 'description': r[2], 'badge': r[3], 'old_price': r[4], 'new_price': r[5]} for r in cur.fetchall()]
        reviews = []
        if sections.get('reviews'):
            cur.execute("""
                SELECT id, name, role, text, rating
                FROM reviews WHERE active = TRUE ORDER BY sort_order ASC, id ASC
            """)
            reviews = [{'id': r[0], 'name': r[1], 'role': r[2], 'text': r[3], 'rating': r[4]} for r in cur.fetchall()]
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sections': sections, 'promos': promos, 'reviews': reviews})}

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

    # GET ?action=unread — счётчики клиентских сообщений по всем проектам одним запросом
    if method == 'GET' and action == 'unread':
        cur.execute("""
            SELECT m.project_id, COUNT(*)
            FROM messages m JOIN users u ON m.author_id = u.id
            WHERE u.is_admin = FALSE
            GROUP BY m.project_id
        """)
        rows = cur.fetchall()
        counts = {str(r[0]): r[1] for r in rows}
        cur.execute("SELECT id FROM invoices WHERE status = 'awaiting' ORDER BY id")
        awaiting = [r[0] for r in cur.fetchall()]
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'counts': counts, 'awaiting_payments': awaiting})}

    # GET ?action=sections — список разделов сайта (вкл/выкл)
    if method == 'GET' and action == 'sections':
        cur.execute("SELECT key, title, enabled FROM site_sections ORDER BY title")
        rows = cur.fetchall()
        conn.close()
        sections = [{'key': r[0], 'title': r[1], 'enabled': r[2]} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sections': sections})}

    # GET ?action=promos — все акции (для админки)
    if method == 'GET' and action == 'promos':
        cur.execute("""
            SELECT id, title, description, badge, old_price, new_price, active, sort_order
            FROM promos ORDER BY sort_order ASC, id ASC
        """)
        rows = cur.fetchall()
        conn.close()
        promos = [{'id': r[0], 'title': r[1], 'description': r[2], 'badge': r[3], 'old_price': r[4], 'new_price': r[5], 'active': r[6], 'sort_order': r[7]} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'promos': promos})}

    # GET ?action=reviews — все отзывы (для админки)
    if method == 'GET' and action == 'reviews':
        cur.execute("""
            SELECT id, name, role, text, rating, active, sort_order
            FROM reviews ORDER BY sort_order ASC, id ASC
        """)
        rows = cur.fetchall()
        conn.close()
        reviews = [{'id': r[0], 'name': r[1], 'role': r[2], 'text': r[3], 'rating': r[4], 'active': r[5], 'sort_order': r[6]} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'reviews': reviews})}

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

        # change_password — админ меняет свой пароль
        if act == 'change_password':
            current = body.get('current_password', '').strip()
            new_password = body.get('new_password', '').strip()
            if not current or not new_password:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(new_password) < 6:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Пароль должен быть не короче 6 символов'})}
            cur.execute("SELECT password_hash FROM users WHERE id = %s", (admin[0],))
            row = cur.fetchone()
            if not row or row[0] != hash_password(current):
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Текущий пароль неверный'})}
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hash_password(new_password), admin[0]))
            cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s AND id != %s", (admin[0], session_id))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

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

        # delete_file
        if act == 'delete_file':
            file_id = body.get('file_id')
            if not file_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'file_id обязателен'})}
            cur.execute("DELETE FROM project_files WHERE id = %s", (file_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # delete_invoice — отменить (удалить) счёт
        if act == 'delete_invoice':
            invoice_id = body.get('invoice_id')
            if not invoice_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invoice_id обязателен'})}
            cur.execute("SELECT status FROM invoices WHERE id = %s", (invoice_id,))
            row = cur.fetchone()
            if row and row[0] == 'paid':
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Нельзя удалить оплаченный счёт'})}
            cur.execute("DELETE FROM invoices WHERE id = %s AND status != 'paid'", (invoice_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

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

        # confirm_payment — админ подтверждает поступление денег
        if act == 'confirm_payment':
            invoice_id = body.get('invoice_id')
            if not invoice_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invoice_id обязателен'})}
            cur.execute("UPDATE invoices SET status = 'paid' WHERE id = %s", (invoice_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

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

        # typing — индикатор набора
        if act == 'typing':
            admin_id = admin[0]
            project_id = body.get('project_id')
            if project_id:
                cur.execute("""
                    INSERT INTO typing_indicators (project_id, user_id, is_admin, updated_at)
                    VALUES (%s, %s, TRUE, NOW())
                    ON CONFLICT (project_id, user_id) DO UPDATE SET updated_at = NOW()
                """, (project_id, admin_id))
                conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # get_typing
        if act == 'get_typing':
            admin_id = admin[0]
            project_id = body.get('project_id')
            if not project_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'project_id обязателен'})}
            cur.execute("""
                SELECT is_admin FROM typing_indicators
                WHERE project_id = %s AND user_id != %s AND updated_at > NOW() - INTERVAL '4 seconds'
            """, (project_id, admin_id))
            rows = cur.fetchall()
            conn.close()
            is_typing = any(not r[0] for r in rows)
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'is_typing': is_typing})}

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

        # toggle_section — включить/выключить раздел сайта
        if act == 'toggle_section':
            key = body.get('key', '').strip()
            enabled = bool(body.get('enabled'))
            if not key:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'key обязателен'})}
            cur.execute("UPDATE site_sections SET enabled = %s, updated_at = NOW() WHERE key = %s", (enabled, key))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # save_promo — создать или обновить акцию
        if act == 'save_promo':
            promo_id = body.get('id')
            title = body.get('title', '').strip()
            description = body.get('description', '').strip()
            badge = body.get('badge', '').strip()
            old_price = body.get('old_price', '').strip()
            new_price = body.get('new_price', '').strip()
            active = bool(body.get('active', True))
            sort_order = body.get('sort_order', 0) or 0
            if not title:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заголовок обязателен'})}
            if promo_id:
                cur.execute("""
                    UPDATE promos SET title=%s, description=%s, badge=%s, old_price=%s, new_price=%s, active=%s, sort_order=%s
                    WHERE id=%s
                """, (title, description, badge, old_price, new_price, active, sort_order, promo_id))
            else:
                cur.execute("""
                    INSERT INTO promos (title, description, badge, old_price, new_price, active, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (title, description, badge, old_price, new_price, active, sort_order))
                promo_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': promo_id})}

        # delete_promo — удалить акцию
        if act == 'delete_promo':
            promo_id = body.get('id')
            if not promo_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'id обязателен'})}
            cur.execute("DELETE FROM promos WHERE id = %s", (promo_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # save_review — создать или обновить отзыв
        if act == 'save_review':
            review_id = body.get('id')
            name = body.get('name', '').strip()
            role = body.get('role', '').strip()
            text = body.get('text', '').strip()
            rating = body.get('rating', 5) or 5
            active = bool(body.get('active', True))
            sort_order = body.get('sort_order', 0) or 0
            if not name:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Имя обязательно'})}
            if review_id:
                cur.execute("""
                    UPDATE reviews SET name=%s, role=%s, text=%s, rating=%s, active=%s, sort_order=%s WHERE id=%s
                """, (name, role, text, rating, active, sort_order, review_id))
            else:
                cur.execute("""
                    INSERT INTO reviews (name, role, text, rating, active, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """, (name, role, text, rating, active, sort_order))
                review_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': review_id})}

        # delete_review — удалить отзыв
        if act == 'delete_review':
            review_id = body.get('id')
            if not review_id:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'id обязателен'})}
            cur.execute("DELETE FROM reviews WHERE id = %s", (review_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}