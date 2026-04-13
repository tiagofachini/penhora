import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus, Search, FileText, MapPin,
  ArrowRight, X, SlidersHorizontal,
} from 'lucide-react';
import { formatAddress } from '@/lib/address';

const PROCESS_PHASES = [
  'Instauração',
  'Citação',
  'Penhora',
  'Defesa',
  'Expropriação',
  'Satisfação do crédito',
  'Extinção',
];

const Processes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);

    // pendingSearch: what the user is typing; activeSearch: applied on Buscar/Enter
    const [pendingSearch, setPendingSearch] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [phaseFilter, setPhaseFilter] = useState('');

    const fetchProcesses = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);

            // 1. Fetch processes
            const { data: procData, error: procError } = await supabase
                .from('processes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (procError) throw procError;

            const procs = procData || [];
            if (procs.length === 0) { setProcesses([]); return; }

            const ids = procs.map(p => p.id);

            // 2. Fetch seized_items separately (avoids RLS join issues)
            const { data: itemsData } = await supabase
                .from('seized_items')
                .select('process_id, item_description, brand, initial_valuation, characteristics')
                .in('process_id', ids);

            // 3. Fetch diligences separately
            const { data: dilsData } = await supabase
                .from('diligences')
                .select('process_id, description')
                .in('process_id', ids);

            // Merge by process_id
            const itemsMap = {};
            const dilsMap = {};
            (itemsData || []).forEach(item => {
                (itemsMap[item.process_id] ||= []).push(item);
            });
            (dilsData || []).forEach(d => {
                (dilsMap[d.process_id] ||= []).push(d);
            });

            setProcesses(procs.map(p => ({
                ...p,
                seized_items: itemsMap[p.id] || [],
                diligences: dilsMap[p.id] || [],
            })));
        } catch (error) {
            console.error('Error fetching processes:', error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as penhoras.' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

    const applySearch = () => setActiveSearch(pendingSearch.trim());

    const filteredProcesses = useMemo(() => {
        return processes.filter(proc => {
            if (phaseFilter && proc.current_phase !== phaseFilter) return false;

            const term = activeSearch.toLowerCase();
            if (!term) return true;

            const fields = [
                proc.process_number,
                proc.current_phase,
                proc.parties_info?.exequente,
                proc.parties_info?.executado,
                proc.parties_info?.depositary,
                formatAddress(proc.execution_location),
                formatAddress(proc.parties_info?.deposit_location),
                ...(proc.seized_items || []).flatMap(item => [
                    item.item_description,
                    item.brand,
                    item.characteristics,
                    item.initial_valuation != null ? String(item.initial_valuation) : null,
                ]),
                ...(proc.diligences || []).map(d => d.description),
            ];

            return fields.some(f => f && f.toLowerCase().includes(term));
        });
    }, [processes, activeSearch, phaseFilter]);

    const hasFilters = activeSearch !== '' || phaseFilter !== '';

    const clearFilters = () => {
        setPendingSearch('');
        setActiveSearch('');
        setPhaseFilter('');
    };

    return (
        <div className="space-y-6">
            <Helmet><title>Penhoras - Penhora.app.br</title></Helmet>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Minhas Penhoras</h1>
                    <p className="text-slate-500">Gerencie todos os seus processos de execução.</p>
                </div>
                <Button onClick={() => navigate('/processes/new')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Penhora
                </Button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por processo, partes, endereço, depositário, bem, marca, valor ou diligência…"
                        className="pl-9 bg-white"
                        value={pendingSearch}
                        onChange={(e) => setPendingSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                    />
                </div>

                <div className="flex gap-2 shrink-0">
                    <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                        <SelectTrigger className="w-44 bg-white">
                            <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                            <SelectValue placeholder="Fase" />
                        </SelectTrigger>
                        <SelectContent>
                            {PROCESS_PHASES.map(phase => (
                                <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={applySearch} className="shrink-0">
                        <Search className="mr-2 h-4 w-4" /> Buscar
                    </Button>

                    {hasFilters && (
                        <Button variant="outline" size="icon" onClick={clearFilters} title="Limpar filtros" className="shrink-0">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Results indicator */}
            {hasFilters && !loading && (
                <p className="text-sm text-slate-500">
                    {filteredProcesses.length === 0
                        ? 'Nenhuma penhora corresponde aos filtros aplicados.'
                        : `${filteredProcesses.length} penhora${filteredProcesses.length !== 1 ? 's' : ''} encontrada${filteredProcesses.length !== 1 ? 's' : ''}`
                    }
                </p>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />)}
                </div>
            ) : filteredProcesses.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="mx-auto h-12 w-12 text-slate-300 mb-4">
                        <FileText className="h-full w-full" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Nenhuma penhora encontrada</h3>
                    <p className="text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
                        {hasFilters ? 'Tente ajustar ou limpar os filtros.' : 'Comece criando seu primeiro auto de penhora digital.'}
                    </p>
                    {hasFilters ? (
                        <Button onClick={clearFilters} variant="outline">
                            <X className="mr-2 h-4 w-4" /> Limpar filtros
                        </Button>
                    ) : (
                        <Button onClick={() => navigate('/processes/new')} variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Criar Penhora
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProcesses.map(proc => (
                        <Card key={proc.id} className="hover:shadow-md transition-shadow cursor-pointer group border-slate-200" onClick={() => navigate(`/processes/${proc.id}`)}>
                            <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {proc.current_phase && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                {proc.current_phase}
                                            </span>
                                        )}
                                        <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 rounded border">
                                            {new Date(proc.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mt-3 group-hover:text-blue-700 transition-colors">
                                    {proc.process_number || "Sem Número"}
                                </h3>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Exequente:</span>
                                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{proc.parties_info?.exequente || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Executado:</span>
                                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{proc.parties_info?.executado || "-"}</span>
                                    </div>
                                </div>

                                {proc.execution_location && (
                                    <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{formatAddress(proc.execution_location)}</span>
                                    </div>
                                )}

                                <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                                    <span className="text-xs font-medium text-slate-500">
                                        {(proc.seized_items || []).length === 1
                                            ? '1 bem registrado'
                                            : `${(proc.seized_items || []).length} bens registrados`}
                                    </span>
                                    <div className="text-blue-600 flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        Abrir <ArrowRight className="ml-1 h-3 w-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Processes;
