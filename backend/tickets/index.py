import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления заявками на пополнение
    Args: event с httpMethod, body, queryStringParameters
    Returns: HTTP ответ с данными заявок
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
            amount = body_data.get('amount')
            user_name = body_data.get('userName', '')
            
            if not session_id or not amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sessionId и amount обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """INSERT INTO t_p7235020_alipay_landing_page.tickets (session_id, amount, user_name, status)
                       VALUES (%s, %s, %s, %s) RETURNING id, session_id, amount, user_name, status, created_at""",
                    (session_id, amount, user_name, 'pending')
                )
                ticket = dict(cur.fetchone())
                conn.commit()
                
                ticket['created_at'] = ticket['created_at'].isoformat()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(ticket),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            session_id = params.get('sessionId')
            minutes = params.get('minutes', '1440')
            
            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sessionId обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                threshold = (datetime.now() - timedelta(minutes=int(minutes))).strftime('%Y-%m-%d %H:%M:%S')
                cur.execute(
                    """SELECT id, session_id, amount, user_name, status, created_at 
                       FROM t_p7235020_alipay_landing_page.tickets 
                       WHERE session_id = %s AND created_at > %s 
                       ORDER BY created_at DESC""",
                    (session_id, threshold)
                )
                tickets = [dict(row) for row in cur.fetchall()]
                
                for ticket in tickets:
                    ticket['created_at'] = ticket['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(tickets),
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
