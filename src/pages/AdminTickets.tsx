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
  is_new?: boolean;
}

const AdminTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [prevTicketCount, setPrevTicketCount] = useState(0);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadTickets = async () => {
    try {
      const response = await fetch(`${CHAT_API}?tickets=true${filter !== 'all' ? `&status=${filter}` : ''}`);
      const data = await response.json();
      const ticketsWithNew = (data.tickets || []).map((ticket: Ticket) => {
        const createdTime = new Date(ticket.created_at).getTime();
        const now = Date.now();
        const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
        return {
          ...ticket,
          is_new: hoursSinceCreation < 1 && ticket.status === 'open'
        };
      });
      
      if (prevTicketCount > 0 && ticketsWithNew.length > prevTicketCount) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dvv2IdBSiG0fDTgjMGHGy57+ehTRAMUKXh8LZjHAU5kdfy0H0qBSh7yfDakj0JEmCz6OmlUhELRp/g7rdiFwUogdDwz4IyBxtvuvDroVEQC0ih4PGzYRYGOJHX8s9+KQUng8rx2JA+CRJfsujopVIRC0Wf4O63YhgGKIHO8NF+KgYbbLzv66JTDgtFoeDxsmEXBjmQ1vLPfSgGKIPK8diRPQcSX7Ln6KZSEQpGnt/uuWEYBSl/zvDRgCsGHGy77+ujUg4LRaCg8LNgFgU6jNTxz3woByuByvDUlD4IElyx6OilUREKRp7f7LZhGAUqfsrw0YAqBh1ru+/so1IOC0Wf4PKzYBYEOIzU8c98KAYqgsrw1JU+CRJcr+jopVERCkaen+u2YBgEKoDJ8NGAKgYea7zu7KRSDQtFn+DytGEVBTiM0/HOfCgGKoLJ8dOWPgkSXK7n6KRREQpGnt/st2AYBCp+yfDRgCkGH2y67+ykUQ4LRp3g8rNhFgU4i9Pw0HwpBSh/yfHTlT4IElux5+mlUREKRp3e7bZgGAQqf8nw0IAoBh9suu7spFEOC0Wc4PKzYhYEOIvT8c9+KAYpgMnx05U+BxJcr+boplESCkaen+u2YRcFKoDJ8M+AKQYfa7rt7KRRDgtFnODys2IXBTiL0/HPfScHKYDJ8dOWPgcSW67n6KdREQpFnd7rtmEYBSp/yfDQgCkGH2u57uykUQ4LRJve77JiGAU3i9Lxz3wpBil/yfHTlj4HEluu5uimUBELRZze7bVhGAUqfsnw0IAqBh5ruu7rpFIOC0Sb3u+zYhYFN4rT8M99KQYpf8jw1JY+CRNasublqVASCkWd3u22YRgFKn7J8M+AKgYea7ru7KNRDgtEm97vtWEYBTeL0/DPfSkGKX7I8NOWPwkSWq7m5qhQEQpEnN3ttmEXBSp+yfDPgCoGHmu67uujUg0LRJrd7rViFgY3itPxz3wpBil+yPDTlj8JElqu5uaoUBEKRJvd7rZiFwYqfcjwz4EpBh5ruu/solENC0Sa3e+1YhYGN4nS8c98KQYpfcjw1JY+ChNarubnp1ARCkSa3u62YhcFKn7I8M+AKgYfa7rv7KJRDgtFmt3vtWEWBjeK0vHOfSgGKX3I8NOXPgoSWK3m56hPEQpEmtzutmEXBSp+yfDPgCkGH2u67+uiURELRJnc77ZhFwY3idLxz34oBil9x/DTlz8JEliu5uenUBELRJnc7rZhGAUqfsjwz4ApBh9ruu/roVEQC0SZ3O+1YhcFN4nS8c99KAYqfsjw05c+ChJYrebnoE8RCkOZ3e+1YRgEKn3H8M+AKgYfa7nt7KFRDwtFmdzutGEXBTeJ0/HOfSgGKn7I8NOWPwkSWK7m5qhPEQpEmtzutmEXBSp9x/DPgCoGH2u47uqiUA8LRJnc7rNhFwU3idLxz3wpBip9yPDTlz8JEliu5uanUBEKRJrc7bVhGAUqfcfwz4AqBh9suu/roVEOC0SZ3O61YhcFN4nT8c99KAYqfcjw05c/CRJYrubmoE8RCkSZ3e+0YRgFKn3I8M+AKgYfa7nt66FRDgtFmdzutGEXBTeJ0/HOfSgGKn3I8NOWPwkSWK3m5adQEQpEmdzutmEYBSp9x/DPfykGHmu57+qhUA8LRJjb77RhFwU3idLxz3wpBip+yPDTlz8IEliu5uenTxEKRJnc7rVhGAUqfcjwz4ApBh9ru+7qolEOC0SY3O6zYhgFN4nS8c99KAYqfsjw05c/CRJYrebmp08RC... [truncated]
        audio.play().catch(e => console.log('Звуковое уведомление отключено'));
      }
      
      setPrevTicketCount(ticketsWithNew.length);
      setTickets(ticketsWithNew);
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
      case 'in_progress': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredTickets = tickets;

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

        {loading ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center text-gray-400">
              Загрузка тикетов...
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center text-gray-400">
              <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Нет тикетов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
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
                            {ticket.status === 'open' ? 'Открыт' : 
                             ticket.status === 'in_progress' ? 'В работе' : 'Закрыт'}
                          </Badge>
                          {ticket.amount && (
                            <Badge variant="outline">
                              {ticket.amount} ₽
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-white">{ticket.subject}</CardTitle>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <div>#{ticket.id}</div>
                        <div>{new Date(ticket.created_at).toLocaleDateString('ru')}</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {ticket.last_message && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Icon name="MessageCircle" size={14} />
                        <span className="truncate">{ticket.last_message}</span>
                        <span className="ml-auto text-xs text-gray-500">
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