import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://keefvvarqolszayrasaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZWZ2dmFycW9sc3pheXJhc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzEwNDIsImV4cCI6MjA3NDgwNzA0Mn0.mX5T3T-VmE1TszTFfXzIVV9b5Hi9ZqDb96R-z03wUgQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Ticket {
  id: number;
  session_id: string;
  amount: string;
  user_name: string;
  created_at: string;
}

export const TicketService = {
  async create(sessionId: string, amount: string, userName: string) {
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
  }
};
