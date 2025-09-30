import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ChatSession {
  session_id: string;
  name: string | null;
  message_count: number;
  last_message: string | null;
  last_message_time: string | null;
}

interface Message {
  id: number;
  message: string;
  image_url?: string;
  is_admin: boolean;
  created_at: string;
}

const CHAT_API = 'https://functions.poehali.dev/22875b8b-5f66-444c-bd9f-f429cbc012a6';

export default function AdminPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
      const interval = setInterval(() => loadMessages(selectedSession), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${CHAT_API}?admin=true`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Ошибка загрузки сессий:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(CHAT_API, {
        headers: { 'X-Session-Id': sessionId }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const sendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedSession) return;

    try {
      await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': selectedSession
        },
        body: JSON.stringify({
          message: adminMessage,
          is_admin: true
        })
      });

      setAdminMessage('');
      loadMessages(selectedSession);
    } catch (error) {
      console.error('Ошибка отправки:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Админ-панель</h1>
            <p className="text-gray-400">Управление чатами с клиентами</p>
          </div>
          <Link to="/admin/tickets">
            <Button variant="outline">
              <Icon name="Ticket" size={18} className="mr-2" />
              Тикеты
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Список сессий */}
          <Card className="md:col-span-1 bg-gray-900 border-gray-800">
            <CardHeader className="border-gray-800">
              <CardTitle className="flex items-center gap-2 text-white">
                <Icon name="Users" size={20} />
                Активные чаты ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => setSelectedSession(session.session_id)}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition ${
                      selectedSession === session.session_id ? 'bg-gray-800 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-sm text-white">
                        {session.name || 'Аноним'}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {session.message_count}
                      </Badge>
                    </div>
                    {session.last_message && (
                      <>
                        <p className="text-sm text-gray-300 truncate mb-1">
                          {session.last_message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.last_message_time ? new Date(session.last_message_time).toLocaleString('ru-RU') : ''}
                        </p>
                      </>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Icon name="MessageCircle" size={48} className="mx-auto mb-2 text-gray-700" />
                    <p>Нет активных чатов</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Окно чата */}
          <Card className="md:col-span-2 bg-gray-900 border-gray-800">
            <CardHeader className="border-gray-800">
              <CardTitle className="flex items-center gap-2 text-white">
                <Icon name="MessageSquare" size={20} />
                {selectedSession ? `Чат: ${selectedSession}` : 'Выберите чат'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSession ? (
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-950 rounded-lg">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.is_admin
                              ? 'bg-primary text-white'
                              : 'bg-gray-800 text-gray-100 shadow'
                          }`}
                        >
                          {msg.image_url && (
                            <img 
                              src={msg.image_url} 
                              alt="Изображение" 
                              className="max-w-full rounded mb-2 cursor-pointer"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          )}
                          {msg.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(msg.created_at).toLocaleString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Ответить клиенту..."
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendAdminMessage();
                        }
                      }}
                    />
                    <Button onClick={sendAdminMessage} disabled={!adminMessage.trim()}>
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-gray-700" />
                    <p>Выберите чат из списка слева</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}