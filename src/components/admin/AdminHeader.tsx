import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AdminHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
  onToggleSound?: () => void;
  soundEnabled?: boolean;
}

export default function AdminHeader({ onRefresh, onLogout, onToggleSound, soundEnabled }: AdminHeaderProps) {
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
          {onToggleSound && (
            <Button 
              variant={soundEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleSound}
            >
              <Icon name={soundEnabled ? "Volume2" : "VolumeX"} size={16} className="mr-2" />
              {soundEnabled ? "Звук вкл" : "Звук выкл"}
            </Button>
          )}
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