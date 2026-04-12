import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

const Login = () => {
  const { signIn, signInWithOtp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Redirect happens automatically
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no login com Google",
        description: error.message,
      });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isMagicLink) {
        if (!formData.email) throw new Error("Email é obrigatório");
        
        // This uses the updated signInWithOtp with correct redirect URL
        const { error } = await signInWithOtp({ email: formData.email });
        if (error) throw error;
        
        toast({
          title: "Link de acesso enviado!",
          description: "Verifique sua caixa de entrada (e spam) para acessar o sistema.",
          duration: 6000,
        });
      } else {
        if (!formData.email || !formData.password) throw new Error("Email e senha são obrigatórios");
        const { error } = await signIn({ email: formData.email, password: formData.password });
        if (error) throw error;
        window.location.href = 'https://go.penhora.app.br/dashboard';
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message === "Invalid login credentials" 
          ? "Credenciais inválidas. Verifique seu email e senha." 
          : "Não foi possível realizar o login. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Helmet>
        <title>Login - Penhora.app</title>
      </Helmet>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link to="/" className="flex justify-center mb-4">
             <img src={logoSrc} alt="Penhora.app Logo" className="h-10 w-auto" />
          </Link>
          <CardTitle className="text-2xl font-bold text-center">Acesse sua conta</CardTitle>
          <CardDescription className="text-center">
            Entre com seu email e senha ou use sua conta Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Entrar com Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {!isMagicLink && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link 
                      to="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMagicLink(true); 
                        toast({ description: "Dica: O Link Mágico enviará um acesso direto para seu email." });
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={formData.password}
                    onChange={handleChange}
                    required={!isMagicLink}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isMagicLink ? 'Enviando Link...' : 'Entrando...'}
                  </>
                ) : (
                  isMagicLink ? 'Enviar Link de Acesso' : 'Entrar'
                )}
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              className="text-sm text-slate-500"
              onClick={() => setIsMagicLink(!isMagicLink)}
            >
              {isMagicLink ? 'Usar senha' : 'Entrar sem senha (Magic Link)'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-slate-500">
            Não tem uma conta?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;