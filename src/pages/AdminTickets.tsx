import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Link } from 'react-router-dom';

const CHAT_API = 'https://functions.poehali.dev/22875b8b-5f66-444c-bd9f-f429cbc012a6';

interface Ticket {
  id: number;
  session_id: string;
  subject: string;
  status: string;
  priority: string;
  amount?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

const AdminTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadTickets = async () => {
    try {
      const response = await fetch(`${CHAT_API}?tickets=true${filter !== 'all' ? `&status=${filter}` : ''}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
    } finally {
      setLoading(false);
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

  const filteredTickets = tickets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Тикеты поддержки</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              Все
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              onClick={() => setFilter('open')}
              size="sm"
            >
              Открытые
            </Button>
            <Button
              variant={filter === 'closed' ? 'default' : 'outline'}
              onClick={() => setFilter('closed')}
              size="sm"
            >
              Закрытые
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Загрузка тикетов...
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Нет тикетов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} to={`/admin/ticket/${ticket.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
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
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>#{ticket.id}</div>
                        <div>{new Date(ticket.created_at).toLocaleDateString('ru')}</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {ticket.last_message && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="MessageCircle" size={14} />
                        <span className="truncate">{ticket.last_message}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {ticket.message_count} сообщ.
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;