export interface Ticket {
  id: number;
  sessionId: string;
  subject: string;
  amount: string;
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

export const TicketStorage = {
  getAll(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },

  getById(id: number): Ticket | null {
    const tickets = this.getAll();
    return tickets.find(t => t.id === id) || null;
  },

  create(sessionId: string, subject: string, amount: string): Ticket {
    const tickets = this.getAll();
    const nextId = this.getNextId();
    
    const newTicket: Ticket = {
      id: nextId,
      sessionId,
      subject,
      amount,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: this.getNextMessageId(),
        senderType: 'client',
        message: `Здравствуйте! Хочу пополнить счёт на ${amount} ₽`,
        createdAt: new Date().toISOString(),
      }]
    };

    tickets.push(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    return newTicket;
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
    return tickets[index];
  },

  addMessage(ticketId: number, senderType: 'client' | 'admin', message: string, imageUrl?: string): TicketMessage | null {
    const tickets = this.getAll();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return null;

    const newMessage: TicketMessage = {
      id: this.getNextMessageId(),
      senderType,
      message,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    return newMessage;
  },

  delete(id: number): boolean {
    const tickets = this.getAll();
    const filtered = tickets.filter(t => t.id !== id);
    
    if (filtered.length === tickets.length) return false;

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(filtered));
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