import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, CreditCard, Loader2, CheckCircle2,
  Search, Filter, Edit, RefreshCw, Copy, Check,
  Phone, MapPin, Hash, ShieldX, ShieldCheck,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Navigate } from 'react-router-dom';

const BR_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
];

const CopyId = ({ id }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title={id}
      className="flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-800 transition-colors group"
    >
      <span>{id.slice(0, 8)}…</span>
      {copied
        ? <Check className="h-3 w-3 text-green-500" />
        : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
};

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const adminEmail = 'emaildogago@gmail.com';

  const [stats, setStats] = useState({ totalUsers: 0, payingUsers: 0, totalProcesses: 0 });
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');

  // Block/unblock
  const [blockTarget, setBlockTarget] = useState(null); // { user, action: 'block'|'unblock' }
  const [blocking, setBlocking] = useState(false);

  // Edit dialog
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    plan_type: 'starter', status: 'active',
    seizure_limit: 0, item_limit: 0, monthly_value: 0,
  });
  const [saving, setSaving] = useState(false);
  const dialogContentRef = useRef(null);

  const fetchData = useCallback(async (showFullLoading = true) => {
    if (!user?.email || user.email.toLowerCase() !== adminEmail) {
      setLoading(false);
      return;
    }
    if (showFullLoading) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [usersCount, processesCount, subsCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('processes').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'trialing']),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        payingUsers: subsCount.count || 0,
        totalProcesses: processesCount.count || 0,
      });

      const [{ data, error }, { data: statsData }] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id, name, email, company_name, phone, company_address, is_active, created_at,
            subscriptions ( id, plan_type, status, seizure_limit, item_limit, monthly_value )
          `)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_admin_user_stats'),
      ]);

      if (error) throw error;

      const statsMap = Object.fromEntries((statsData ?? []).map(s => [s.user_id, s]));

      setUsersList(data.map(u => ({
        ...u,
        subscription: u.subscriptions?.[0] ?? null,
        state: u.company_address?.state ?? null,
        is_active: u.is_active !== false,
        process_count: Number(statsMap[u.id]?.process_count ?? 0),
        item_count: Number(statsMap[u.id]?.item_count ?? 0),
        total_valuation: Number(statsMap[u.id]?.total_valuation ?? 0),
      })));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      if (showFullLoading) setLoading(false);
      else setIsRefreshing(false);
    }
  }, [toast, user, adminEmail]);

  useEffect(() => {
    if (user?.email?.toLowerCase() === adminEmail) fetchData(true);
  }, [fetchData, user, adminEmail]);

  const handleEditClick = (u) => {
    const sub = u.subscription || {};
    setEditingUser(u);
    setEditForm({
      plan_type: sub.plan_type || 'starter',
      status: sub.status || 'inactive',
      seizure_limit: sub.seizure_limit || 5,
      item_limit: sub.item_limit || 100,
      monthly_value: sub.monthly_value || 0,
    });
  };

  const handleSavePlan = async () => {
    if (!editingUser) return;
    setSaving(true);
    const targetId = editingUser.id;
    try {
      if (isNaN(parseInt(editForm.seizure_limit)) || isNaN(parseInt(editForm.item_limit)))
        throw new Error('Os limites devem ser números válidos.');

      const payload = {
        user_id: targetId,
        plan_type: editForm.plan_type,
        status: editForm.status,
        seizure_limit: parseInt(editForm.seizure_limit),
        item_limit: parseInt(editForm.item_limit),
        monthly_value: parseFloat(editForm.monthly_value) || 0,
        plan_config: { seizures: parseInt(editForm.seizure_limit), items: parseInt(editForm.item_limit) },
      };

      const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', targetId).maybeSingle();
      const { data: result, error: saveError } = existing
        ? await supabase.from('subscriptions').update(payload).eq('id', existing.id).select().single()
        : await supabase.from('subscriptions').insert([payload]).select().single();

      if (saveError) throw saveError;
      if (!result) throw new Error('Não foi possível confirmar o salvamento.');

      setEditingUser(null);
      toast({ title: 'Sucesso', description: 'Plano atualizado!' });
      setTimeout(async () => {
        setUsersList(prev => prev.map(u => u.id === targetId ? { ...u, subscription: result } : u));
        await fetchData(false);
      }, 150);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!blockTarget) return;
    setBlocking(true);
    const { user: targetUser, action } = blockTarget;
    const newActive = action === 'unblock';
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: newActive })
        .eq('id', targetUser.id);
      if (error) throw error;
      setUsersList(prev => prev.map(u =>
        u.id === targetUser.id ? { ...u, is_active: newActive } : u
      ));
      toast({ title: newActive ? 'Usuário ativado' : 'Usuário bloqueado', description: targetUser.email });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setBlocking(false);
      setBlockTarget(null);
    }
  };

  // Derived: states present in the data
  const availableStates = [...new Set(usersList.map(u => u.state).filter(Boolean))].sort();

  const filteredUsers = usersList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.id?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (u.subscription?.status ?? 'none') === statusFilter;
    const matchState = stateFilter === 'all' || u.state === stateFilter;
    return matchSearch && matchStatus && matchState;
  });

  const statusBadge = (status) => {
    const map = {
      active:               <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>,
      trialing:             <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Teste</Badge>,
      pending_verification: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>,
      canceled:             <Badge variant="destructive">Cancelado</Badge>,
    };
    return map[status] ?? <Badge variant="outline">Sem Plano</Badge>;
  };

  if (user && user.email.toLowerCase() !== adminEmail) return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <Helmet><title>Admin | Penhora.app.br</title></Helmet>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500">Base de usuários ativos da plataforma.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Super Admin
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-700">{stats.payingUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos</CardTitle>
            <Hash className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalProcesses}</div></CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <CardTitle>
                Usuários
                {filteredUsers.length !== usersList.length && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    {filteredUsers.length} de {usersList.length}
                  </span>
                )}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={() => fetchData(false)} title="Recarregar">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nome, email, WhatsApp ou ID…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="trialing">Em Teste</SelectItem>
                  <SelectItem value="pending_verification">Pendente</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                  <SelectItem value="none">Sem Plano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-40">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {availableStates.length > 0
                    ? availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                    : BR_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-b-lg border-t overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />WhatsApp</span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Estado</span>
                  </TableHead>
                  <TableHead className="text-right">Processos</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Valoração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.map(u => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-slate-900 truncate">{u.name || '—'}</span>
                        <span className="text-xs text-slate-500 truncate">{u.email}</span>
                        {u.company_name && (
                          <span className="text-xs text-slate-400 truncate">{u.company_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><CopyId id={u.id} /></TableCell>
                    <TableCell>
                      {u.phone
                        ? <span className="text-sm text-slate-700">{u.phone}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      {u.state
                        ? <Badge variant="secondary" className="font-medium">{u.state}</Badge>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {u.process_count || <span className="text-slate-300">0</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {u.item_count || <span className="text-slate-300">0</span>}
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">
                      {u.total_valuation > 0
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(u.total_valuation)
                        : <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {statusBadge(u.subscription?.status)}
                        {!u.is_active && (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 w-fit">Bloqueado</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize text-slate-600">
                        {u.subscription?.plan_type || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(u)} title="Editar plano">
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        {u.email !== adminEmail && (
                          u.is_active
                            ? (
                              <Button variant="ghost" size="sm"
                                title="Bloquear usuário"
                                onClick={() => setBlockTarget({ user: u, action: 'block' })}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <ShieldX className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm"
                                title="Desbloquear usuário"
                                onClick={() => setBlockTarget({ user: u, action: 'unblock' })}
                                className="text-red-400 hover:text-green-600 hover:bg-green-50"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Block / Unblock Confirmation */}
      <AlertDialog open={!!blockTarget} onOpenChange={open => !open && setBlockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.action === 'block' ? 'Bloquear usuário?' : 'Desbloquear usuário?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget?.action === 'block'
                ? <>O usuário <strong>{blockTarget?.user.email}</strong> será bloqueado e não conseguirá mais acessar o sistema.</>
                : <>O usuário <strong>{blockTarget?.user.email}</strong> terá o acesso restaurado.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleBlock}
              disabled={blocking}
              className={blockTarget?.action === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {blocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {blockTarget?.action === 'block' ? 'Bloquear' : 'Desbloquear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
        <DialogContent ref={dialogContentRef} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Plano</DialogTitle>
            <DialogDescription>
              Editando assinatura de{' '}
              <span className="font-bold text-slate-800">{editingUser?.name || editingUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Plano</Label>
                <Select value={editForm.plan_type} onValueChange={v => setEditForm(p => ({ ...p, plan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trialing">Em Teste</SelectItem>
                    <SelectItem value="pending_verification">Pendente</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite de Penhoras</Label>
                <Input type="number" value={editForm.seizure_limit}
                  onChange={e => setEditForm(p => ({ ...p, seizure_limit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Limite de Itens</Label>
                <Input type="number" value={editForm.item_limit}
                  onChange={e => setEditForm(p => ({ ...p, item_limit: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input type="number" step="0.01" value={editForm.monthly_value}
                onChange={e => setEditForm(p => ({ ...p, monthly_value: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
