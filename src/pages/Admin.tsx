import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Ticket } from "@/lib/supabase";

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      setTickets(data || []);
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
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    setPassword('');
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.amount.includes(searchTerm) ||
    ticket.session_id.includes(searchTerm)
  );

  const totalAmount = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.amount), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Админ-панель</CardTitle>
            <p className="text-gray-600 text-center">Введите пароль для доступа</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="h-12"
            />
            <Button onClick={handleLogin} className="w-full h-12">
              <Icon name="Lock" size={20} className="mr-2" />
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="LayoutDashboard" size={24} className="text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Админ-панель</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={loadTickets}>
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Обновить
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всего заявок</p>
                  <p className="text-3xl font-bold">{tickets.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="FileText" size={24} className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Общая сумма</p>
                  <p className="text-3xl font-bold">{totalAmount.toLocaleString()} ₽</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="DollarSign" size={24} className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Сегодня</p>
                  <p className="text-3xl font-bold">
                    {tickets.filter(t => {
                      const today = new Date().toDateString();
                      const ticketDate = new Date(t.created_at).toDateString();
                      return today === ticketDate;
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name="Calendar" size={24} className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Заявки на пополнение</CardTitle>
              <div className="w-full sm:w-auto">
                <Input
                  placeholder="Поиск по имени, сумме, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Icon name="Loader" size={32} className="animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Загрузка...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Inbox" size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Заявок пока нет</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Чат</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="secondary">#{ticket.id}</Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Icon name="User" size={16} className="mr-2 text-gray-400" />
                            <span className="font-medium">{ticket.user_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-green-600 font-semibold">{ticket.amount} ₽</span>
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/admin/chat/${ticket.session_id}`)}
                          >
                            <Icon name="MessageCircle" size={16} className="mr-1" />
                            Чат
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;