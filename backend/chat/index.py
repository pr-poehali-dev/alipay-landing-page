"""
Business: API для системы чата между клиентами и администратором
Args: event - dict с httpMethod, body, queryStringParameters, headers
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными чата
"""

import json
import os
from typing import Dict, Any
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # GET: получить сообщения сессии ИЛИ все сессии для админа
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            is_admin_request = query_params.get('admin') == 'true'
            
            # Админ запрос: получить все сессии
            if is_admin_request:
                cur.execute("""
                    SELECT 
                        cu.session_id,
                        cu.name,
                        to_char(cu.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
                        (SELECT COUNT(*) FROM chat_messages WHERE session_id = cu.session_id) as message_count,
                        (SELECT message FROM chat_messages WHERE session_id = cu.session_id ORDER BY created_at DESC LIMIT 1) as last_message,
                        (SELECT to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') FROM chat_messages WHERE session_id = cu.session_id ORDER BY created_at DESC LIMIT 1) as last_message_time
                    FROM chat_users cu
                    ORDER BY (SELECT created_at FROM chat_messages WHERE session_id = cu.session_id ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST
                """)
                
                sessions = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'sessions': sessions}),
                    'isBase64Encoded': False
                }
            
            # Обычный запрос: получить сообщения сессии
            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Session ID required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT id, session_id, message, is_admin, 
                       to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
                FROM chat_messages 
                WHERE session_id = %s 
                ORDER BY created_at ASC
            """, (session_id,))
            
            messages = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        # POST: отправить сообщение
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            message = body_data.get('message', '').strip()
            is_admin = body_data.get('is_admin', False)
            user_name = body_data.get('name')
            
            if not session_id or not message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Session ID and message required'}),
                    'isBase64Encoded': False
                }
            
            # Создать пользователя если не существует
            cur.execute("""
                INSERT INTO chat_users (session_id, name)
                VALUES (%s, %s)
                ON CONFLICT (session_id) DO NOTHING
            """, (session_id, user_name))
            
            # Добавить сообщение
            cur.execute("""
                INSERT INTO chat_messages (session_id, message, is_admin)
                VALUES (%s, %s, %s)
                RETURNING id, session_id, message, is_admin, 
                          to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
            """, (session_id, message, is_admin))
            
            new_message = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': new_message}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()