import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Ticket, TicketService, MessageService, BlockService } from "@/lib/supabase";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStats from "@/components/admin/AdminStats";
import TicketsFilter from "@/components/admin/TicketsFilter";
import TicketsTable from "@/components/admin/TicketsTable";

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [prevTicketCount, setPrevTicketCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  const ADMIN_PASSWORD = 'admin123';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
      loadTickets();
    } else {
      alert('Неверный пароль');
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const newData = data || [];
      
      try {
        const ticketsWithUnread = await Promise.all(
          newData.map(async (ticket) => {
            try {
              const unreadCount = await MessageService.getUnreadCount(ticket.session_id, true);
              return { ...ticket, unread_messages: unreadCount };
            } catch (e) {
              return { ...ticket, unread_messages: 0 };
            }
          })
        );
        setTickets(ticketsWithUnread);
        setPrevTicketCount(ticketsWithUnread.length);
      } catch (e) {
        setTickets(newData);
        setPrevTicketCount(newData.length);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadTickets();
      
      const interval = setInterval(() => {
        loadTickets();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const res = await fetch('https://functions.poehali.dev/55ffc95c-6162-4458-8c6e-8d11555582da?action=online');
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.online_count || 0);
        }
      } catch (e) {
        console.error('Online count error:', e);
      }
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    setPassword('');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = (ticket.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.amount.includes(searchTerm) ||
      ticket.session_id.includes(searchTerm) ||
      ticket.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      await TicketService.updateStatus(ticketId, newStatus);
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleManagerChange = async (ticketId: number, newManager: string | null) => {
    try {
      await TicketService.updateManager(ticketId, newManager);
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, assigned_manager: newManager } : t));
    } catch (error) {
      console.error('Ошибка обновления менеджера:', error);
      alert('Ошибка назначения менеджера');
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm('Удалить заявку? Это действие нельзя отменить.')) return;
    
    try {
      await TicketService.delete(ticketId);
      setTickets(tickets.filter(t => t.id !== ticketId));
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления заявки');
    }
  };

  const handleOpenChat = (sessionId: string) => {
    navigate(`/admin/chat/${sessionId}`);
  };

  const handleBlockUser = async (sessionId: string) => {
    if (!confirm('Заблокировать пользователя? Он не сможет создавать заявки и писать в чат.')) return;
    
    try {
      await BlockService.block(sessionId, 'Заблокирован администратором');
      alert('Пользователь заблокирован');
    } catch (error: any) {
      console.error('Ошибка блокировки:', error);
      alert(`Ошибка блокировки: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin
        password={password}
        setPassword={setPassword}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <AdminHeader onRefresh={loadTickets} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <AdminStats tickets={tickets} onlineCount={onlineCount} />

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Заявки на пополнение</CardTitle>
              <TicketsFilter
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          </CardHeader>
          <CardContent>
            <TicketsTable
              tickets={filteredTickets}
              loading={loading}
              onStatusChange={handleStatusChange}
              onManagerChange={handleManagerChange}
              onDeleteTicket={handleDeleteTicket}
              onOpenChat={handleOpenChat}
              onBlockUser={handleBlockUser}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;