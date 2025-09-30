'''
Business: Send Telegram notification when new support ticket is created
Args: event with httpMethod, body containing ticket details
Returns: HTTP response with success/error status
'''

import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Get Telegram credentials from environment
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    
    if not bot_token or not chat_id:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Telegram credentials not configured'})
        }
    
    # Parse request body
    body_data = json.loads(event.get('body', '{}'))
    ticket_id = body_data.get('ticketId', 'N/A')
    subject = body_data.get('subject', 'Новая заявка')
    amount = body_data.get('amount', '')
    user_name = body_data.get('userName', 'Не указано')
    
    # Format message
    message = f"""🔔 <b>Новая заявка #{ticket_id}</b>

📝 <b>Тема:</b> {subject}
👤 <b>Клиент:</b> {user_name}
💰 <b>Сумма:</b> {amount} ₽

⏰ Требует внимания!"""
    
    # Send to Telegram
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            if response_data.get('ok'):
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'message': 'Notification sent'})
                }
            else:
                return {
                    'statusCode': 500,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Telegram API error', 'details': response_data})
                }
                
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'HTTP Error: {e.code}', 'details': error_body})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
