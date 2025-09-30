import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, update, query, orderByChild, equalTo, get, limitToLast } from 'firebase/database';

// Конфигурация Firebase - ЗАМЕНИТЕ на свои данные из Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface Ticket {
  id: string;
  sessionId: string;
  subject: string;
  amount: string;
  userName?: string;
  assignedTo?: string;
  status: 'open' | 'closed';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: 'client' | 'admin';
  message: string;
  imageUrl?: string;
  managerName?: string;
  createdAt: string;
}

export const FirebaseTicketStorage = {
  // Создать новый тикет
  async create(sessionId: string, subject: string, amount: string, userName?: string): Promise<Ticket> {
    const ticketsRef = ref(database, 'tickets');
    const newTicketRef = push(ticketsRef);
    const ticketId = newTicketRef.key!;
    
    const newTicket: Ticket = {
      id: ticketId,
      sessionId,
      subject,
      amount,
      userName,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await set(newTicketRef, newTicket);
    
    // Добавляем первое сообщение
    const messagesRef = ref(database, 'messages');
    const msg1Ref = push(messagesRef);
    await set(msg1Ref, {
      id: msg1Ref.key,
      ticketId,
      senderType: 'client',
      message: `📋 Новая заявка на пополнение\n\n👤 Имя: ${userName}\n💰 Сумма: ${amount} ₽\n\nЖду подтверждения от менеджера.`,
      createdAt: new Date().toISOString(),
    });
    
    // Системное сообщение
    const msg2Ref = push(messagesRef);
    await set(msg2Ref, {
      id: msg2Ref.key,
      ticketId,
      senderType: 'admin',
      message: 'Менеджер подключился к чату. Скоро с вами свяжутся.',
      managerName: 'Система',
      createdAt: new Date().toISOString(),
    });
    
    return newTicket;
  },
  
  // Получить все тикеты
  async getAll(): Promise<Ticket[]> {
    const ticketsRef = ref(database, 'tickets');
    const snapshot = await get(ticketsRef);
    
    if (!snapshot.exists()) return [];
    
    const tickets: Ticket[] = [];
    snapshot.forEach((child) => {
      tickets.push(child.val());
    });
    
    return tickets.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  
  // Получить тикеты по session ID
  async getBySessionId(sessionId: string): Promise<Ticket[]> {
    const ticketsRef = ref(database, 'tickets');
    const q = query(ticketsRef, orderByChild('sessionId'), equalTo(sessionId));
    const snapshot = await get(q);
    
    if (!snapshot.exists()) return [];
    
    const tickets: Ticket[] = [];
    snapshot.forEach((child) => {
      tickets.push(child.val());
    });
    
    return tickets;
  },
  
  // Получить тикет по ID
  async getById(id: string): Promise<Ticket | null> {
    const ticketRef = ref(database, `tickets/${id}`);
    const snapshot = await get(ticketRef);
    return snapshot.exists() ? snapshot.val() : null;
  },
  
  // Проверить лимит заявок (5 за 24 часа)
  async checkLimit(sessionId: string): Promise<boolean> {
    const tickets = await this.getBySessionId(sessionId);
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentTickets = tickets.filter(t => 
      new Date(t.createdAt).getTime() > dayAgo
    );
    
    return recentTickets.length >= 5;
  },
  
  // Обновить тикет
  async update(id: string, updates: Partial<Ticket>): Promise<void> {
    const ticketRef = ref(database, `tickets/${id}`);
    await update(ticketRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
  
  // Слушать изменения всех тикетов
  onTicketsChange(callback: (tickets: Ticket[]) => void): () => void {
    const ticketsRef = ref(database, 'tickets');
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      const tickets: Ticket[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          tickets.push(child.val());
        });
      }
      tickets.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      callback(tickets);
    });
    
    return unsubscribe;
  },
  
  // Слушать изменения конкретного тикета
  onTicketChange(ticketId: string, callback: (ticket: Ticket | null) => void): () => void {
    const ticketRef = ref(database, `tickets/${ticketId}`);
    const unsubscribe = onValue(ticketRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    
    return unsubscribe;
  },
};

export const FirebaseMessageStorage = {
  // Добавить сообщение
  async add(ticketId: string, senderType: 'client' | 'admin', message: string, imageUrl?: string, managerName?: string): Promise<TicketMessage> {
    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef);
    
    const newMessage: TicketMessage = {
      id: newMessageRef.key!,
      ticketId,
      senderType,
      message,
      imageUrl,
      managerName: senderType === 'admin' ? managerName : undefined,
      createdAt: new Date().toISOString(),
    };
    
    await set(newMessageRef, newMessage);
    
    // Обновляем время тикета
    const ticketRef = ref(database, `tickets/${ticketId}`);
    await update(ticketRef, {
      updatedAt: new Date().toISOString(),
    });
    
    return newMessage;
  },
  
  // Получить сообщения тикета
  async getByTicketId(ticketId: string): Promise<TicketMessage[]> {
    const messagesRef = ref(database, 'messages');
    const q = query(messagesRef, orderByChild('ticketId'), equalTo(ticketId));
    const snapshot = await get(q);
    
    if (!snapshot.exists()) return [];
    
    const messages: TicketMessage[] = [];
    snapshot.forEach((child) => {
      messages.push(child.val());
    });
    
    return messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },
  
  // Слушать изменения сообщений тикета
  onMessagesChange(ticketId: string, callback: (messages: TicketMessage[]) => void): () => void {
    const messagesRef = ref(database, 'messages');
    const q = query(messagesRef, orderByChild('ticketId'), equalTo(ticketId));
    
    const unsubscribe = onValue(q, (snapshot) => {
      const messages: TicketMessage[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          messages.push(child.val());
        });
      }
      messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      callback(messages);
    });
    
    return unsubscribe;
  },
};
