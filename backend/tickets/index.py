import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления тикетами - создание, получение, обновление, админ-панель
    Args: event с httpMethod, body, queryStringParameters, headers
    Returns: HTTP ответ с данными тикета или списком всех тикетов
    '''
    method: str = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    is_admin = headers.get('X-Admin-Mode') == 'true' or headers.get('x-admin-mode') == 'true'
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Admin-Mode',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    
    schema_name = 't_p7235020_alipay_landing_page'
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            session_id = body_data.get('sessionId')
            title = body_data.get('title')
            amount = body_data.get('amount')
            user_name = body_data.get('userName')
            
            if not session_id or not title:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sessionId и title обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                time_limit = datetime.now() - timedelta(hours=24)
                cur.execute(
                    f"SELECT COUNT(*) as count FROM {schema_name}.tickets WHERE session_id = %s AND created_at > %s",
                    (session_id, time_limit)
                )
                count = cur.fetchone()['count']
                
                if count >= 5:
                    return {
                        'statusCode': 429,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Превышен лимит: максимум 5 заявок за 24 часа'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"""INSERT INTO {schema_name}.tickets (session_id, title, amount, user_name, status)
                       VALUES (%s, %s, %s, %s, 'open') RETURNING id, session_id, title, amount, user_name, status, 
                       created_at, updated_at""",
                    (session_id, title, amount, user_name)
                )
                ticket = dict(cur.fetchone())
                conn.commit()
                
                telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
                telegram_chat = os.environ.get('TELEGRAM_CHAT_ID')
                
                if telegram_token and telegram_chat:
                    message = f"🔔 *Новая заявка #{ticket['id']}*\n\n👤 *Имя:* {user_name}\n💰 *Сумма:* {amount} ₽\n\n⏰ Требует внимания!"
                    try:
                        requests.post(
                            f"https://api.telegram.org/bot{telegram_token}/sendMessage",
                            json={
                                'chat_id': telegram_chat,
                                'text': message,
                                'parse_mode': 'Markdown'
                            },
                            timeout=5
                        )
                    except Exception:
                        pass
                
                ticket['created_at'] = ticket['created_at'].isoformat()
                ticket['updated_at'] = ticket['updated_at'].isoformat()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(ticket),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            
            if is_admin:
                status_filter = params.get('status')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if status_filter:
                        cur.execute(
                            f"""SELECT id, session_id, title, amount, user_name, status, created_at, updated_at 
                               FROM {schema_name}.tickets WHERE status = %s ORDER BY created_at DESC""",
                            (status_filter,)
                        )
                    else:
                        cur.execute(
                            f"""SELECT id, session_id, title, amount, user_name, status, created_at, updated_at 
                               FROM {schema_name}.tickets ORDER BY created_at DESC"""
                        )
                    
                    tickets = [dict(row) for row in cur.fetchall()]
                    
                    for ticket in tickets:
                        ticket['created_at'] = ticket['created_at'].isoformat()
                        ticket['updated_at'] = ticket['updated_at'].isoformat()
                        
                        cur.execute(
                            f"SELECT id, ticket_id, sender, text, image_url, created_at FROM {schema_name}.messages WHERE ticket_id = %s ORDER BY created_at ASC",
                            (ticket['id'],)
                        )
                        messages = [dict(msg) for msg in cur.fetchall()]
                        
                        for msg in messages:
                            msg['created_at'] = msg['created_at'].isoformat()
                        
                        ticket['messages'] = messages
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(tickets),
                        'isBase64Encoded': False
                    }
            else:
                session_id = params.get('sessionId')
                
                if not session_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'sessionId обязателен'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"SELECT id, session_id, title, amount, user_name, status, created_at, updated_at FROM {schema_name}.tickets WHERE session_id = %s ORDER BY created_at DESC",
                        (session_id,)
                    )
                    tickets = [dict(row) for row in cur.fetchall()]
                    
                    for ticket in tickets:
                        ticket['created_at'] = ticket['created_at'].isoformat()
                        ticket['updated_at'] = ticket['updated_at'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(tickets),
                        'isBase64Encoded': False
                    }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            ticket_id = body_data.get('ticketId')
            status = body_data.get('status')
            
            if not ticket_id or not status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ticketId и status обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"UPDATE {schema_name}.tickets SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, status, updated_at",
                    (status, ticket_id)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Тикет не найден'}),
                        'isBase64Encoded': False
                    }
                
                ticket = dict(result)
                ticket['updated_at'] = ticket['updated_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(ticket),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()