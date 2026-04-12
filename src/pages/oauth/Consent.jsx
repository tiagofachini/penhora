import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, AlertCircle, Check, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

const Consent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  // Extract OAuth parameters
  const clientId = searchParams.get('client_id');
  const scope = searchParams.get('scope') || 'read';
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const responseType = searchParams.get('response_type');

  // Parse scopes into a list
  const scopesList = scope.split(' ').filter(Boolean);

  useEffect(() => {
    if (!authLoading && !user) {
      // If user is not logged in, we must redirect them to login first
      // We encode the current URL as the return path
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirectTo=${returnUrl}`);
    }
  }, [user, authLoading, navigate]);

  const handleAllow = async () => {
    setProcessing(true);
    
    // In a real implementation with Supabase acting as OAuth Provider, 
    // you would typically make a POST request to your backend/Edge Function here
    // to sign the approval and get the authorization code.
    
    try {
        // Simulating API call latency
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Construct the success callback URL
        // NOTE: In a real flow, the server would return the 'code'. 
        // Here we simulate a successful redirect for the frontend flow demonstration.
        if (redirectUri) {
            const separator = redirectUri.includes('?') ? '&' : '?';
            // Mock code generation or pass-through if this was a direct handling page
            const code = 'spl_mock_auth_code_' + Math.random().toString(36).substring(7);
            const targetUrl = `${redirectUri}${separator}code=${code}${state ? `&state=${state}` : ''}`;
            
            toast({
                title: "Autorização concedida",
                description: "Redirecionando de volta para a aplicação...",
                duration: 2000,
            });

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 1000);
        } else {
            throw new Error("Redirect URI missing");
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro na autorização",
            description: "Não foi possível concluir o processo. Tente novamente."
        });
        setProcessing(false);
    }
  };

  const handleDeny = () => {
    setProcessing(true);
    if (redirectUri) {
        const separator = redirectUri.includes('?') ? '&' : '?';
        const targetUrl = `${redirectUri}${separator}error=access_denied&error_description=User%20denied%20access${state ? `&state=${state}` : ''}`;
        window.location.href = targetUrl;
    } else {
        navigate('/dashboard');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clientId || !redirectUri) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <Card className="w-full max-w-md border-red-200 bg-red-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Requisição Inválida
                </CardTitle>
                <CardDescription className="text-red-600">
                    Os parâmetros de autorização (client_id ou redirect_uri) estão ausentes ou incorretos.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-100" onClick={() => navigate('/dashboard')}>
                    Voltar ao Dashboard
                </Button>
            </CardFooter>
          </Card>
       </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Helmet>
        <title>Autorização de Acesso - Penhora.app.br</title>
      </Helmet>

      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
             <div className="relative">
                <img src={logoSrc} alt="Penhora.app" className="h-12 w-auto" />
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border">
                    <Shield className="h-4 w-4 text-blue-600" />
                </div>
             </div>
          </div>
          <CardTitle className="text-xl">Solicitação de Acesso</CardTitle>
          <CardDescription className="pt-2">
            A aplicação <span className="font-semibold text-slate-900">{clientId}</span> deseja conectar-se à sua conta Penhora.app
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
           {/* Account Info */}
           <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg mr-3">
                  {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.user_metadata?.name || 'Usuário'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
           </div>

           <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                 <Info className="h-4 w-4 text-slate-400" />
                 Permissões solicitadas:
              </h4>
              <ul className="space-y-2">
                  {scopesList.map((scopeItem, index) => (
                      <li key={index} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 transition-colors">
                          <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                              <span className="font-medium text-slate-700 block">
                                  {scopeItem === 'read' ? 'Visualizar seus dados' : 
                                   scopeItem === 'write' ? 'Criar e editar registros' : 
                                   scopeItem === 'offline_access' ? 'Acesso offline' : scopeItem}
                              </span>
                              <span className="text-xs text-slate-500">
                                   {scopeItem === 'read' ? 'Permite leitura de processos e itens.' : 
                                   scopeItem === 'write' ? 'Permite modificação de dados em seu nome.' : 
                                   'Permissão de escopo padrão.'}
                              </span>
                          </div>
                      </li>
                  ))}
              </ul>
           </div>

           <div className="text-xs text-slate-400 text-center px-4">
              Ao clicar em Permitir, você autoriza esta aplicação a usar suas informações de acordo com os <a href="/termos-de-uso" target="_blank" className="underline hover:text-slate-600">Termos de Uso</a>.
           </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse sm:flex-row gap-3 border-t pt-6 bg-slate-50/50">
            <Button variant="outline" className="w-full sm:w-1/2" onClick={handleDeny} disabled={processing}>
                <X className="mr-2 h-4 w-4" />
                Negar
            </Button>
            <Button className="w-full sm:w-1/2" onClick={handleAllow} disabled={processing}>
                {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                    <Check className="mr-2 h-4 w-4" />
                )}
                Permitir Acesso
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Consent;