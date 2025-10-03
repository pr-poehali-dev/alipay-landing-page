import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Ticket } from "@/lib/supabase";

interface AdminStatsProps {
  tickets: Ticket[];
  onlineCount: number;
}

export default function AdminStats({ tickets, onlineCount }: AdminStatsProps) {
  const totalAmount = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.amount), 0);
  const todayTickets = tickets.filter(t => {
    const today = new Date().toDateString();
    const ticketDate = new Date(t.created_at).toDateString();
    return today === ticketDate;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm text-gray-600">Онлайн на сайте</p>
              <p className="text-3xl font-bold">{onlineCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center relative">
              <Icon name="Users" size={24} className="text-purple-600" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Сегодня</p>
              <p className="text-3xl font-bold">{todayTickets}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon name="Calendar" size={24} className="text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
