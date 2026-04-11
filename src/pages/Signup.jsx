import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
// generatePassword moved to edge function
import { Helmet } from 'react-helmet-async';
import { Loader2, Check, Mail, KeyRound } from 'lucide-react';

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
};

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;

  const password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = 4; i < 12; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  return password.sort(() => Math.random() - 0.5).join('');
};

const Signup = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const translateAuthError = (errorMessage) => {
    const msg = errorMessage?.toLowerCase() || "";
    if (msg.includes("user already registered")) return "Este email já está cadastrado.";
    if (msg.includes("invalid email")) return "Email inválido.";
    if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde um momento.";
    return "Ocorreu um erro ao criar a conta. Tente novamente.";
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: id === 'phone' ? formatPhone(value) : value });
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro com Google",
        description: error.message,
      });
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccessEmail(formData.email);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: translateAuthError(error.message),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de sucesso
  if (successEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <Helmet>
          <title>Conta Criada - Penhora.app</title>
        </Helmet>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <Link to="/" className="flex justify-center mb-4">
              <img src={logoSrc} alt="Penhora.app Logo" className="h-10 w-auto" />
            </Link>
            <div className="flex justify-center mb-2">
              <div className="bg-green-100 rounded-full p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Conta criada!</CardTitle>
            <CardDescription className="text-center">
              Sua senha de acesso foi enviada por email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Verifique seu email</p>
                <p>
                  Enviamos sua senha de acesso para <strong>{successEmail}</strong>.
                  Verifique também a caixa de spam.
                </p>
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => navigate('/login')}
            >
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Helmet>
        <title>Cadastro - Penhora.app</title>
      </Helmet>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <Link to="/" className="flex justify-center mb-4">
            <img src={logoSrc} alt="Penhora.app Logo" className="h-10 w-auto" />
          </Link>
          <CardTitle className="text-2xl font-bold text-center">Crie sua conta</CardTitle>
          <CardDescription className="text-center">
            Comece a gerenciar suas penhoras de forma eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Cadastrar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou preencha o formulário
                </span>
              </div>
            </div>

            {/* Aviso sobre senha automática */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
              <KeyRound className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Não é necessário criar uma senha. Após o cadastro, enviaremos uma senha segura para o seu email.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone / WhatsApp <span className="text-slate-400 text-xs">(opcional)</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="(00) 0000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
