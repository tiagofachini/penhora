import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, AlertTriangle } from 'lucide-react';

const ManualEntryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initial data might come from CapturePhoto or ScanBarcode pages
  const initialData = location.state || {};

  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [diligences, setDiligences] = useState([]);
  
  const [formData, setFormData] = useState({
    item_description: initialData.item_description || '',
    brand: initialData.brand || '',
    quantity: initialData.quantity || '1',
    characteristics: initialData.characteristics || '',
    condition: initialData.condition || 'Bom',
    initial_valuation: initialData.initial_valuation || '',
    display_valuation: '',
    photo_url: initialData.photo_url || '',
    barcode: initialData.barcode || '',
    process_id: initialData.process_id || '',
    diligence_id: initialData.diligence_id || '',
  });

  useEffect(() => {
    const fetchProcesses = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('processes')
          .select('id, process_number')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setProcesses(data || []);
      } catch (error) {
        console.error('Error fetching processes:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar processos.' });
      }
    };
    fetchProcesses();
  }, [user, toast]);

  useEffect(() => {
    const fetchDiligences = async () => {
      if (!formData.process_id) {
        setDiligences([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('diligences')
          .select('*')
          .eq('process_id', formData.process_id)
          .order('date', { ascending: false });
        
        if (error) throw error;
        setDiligences(data || []);

        // Auto-select closest diligence if not already set
        if (!formData.diligence_id && data && data.length > 0) {
            const now = new Date();
            const closest = data.reduce((prev, curr) => {
                const prevDate = prev.date ? new Date(prev.date) : new Date(0);
                const currDate = curr.date ? new Date(curr.date) : new Date(0);
                return Math.abs(currDate - now) < Math.abs(prevDate - now) ? curr : prev;
            });
            setFormData(prev => ({ ...prev, diligence_id: closest.id }));
        }
      } catch (error) {
        console.error("Error fetching diligences:", error);
      }
    };

    fetchDiligences();
  }, [formData.process_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    const numericValue = parseFloat(value) / 100;
    if (isNaN(numericValue)) {
      setFormData(prev => ({ ...prev, initial_valuation: '', display_valuation: '' }));
      return;
    }
    setFormData(prev => ({ 
        ...prev, 
        initial_valuation: numericValue, 
        display_valuation: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.process_id || !formData.diligence_id) {
        toast({ variant: 'destructive', title: "Campos obrigatórios", description: "Selecione um processo e uma diligência." });
        return;
    }

    setLoading(true);
    try {
      const itemData = {
        item_description: formData.item_description,
        brand: formData.brand,
        quantity: parseFloat(formData.quantity),
        characteristics: formData.characteristics,
        condition: formData.condition,
        initial_valuation: formData.initial_valuation ? parseFloat(formData.initial_valuation) : null,
        photo_url: formData.photo_url,
        barcode: formData.barcode,
        process_id: formData.process_id,
        diligence_id: formData.diligence_id
      };

      const { error } = await supabase.from('seized_items').insert(itemData);
      if (error) throw error;

      toast({ title: "Sucesso", description: "Item adicionado com sucesso!" });
      navigate(`/processes/${formData.process_id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Item</CardTitle>
          <CardDescription>Preencha os detalhes do bem apreendido.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Context Selection */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                <div className="space-y-2">
                    <Label>Processo <span className="text-red-500">*</span></Label>
                    <Select 
                        value={formData.process_id} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, process_id: val, diligence_id: '' }))}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecione o processo" />
                        </SelectTrigger>
                        <SelectContent>
                            {processes.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.process_number}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {formData.process_id && (
                    <div className="space-y-2">
                        <Label>Diligência <span className="text-red-500">*</span></Label>
                        {diligences.length > 0 ? (
                            <Select 
                                value={formData.diligence_id} 
                                onValueChange={(val) => setFormData(prev => ({ ...prev, diligence_id: val }))}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Selecione a diligência" />
                                </SelectTrigger>
                                <SelectContent>
                                    {diligences.map(d => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {new Date(d.date).toLocaleDateString('pt-BR')} - {d.status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-sm text-yellow-600 flex items-center bg-yellow-50 p-2 rounded border border-yellow-200">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Nenhuma diligência encontrada. Crie uma no processo antes de continuar.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Item Details */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Descrição do Item <span className="text-red-500">*</span></Label>
                    <Input 
                        name="item_description" 
                        value={formData.item_description} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ex: Televisão Samsung 50 polegadas"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Marca</Label>
                        <Input name="brand" value={formData.brand} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0.01" step="0.01" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Condição</Label>
                        <Select value={formData.condition} onValueChange={(val) => setFormData(prev => ({ ...prev, condition: val }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Novo">Novo</SelectItem>
                                <SelectItem value="Excelente">Excelente</SelectItem>
                                <SelectItem value="Bom">Bom</SelectItem>
                                <SelectItem value="Regular">Regular</SelectItem>
                                <SelectItem value="Ruim">Ruim</SelectItem>
                                <SelectItem value="Sucata">Sucata</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Valor Avaliado (R$)</Label>
                        <Input 
                            value={formData.display_valuation} 
                            onChange={handleCurrencyChange} 
                            placeholder="R$ 0,00" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Características / Detalhes</Label>
                    <Textarea 
                        name="characteristics" 
                        value={formData.characteristics} 
                        onChange={handleChange} 
                        rows={4} 
                    />
                </div>

                {formData.barcode && (
                    <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                        Código de Barras vinculado: {formData.barcode}
                    </div>
                )}
                
                {formData.photo_url && (
                    <div className="mt-2">
                        <Label>Foto Vinculada</Label>
                        <img src={formData.photo_url} alt="Item" className="mt-1 h-32 w-auto rounded border" />
                    </div>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !formData.diligence_id}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Item
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualEntryPage;