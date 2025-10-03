import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Reviews from "./pages/Reviews";
import Admin from "./pages/Admin";
import AdminChat from "./pages/AdminChat";
import AdminPanel from "./pages/AdminPanel";
import AdminTickets from "./pages/AdminTickets";
import AdminTicketView from "./pages/AdminTicketView";
import NotFound from "./pages/NotFound";
import ChatWidget from "./components/ChatWidget";

const queryClient = new QueryClient();

const VisitorTracker = () => {
  useEffect(() => {
    const sessionId = sessionStorage.getItem('session_id') || Math.random().toString(36).substring(2);
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', sessionId);
    }

    const pageViews = parseInt(sessionStorage.getItem('page_views') || '0') + 1;
    sessionStorage.setItem('page_views', pageViews.toString());

    const userAgent = navigator.userAgent;
    const getDeviceType = () => {
      const ua = userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
      if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
      return 'Desktop';
    };

    const visitor = {
      sessionId,
      deviceType: getDeviceType(),
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
      pageViews,
    };

    const visitors = JSON.parse(localStorage.getItem('visitors') || '[]');
    const index = visitors.findIndex((v: any) => v.sessionId === sessionId);
    
    if (index >= 0) {
      visitors[index] = { ...visitors[index], timestamp: visitor.timestamp, pageViews };
    } else {
      visitors.unshift(visitor);
    }

    localStorage.setItem('visitors', JSON.stringify(visitors.slice(0, 50)));
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <VisitorTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/chat/:sessionId" element={<AdminChat />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/ticket/:ticketId" element={<AdminTicketView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;