import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const CHAT_API = 'https://functions.poehali.dev/22875b8b-5f66-444c-bd9f-f429cbc012a6';

interface Message {
  id: number;
  sender_type: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: number;
  session_id: string;
  subject: string;
  status: string;
  priority: string;
  amount?: string;
  created_at: string;
  updated_at: string;
}

const AdminTicketView = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTicketData();
    const interval = setInterval(loadTicketData, 3000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const loadTicketData = async () => {
    try {
      const response = await fetch(`${CHAT_API}?ticket_id=${ticketId}`);
      const data = await response.json();
      
      if (data.ticket && data.messages) {
        setTicket(data.ticket);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Ошибка загрузки тикета:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ticketId) return;
    
    setSending(true);
    try {
      await fetch(CHAT_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: parseInt(ticketId),
          message: newMessage,
          sender_type: 'admin'
        })
      });
      
      setNewMessage('');
      await loadTicketData();
    } catch (error) {
      console.error('Ошибка отправки:', error);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!ticketId) return;
    
    try {
      await fetch(CHAT_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: parseInt(ticketId),
          status
        })
      });
      
      await loadTicketData();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Загрузка...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Тикет не найден</p>
              <Link to="/admin/tickets">
                <Button className="mt-4" variant="outline">
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  Вернуться к списку
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/tickets">
            <Button variant="outline" size="sm">
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              К тикетам
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority === 'high' ? 'Высокий' : 
                     ticket.priority === 'normal' ? 'Обычный' : 'Низкий'}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status === 'open' ? 'Открыт' : 'Закрыт'}
                  </Badge>
                  {ticket.amount && (
                    <Badge variant="outline">
                      {ticket.amount} ₽
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                <div className="text-sm text-gray-500 mt-2">
                  Создан: {new Date(ticket.created_at).toLocaleString('ru')}
                </div>
              </div>
              
              <div className="flex gap-2">
                {ticket.status === 'open' ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatus('closed')}
                  >
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    Закрыть
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatus('open')}
                  >
                    <Icon name="RotateCcw" size={16} className="mr-2" />
                    Открыть
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="flex flex-col h-[500px]">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Сообщения</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-30" />
                <p>Нет сообщений</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_type === 'admin'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm break-words">{msg.message}</div>
                    <div className={`text-xs mt-1 ${
                      msg.sender_type === 'admin' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('ru', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                disabled={sending || ticket.status === 'closed'}
              />
              <Button 
                type="submit" 
                disabled={sending || !newMessage.trim() || ticket.status === 'closed'}
              >
                <Icon name="Send" size={20} />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminTicketView;
