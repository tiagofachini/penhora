import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Plus, Search, Edit, Trash2, Loader2, Users, MapPin, X, SlidersHorizontal,
} from 'lucide-react';
import { maskCPF } from '@/lib/cpf';
import { formatAddress } from '@/lib/address';

const CATEGORIES = ['Exequente', 'Executado', 'Depositário'];

const CATEGORY_STYLE = {
    'Exequente':  'bg-blue-100 text-blue-700 border-blue-200',
    'Executado':  'bg-red-100 text-red-700 border-red-200',
    'Depositário':'bg-amber-100 text-amber-700 border-amber-200',
};

/* ─────────────────────────── PersonDialog ─────────────────────────── */
const EMPTY_FORM = {
    name: '', cpf: '', category: '',
    cep: '', logradouro: '', addr_number: '',
    complement: '', neighborhood: '', city: '', state: '',
};

const PersonDialog = ({ open, onOpenChange, person, onSaved }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    const isEditing = !!person?.id;

    useEffect(() => {
        if (open) {
            setForm(person
                ? {
                    name:         person.name         || '',
                    cpf:          person.cpf          || '',
                    category:     person.category     || '',
                    cep:          person.cep          || '',
                    logradouro:   person.logradouro   || '',
                    addr_number:  person.addr_number  || '',
                    complement:   person.complement   || '',
                    neighborhood: person.neighborhood || '',
                    city:         person.city         || '',
                    state:        person.state        || '',
                }
                : EMPTY_FORM
            );
        }
    }, [open, person]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const normalized = name === 'cpf' ? maskCPF(value) : value;
        setForm(prev => ({ ...prev, [name]: normalized }));
    };

    const handleCepSearch = async () => {
        const cep = form.cep.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setCepLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (data.erro) {
                toast({ variant: 'destructive', title: 'CEP não encontrado' });
                return;
            }
            setForm(prev => ({
                ...prev,
                logradouro:   data.logradouro || '',
                neighborhood: data.bairro     || '',
                city:         data.localidade || '',
                state:        data.uf         || '',
            }));
            toast({ title: 'Endereço encontrado!' });
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao buscar CEP' });
        } finally {
            setCepLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                user_id:      user.id,
                name:         form.name.trim(),
                cpf:          form.cpf     || null,
                category:     form.category || null,
                cep:          form.cep      || null,
                logradouro:   form.logradouro   || null,
                addr_number:  form.addr_number  || null,
                complement:   form.complement   || null,
                neighborhood: form.neighborhood || null,
                city:         form.city         || null,
                state:        form.state        || null,
            };

            let error;
            if (isEditing) {
                ({ error } = await supabase.from('people').update(payload).eq('id', person.id));
            } else {
                ({ error } = await supabase.from('people').insert(payload));
            }
            if (error) throw error;

            toast({ title: `Pessoa ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!` });
            onSaved();
            onOpenChange(false);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Name + Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <Label htmlFor="p_name">Nome <span className="text-red-500">*</span></Label>
                            <Input
                                id="p_name" name="name" value={form.name}
                                onChange={handleChange} placeholder="Nome completo" required
                            />
                        </div>
                        <div>
                            <Label htmlFor="p_category">Categoria <span className="text-red-500">*</span></Label>
                            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                                <SelectTrigger id="p_category">
                                    <SelectValue placeholder="Selecione…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* CPF */}
                    <div>
                        <Label htmlFor="p_cpf">CPF <span className="text-slate-400 font-normal">(opcional)</span></Label>
                        <Input
                            id="p_cpf" name="cpf" value={form.cpf}
                            onChange={handleChange} placeholder="000.000.000-00"
                            inputMode="numeric" maxLength={14}
                        />
                    </div>

                    {/* Address */}
                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-slate-600 flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4" /> Endereço <span className="text-slate-400 font-normal">(opcional)</span>
                        </p>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                                <Label htmlFor="p_cep">CEP</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="p_cep" name="cep" value={form.cep}
                                        onChange={handleChange} placeholder="00000-000" maxLength={9}
                                    />
                                    <Button type="button" variant="outline" size="icon"
                                        onClick={handleCepSearch} disabled={cepLoading} title="Buscar CEP">
                                        {cepLoading
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="p_logradouro">Logradouro</Label>
                                <Input id="p_logradouro" name="logradouro" value={form.logradouro} onChange={handleChange} placeholder="Rua, Avenida…" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                                <Label htmlFor="p_addr_number">Número</Label>
                                <Input id="p_addr_number" name="addr_number" value={form.addr_number} onChange={handleChange} placeholder="123" />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="p_complement">Complemento</Label>
                                <Input id="p_complement" name="complement" value={form.complement} onChange={handleChange} placeholder="Apto, Bloco…" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label htmlFor="p_neighborhood">Bairro</Label>
                                <Input id="p_neighborhood" name="neighborhood" value={form.neighborhood} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="p_city">Cidade</Label>
                                <Input id="p_city" name="city" value={form.city} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="p_state">UF</Label>
                                <Input id="p_state" name="state" value={form.state} onChange={handleChange} maxLength={2} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={saving || !form.name.trim() || !form.category}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Pessoa'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/* ─────────────────────────── People (list page) ─────────────────────── */
const People = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);

    const [pendingSearch, setPendingSearch] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchPeople = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('user_id', user.id)
                .order('name');
            if (error) throw error;
            setPeople(data || []);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro ao carregar pessoas', description: err.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { fetchPeople(); }, [fetchPeople]);

    const applySearch = () => setActiveSearch(pendingSearch.trim());

    const filtered = people.filter(p => {
        if (categoryFilter && p.category !== categoryFilter) return false;
        const term = activeSearch.toLowerCase();
        if (!term) return true;
        return [p.name, p.cpf, p.city, p.neighborhood]
            .some(f => f && f.toLowerCase().includes(term));
    });

    const hasFilters = activeSearch !== '' || categoryFilter !== '';

    const clearFilters = () => {
        setPendingSearch('');
        setActiveSearch('');
        setCategoryFilter('');
    };

    const openNew = () => { setEditingPerson(null); setDialogOpen(true); };
    const openEdit = (person) => { setEditingPerson(person); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('people').delete().eq('id', deleteTarget.id);
            if (error) throw error;
            toast({ title: 'Pessoa excluída.' });
            fetchPeople();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: err.message });
        } finally {
            setDeleteTarget(null);
        }
    };

    const addressOf = (p) => {
        const obj = {
            logradouro: p.logradouro, number: p.addr_number,
            complement: p.complement, neighborhood: p.neighborhood,
            city: p.city, state: p.state, cep: p.cep,
        };
        return formatAddress(JSON.stringify(obj));
    };

    return (
        <div className="space-y-6">
            <Helmet><title>Pessoas - Penhora.app.br</title></Helmet>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pessoas</h1>
                    <p className="text-slate-500">Exequentes, executados e depositários cadastrados.</p>
                </div>
                <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nova Pessoa
                </Button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome, CPF ou cidade…"
                        className="pl-9 bg-white"
                        value={pendingSearch}
                        onChange={e => setPendingSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applySearch()}
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40 bg-white">
                            <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={applySearch} className="shrink-0">
                        <Search className="mr-2 h-4 w-4" /> Buscar
                    </Button>
                    {hasFilters && (
                        <Button variant="outline" size="icon" onClick={clearFilters} title="Limpar filtros">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            {hasFilters && !loading && (
                <p className="text-sm text-slate-500">
                    {filtered.length === 0
                        ? 'Nenhuma pessoa corresponde aos filtros.'
                        : `${filtered.length} pessoa${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
                </p>
            )}

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">
                        {hasFilters ? 'Nenhum resultado' : 'Nenhuma pessoa cadastrada'}
                    </h3>
                    <p className="text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
                        {hasFilters
                            ? 'Tente ajustar ou limpar os filtros.'
                            : 'Cadastre exequentes, executados e depositários para reutilizá-los nos processos.'}
                    </p>
                    {hasFilters
                        ? <Button variant="outline" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Limpar filtros</Button>
                        : <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Pessoa</Button>
                    }
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(p => {
                        const addr = addressOf(p);
                        const catStyle = CATEGORY_STYLE[p.category] || 'bg-slate-100 text-slate-600 border-slate-200';
                        return (
                            <Card key={p.id} className="border-slate-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{p.name}</p>
                                            {p.cpf && (
                                                <p className="text-xs font-mono text-slate-400 mt-0.5">{p.cpf}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {p.category && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${catStyle}`}>
                                                    {p.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {addr && addr !== '—' && (
                                        <div className="flex items-start gap-1.5 text-xs text-slate-500">
                                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{addr}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-1 pt-1 border-t border-slate-100">
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                            onClick={() => openEdit(p)}
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                                            onClick={() => setDeleteTarget(p)}
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit dialog */}
            <PersonDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                person={editingPerson}
                onSaved={fetchPeople}
            />

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir pessoa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deleteTarget?.name}</strong> será removida do cadastro.
                            Os processos que a referenciam não serão afetados.
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
        </div>
    );
};

export default People;
