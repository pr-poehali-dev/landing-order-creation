import json
import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_email(to_email: str, client_name: str, project_title: str, message_text: str):
    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ['SMTP_PORT'])
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новое сообщение по проекту «{project_title}»'
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 28px 32px;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">Новое сообщение от команды</h1>
      </div>
      <div style="padding: 28px 32px; color: #e0e0e0;">
        <p style="margin: 0 0 8px 0; color: #a0a0b0; font-size: 14px;">Проект</p>
        <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #fff;">{project_title}</p>
        <div style="background: rgba(168,85,247,0.1); border-left: 3px solid #a855f7; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 15px; color: #e0e0e0; line-height: 1.5;">{message_text}</p>
        </div>
        <a href="https://landingguru.ru/cabinet" 
           style="display: inline-block; background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">
          Открыть кабинет →
        </a>
        <p style="margin: 20px 0 0 0; font-size: 12px; color: #555;">Вы получили это письмо, так как вам отправили сообщение в личном кабинете.</p>
      </div>
    </div>
    """

    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())


def handler(event: dict, context) -> dict:
    """Отправка email-уведомления клиенту если он оффлайн"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    session_id = (event.get('headers') or {}).get('X-Session-Id', '')
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.id, u.is_admin
        FROM sessions s JOIN users u ON s.user_id = u.id
        WHERE s.id = %s AND s.expires_at > NOW() AND u.is_admin = TRUE
    """, (session_id,))
    admin = cur.fetchone()

    if not admin:
        conn.close()
        return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'Доступ запрещён'})}

    body = json.loads(event.get('body') or '{}')
    project_id = body.get('project_id')
    message_text = body.get('message_text', '')

    cur.execute("""
        SELECT u.email, u.name, u.last_seen, p.title
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = %s
    """, (project_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Проект не найден'})}

    email, name, last_seen, project_title = row

    if last_seen is None:
        offline = True
    else:
        diff = (datetime.now() - last_seen).total_seconds()
        offline = diff > 300

    if offline:
        send_email(email, name, project_title, message_text)
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': True})}

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': False, 'reason': 'online'})}
