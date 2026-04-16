import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Gift, Mail, Trash2, RefreshCw, CheckCircle2, Clock, XCircle, Send, Loader2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_STYLES = {
  invited:    { label: 'Aguardando',  badge: 'bg-blue-100 text-blue-700',   Icon: Clock },
  registered: { label: 'Cadastrado',  badge: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
  expired:    { label: 'Expirado',    badge: 'bg-slate-100 text-slate-500', Icon: XCircle },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const ReferralsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = data || [];
      // Expire overdue invites
      const now = new Date();
      const toExpire = rows.filter(r => r.status === 'invited' && new Date(r.expires_at) < now);
      if (toExpire.length) {
        await supabase.from('referrals')
          .update({ status: 'expired' })
          .in('id', toExpire.map(r => r.id));
        toExpire.forEach(r => { r.status = 'expired'; });
      }
      setReferrals(rows);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao carregar indicações', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const handleInvite = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-referral-invite', {
        body: { invitee_email: trimmed },
      });
      if (error) throw new Error(error.message);
      toast({ title: 'Convite enviado!', description: `${trimmed} receberá um e-mail com o link de cadastro.` });
      setEmail('');
      fetchReferrals();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao enviar convite', description: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (referral) => {
    setResendingId(referral.id);
    try {
      const { error } = await supabase.functions.invoke('send-referral-invite', {
        body: { invitee_email: referral.invitee_email, resend: true, referral_id: referral.id },
      });
      if (error) throw new Error(error.message);
      toast({ title: 'Convite reenviado!', description: `${referral.invitee_email} receberá um novo link.` });
      fetchReferrals();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao reenviar', description: err.message });
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('referrals').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: 'Convite excluído.' });
      setReferrals(prev => prev.filter(r => r.id !== deleteTarget.id));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: err.message });
    } finally {
      setDeleteTarget(null);
    }
  };

  const stats = {
    invited:    referrals.filter(r => r.status === 'invited').length,
    registered: referrals.filter(r => r.status === 'registered').length,
    expired:    referrals.filter(r => r.status === 'expired').length,
  };

  return (
    <>
      <Helmet><title>Indicações - Penhora.app.br</title></Helmet>

      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Gift className="h-7 w-7 text-purple-500" />
            Indicações
          </h1>
          <p className="text-slate-500 mt-1">
            Convide colegas para conhecer o Penhora.app.br. Cada convite enviado é acompanhado aqui.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'invited',    label: 'Aguardando', count: stats.invited,    Icon: Clock,        color: 'text-blue-400',  border: 'border-blue-100' },
            { key: 'registered', label: 'Cadastrados', count: stats.registered, Icon: CheckCircle2, color: 'text-green-500', border: 'border-green-100' },
            { key: 'expired',    label: 'Expirados',   count: stats.expired,    Icon: XCircle,      color: 'text-slate-400', border: 'border-slate-100' },
          ].map(({ key, label, count, Icon, color, border }) => (
            <Card key={key} className={border}>
              <CardContent className="pt-5 pb-4 flex flex-col items-center gap-1">
                <Icon className={`h-6 w-6 mb-1 ${color}`} />
                <span className="text-2xl font-bold text-slate-800">{count}</span>
                <span className="text-xs text-slate-500 font-medium">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invite form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convidar por E-mail</CardTitle>
            <CardDescription>
              O convidado receberá um link para criar a conta. O convite expira em 30 dias sem ação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplo.com.br"
                  className="pl-9"
                  required
                  disabled={sending}
                />
              </div>
              <Button
                type="submit"
                disabled={sending || !email.trim()}
                className="bg-purple-600 hover:bg-purple-700 shrink-0"
              >
                {sending
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <Send className="h-4 w-4 mr-2" />}
                {sending ? 'Enviando…' : 'Convidar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400 h-6 w-6" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Gift className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Você ainda não fez nenhuma indicação.</p>
            <p className="text-slate-400 text-xs mt-1">Use o formulário acima para convidar alguém.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {referrals.map(r => {
                  const style = STATUS_STYLES[r.status] || STATUS_STYLES.invited;
                  const { Icon } = style;
                  return (
                    <div key={r.id} className="flex items-center gap-4 px-4 py-3">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.invitee_email}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-slate-400">
                          <span>Convidado em {fmt(r.invited_at)}</span>
                          {r.registered_at && (
                            <span className="text-green-600 font-medium">
                              Cadastrado em {fmt(r.registered_at)}
                            </span>
                          )}
                          {r.status === 'invited' && (
                            <span>Expira em {fmt(r.expires_at)}</span>
                          )}
                          {r.status === 'expired' && (
                            <span>Expirou em {fmt(r.expires_at)}</span>
                          )}
                        </div>
                      </div>

                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                        <Icon className="h-3 w-3" />
                        {style.label}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {r.status === 'expired' && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Reconvidar"
                            onClick={() => handleResend(r)}
                            disabled={!!resendingId}
                          >
                            {resendingId === r.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RefreshCw className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {r.status !== 'registered' && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir convite"
                            onClick={() => setDeleteTarget(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite para <strong>{deleteTarget?.invitee_email}</strong> será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReferralsPage;
