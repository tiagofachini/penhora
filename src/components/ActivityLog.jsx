import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ScrollText, History } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ActivityLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch logs where current user is the owner OR the actor
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('owner_id', user.id) 
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    
    // Subscribe to new logs
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `owner_id=eq.${user?.id}`
        },
        (payload) => {
          setLogs((current) => [payload.new, ...current].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <Card>
      <CardHeader><CardTitle>Últimas atividades</CardTitle></CardHeader>
      <CardContent className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </CardContent>
    </Card>
  );

  return (
    <Card className="h-full max-h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-slate-500" />
            Últimas atividades
        </CardTitle>
        <CardDescription>
          Registro recente de ações na sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <History className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">Nenhuma atividade registrada.</p>
          </div>
        ) : (
          <div className="space-y-1 font-mono text-xs md:text-sm">
            {logs.map((log) => {
              const email = log.details?.email || user?.email || 'Usuário';
              const date = formatDate(log.created_at);
              const info = log.details?.info;
              
              return (
                <div key={log.id} className="py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded transition-colors break-words">
                  <span className="text-slate-500">[{date}]</span>
                  <span className="text-slate-400 mx-1">-</span>
                  <span className="font-semibold text-blue-600">[{email}]</span>
                  <span className="text-slate-800 ml-1">
                    [{log.action}{info ? `: ${info}` : ''}]
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;