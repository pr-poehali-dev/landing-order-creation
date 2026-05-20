import json
import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


CABINET_URL = 'https://landingguru.ru/cabinet'

STATUS_LABELS = {
    'new': 'Новый',
    'in_progress': 'В работе',
    'review': 'На согласовании',
    'done': 'Готово',
}


def base_email(to_email: str, subject: str, html_body: str):
    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ['SMTP_PORT'])
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden;">
      {html_body}
      <div style="padding: 0 32px 24px 32px;">
        <a href="{CABINET_URL}"
           style="display: inline-block; background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">
          Открыть кабинет →
        </a>
        <div style="margin: 20px 0 0 0; padding: 12px 16px; background: rgba(255,255,255,0.04); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
          <p style="margin: 0; font-size: 12px; color: #888;">⚠️ Это письмо отправлено автоматически. Чтобы ответить — войдите в личный кабинет по кнопке выше. Ответ на это письмо не доставляется команде.</p>
        </div>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #444;">LandingGuru.ru — личный кабинет клиента</p>
      </div>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())


def send_message_email(to_email: str, project_title: str, message_text: str):
    body = f"""
    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 28px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">💬 Новое сообщение от команды</h1>
    </div>
    <div style="padding: 28px 32px 16px; color: #e0e0e0;">
      <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 14px;">Проект</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #fff;">{project_title}</p>
      <div style="background: rgba(168,85,247,0.1); border-left: 3px solid #a855f7; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #e0e0e0; line-height: 1.5;">{message_text}</p>
      </div>
    </div>
    """
    base_email(to_email, f'Новое сообщение по проекту «{project_title}»', body)


def send_status_email(to_email: str, project_title: str, status: str):
    label = STATUS_LABELS.get(status, status)
    color = {'new': '#a855f7', 'in_progress': '#00f5ff', 'review': '#facc15', 'done': '#4ade80'}.get(status, '#a855f7')
    body = f"""
    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 28px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">🔄 Статус проекта обновлён</h1>
    </div>
    <div style="padding: 28px 32px 16px; color: #e0e0e0;">
      <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 14px;">Проект</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #fff;">{project_title}</p>
      <p style="margin: 0 0 8px 0; color: #a0a0b0; font-size: 14px;">Новый статус</p>
      <span style="display: inline-block; background: {color}22; color: {color}; border: 1px solid {color}55; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 15px; margin-bottom: 24px;">
        {label}
      </span>
    </div>
    """
    base_email(to_email, f'Статус проекта «{project_title}» изменён', body)


def send_invoice_email(to_email: str, project_title: str, invoice_title: str, amount: float):
    body = f"""
    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 28px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">🧾 Выставлен счёт на оплату</h1>
    </div>
    <div style="padding: 28px 32px 16px; color: #e0e0e0;">
      <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 14px;">Проект</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #fff;">{project_title}</p>
      <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 6px 0; color: #a0a0b0; font-size: 13px;">Счёт</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #fff;">{invoice_title}</p>
        <p style="margin: 0; font-size: 26px; font-weight: 700; color: #a855f7;">{amount:,.0f} ₽</p>
      </div>
    </div>
    """
    base_email(to_email, f'Счёт на оплату по проекту «{project_title}»', body)


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

    body = json.loads(event.get('body') or '{}')
    notify_type = body.get('type', 'message')

    # file_uploaded — разрешено для авторизованных клиентов
    if notify_type == 'file_uploaded':
        cur.execute("""
            SELECT u.id FROM sessions s JOIN users u ON s.user_id = u.id
            WHERE s.id = %s AND s.expires_at > NOW()
        """, (session_id,))
        user = cur.fetchone()
        if not user:
            conn.close()
            return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'Доступ запрещён'})}
    else:
        cur.execute("""
            SELECT u.id, u.is_admin
            FROM sessions s JOIN users u ON s.user_id = u.id
            WHERE s.id = %s AND s.expires_at > NOW() AND u.is_admin = TRUE
        """, (session_id,))
        admin = cur.fetchone()
        if not admin:
            conn.close()
            return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'Доступ запрещён'})}

    notify_type = body.get('type', 'message')
    project_id = body.get('project_id')

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

    # Для сообщений — только если оффлайн
    if notify_type == 'message':
        offline = last_seen is None or (datetime.now() - last_seen).total_seconds() > 300
        if not offline:
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': False, 'reason': 'online'})}
        send_message_email(email, project_title, body.get('message_text', ''))

    # Для статуса — всегда
    elif notify_type == 'status':
        send_status_email(email, project_title, body.get('status', ''))

    # Для счёта — всегда
    elif notify_type == 'invoice':
        send_invoice_email(email, project_title, body.get('invoice_title', ''), float(body.get('amount', 0)))

    # Уведомление админу о новом файле от клиента
    elif notify_type == 'file_uploaded':
        admin_email = os.environ.get('ADMIN_EMAIL', '')
        if not admin_email:
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': False, 'reason': 'no admin email'})}
        file_name = body.get('file_name', 'файл')
        file_url = body.get('file_url', '')
        body_html = f"""
        <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 28px 32px;">
          <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">📎 Клиент загрузил файл</h1>
        </div>
        <div style="padding: 28px 32px 16px; color: #e0e0e0;">
          <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 14px;">Клиент</p>
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #fff;">{name}</p>
          <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 14px;">Проект</p>
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #fff;">{project_title}</p>
          <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; color: #a0a0b0; font-size: 13px;">Файл</p>
            <a href="{file_url}" style="color: #a855f7; font-size: 15px; text-decoration: underline;">{file_name}</a>
          </div>
        </div>
        """
        base_email(admin_email, f'Новый файл от клиента «{name}» — {project_title}', body_html)

    else:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Неизвестный тип уведомления'})}

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': True})}