import { supabase } from '../../../lib/supabaseClient';
import { SleepLog, SleepLogInsert } from '../../../types/requests.types';

export const sleepApi = {
  async getLogs(userId: string, limit = 30) {
    console.log('[sleepApi.getLogs] Iniciando - userId:', userId, 'limit:', limit);
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[sleepApi.getLogs] Error:', error);
        throw error;
      }
      console.log('[sleepApi.getLogs] Éxito - registros:', data?.length);
      return data as SleepLog[];
    } catch (err) {
      console.error('[sleepApi.getLogs] Exception:', err);
      throw err;
    }
  },

  async addLog(log: Omit<SleepLogInsert, 'id'>) {
    console.log('[sleepApi.addLog] Iniciando - date:', log.date, 'duration:', log.duration_min, 'min');
    try {
      const { data, error } = await supabase.from('sleep_logs').insert(log).select().single();

      if (error) {
        console.error('[sleepApi.addLog] Error:', error);
        throw error;
      }
      console.log('[sleepApi.addLog] Éxito - id:', data?.id);
      return data as SleepLog;
    } catch (err) {
      console.error('[sleepApi.addLog] Exception:', err);
      throw err;
    }
  },

  async deleteLog(id: string) {
    console.log('[sleepApi.deleteLog] Iniciando - id:', id);
    try {
      const { error } = await supabase.from('sleep_logs').delete().eq('id', id);

      if (error) {
        console.error('[sleepApi.deleteLog] Error:', error);
        throw error;
      }
      console.log('[sleepApi.deleteLog] Éxito');
    } catch (err) {
      console.error('[sleepApi.deleteLog] Exception:', err);
      throw err;
    }
  },
};
