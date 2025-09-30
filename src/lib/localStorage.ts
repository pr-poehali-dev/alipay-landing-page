export interface Ticket {
  id: number;
  sessionId: string;
  subject: string;
  amount: string;
  userName?: string;
  assignedTo?: string;
  status: 'open' | 'closed';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  senderType: 'client' | 'admin';
  message: string;
  imageUrl?: string;
  managerName?: string;
  createdAt: string;
}

export interface ChatSession {
  sessionId: string;
  name: string | null;
  messages: ChatMessage[];
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  message: string;
  imageUrl?: string;
  isAdmin: boolean;
  createdAt: string;
}

const STORAGE_KEYS = {
  TICKETS: 'alipay_tickets',
  CHAT_SESSIONS: 'alipay_chat_sessions',
  NEXT_TICKET_ID: 'alipay_next_ticket_id',
  NEXT_MESSAGE_ID: 'alipay_next_message_id',
};

// Синхронизация между вкладками через storage events
type StorageChangeListener = () => void;
const storageListeners: StorageChangeListener[] = [];

export const onStorageChange = (listener: StorageChangeListener) => {
  storageListeners.push(listener);
  return () => {
    const index = storageListeners.indexOf(listener);
    if (index > -1) storageListeners.splice(index, 1);
  };
};

// Уведомляем все вкладки об изменениях
const notifyChange = () => {
  storageListeners.forEach(listener => listener());
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.TICKETS,
    newValue: localStorage.getItem(STORAGE_KEYS.TICKETS),
    url: window.location.href
  }));
};

// Слушаем изменения из других вкладок
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.TICKETS || e.key === STORAGE_KEYS.CHAT_SESSIONS) {
      storageListeners.forEach(listener => listener());
    }
  });
}

export const TicketStorage = {
  getAll(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },

  getById(id: number): Ticket | null {
    const tickets = this.getAll();
    return tickets.find(t => t.id === id) || null;
  },

  create(sessionId: string, subject: string, amount: string, userName?: string): Ticket {
    const tickets = this.getAll();
    const nextId = this.getNextId();
    
    const newTicket: Ticket = {
      id: nextId,
      sessionId,
      subject,
      amount,
      userName,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: this.getNextMessageId(),
          senderType: 'client',
          message: `📋 Новая заявка на пополнение\n\n👤 Имя: ${userName}\n💰 Сумма: ${amount} ₽\n\nЖду подтверждения от менеджера.`,
          createdAt: new Date().toISOString(),
        },
        {
          id: this.getNextMessageId(),
          senderType: 'admin',
          message: 'Менеджер подключился к чату. Скоро с вами свяжутся.',
          managerName: 'Система',
          createdAt: new Date().toISOString(),
        }
      ]
    };

    tickets.push(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    notifyChange();
    return newTicket;
  },

  getRecentTickets(sessionId: string, minutes: number): Ticket[] {
    const tickets = this.getAll();
    const now = Date.now();
    const timeLimit = minutes * 60 * 1000;
    
    return tickets.filter(ticket => {
      if (ticket.sessionId !== sessionId) return false;
      const createdTime = new Date(ticket.createdAt).getTime();
      return (now - createdTime) < timeLimit;
    });
  },

  update(id: number, updates: Partial<Ticket>): Ticket | null {
    const tickets = this.getAll();
    const index = tickets.findIndex(t => t.id === id);
    
    if (index === -1) return null;

    tickets[index] = {
      ...tickets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    notifyChange();
    return tickets[index];
  },

  addMessage(ticketId: number, senderType: 'client' | 'admin', message: string, imageUrl?: string, managerName?: string): TicketMessage | null {
    const tickets = this.getAll();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return null;

    const newMessage: TicketMessage = {
      id: this.getNextMessageId(),
      senderType,
      message,
      imageUrl,
      managerName: senderType === 'admin' ? (managerName || ticket.assignedTo || 'Менеджер') : undefined,
      createdAt: new Date().toISOString(),
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    notifyChange();
    return newMessage;
  },

  delete(id: number): boolean {
    const tickets = this.getAll();
    const filtered = tickets.filter(t => t.id !== id);
    
    if (filtered.length === tickets.length) return false;

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(filtered));
    notifyChange();
    return true;
  },

  getNextId(): number {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_TICKET_ID) || '1');
    localStorage.setItem(STORAGE_KEYS.NEXT_TICKET_ID, String(current + 1));
    return current;
  },

  getNextMessageId(): number {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_MESSAGE_ID) || '1');
    localStorage.setItem(STORAGE_KEYS.NEXT_MESSAGE_ID, String(current + 1));
    return current;
  }
};

export const ChatStorage = {
  getAll(): ChatSession[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  getBySessionId(sessionId: string): ChatSession | null {
    const sessions = this.getAll();
    return sessions.find(s => s.sessionId === sessionId) || null;
  },

  createOrGet(sessionId: string, name?: string): ChatSession {
    const existing = this.getBySessionId(sessionId);
    if (existing) return existing;

    const sessions = this.getAll();
    const newSession: ChatSession = {
      sessionId,
      name: name || null,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    sessions.push(newSession);
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    return newSession;
  },

  addMessage(sessionId: string, message: string, isAdmin: boolean, imageUrl?: string): ChatMessage {
    this.createOrGet(sessionId);
    
    const sessions = this.getAll();
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session) {
      throw new Error('Failed to create or get session');
    }

    const newMessage: ChatMessage = {
      id: TicketStorage.getNextMessageId(),
      message,
      imageUrl,
      isAdmin,
      createdAt: new Date().toISOString(),
    };

    session.messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    return newMessage;
  },

  updateName(sessionId: string, name: string): void {
    const sessions = this.getAll();
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (session) {
      session.name = name;
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    }
  }
};