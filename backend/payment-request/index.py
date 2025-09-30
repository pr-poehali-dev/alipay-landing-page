"""
Business: API для создания заявки на пополнение счета
Args: event - dict с httpMethod, body, headers (X-Session-Id)
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с ID заявки
"""

import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создаёт подключение к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id')
    body_data = json.loads(event.get('body', '{}'))
    amount = body_data.get('amount')
    
    if not session_id or not amount:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session ID and amount required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Создать тикет (тему)
        cur.execute("""
            INSERT INTO tickets (session_id, subject, amount, status, priority)
            VALUES (%s, %s, %s, 'open', 'high')
            RETURNING id, session_id, subject, CAST(amount AS TEXT) as amount, status, priority,
                      to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
        """, (session_id, f"Заявка на пополнение {amount} ₽", amount))
        
        ticket = dict(cur.fetchone())
        
        # Добавить первое сообщение в тикет
        cur.execute("""
            INSERT INTO ticket_messages (ticket_id, sender_type, message)
            VALUES (%s, 'client', %s)
        """, (ticket['id'], f"Здравствуйте! Хочу пополнить счёт на {amount} ₽"))
        
        # Создать заявку в старой таблице (для совместимости)
        cur.execute("""
            INSERT INTO payment_requests (session_id, amount, status)
            VALUES (%s, %s, 'pending')
        """, (session_id, amount))
        
        # Отправить автоматическое сообщение в старый чат
        cur.execute("""
            INSERT INTO chat_messages (session_id, message, is_admin)
            VALUES (%s, %s, false)
        """, (session_id, f"Заявка на пополнение: {amount} ₽"))
        
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ticket': ticket}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()