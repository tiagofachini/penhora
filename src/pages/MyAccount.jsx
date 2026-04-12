import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, User, Building, Mail, Phone } from 'lucide-react';

const MyAccount = () => {
  const { user, logActivity } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: ''
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

          setFormData({
            name: data.name || '',
            company_name: data.company_name || '',
            email: user.email || '', // Email comes from Auth
            phone: data.phone || ''
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar suas informações.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, toast]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          company_name: formData.company_name,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await logActivity('UPDATE_PROFILE', { updated_fields: ['name', 'company', 'phone'] });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
        className: "bg-green-50 text-green-900 border-green-200"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <>
      <Helmet>
        <title>Minha Conta - Penhora.app.br</title>
      </Helmet>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Minha Conta</h1>
          <p className="text-slate-500">Gerencie seus dados pessoais e de contato.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Estes dados serão usados em seus documentos e processos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="pl-10" 
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa / Escritório</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="company_name" 
                    value={formData.company_name} 
                    onChange={handleChange} 
                    className="pl-10" 
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="email" 
                    value={formData.email} 
                    disabled 
                    className="pl-10 bg-slate-50 cursor-not-allowed" 
                    title="Para alterar o e-mail, entre em contato com o suporte."
                  />
                </div>
                <p className="text-xs text-slate-500">O e-mail não pode ser alterado diretamente.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className="pl-10" 
                    placeholder="+55..."
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MyAccount;