import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ChatStorage, ChatSession } from '@/lib/localStorage';

export default function AdminPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = () => {
    const allSessions = ChatStorage.getAll();
    setSessions(allSessions.sort((a, b) => {
      const aLastMsg = a.messages[a.messages.length - 1];
      const bLastMsg = b.messages[b.messages.length - 1];
      
      if (!aLastMsg) return 1;
      if (!bLastMsg) return -1;
      
      return new Date(bLastMsg.createdAt).getTime() - new Date(aLastMsg.createdAt).getTime();
    }));
  };

  const sendAdminMessage = () => {
    if (!adminMessage.trim() || !selectedSession) return;

    ChatStorage.addMessage(selectedSession, adminMessage, true);
    setAdminMessage('');
    loadSessions();
  };

  const currentSession = sessions.find(s => s.sessionId === selectedSession);

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
          <Card className="md:col-span-1 bg-gray-900 border-gray-800">
            <CardHeader className="border-gray-800">
              <CardTitle className="flex items-center gap-2 text-white">
                <Icon name="Users" size={20} />
                Активные чаты ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {sessions.map((session) => {
                  const lastMessage = session.messages[session.messages.length - 1];
                  
                  return (
                    <div
                      key={session.sessionId}
                      onClick={() => setSelectedSession(session.sessionId)}
                      className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition ${
                        selectedSession === session.sessionId ? 'bg-gray-800 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-sm text-white">
                          {session.name || 'Аноним'}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {session.messages.length}
                        </Badge>
                      </div>
                      {lastMessage && (
                        <>
                          <p className="text-sm text-gray-300 truncate mb-1">
                            {lastMessage.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(lastMessage.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
                {sessions.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Icon name="MessageCircle" size={48} className="mx-auto mb-2 text-gray-700" />
                    <p>Нет активных чатов</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-gray-900 border-gray-800">
            <CardHeader className="border-gray-800">
              <CardTitle className="flex items-center gap-2 text-white">
                <Icon name="MessageSquare" size={20} />
                {selectedSession ? `Чат: ${selectedSession}` : 'Выберите чат'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSession && currentSession ? (
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-950 rounded-lg">
                    {currentSession.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.isAdmin
                              ? 'bg-primary text-white'
                              : 'bg-gray-800 text-gray-100 shadow'
                          }`}
                        >
                          {msg.imageUrl && (
                            <img 
                              src={msg.imageUrl} 
                              alt="Изображение" 
                              className="max-w-full rounded mb-2 cursor-pointer"
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                          )}
                          {msg.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(msg.createdAt).toLocaleString('ru-RU')}
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
