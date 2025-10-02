import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface AdminLoginProps {
  password: string;
  setPassword: (password: string) => void;
  onLogin: () => void;
}

export default function AdminLogin({ password, setPassword, onLogin }: AdminLoginProps) {
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
            onKeyPress={(e) => e.key === 'Enter' && onLogin()}
            className="h-12"
          />
          <Button onClick={onLogin} className="w-full h-12">
            <Icon name="Lock" size={20} className="mr-2" />
            Войти
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
