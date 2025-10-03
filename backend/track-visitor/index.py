import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_device_type(user_agent: str) -> str:
    ua_lower = user_agent.lower()
    if 'mobile' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
        return 'Mobile'
    elif 'tablet' in ua_lower or 'ipad' in ua_lower:
        return 'Tablet'
    return 'Desktop'

def get_browser(user_agent: str) -> str:
    ua = user_agent.lower()
    if 'edg' in ua:
        return 'Edge'
    elif 'chrome' in ua:
        return 'Chrome'
    elif 'safari' in ua and 'chrome' not in ua:
        return 'Safari'
    elif 'firefox' in ua:
        return 'Firefox'
    elif 'opera' in ua or 'opr' in ua:
        return 'Opera'
    return 'Unknown'

def get_os(user_agent: str) -> str:
    ua = user_agent.lower()
    if 'windows' in ua:
        return 'Windows'
    elif 'mac' in ua:
        return 'macOS'
    elif 'linux' in ua:
        return 'Linux'
    elif 'android' in ua:
        return 'Android'
    elif 'iphone' in ua or 'ipad' in ua:
        return 'iOS'
    return 'Unknown'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Track website visitors with device info and location
    Args: event with httpMethod, body, headers
    Returns: HTTP response
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
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            session_id = body_data.get('session_id')
            
            headers = event.get('headers', {})
            user_agent = headers.get('user-agent', headers.get('User-Agent', 'Unknown'))
            
            ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'Unknown')
            
            device_type = get_device_type(user_agent)
            browser = get_browser(user_agent)
            os_name = get_os(user_agent)
            
            cur.execute(
                "SELECT id FROM visitors WHERE session_id = %s",
                (session_id,)
            )
            existing = cur.fetchone()
            
            if existing:
                cur.execute(
                    "UPDATE visitors SET last_activity = CURRENT_TIMESTAMP, is_online = true, page_views = page_views + 1 WHERE session_id = %s",
                    (session_id,)
                )
            else:
                cur.execute(
                    "INSERT INTO visitors (session_id, ip_address, user_agent, device_type, browser, os) VALUES (%s, %s, %s, %s, %s, %s)",
                    (session_id, ip_address, user_agent, device_type, browser, os_name)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        elif method == 'GET':
            cur.execute(
                """
                SELECT id, session_id, ip_address, device_type, browser, os, 
                       first_visit, last_activity, is_online, page_views,
                       CASE 
                           WHEN last_activity > NOW() - INTERVAL '5 minutes' THEN true 
                           ELSE false 
                       END as currently_online
                FROM visitors 
                ORDER BY last_activity DESC 
                LIMIT 100
                """
            )
            visitors = cur.fetchall()
            
            for visitor in visitors:
                for key, value in visitor.items():
                    if isinstance(value, datetime):
                        visitor[key] = value.isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(visitors)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
