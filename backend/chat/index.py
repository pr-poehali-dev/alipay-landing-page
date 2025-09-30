"""
Business: API для системы чата и тикетов между клиентами и администратором
Args: event - dict с httpMethod, body, queryStringParameters, headers
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными чата или тикетов
"""

import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def decimal_default(obj):
    """JSON serializer для Decimal"""
    if isinstance(obj, Decimal):
        return str(obj)
    raise TypeError

def get_db_connection():
    """Создаёт подключение к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Ticket-Id',
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
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            is_admin_request = query_params.get('admin') == 'true'
            tickets_request = query_params.get('tickets') == 'true'
            ticket_id = query_params.get('ticket_id')
            
            if tickets_request:
                status_filter = query_params.get('status')
                query = """
                    SELECT 
                        t.id,
                        t.session_id,
                        t.subject,
                        t.status,
                        t.priority,
                        CAST(t.amount AS TEXT) as amount,
                        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
                        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at,
                        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count,
                        (SELECT message FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
                    FROM tickets t
                """
                
                if status_filter:
                    query += " WHERE t.status = %s"
                    cur.execute(query + " ORDER BY t.updated_at DESC", (status_filter,))
                else:
                    cur.execute(query + " ORDER BY t.updated_at DESC")
                
                tickets = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tickets': tickets}, default=decimal_default),
                    'isBase64Encoded': False
                }
            
            if ticket_id:
                cur.execute("""
                    SELECT 
                        t.id,
                        t.session_id,
                        t.subject,
                        t.status,
                        t.priority,
                        CAST(t.amount AS TEXT) as amount,
                        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
                        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
                    FROM tickets t
                    WHERE t.id = %s
                """, (ticket_id,))
                
                ticket = cur.fetchone()
                
                if not ticket:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Ticket not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT 
                        id,
                        ticket_id,
                        sender_type,
                        message,
                        image_url,
                        to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
                    FROM ticket_messages
                    WHERE ticket_id = %s
                    ORDER BY created_at ASC
                """, (ticket_id,))
                
                messages = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ticket': ticket, 'messages': messages}),
                    'isBase64Encoded': False
                }
            
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
            
            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Session ID required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT id, session_id, message, image_url, is_admin, 
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
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            message = body_data.get('message', '').strip()
            image_url = body_data.get('image_url')
            is_admin = body_data.get('is_admin', False)
            user_name = body_data.get('name')
            
            if not session_id or (not message and not image_url):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Session ID and message or image required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO chat_users (session_id, name)
                VALUES (%s, %s)
                ON CONFLICT (session_id) DO NOTHING
            """, (session_id, user_name))
            
            cur.execute("""
                INSERT INTO chat_messages (session_id, message, image_url, is_admin)
                VALUES (%s, %s, %s, %s)
                RETURNING id, session_id, message, image_url, is_admin, 
                          to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
            """, (session_id, message or '', image_url, is_admin))
            
            new_message = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': new_message}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            ticket_id = body_data.get('ticket_id')
            
            if not ticket_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Ticket ID required'}),
                    'isBase64Encoded': False
                }
            
            if 'message' in body_data or 'image_url' in body_data:
                message = body_data.get('message', '').strip()
                image_url = body_data.get('image_url')
                sender_type = body_data.get('sender_type', 'client')
                
                if not message and not image_url:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Message or image required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO ticket_messages (ticket_id, sender_type, message, image_url)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, ticket_id, sender_type, message, image_url,
                              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
                """, (ticket_id, sender_type, message, image_url))
                
                new_message = cur.fetchone()
                
                cur.execute("""
                    UPDATE tickets 
                    SET updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (ticket_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': new_message}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            update_values = []
            
            if 'status' in body_data:
                update_fields.append('status = %s')
                update_values.append(body_data['status'])
            
            if 'priority' in body_data:
                update_fields.append('priority = %s')
                update_values.append(body_data['priority'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            update_values.append(ticket_id)
            
            query = f"""
                UPDATE tickets 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, status, priority,
                          to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
            """
            
            cur.execute(query, update_values)
            updated_ticket = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ticket': updated_ticket}),
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