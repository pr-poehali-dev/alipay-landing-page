import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Link } from 'react-router-dom';
import { TicketStorage, Ticket } from '@/lib/localStorage';

const AdminTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [lastTicketIds, setLastTicketIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 2000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadTickets = () => {
    const allTickets = TicketStorage.getAll();
    
    const filteredTickets = filter === 'all' 
      ? allTickets 
      : allTickets.filter(t => t.status === filter);

    const ticketsWithNew = filteredTickets.map(ticket => {
      const createdTime = new Date(ticket.createdAt).getTime();
      const now = Date.now();
      const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
      return {
        ...ticket,
        is_new: hoursSinceCreation < 1 && ticket.status === 'open'
      };
    });

    const currentTicketIds = new Set(ticketsWithNew.map(t => t.id));
    const newTickets = ticketsWithNew.filter(t => !lastTicketIds.has(t.id) && t.status === 'open');

    if (newTickets.length > 0 && lastTicketIds.size > 0) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.log('Звук недоступен');
      }
    }

    setLastTicketIds(currentTicketIds);
    setTickets(ticketsWithNew);
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

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white">Тикеты поддержки</h1>
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

        {tickets.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center text-gray-400">
              <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Нет тикетов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const lastMessage = ticket.messages[ticket.messages.length - 1];
              
              return (
                <Link key={ticket.id} to={`/admin/ticket/${ticket.id}`}>
                  <Card className={`bg-gray-900 border-gray-800 hover:bg-gray-850 transition-all cursor-pointer ${
                    ticket.is_new ? 'border-2 border-green-500 shadow-lg shadow-green-500/20' : ''
                  }`}>
                    <CardHeader className="pb-3 border-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {ticket.is_new && (
                              <Badge className="bg-green-500 text-white animate-pulse">
                                NEW
                              </Badge>
                            )}
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
                                <Icon name="User" size={12} className="mr-1" />
                                {ticket.assignedTo}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-white">{ticket.subject}</CardTitle>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div>#{ticket.id}</div>
                          <div>{new Date(ticket.createdAt).toLocaleDateString('ru')}</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {lastMessage && (
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Icon name="MessageCircle" size={14} />
                          <span className="truncate">{lastMessage.message}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {ticket.messages.length} сообщ.
                          </span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;