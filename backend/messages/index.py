import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления сообщениями в чате заявок
    Args: event с httpMethod, body, queryStringParameters
    Returns: HTTP ответ с данными сообщений
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    db_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(db_url)
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            session_id = body_data.get('sessionId')
            message_text = body_data.get('message', '')
            image_url = body_data.get('imageUrl', '')
            is_admin = body_data.get('isAdmin', False)
            
            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sessionId обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """INSERT INTO chat_messages (session_id, message, is_admin, image_url)
                       VALUES (%s, %s, %s, %s) RETURNING id, session_id, message, is_admin, image_url, created_at""",
                    (session_id, message_text, is_admin, image_url)
                )
                message = dict(cur.fetchone())
                conn.commit()
                
                message['created_at'] = message['created_at'].isoformat()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(message),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            session_id = params.get('sessionId')
            action = params.get('action')
            
            if action == 'online':
                session_to_update = params.get('session')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if session_to_update:
                        user_agent = event.get('headers', {}).get('user-agent', '')
                        cur.execute('''
                            INSERT INTO t_p7235020_alipay_landing_page.online_users 
                            (session_id, last_seen, user_agent)
                            VALUES (%s, CURRENT_TIMESTAMP, %s)
                            ON CONFLICT (session_id) 
                            DO UPDATE SET last_seen = CURRENT_TIMESTAMP
                        ''', (session_to_update, user_agent))
                        conn.commit()
                    
                    threshold = (datetime.now() - timedelta(seconds=30)).strftime('%Y-%m-%d %H:%M:%S')
                    cur.execute('''
                        DELETE FROM t_p7235020_alipay_landing_page.online_users 
                        WHERE last_seen < %s
                    ''', (threshold,))
                    conn.commit()
                    
                    cur.execute('''
                        SELECT COUNT(*) as count 
                        FROM t_p7235020_alipay_landing_page.online_users
                    ''')
                    result = cur.fetchone()
                    count = result['count'] if result else 0
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'online_count': count}),
                        'isBase64Encoded': False
                    }
            
            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sessionId обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, session_id, message, is_admin, image_url, created_at FROM chat_messages WHERE session_id = %s ORDER BY created_at ASC",
                    (session_id,)
                )
                messages = [dict(row) for row in cur.fetchall()]
                
                for msg in messages:
                    msg['created_at'] = msg['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(messages),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'conn' in locals():
            conn.close()