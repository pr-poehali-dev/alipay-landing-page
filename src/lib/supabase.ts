import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://keefvvarqolszayrasaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZWZ2dmFycW9sc3pheXJhc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzEwNDIsImV4cCI6MjA3NDgwNzA0Mn0.mX5T3T-VmE1TszTFfXzIVV9b5Hi9ZqDb96R-z03wUgQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Ticket {
  id: number;
  session_id: string;
  amount: string;
  user_name: string | null;
  status: string;
  assigned_manager: string | null;
  created_at: string;
  unread_messages?: number;
}

export interface Message {
  id: number;
  session_id: string;
  user_name: string | null;
  message: string;
  is_admin: boolean;
  image_url: string | null;
  manager_name: string | null;
  created_at: string;
  read_by_user?: boolean;
  read_by_admin?: boolean;
}

export const BlockService = {
  async isBlocked(sessionId: string): Promise<boolean> {
    const { data } = await supabase
      .from('tickets')
      .select('is_blocked')
      .eq('session_id', sessionId)
      .eq('is_blocked', true)
      .maybeSingle();
    
    return !!data;
  },

  async block(sessionId: string, reason: string = 'Нарушение правил') {
    const { data, error } = await supabase
      .from('tickets')
      .update({ is_blocked: true })
      .eq('session_id', sessionId)
      .select();

    if (error) throw error;
    return data;
  },

  async unblock(sessionId: string) {
    const { error } = await supabase
      .from('tickets')
      .update({ is_blocked: false })
      .eq('session_id', sessionId);

    if (error) throw error;
  },

  getRateLimitMessage(): string {
    return 'Превышен лимит запросов. Попробуйте позже.';
  }
};

export const MessageService = {
  async sendMessage(sessionId: string, message: string, isAdmin: boolean = false, userName: string | null = null, imageUrl: string | null = null, managerName: string | null = null) {
    if (!isAdmin) {
      const isBlocked = await BlockService.isBlocked(sessionId);
      if (isBlocked) {
        throw new Error(BlockService.getRateLimitMessage());
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        { session_id: sessionId, message, is_admin: isAdmin, user_name: userName, image_url: imageUrl, manager_name: managerName, read_by_user: isAdmin ? false : true, read_by_admin: isAdmin ? true : false }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  },

  async markAsRead(sessionId: string, isAdmin: boolean) {
    try {
      const field = isAdmin ? 'read_by_admin' : 'read_by_user';
      const { error } = await supabase
        .from('messages')
        .update({ [field]: true })
        .eq('session_id', sessionId)
        .eq(field, false);

      if (error && !error.message.includes('column')) {
        console.error('markAsRead error:', error);
      }
    } catch (e) {
      console.log('markAsRead not available yet');
    }
  },

  async getUnreadCount(sessionId: string, isAdmin: boolean) {
    try {
      const field = isAdmin ? 'read_by_admin' : 'read_by_user';
      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId)
        .eq(field, false);

      if (error && !error.message.includes('column')) {
        console.error('getUnreadCount error:', error);
      }
      return data?.length || 0;
    } catch (e) {
      return 0;
    }
  },

  async getMessages(sessionId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `chat-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async uploadFile(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `chat-files/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

export const TicketService = {
  async create(sessionId: string, amount: string, userName: string) {
    const isBlocked = await BlockService.isBlocked(sessionId);
    if (isBlocked) {
      throw new Error(BlockService.getRateLimitMessage());
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        { session_id: sessionId, amount, user_name: userName }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Ticket;
  },

  async updateStatus(id: number, status: string) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Ticket;
  },

  async updateManager(id: number, manager: string | null) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ assigned_manager: manager })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Ошибка обновления: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Не удалось обновить менеджера');
    }
    
    return data as Ticket;
  },

  async getRecentBySession(sessionId: string, minutesAgo: number = 1440) {
    const timeAgo = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('session_id', sessionId)
      .gte('created_at', timeAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Ticket[];
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};