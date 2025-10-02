import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AdminHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
}

export default function AdminHeader({ onRefresh, onLogout }: AdminHeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="LayoutDashboard" size={24} className="text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold">Админ-панель</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
