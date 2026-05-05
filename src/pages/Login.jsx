import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Helmet } from 'react-helmet-async';
import { Loader2, ShieldX, Mail } from 'lucide-react';

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

const Login = () => {
  const { signInWithOtp } = useAuth();
  const { search } = useLocation();
  const isBlocked = new URLSearchParams(search).get('blocked') === '1';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const { error } = await signInWithOtp({ email });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar link',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <Helmet>
          <title>Verifique seu email - Penhora.app.br</title>
        </Helmet>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <Link to="/" className="flex justify-center mb-4">
              <img src={logoSrc} alt="Penhora.app Logo" className="h-10 w-auto" />
            </Link>
            <CardTitle className="text-2xl font-bold text-center">Verifique seu email</CardTitle>
            <CardDescription className="text-center">
              Enviamos um link de acesso para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Link enviado!</p>
                <p>Clique no link no seu email para acessar o sistema. Verifique também a caixa de spam.</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Usar outro email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Helmet>
        <title>Login - Penhora.app.br</title>
      </Helmet>

      {isBlocked && (
        <div className="w-full max-w-md mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <ShieldX className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm font-medium">Seu usuário está bloqueado e não pode acessar o sistema.</p>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link to="/" className="flex justify-center mb-4">
            <img src={logoSrc} alt="Penhora.app Logo" className="h-10 w-auto" />
          </Link>
          <CardTitle className="text-2xl font-bold text-center">Acesse sua conta</CardTitle>
          <CardDescription className="text-center">
            Informe seu email e enviaremos um link de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</>
              ) : 'Enviar link de acesso'}
            </Button>
          </form>
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
