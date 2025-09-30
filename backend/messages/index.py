import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления сообщениями в тикетах
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
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    
    schema_name = 't_p7235020_alipay_landing_page'
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            ticket_id = body_data.get('ticketId')
            sender = body_data.get('sender')
            text = body_data.get('text', '')
            image_url = body_data.get('imageUrl', '')
            
            if not ticket_id or not sender:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ticketId и sender обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"""INSERT INTO {schema_name}.messages (ticket_id, sender, text, image_url)
                       VALUES (%s, %s, %s, %s) RETURNING id, ticket_id, sender, text, image_url, created_at""",
                    (ticket_id, sender, text, image_url)
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
            ticket_id = params.get('ticketId')
            
            if not ticket_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ticketId обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"SELECT id, ticket_id, sender, text, image_url, created_at FROM {schema_name}.messages WHERE ticket_id = %s ORDER BY created_at ASC",
                    (ticket_id,)
                )
                messages = [dict(row) for row in cur.fetchall()]
                
                for message in messages:
                    message['created_at'] = message['created_at'].isoformat()
                
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
    
    finally:
        conn.close()