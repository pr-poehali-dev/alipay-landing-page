import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { TicketStorage, Ticket, TicketMessage, onStorageChange } from '@/lib/localStorage';

const MANAGERS = ['Георгий', 'Жека', 'Кристина', 'Тичер'];

const AdminTicketView = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showManagerSelect, setShowManagerSelect] = useState(false);

  useEffect(() => {
    loadTicketData();
    const interval = setInterval(loadTicketData, 2000);
    const unsubscribe = onStorageChange(loadTicketData);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [ticketId]);

  const loadTicketData = () => {
    if (!ticketId) return;

    const foundTicket = TicketStorage.getById(parseInt(ticketId));
    
    if (foundTicket) {
      setTicket(foundTicket);
      setMessages(foundTicket.messages);
    }
    
    setLoading(false);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ticketId || !ticket) return;
    
    const managerName = ticket.assignedTo || 'Менеджер';
    TicketStorage.addMessage(parseInt(ticketId), 'admin', newMessage, undefined, managerName);
    setNewMessage('');
    loadTicketData();
  };

  const updateStatus = (status: 'open' | 'closed') => {
    if (!ticketId) return;
    
    TicketStorage.update(parseInt(ticketId), { status });
    loadTicketData();
  };

  const assignToManager = (managerName: string) => {
    if (!ticketId) return;
    
    TicketStorage.update(parseInt(ticketId), { assignedTo: managerName });
    setShowManagerSelect(false);
    loadTicketData();
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
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center text-gray-400">
              Загрузка...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center text-gray-400">
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
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/tickets">
            <Button variant="outline" size="sm">
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              К тикетам
            </Button>
          </Link>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="border-gray-800">
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
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      {ticket.amount} ₽
                    </Badge>
                  )}
                  {ticket.userName && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {ticket.userName}
                    </Badge>
                  )}
                  {ticket.assignedTo && (
                    <Badge className="bg-green-100 text-green-800">
                      <Icon name="User" size={14} className="mr-1" />
                      {ticket.assignedTo}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl text-white">{ticket.subject}</CardTitle>
                <div className="text-sm text-gray-400 mt-2">
                  Создан: {new Date(ticket.createdAt).toLocaleString('ru')}
                  {ticket.userName && <span className="ml-4">Клиент: {ticket.userName}</span>}
                </div>
              </div>
              
              <div className="flex gap-2">
                {!ticket.assignedTo && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => setShowManagerSelect(!showManagerSelect)}
                  >
                    <Icon name="UserPlus" size={16} className="mr-2" />
                    Взять в работу
                  </Button>
                )}
                {ticket.status === 'open' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatus('closed')}
                  >
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    Закрыть
                  </Button>
                )}
                {ticket.status === 'closed' && (
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

        {showManagerSelect && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Выберите менеджера</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MANAGERS.map((manager) => (
                  <Button
                    key={manager}
                    variant="outline"
                    onClick={() => assignToManager(manager)}
                    className="h-16 text-base"
                  >
                    <Icon name="User" size={18} className="mr-2" />
                    {manager}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {ticket.assignedTo && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={18} className="text-green-400" />
                  <span className="text-white">Менеджер:</span>
                  <Badge className="bg-green-100 text-green-800 text-base">
                    {ticket.assignedTo}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => assignToManager('')}
                  className="text-gray-400 hover:text-white"
                >
                  <Icon name="X" size={16} className="mr-1" />
                  Снять
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="flex flex-col h-[500px] bg-gray-900 border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-lg text-white">Сообщения</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-30" />
                <p>Нет сообщений</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    msg.senderType === 'admin'
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}>
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="Изображение" 
                        className="max-w-full rounded mb-2 cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    )}
                    {msg.message && (
                      <div className="text-sm break-words">{msg.message}</div>
                    )}
                    <div className={`text-xs mt-1 ${
                      msg.senderType === 'admin' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString('ru', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          
          <div className="border-t border-gray-800 p-4 bg-gray-900">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                disabled={ticket.status === 'closed'}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || ticket.status === 'closed'}
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