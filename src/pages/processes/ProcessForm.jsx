import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, FileText, Gavel, MapPin } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { maskCNJ } from '@/lib/cnj';
import PersonCombobox from '@/components/PersonCombobox';

const PROCESS_PHASES = [
  'Instauração', 'Citação', 'Penhora', 'Defesa',
  'Expropriação', 'Satisfação do crédito', 'Extinção',
];

const ProcessForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    process_number: '',

    // Parties — name (required) + person_id (optional, when selected from People module)
    exequente: '',
    exequente_person_id: null,
    executado: '',
    executado_person_id: null,
    depositary: '',
    depositary_person_id: null,

    // Deposit location
    deposit_cep: '',
    deposit_logradouro: '',
    deposit_number: '',
    deposit_complement: '',
    deposit_neighborhood: '',
    deposit_city: '',
    deposit_state: '',

    // Diligence
    execution_date: '',
    cep: '',
    logradouro: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',

    summary: '',
    current_phase: '',
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);
  const [cepLoading, setCepLoading] = useState(false);
  const [depositCepLoading, setDepositCepLoading] = useState(false);

  const isEditing = !!id;

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['link'], ['clean'],
    ],
  };
  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent', 'link',
  ];

  const parseLocation = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      if (typeof jsonString === 'string' && jsonString.length > 0)
        return { logradouro: jsonString };
    }
    return {};
  };

  // Load existing process when editing
  useEffect(() => {
    if (!isEditing || !user) { setPageLoading(false); return; }

    const fetchProcess = async () => {
      setPageLoading(true);
      try {
        const { data, error } = await supabase
          .from('processes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (error) throw error;

        const diligenceAddress = parseLocation(data.execution_location);
        const depositAddress   = parseLocation(data.parties_info?.deposit_location);

        setFormData({
          process_number: maskCNJ(data.process_number || ''),

          exequente:           data.parties_info?.exequente        || '',
          exequente_person_id: data.parties_info?.exequente_person_id || null,
          executado:           data.parties_info?.executado         || '',
          executado_person_id: data.parties_info?.executado_person_id || null,
          depositary:          data.parties_info?.depositary        || '',
          depositary_person_id:data.parties_info?.depositary_person_id || null,

          deposit_cep:          depositAddress.cep          || '',
          deposit_logradouro:   depositAddress.logradouro   ||
            (typeof data.parties_info?.deposit_location === 'string'
              ? data.parties_info.deposit_location : ''),
          deposit_number:       depositAddress.number       || '',
          deposit_complement:   depositAddress.complement   || '',
          deposit_neighborhood: depositAddress.neighborhood || '',
          deposit_city:         depositAddress.city         || '',
          deposit_state:        depositAddress.state        || '',

          execution_date: data.execution_date
            ? new Date(data.execution_date).toISOString().split('T')[0] : '',

          cep:          diligenceAddress.cep          || '',
          logradouro:   diligenceAddress.logradouro   || '',
          number:       diligenceAddress.number       || '',
          complement:   diligenceAddress.complement   || '',
          neighborhood: diligenceAddress.neighborhood || '',
          city:         diligenceAddress.city         || '',
          state:        diligenceAddress.state        || '',

          summary:       data.summary       || '',
          current_phase: data.current_phase || '',
        });
      } catch (error) {
        console.error('Error fetching process:', error);
        toast({ variant: 'destructive', title: 'Erro ao carregar penhora' });
        navigate('/processes');
      } finally {
        setPageLoading(false);
      }
    };
    fetchProcess();
  }, [id, user, toast, navigate, isEditing]);

  // Generic field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalized = name === 'process_number' ? maskCNJ(value) : value;
    setFormData(prev => ({ ...prev, [name]: normalized }));
    if ((name === 'cep' || name === 'deposit_cep') && normalized.replace(/\D/g, '').length === 8) {
      handleCepSearch(normalized, name === 'deposit_cep');
    }
  };

  // PersonCombobox selection handler — one per party
  const handlePartySelect = (field, idField) => ({ name, personId }) => {
    setFormData(prev => ({ ...prev, [field]: name, [idField]: personId || null }));
  };

  const handleEditorChange = (content) => {
    setFormData(prev => ({ ...prev, summary: content }));
  };

  const handleCepSearch = async (cepValue, isDeposit = false) => {
    const cep = cepValue.replace(/\D/g, '');
    if (cep.length !== 8) return;

    if (isDeposit) setDepositCepLoading(true);
    else setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast({ variant: 'destructive', title: 'CEP não encontrado', description: 'Verifique o número digitado.' });
        return;
      }
      if (isDeposit) {
        setFormData(prev => ({
          ...prev,
          deposit_logradouro:   data.logradouro || '',
          deposit_neighborhood: data.bairro     || '',
          deposit_city:         data.localidade || '',
          deposit_state:        data.uf         || '',
          deposit_cep: cep,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          logradouro:   data.logradouro || '',
          neighborhood: data.bairro     || '',
          city:         data.localidade || '',
          state:        data.uf         || '',
          cep,
        }));
      }
      toast({ title: 'Endereço encontrado!', description: 'Campos preenchidos automaticamente.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: 'Verifique sua conexão.' });
    } finally {
      if (isDeposit) setDepositCepLoading(false);
      else setCepLoading(false);
    }
  };

  // If the party has a name but no linked person_id (user typed free text),
  // create a new person record and return its id. If already linked, return existing id.
  const ensurePerson = async (name, category, existingPersonId) => {
    if (!name?.trim()) return null;
    if (existingPersonId) return existingPersonId;
    const { data, error } = await supabase
      .from('people')
      .insert({ user_id: user.id, name: name.trim(), category })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const diligenceAddressObject = {
      cep: formData.cep, logradouro: formData.logradouro,
      number: formData.number, complement: formData.complement,
      neighborhood: formData.neighborhood, city: formData.city, state: formData.state,
    };

    const depositAddressObject = {
      cep: formData.deposit_cep, logradouro: formData.deposit_logradouro,
      number: formData.deposit_number, complement: formData.deposit_complement,
      neighborhood: formData.deposit_neighborhood, city: formData.deposit_city, state: formData.deposit_state,
    };

    // Auto-create person records for any party typed as free text (no existing link)
    let exequentePid, executadoPid, depositaryPid;
    try {
      [exequentePid, executadoPid, depositaryPid] = await Promise.all([
        ensurePerson(formData.exequente,  'Exequente',   formData.exequente_person_id),
        ensurePerson(formData.executado,  'Executado',   formData.executado_person_id),
        ensurePerson(formData.depositary, 'Depositário', formData.depositary_person_id),
      ]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao vincular pessoas', description: err.message });
      setLoading(false);
      return;
    }


    const baseData = {
      process_number: formData.process_number,
      parties_info: {
        exequente:            formData.exequente,
        exequente_person_id:  exequentePid  || null,
        executado:            formData.executado,
        executado_person_id:  executadoPid  || null,
        depositary:           formData.depositary,
        depositary_person_id: depositaryPid || null,
        deposit_location: JSON.stringify(depositAddressObject),
      },
      execution_date:    formData.execution_date || null,
      execution_location: JSON.stringify(diligenceAddressObject),
      summary:           formData.summary,
      current_phase:     formData.current_phase || null,
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('processes').update(baseData).eq('id', id).select().single();
      } else {
        result = await supabase.from('processes').insert({ user_id: user.id, ...baseData }).select().single();
      }
      const { data, error } = result;
      if (error) throw error;

      toast({ title: `Penhora ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
      navigate(`/processes/${data.id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} penhora`, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Editar Penhora' : 'Nova Penhora'} - Penhora.app.br</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-4">
        <Link to={isEditing ? `/processes/${id}` : '/processes'}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Penhora' : 'Criar Nova Penhora'}</CardTitle>
            <CardDescription>Preencha os dados da penhora, partes envolvidas e diligência.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── Número CNJ ── */}
              <div>
                <Label htmlFor="process_number">Número da Penhora (CNJ)</Label>
                <Input
                  id="process_number" name="process_number"
                  value={formData.process_number} onChange={handleChange}
                  placeholder="0000000-00.0000.0.00.0000"
                  inputMode="numeric" maxLength={25} required
                />
              </div>

              {/* ── Partes ── */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="exequente">
                    Exequente (Autor) <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-400 mb-1">
                    Digite ou pesquise cadastros existentes
                  </p>
                  <PersonCombobox
                    value={formData.exequente}
                    personId={formData.exequente_person_id}
                    onSelect={handlePartySelect('exequente', 'exequente_person_id')}
                    placeholder="Nome do credor…"
                  />
                </div>
                <div>
                  <Label htmlFor="executado">
                    Executado (Réu) <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-400 mb-1">
                    Digite ou pesquise cadastros existentes
                  </p>
                  <PersonCombobox
                    value={formData.executado}
                    personId={formData.executado_person_id}
                    onSelect={handlePartySelect('executado', 'executado_person_id')}
                    placeholder="Nome do devedor…"
                  />
                </div>
              </div>

              {/* ── Fase ── */}
              <div>
                <Label htmlFor="current_phase">Fase Atual do Processo</Label>
                <Select
                  value={formData.current_phase}
                  onValueChange={val => setFormData(prev => ({ ...prev, current_phase: val }))}
                >
                  <SelectTrigger id="current_phase" className="mt-1">
                    <SelectValue placeholder="Selecione a fase atual" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_PHASES.map(phase => (
                      <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Dados do Auto ── */}
              <div className="border-t pt-6 mt-2">
                <h3 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="h-4 w-4" /> Dados do Auto
                </h3>

                <div className="mb-6">
                  <Label htmlFor="depositary">Nome do Depositário</Label>
                  <p className="text-xs text-slate-400 mb-1">
                    Digite ou pesquise cadastros existentes
                  </p>
                  <PersonCombobox
                    value={formData.depositary}
                    personId={formData.depositary_person_id}
                    onSelect={handlePartySelect('depositary', 'depositary_person_id')}
                    placeholder="Responsável pelos bens…"
                  />
                </div>

                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Local do Depósito
                </h4>

                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <Label htmlFor="deposit_cep">CEP</Label>
                    <div className="relative">
                      <Input
                        id="deposit_cep" name="deposit_cep"
                        value={formData.deposit_cep} onChange={handleChange}
                        placeholder="00000-000" maxLength={9}
                      />
                      {depositCepLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400 pointer-events-none" />}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="deposit_logradouro">Logradouro</Label>
                    <Input id="deposit_logradouro" name="deposit_logradouro"
                      value={formData.deposit_logradouro} onChange={handleChange}
                      placeholder="Rua, Avenida, etc." />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <Label htmlFor="deposit_number">Número</Label>
                    <Input id="deposit_number" name="deposit_number"
                      value={formData.deposit_number} onChange={handleChange} placeholder="123" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="deposit_complement">Complemento</Label>
                    <Input id="deposit_complement" name="deposit_complement"
                      value={formData.deposit_complement} onChange={handleChange}
                      placeholder="Apto 101, Bloco B" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <Label htmlFor="deposit_neighborhood">Bairro</Label>
                    <Input id="deposit_neighborhood" name="deposit_neighborhood"
                      value={formData.deposit_neighborhood} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="deposit_city">Cidade</Label>
                    <Input id="deposit_city" name="deposit_city"
                      value={formData.deposit_city} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="deposit_state">UF</Label>
                    <Input id="deposit_state" name="deposit_state"
                      value={formData.deposit_state} onChange={handleChange}
                      maxLength={2} />
                  </div>
                </div>
              </div>

              {/* ── Diligência ── */}
              <div className="border-t pt-6 mt-2">
                <h3 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Dados da Diligência
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <Label htmlFor="execution_date">Data Prevista</Label>
                    <Input id="execution_date" name="execution_date" type="date"
                      value={formData.execution_date} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <Input id="cep" name="cep" value={formData.cep}
                        onChange={handleChange} placeholder="00000-000" maxLength={9} />
                      {cepLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400 pointer-events-none" />}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input id="logradouro" name="logradouro" value={formData.logradouro}
                      onChange={handleChange} placeholder="Rua, Avenida, etc." />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" name="number" value={formData.number}
                      onChange={handleChange} placeholder="123" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" name="neighborhood"
                      value={formData.neighborhood} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" name="complement"
                      value={formData.complement} onChange={handleChange}
                      placeholder="Apto 101, Bloco B" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" value={formData.city}
                      onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="state">UF</Label>
                    <Input id="state" name="state" value={formData.state}
                      onChange={handleChange} maxLength={2} />
                  </div>
                </div>
              </div>

              {/* ── Resumo ── */}
              <div className="border-t pt-6 mt-2">
                <Label htmlFor="summary" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Resumo / Observações Adicionais
                </Label>
                <div className="bg-white">
                  <ReactQuill
                    theme="snow" value={formData.summary}
                    onChange={handleEditorChange}
                    modules={quillModules} formats={quillFormats}
                    className="bg-white min-h-[150px]"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Observações gerais sobre a diligência, acesso ao local ou contatos.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t mt-6">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto shadow-lg">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Salvar Alterações' : 'Confirmar e Criar Penhora'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProcessForm;
