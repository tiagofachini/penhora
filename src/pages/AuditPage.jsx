import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const ITEMS_PER_PAGE = 20;

const AuditPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        seizureRef: '', // details->>info
        action: 'all',
        userId: 'all'
    });
    
    // User Autocomplete State
    const [userSearch, setUserSearch] = useState('');
    const [userOptions, setUserOptions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Action Options (Derived or Static)
    const actionTypes = [
        "Login", "Logout", 
        "cadastrar nova penhora", "editar penhora", "remover penhora",
        "incluir item em penhora", "editar item em penhora", "remover item em penhora",
        "alteração de plano", "alteração da conta"
    ];

    // Fetch Users for Autocomplete
    useEffect(() => {
        const searchUsers = async () => {
            if (userSearch.length < 2) {
                setUserOptions([]);
                return;
            }
            const { data } = await supabase
                .from('users')
                .select('id, name, email')
                .or(`name.ilike.%${userSearch}%,email.ilike.%${userSearch}%`)
                .limit(5);
            setUserOptions(data || []);
        };
        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('activity_logs')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (filters.startDate) query = query.gte('created_at', new Date(filters.startDate).toISOString());
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                query = query.lte('created_at', end.toISOString());
            }
            if (filters.action && filters.action !== 'all') {
                query = query.eq('action', filters.action);
            }
            if (filters.seizureRef) {
                // Search within JSONB details -> info
                // Note: Arrow operator in ilike requires casting or specific syntax depending on postgrest version
                // Simple filter:
                query = query.ilike('details->>info', `%${filters.seizureRef}%`);
            }
            if (selectedUser) {
                query = query.eq('user_id', selectedUser.id);
            }

            // If not admin, restrict to own logs or owner_id logs
            // Assuming "Auditoria" is for admins or for viewing one's own detailed history?
            // The prompt implies a general audit page. If regular user, they only see their own.
            // Admin check is done via RLS usually, but let's be safe.
            // RLS "Owners can view logs for their account" is already in place.
            
            // Pagination & Sorting
            const from = page * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;
            
            query = query
                .order('created_at', { ascending: false })
                .range(from, to);

            const { data, count, error } = await query;

            if (error) throw error;
            
            setLogs(data || []);
            setTotalCount(count || 0);

        } catch (error) {
            console.error("Error fetching logs:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar registros de auditoria.' });
        } finally {
            setLoading(false);
        }
    }, [filters, page, selectedUser, toast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            seizureRef: '',
            action: 'all',
            userId: 'all'
        });
        setSelectedUser(null);
        setUserSearch('');
        setPage(0);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <Helmet><title>Auditoria - Penhora.app</title></Helmet>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-blue-600" />
                        Auditoria do Sistema
                    </h1>
                    <p className="text-slate-500">Registre e monitore todas as atividades e operações realizadas.</p>
                </div>
                <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filtros Avançados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>Data Inicial</Label>
                            <Input 
                                type="date" 
                                value={filters.startDate} 
                                onChange={(e) => handleFilterChange('startDate', e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Final</Label>
                            <Input 
                                type="date" 
                                value={filters.endDate} 
                                onChange={(e) => handleFilterChange('endDate', e.target.value)} 
                            />
                        </div>

                        {/* User Autocomplete */}
                        <div className="space-y-2">
                            <Label>Usuário</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {selectedUser ? selectedUser.name || selectedUser.email : "Selecionar usuário..."}
                                        <Search className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[250px]" align="start">
                                    <div className="p-2">
                                        <Input 
                                            placeholder="Buscar nome ou email..." 
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="mb-2 h-8"
                                        />
                                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                                            {userOptions.length === 0 && <div className="text-xs text-center py-2 text-muted-foreground">Nenhum usuário encontrado</div>}
                                            {userOptions.map(u => (
                                                <div 
                                                    key={u.id}
                                                    className="text-sm px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer"
                                                    onClick={() => { setSelectedUser(u); handleFilterChange('userId', u.id); }}
                                                >
                                                    <div className="font-medium">{u.name}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Action Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Ação</Label>
                            <Select value={filters.action} onValueChange={(val) => handleFilterChange('action', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {actionTypes.map(action => (
                                        <SelectItem key={action} value={action}>{action}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                         {/* Seizure Ref */}
                         <div className="space-y-2 lg:col-span-2">
                            <Label>Ref. Penhora / ID</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input 
                                    placeholder="Número do processo ou descrição..." 
                                    value={filters.seizureRef}
                                    onChange={(e) => handleFilterChange('seizureRef', e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        
                         <div className="space-y-2 flex items-end">
                            <Button variant="ghost" onClick={clearFilters} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                                Limpar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[180px]">Data/Hora</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Detalhes / Ref.</TableHead>
                                <TableHead className="w-[140px]">IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-32 bg-slate-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-slate-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-40 bg-slate-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-full bg-slate-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-20 bg-slate-100 animate-pulse rounded" /></TableCell>
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs text-slate-600">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-800">
                                                    {log.details?.email || 'Sistema'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50 font-normal">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">
                                                {log.details?.info || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {log.ip_address || 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                    Mostrando {logs.length > 0 ? page * ITEMS_PER_PAGE + 1 : 0} a {Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} de {totalCount} registros
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * ITEMS_PER_PAGE >= totalCount || loading}
                    >
                        Próxima <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;