import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Building, Mail, Phone, Upload, X, ImageIcon, MapPin } from 'lucide-react';

const MyAccount = () => {
  const { user, logActivity } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    logo_url: '',
    cep: '',
    logradouro: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          const addr = data.company_address || {};
          setFormData({
            name: data.name || '',
            company_name: data.company_name || '',
            email: user.email || '',
            phone: data.phone || '',
            logo_url: data.logo_url || '',
            cep: addr.cep || '',
            logradouro: addr.logradouro || '',
            number: addr.number || '',
            complement: addr.complement || '',
            neighborhood: addr.neighborhood || '',
            city: addr.city || '',
            state: addr.state || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({ title: 'Erro ao carregar dados', description: 'Não foi possível carregar suas informações.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user, toast]);

  const handleCepSearch = async (cepValue) => {
    const raw = cepValue.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (_) {}
    finally { setCepLoading(false); }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    if (id === 'cep') {
      const digits = value.replace(/\D/g, '');
      const masked = digits.length > 5
        ? `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
        : digits;
      setFormData(prev => ({ ...prev, cep: masked }));
      if (digits.length === 8) handleCepSearch(digits);
      return;
    }

    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Selecione uma imagem (JPG, PNG, SVG, etc).' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'A imagem deve ter no máximo 2 MB.' });
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: 'Logo carregada com sucesso!' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao carregar logo', description: err.message });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const company_address = {
        cep: formData.cep,
        logradouro: formData.logradouro,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      };

      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          company_name: formData.company_name,
          phone: formData.phone,
          logo_url: formData.logo_url || null,
          company_address,
        })
        .eq('id', user.id);

      if (error) throw error;

      await logActivity('UPDATE_PROFILE', { updated_fields: ['name', 'company', 'phone', 'logo', 'address'] });

      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas com sucesso.', className: 'bg-green-50 text-green-900 border-green-200' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Erro ao salvar', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <>
      <Helmet><title>Minha Conta - Penhora.app.br</title></Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Minha Conta</h1>
          <p className="text-slate-500">Gerencie seus dados pessoais e de contato.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Logo ── */}
          <Card>
            <CardHeader>
              <CardTitle>Logomarca</CardTitle>
              <CardDescription>
                Sua logo será exibida no cabeçalho dos autos de penhora gerados em PDF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* Preview */}
                <div className="flex-shrink-0 w-32 h-32 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo da empresa"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-xs">Sem logo</span>
                    </div>
                  )}
                </div>

                {/* Upload actions */}
                <div className="flex flex-col gap-3 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Upload className="mr-2 h-4 w-4" />}
                    {uploadingLogo ? 'Enviando…' : 'Escolher Imagem'}
                  </Button>
                  {formData.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Remover Logo
                    </Button>
                  )}
                  <p className="text-xs text-slate-400">JPG, PNG, SVG ou WebP. Máximo 2 MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Personal info ── */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Estes dados serão usados em seus documentos e processos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="name" value={formData.name} onChange={handleChange} className="pl-10" placeholder="Seu nome" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="email" value={formData.email} disabled className="pl-10 bg-slate-50 cursor-not-allowed" title="Para alterar o e-mail, entre em contato com o suporte." />
                </div>
                <p className="text-xs text-slate-500">O e-mail não pode ser alterado diretamente.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="phone" value={formData.phone} onChange={handleChange} className="pl-10" placeholder="+55..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Company address ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" />
                Endereço da Empresa / Escritório
              </CardTitle>
              <CardDescription>
                Opcional. Aparecerá no cabeçalho dos autos de penhora quando preenchido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa / Escritório</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="company_name" value={formData.company_name} onChange={handleChange} className="pl-10" placeholder="Nome da empresa" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input id="state" value={formData.state} onChange={handleChange} placeholder="SP" maxLength={2} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" value={formData.logradouro} onChange={handleChange} placeholder="Rua, Av., etc." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" value={formData.number} onChange={handleChange} placeholder="123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input id="complement" value={formData.complement} onChange={handleChange} placeholder="Sala, Andar…" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input id="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Bairro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={formData.city} onChange={handleChange} placeholder="Cidade" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pb-8">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Salvando…' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default MyAccount;
