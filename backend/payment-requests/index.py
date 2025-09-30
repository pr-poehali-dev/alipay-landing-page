import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления заявками на пополнение - создание, получение, обновление
    Args: event с httpMethod, body, queryStringParameters, headers
    Returns: HTTP ответ с данными заявки или списком всех заявок
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
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            session_id = body_data.get('sessionId')
            amount = body_data.get('amount')
            
            if not session_id or not amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sessionId и amount обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                time_limit = datetime.now() - timedelta(hours=24)
                cur.execute(
                    "SELECT COUNT(*) as count FROM payment_requests WHERE session_id = %s AND created_at > %s",
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
                    """INSERT INTO payment_requests (session_id, amount, status)
                       VALUES (%s, %s, 'pending') RETURNING id, session_id, amount, status, created_at""",
                    (session_id, float(amount))
                )
                row = cur.fetchone()
                conn.commit()
                
                request = {
                    'id': row['id'],
                    'session_id': row['session_id'],
                    'amount': str(row['amount']),
                    'status': row['status'],
                    'created_at': row['created_at'].isoformat()
                }
                
                telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
                telegram_chat = os.environ.get('TELEGRAM_CHAT_ID')
                
                if telegram_token and telegram_chat:
                    message = f"🔔 *Новая заявка #{request['id']}*\n\n💰 *Сумма:* {amount} ₽\n\n⏰ Требует внимания!"
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
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(request),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            
            if is_admin:
                status_filter = params.get('status')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if status_filter:
                        cur.execute(
                            """SELECT id, session_id, amount, status, created_at 
                               FROM payment_requests WHERE status = %s ORDER BY created_at DESC""",
                            (status_filter,)
                        )
                    else:
                        cur.execute(
                            """SELECT id, session_id, amount, status, created_at 
                               FROM payment_requests ORDER BY created_at DESC"""
                        )
                    
                    requests_list = []
                    for row in cur.fetchall():
                        requests_list.append({
                            'id': row['id'],
                            'session_id': row['session_id'],
                            'amount': str(row['amount']),
                            'status': row['status'],
                            'created_at': row['created_at'].isoformat()
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(requests_list),
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
                        "SELECT id, session_id, amount, status, created_at FROM payment_requests WHERE session_id = %s ORDER BY created_at DESC",
                        (session_id,)
                    )
                    
                    requests_list = []
                    for row in cur.fetchall():
                        requests_list.append({
                            'id': row['id'],
                            'session_id': row['session_id'],
                            'amount': str(row['amount']),
                            'status': row['status'],
                            'created_at': row['created_at'].isoformat()
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(requests_list),
                        'isBase64Encoded': False
                    }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            request_id = body_data.get('requestId')
            status = body_data.get('status')
            
            if not request_id or not status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'requestId и status обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "UPDATE payment_requests SET status = %s WHERE id = %s RETURNING id, status",
                    (status, request_id)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }
                
                request = {'id': result['id'], 'status': result['status']}
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(request),
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
