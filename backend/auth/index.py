import json
import os
import hashlib
import secrets
import random
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def gen_code() -> str:
    return ''.join(str(random.randint(0, 9)) for _ in range(8))


def send_code_email(to_email: str, code: str, purpose: str):
    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ['SMTP_PORT'])
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']

    title = 'Код для входа в админ-панель' if purpose == 'login' else 'Код для сброса пароля'
    subtitle = ('Введите этот код, чтобы завершить вход в личный кабинет администратора.'
                if purpose == 'login' else
                'Введите этот код, чтобы задать новый пароль администратора.')

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 28px 32px;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">🔐 {title}</h1>
      </div>
      <div style="padding: 28px 32px 32px; color: #e0e0e0;">
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #a0a0b0;">{subtitle}</p>
        <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #fff;">{code}</span>
        </div>
        <p style="margin: 0; font-size: 13px; color: #888;">Код действует 10 минут. Если вы не запрашивали его — просто проигнорируйте это письмо.</p>
      </div>
    </div>
    """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = title
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())


def create_and_send_code(cur, user_id: int, email: str, purpose: str):
    cur.execute("UPDATE auth_codes SET used = TRUE WHERE user_id = %s AND purpose = %s AND used = FALSE", (user_id, purpose))
    code = gen_code()
    expires_at = datetime.now() + timedelta(minutes=10)
    cur.execute(
        "INSERT INTO auth_codes (user_id, code, purpose, expires_at) VALUES (%s, %s, %s, %s)",
        (user_id, code, purpose, expires_at)
    )
    send_code_email(email, code, purpose)


def verify_stored_code(cur, user_id: int, purpose: str, code: str):
    cur.execute(
        "SELECT id, code, attempts FROM auth_codes WHERE user_id = %s AND purpose = %s AND used = FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
        (user_id, purpose)
    )
    row = cur.fetchone()
    if not row:
        return False, 'Код истёк или не найден. Запросите новый.'
    code_id, real_code, attempts = row
    if attempts >= 5:
        cur.execute("UPDATE auth_codes SET used = TRUE WHERE id = %s", (code_id,))
        return False, 'Слишком много попыток. Запросите новый код.'
    if code.strip() != real_code:
        cur.execute("UPDATE auth_codes SET attempts = attempts + 1 WHERE id = %s", (code_id,))
        return False, 'Неверный код'
    cur.execute("UPDATE auth_codes SET used = TRUE WHERE id = %s", (code_id,))
    return True, None


def issue_session(cur, user_id: int) -> str:
    new_session = secrets.token_hex(32)
    expires_at = datetime.now() + timedelta(days=30)
    cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (new_session, user_id, expires_at))
    return new_session


def handler(event: dict, context) -> dict:
    """Авторизация: login (с 2FA для админа), verify_login, request_reset, reset_password, me, logout"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    session_id = (event.get('headers') or {}).get('X-Session-Id', '')

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

        # login — проверка пароля. Для админа отправляем код (2FA), сессию не выдаём
        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '').strip()
            if not email or not password:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Email и пароль обязательны'})}

            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, name, email, is_admin FROM users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Неверный email или пароль'})}

            user_id, name, user_email, is_admin = row

            if is_admin:
                create_and_send_code(cur, user_id, user_email, 'login')
                conn.commit()
                conn.close()
                masked = user_email[0] + '***' + user_email[user_email.index('@'):] if '@' in user_email else user_email
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'need_2fa': True, 'email_hint': masked})}

            new_session = issue_session(cur, user_id)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'session_id': new_session, 'user': {'id': user_id, 'name': name, 'email': user_email, 'is_admin': is_admin}})}

        # verify_login — проверка 2FA-кода админа, выдаём сессию
        if action == 'verify_login':
            email = body.get('email', '').strip().lower()
            code = body.get('code', '').strip()
            if not email or not code:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Email и код обязательны'})}

            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, name, email, is_admin FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Пользователь не найден'})}
            user_id, name, user_email, is_admin = row

            ok, err = verify_stored_code(cur, user_id, 'login', code)
            if not ok:
                conn.commit()
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': err})}

            new_session = issue_session(cur, user_id)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'session_id': new_session, 'user': {'id': user_id, 'name': name, 'email': user_email, 'is_admin': is_admin}})}

        # request_reset — отправить код для сброса пароля админа
        if action == 'request_reset':
            email = body.get('email', '').strip().lower()
            if not email:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Email обязателен'})}

            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, email, is_admin FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            # Не раскрываем, существует ли пользователь
            if row and row[2]:
                create_and_send_code(cur, row[0], row[1], 'reset')
                conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # reset_password — проверить код и установить новый пароль
        if action == 'reset_password':
            email = body.get('email', '').strip().lower()
            code = body.get('code', '').strip()
            new_password = body.get('new_password', '').strip()
            if not email or not code or not new_password:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(new_password) < 6:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Пароль должен быть не короче 6 символов'})}

            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, is_admin FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row or not row[1]:
                conn.close()
                return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Пользователь не найден'})}
            user_id = row[0]

            ok, err = verify_stored_code(cur, user_id, 'reset', code)
            if not ok:
                conn.commit()
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': err})}

            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hash_password(new_password), user_id))
            cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Неизвестное действие'})}

    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
