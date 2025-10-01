import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const MESSAGES_URL = 'https://functions.poehali.dev/55ffc95c-6162-4458-8c6e-8d11555582da';

export default function OnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem('visitor_session_id');
    if (existing) return existing;
    const newId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_session_id', newId);
    return newId;
  });

  useEffect(() => {
    const updateOnline = async () => {
      try {
        const res = await fetch(`${MESSAGES_URL}?action=online&session=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.online_count || 0);
        }
      } catch (e) {
        console.error('Online count error:', e);
      }
    };

    updateOnline();
    const interval = setInterval(updateOnline, 10000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
      <div className="relative">
        <Icon name="Users" size={18} className="text-green-600" />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      <span className="text-sm font-medium text-gray-700">
        {onlineCount} онлайн
      </span>
    </div>
  );
}
