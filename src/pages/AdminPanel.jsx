import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, CreditCard, Loader2, CheckCircle2, 
  Search, Filter, Edit, RefreshCw
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Navigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, payingUsers: 0, totalProcesses: 0, totalItems: 0 });
  
  // Users List Management
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Edit Dialog State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    plan_type: 'starter',
    status: 'active',
    seizure_limit: 0,
    item_limit: 0,
    monthly_value: 0
  });
  const [saving, setSaving] = useState(false);
  
  // Ref to help manage focus/aria issues
  const dialogContentRef = useRef(null);

  const adminEmail = 'emaildogago@gmail.com';

  const fetchData = useCallback(async (showFullLoading = true) => {
    if (!user?.email || user.email.toLowerCase() !== adminEmail) {
      setLoading(false);
      return;
    }

    if (showFullLoading) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Fetch Stats
      const [usersCount, processesCount, itemsCount, subsCount] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('processes').select('*', { count: 'exact', head: true }),
          supabase.from('seized_items').select('id', { count: 'exact', head: true }),
          supabase.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'trialing'])
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        payingUsers: subsCount.count || 0,
        totalProcesses: processesCount.count || 0,
        totalItems: itemsCount.count || 0
      });

      // Fetch Detailed User List joined with Subscriptions
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, company_name, phone, created_at,
          subscriptions (
            id, plan_type, status, seizure_limit, item_limit, monthly_value
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten data for easier consumption
      const formattedUsers = data.map(u => ({
         ...u,
         subscription: u.subscriptions && u.subscriptions.length > 0 ? u.subscriptions[0] : null
      }));

      setUsersList(formattedUsers);

    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      if (showFullLoading) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [toast, user, adminEmail]);

  useEffect(() => {
    if (user?.email?.toLowerCase() === adminEmail) {
      fetchData(true);
    }
  }, [fetchData, user, adminEmail]);

  // Actions
  const handleEditClick = (userObj) => {
    const sub = userObj.subscription || {};
    setEditingUser(userObj);
    setEditForm({
      plan_type: sub.plan_type || 'starter',
      status: sub.status || 'inactive',
      seizure_limit: sub.seizure_limit || 5,
      item_limit: sub.item_limit || 100,
      monthly_value: sub.monthly_value || 0
    });
  };

  const handleSavePlan = async () => {
    if (!editingUser) return;
    setSaving(true);
    
    // Capture these values for use in the timeout callback after modal closes
    const targetUserId = editingUser.id;
    
    try {
        // Validate inputs
        if (isNaN(parseInt(editForm.seizure_limit)) || isNaN(parseInt(editForm.item_limit))) {
            throw new Error("Os limites devem ser números válidos.");
        }

        const seizureLimit = parseInt(editForm.seizure_limit);
        const itemLimit = parseInt(editForm.item_limit);
        const monthlyValue = parseFloat(editForm.monthly_value) || 0;

        // Prepare base payload
        const payload = {
            user_id: targetUserId,
            plan_type: editForm.plan_type,
            status: editForm.status,
            seizure_limit: seizureLimit,
            item_limit: itemLimit,
            monthly_value: monthlyValue,
            plan_config: { seizures: seizureLimit, items: itemLimit }
        };

        console.log("Saving plan payload:", payload);

        // Check if subscription exists first
        const { data: existingSub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', targetUserId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let resultData = null;
        let saveError = null;
        
        if (existingSub) {
            console.log("Updating existing subscription ID:", existingSub.id);
            // Update existing
            const { data, error } = await supabase
                .from('subscriptions')
                .update(payload)
                .eq('id', existingSub.id)
                .select()
                .single();
            saveError = error;
            resultData = data;
        } else {
            console.log("Creating new subscription for user:", targetUserId);
            // Insert new
            const { data, error } = await supabase
                .from('subscriptions')
                .insert([payload])
                .select()
                .single();
            saveError = error;
            resultData = data;
        }

        if (saveError) {
            console.error("Supabase Save Error:", saveError);
            throw saveError;
        }

        if (!resultData) {
            throw new Error("Não foi possível confirmar o salvamento dos dados.");
        }

        console.log("Save successful. Result:", resultData);

        // -------------------------------------------------------------------------
        // CRITICAL FIX: Close modal FIRST before updating list data.
        // This prevents "aria-hidden" conflicts and focus loss errors where the
        // trigger button might be destroyed/re-rendered while modal is still open.
        // -------------------------------------------------------------------------
        setEditingUser(null);
        toast({ title: "Sucesso", description: "Plano atualizado com sucesso!" });

        // Update data after a brief delay to allow modal cleanup and focus return
        setTimeout(async () => {
             // Optimistically update local state immediately
             setUsersList(prevList => prevList.map(u => {
                if (u.id === targetUserId) {
                    return { ...u, subscription: resultData };
                }
                return u;
            }));

            // Force refetch to ensure consistency
            await fetchData(false); 
        }, 150);

    } catch (error) {
        console.error("Error saving plan:", error);
        toast({ 
            variant: 'destructive', 
            title: "Erro ao salvar", 
            description: error.message || "Ocorreu um erro ao atualizar o plano." 
        });
    } finally {
        setSaving(false);
    }
  };

  // Filtering
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const status = u.subscription?.status || 'none';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>;
      case 'trialing': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Teste</Badge>;
      case 'pending_verification': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'canceled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">Sem Plano</Badge>;
    }
  };

  if (user && user.email.toLowerCase() !== adminEmail) return <Navigate to="/dashboard" replace />;
  
  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 space-y-8 pb-20">
      <Helmet><title>Admin | Penhora.app</title></Helmet>
      
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Gestão de Planos</h1>
           <p className="text-slate-500">Gerencie usuários, assinaturas e limites.</p>
        </div>
        <div className="flex items-center gap-3">
            {isRefreshing && <span className="text-sm text-slate-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Atualizando...</span>}
            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                <CheckCircle2 className="w-3 h-3 mr-1"/> Super Admin
            </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Base de Usuários</CardTitle>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Buscar por nome ou email..." 
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="pending_verification">Pendente</SelectItem>
                            <SelectItem value="trialing">Em Teste</SelectItem>
                            <SelectItem value="none">Sem Plano</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => fetchData(false)} title="Recarregar Lista">
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Usuário</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Limites (Penhoras/Itens)</TableHead>
                            <TableHead className="text-right">Valor Mensal</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhum usuário encontrado.</TableCell></TableRow>
                        ) : (
                            filteredUsers.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{u.name || 'Sem nome'}</span>
                                            <span className="text-xs text-slate-500">{u.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{u.subscription?.plan_type || '-'}</TableCell>
                                    <TableCell>{getStatusBadge(u.subscription?.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {u.subscription ? (
                                            <div className="flex justify-end gap-1">
                                                <Badge variant="secondary" className="font-mono">{u.subscription.seizure_limit}</Badge>
                                                <span className="text-slate-300">/</span>
                                                <Badge variant="secondary" className="font-mono">{u.subscription.item_limit}</Badge>
                                            </div>
                                        ) : <span className="text-slate-400">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {u.subscription?.monthly_value 
                                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(u.subscription.monthly_value)
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(u)}>
                                            <Edit className="h-4 w-4 text-blue-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent ref={dialogContentRef} className="sm:max-w-[500px]" aria-hidden={false}>
            <DialogHeader>
                <DialogTitle>Gerenciar Plano</DialogTitle>
                <DialogDescription>
                    Editando assinatura de <span className="font-bold text-slate-800">{editingUser?.name || editingUser?.email}</span>
                </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo de Plano</Label>
                        <Select 
                            value={editForm.plan_type} 
                            onValueChange={(val) => setEditForm(prev => ({...prev, plan_type: val}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                            value={editForm.status} 
                            onValueChange={(val) => setEditForm(prev => ({...prev, status: val}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="pending_verification">Pendente (Verificação)</SelectItem>
                                <SelectItem value="trialing">Em Teste</SelectItem>
                                <SelectItem value="canceled">Cancelado</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Limite de Penhoras</Label>
                        <Input 
                            type="number" 
                            value={editForm.seizure_limit} 
                            onChange={(e) => setEditForm(prev => ({...prev, seizure_limit: e.target.value}))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Limite de Itens</Label>
                        <Input 
                            type="number" 
                            value={editForm.item_limit} 
                            onChange={(e) => setEditForm(prev => ({...prev, item_limit: e.target.value}))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Valor Mensal (R$)</Label>
                    <Input 
                        type="number" 
                        step="0.01"
                        value={editForm.monthly_value} 
                        onChange={(e) => setEditForm(prev => ({...prev, monthly_value: e.target.value}))}
                    />
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