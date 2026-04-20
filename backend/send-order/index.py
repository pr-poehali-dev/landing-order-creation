import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправка заявки с формы на email sergasvnet@mail.ru"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    comment = body.get('comment', '').strip()

    if not name or not phone:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Имя и телефон обязательны'})
        }

    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ['SMTP_PORT'])
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']
    to_email = 'sergasvnet@mail.ru'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новая заявка от {name}'
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #1a1a2e;">📋 Новая заявка с сайта</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr>
                <td style="padding: 10px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd; width: 140px;">Имя</td>
                <td style="padding: 10px; border: 1px solid #ddd;">{name}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;">Телефон</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:{phone}">{phone}</a></td>
            </tr>
            {"<tr><td style='padding: 10px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;'>Комментарий</td><td style='padding: 10px; border: 1px solid #ddd;'>" + comment + "</td></tr>" if comment else ""}
        </table>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }
