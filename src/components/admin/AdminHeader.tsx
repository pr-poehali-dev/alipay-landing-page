import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AdminHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
  onToggleSound?: () => void;
  soundEnabled?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function AdminHeader({ onRefresh, onLogout, onToggleSound, soundEnabled, darkMode, onToggleDarkMode }: AdminHeaderProps) {
  return (
    <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="LayoutDashboard" size={24} className="text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold dark:text-white">Админ-панель</h1>
        </div>
        <div className="flex items-center gap-2">
          {onToggleDarkMode && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleDarkMode}
              className="dark:text-white"
            >
              <Icon name={darkMode ? "Sun" : "Moon"} size={18} />
            </Button>
          )}
          {onToggleSound && (
            <Button 
              variant={soundEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleSound}
              className="dark:border-gray-600 dark:text-white hidden sm:flex"
            >
              <Icon name={soundEnabled ? "Volume2" : "VolumeX"} size={16} className="mr-2" />
              {soundEnabled ? "Звук вкл" : "Звук выкл"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} className="dark:border-gray-600 dark:text-white">
            <Icon name="RefreshCw" size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Обновить</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout} className="dark:border-gray-600 dark:text-white">
            <Icon name="LogOut" size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </div>
    </header>
  );
}