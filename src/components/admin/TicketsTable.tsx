import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Ticket } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  onStatusChange: (ticketId: number, newStatus: string) => void;
  onManagerChange: (ticketId: number, newManager: string | null) => void;
  onDeleteTicket: (ticketId: number) => void;
  onOpenChat: (sessionId: string) => void;
  onBlockUser: (sessionId: string) => void;
}

export default function TicketsTable({
  tickets,
  loading,
  onStatusChange,
  onManagerChange,
  onDeleteTicket,
  onOpenChat,
  onBlockUser
}: TicketsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'новая': { color: 'bg-gray-100 text-gray-800', label: 'Новая' },
      'обработан': { color: 'bg-purple-100 text-purple-800', label: 'Обработан' },
      'скам': { color: 'bg-red-100 text-red-800', label: 'Скам' },
      'успешный платеж': { color: 'bg-green-100 text-green-800', label: 'Успешный платеж' },
      'в работе спикер': { color: 'bg-emerald-100 text-emerald-800', label: 'В работе Спикер' },
      'в работе кристи': { color: 'bg-teal-100 text-teal-800', label: 'В работе Кристи' },
      'в работе тичер': { color: 'bg-cyan-100 text-cyan-800', label: 'В работе Тичер' },
      'в работе жека': { color: 'bg-lime-100 text-lime-800', label: 'В работе Жека' },
      'закрыт': { color: 'bg-green-100 text-green-800', label: 'Закрыт' },
      'open': { color: 'bg-gray-100 text-gray-800', label: 'Открыта' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', label: 'В обработке' },
      'closed': { color: 'bg-green-100 text-green-800', label: 'Закрыта' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Icon name="Loader" size={32} className="animate-spin mx-auto text-gray-400 dark:text-gray-500" />
        <p className="text-gray-500 dark:text-gray-400 mt-2">Загрузка...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="Inbox" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">Заявок пока нет</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Имя</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Сумма</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Менеджер</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Session ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-4 whitespace-nowrap">
                <Badge variant="secondary">#{ticket.id}</Badge>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="font-medium dark:text-white">{ticket.user_name || 'Без имени'}</span>
                  {ticket.unread_messages && ticket.unread_messages > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                      {ticket.unread_messages}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-green-600 dark:text-green-400 font-semibold">{ticket.amount} ₽</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Select 
                  value={ticket.status} 
                  onValueChange={(value) => onStatusChange(ticket.id, value)}
                >
                  <SelectTrigger className="w-44 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue>{getStatusBadge(ticket.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="новая">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                        Новая
                      </span>
                    </SelectItem>
                    <SelectItem value="обработан">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                        Обработан
                      </span>
                    </SelectItem>
                    <SelectItem value="скам">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Скам
                      </span>
                    </SelectItem>
                    <SelectItem value="успешный платеж">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Успешный платеж
                      </span>
                    </SelectItem>
                    <SelectItem value="в работе спикер">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        В работе Спикер
                      </span>
                    </SelectItem>
                    <SelectItem value="в работе кристи">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-teal-500 mr-2"></span>
                        В работе Кристи
                      </span>
                    </SelectItem>
                    <SelectItem value="в работе тичер">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></span>
                        В работе Тичер
                      </span>
                    </SelectItem>
                    <SelectItem value="в работе жека">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-lime-500 mr-2"></span>
                        В работе Жека
                      </span>
                    </SelectItem>
                    <SelectItem value="закрыт">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                        Закрыт
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Select 
                  value={ticket.assigned_manager || 'unassigned'} 
                  onValueChange={(value) => onManagerChange(ticket.id, value === 'unassigned' ? null : value)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Не назначен">
                      {ticket.assigned_manager ? (
                        <span className="flex items-center">
                          <Icon name="UserCheck" size={14} className="mr-1" />
                          {ticket.assigned_manager}
                        </span>
                      ) : (
                        <span className="text-gray-400">Не назначен</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <span className="text-gray-400">Не назначен</span>
                    </SelectItem>
                    <SelectItem value="Кристина">Кристина</SelectItem>
                    <SelectItem value="Евгений">Евгений</SelectItem>
                    <SelectItem value="Георгий">Георгий</SelectItem>
                    <SelectItem value="Василий">Василий</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(ticket.created_at).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                {ticket.session_id.substring(0, 20)}...
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onOpenChat(ticket.session_id)}
                  >
                    <Icon name="MessageCircle" size={16} className="mr-1" />
                    Чат
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onBlockUser(ticket.session_id)}
                    className="hover:bg-orange-50"
                  >
                    <Icon name="Ban" size={16} className="text-orange-500" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteTicket(ticket.id)}
                    className="hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={16} className="text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}