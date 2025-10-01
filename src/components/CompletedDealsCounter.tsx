import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

export default function CompletedDealsCounter() {
  const [dealsCount, setDealsCount] = useState(() => {
    const saved = localStorage.getItem('deals_count');
    const savedTime = localStorage.getItem('deals_time');
    const now = Date.now();
    
    if (saved && savedTime) {
      const lastUpdate = parseInt(savedTime);
      const hoursPassed = Math.floor((now - lastUpdate) / (1000 * 60 * 60));
      
      if (hoursPassed < 1) {
        return parseInt(saved);
      }
    }
    
    const newCount = Math.floor(Math.random() * (406 - 109 + 1)) + 109;
    localStorage.setItem('deals_count', newCount.toString());
    localStorage.setItem('deals_time', now.toString());
    return newCount;
  });

  useEffect(() => {
    const updateDeals = () => {
      const savedTime = localStorage.getItem('deals_time');
      const now = Date.now();
      
      if (savedTime) {
        const lastUpdate = parseInt(savedTime);
        const hoursPassed = Math.floor((now - lastUpdate) / (1000 * 60 * 60));
        
        if (hoursPassed >= 1) {
          const newCount = Math.floor(Math.random() * (406 - 109 + 1)) + 109;
          setDealsCount(newCount);
          localStorage.setItem('deals_count', newCount.toString());
          localStorage.setItem('deals_time', now.toString());
        }
      }
    };

    const interval = setInterval(updateDeals, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
      <Icon name="CheckCircle2" size={18} className="text-white" />
      <span className="text-sm font-medium">
        {dealsCount} сделок завершено сегодня
      </span>
    </div>
  );
}
