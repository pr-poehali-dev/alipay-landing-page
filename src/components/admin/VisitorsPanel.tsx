import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Visitor {
  sessionId: string;
  ipAddress: string;
  deviceType: string;
  browser: string;
  os: string;
  timestamp: string;
  isOnline: boolean;
  pageViews: number;
}

export default function VisitorsPanel() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const getVisitorInfo = () => {
      const userAgent = navigator.userAgent;
      const sessionId = sessionStorage.getItem('session_id') || Math.random().toString(36);
      
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }

      const getDeviceType = () => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          return 'Mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          return 'Tablet';
        }
        return 'Desktop';
      };

      const getBrowser = () => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('edg')) return 'Edge';
        if (ua.includes('chrome')) return 'Chrome';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
        return 'Unknown';
      };

      const getOS = () => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('windows')) return 'Windows';
        if (ua.includes('mac')) return 'macOS';
        if (ua.includes('linux')) return 'Linux';
        if (ua.includes('android')) return 'Android';
        if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
        return 'Unknown';
      };

      return {
        sessionId,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        timestamp: new Date().toISOString(),
        isOnline: true,
        pageViews: parseInt(sessionStorage.getItem('page_views') || '1'),
      };
    };

    const visitorInfo = getVisitorInfo();
    
    const storedVisitors = JSON.parse(localStorage.getItem('visitors') || '[]');
    const existingIndex = storedVisitors.findIndex((v: Visitor) => v.sessionId === visitorInfo.sessionId);
    
    if (existingIndex >= 0) {
      storedVisitors[existingIndex] = {
        ...storedVisitors[existingIndex],
        timestamp: visitorInfo.timestamp,
        isOnline: true,
        pageViews: storedVisitors[existingIndex].pageViews + 1,
      };
    } else {
      storedVisitors.unshift(visitorInfo);
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const updatedVisitors = storedVisitors.map((v: Visitor) => ({
      ...v,
      isOnline: new Date(v.timestamp).getTime() > fiveMinutesAgo,
    }));

    localStorage.setItem('visitors', JSON.stringify(updatedVisitors.slice(0, 50)));
    setVisitors(updatedVisitors);
    setOnlineCount(updatedVisitors.filter((v: Visitor) => v.isOnline).length);

    const interval = setInterval(() => {
      const stored = JSON.parse(localStorage.getItem('visitors') || '[]');
      const fiveMin = Date.now() - 5 * 60 * 1000;
      const updated = stored.map((v: Visitor) => ({
        ...v,
        isOnline: new Date(v.timestamp).getTime() > fiveMin,
      }));
      setVisitors(updated);
      setOnlineCount(updated.filter((v: Visitor) => v.isOnline).length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'Mobile') return 'Smartphone';
    if (deviceType === 'Tablet') return 'Tablet';
    return 'Monitor';
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Users" size={24} />
          Посетители
          <span className="ml-auto flex items-center gap-2 text-sm font-normal">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {onlineCount} онлайн
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visitors.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Нет данных о посетителях
            </p>
          ) : (
            visitors.map((visitor, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  visitor.isOnline
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon
                      name={getDeviceIcon(visitor.deviceType)}
                      size={20}
                      className={visitor.isOnline ? 'text-green-600' : 'text-gray-400'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm dark:text-white">
                          {visitor.deviceType}
                        </span>
                        {visitor.isOnline && (
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Icon name="Globe" size={12} />
                          <span>{visitor.browser} • {visitor.os}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Eye" size={12} />
                          <span>{visitor.pageViews} просмотров</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Clock" size={12} />
                          <span>
                            {new Date(visitor.timestamp).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
