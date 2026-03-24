import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Helmet } from 'react-helmet-async';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

const Signup = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasMixedCase: false
  });

  const translateAuthError = (errorMessage) => {
    const msg = errorMessage?.toLowerCase() || "";
    if (msg.includes("user already registered")) return "Este email já está cadastrado.";
    if (msg.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
    if (msg.includes("weak password")) return "A senha é muito fraca. Tente adicionar números e símbolos.";
    if (msg.includes("invalid email")) return "Email inválido.";
    if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde um momento.";
    return "Ocorreu um erro ao criar a conta. Tente novamente.";
  };

  const calculateStrength = (password) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

    let score = 0;
    if (hasMinLength) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (hasMixedCase) score++;

    // Boost score for extra length if other criteria are met
    if (password.length >= 12 && score >= 2) score++;

    // Cap score at 4 for simple mapping
    if (score > 4) score = 4;

    return {
      score,
      hasMinLength,
      hasNumber,
      hasSpecial,
      hasMixedCase
    };
  };

  useEffect(() => {
    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const getStrengthLabel = (score) => {
    if (!formData.password) return { text: "", color: "bg-slate-200" };
    if (formData.password.length < 6) return { text: "Muito Curta", color: "bg-red-500" };
    
    switch (score) {
      case 0:
      case 1:
        return { text: "Fraca", color: "bg-red-500" };
      case 2:
        return { text: "Média", color: "bg-yellow-500" };
      case 3:
        return { text: "Forte", color: "bg-green-500" };
      case 4:
        return { text: "Muito Forte", color: "bg-emerald-600" };
      default:
        return { text: "", color: "bg-slate-200" };
    }
  };

  const strengthInfo = getStrengthLabel(passwordStrength.score);

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Redirect happens automatically
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
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "As senhas digitadas não conferem."
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha Muito Curta",
        description: "A senha deve ter pelo menos 6 caracteres para sua segurança."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Calls signUp in context which ensures emailRedirectTo is set correctly
      const { error } = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar o cadastro e ativar sua conta.",
        duration: 6000,
      });
      navigate('/login');
      
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
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input 
                  id="phone" 
                  placeholder="(00) 00000-0000" 
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={cn(
                    formData.password && formData.password.length < 6 && "border-red-300 focus-visible:ring-red-200"
                  )}
                />
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-500">Força da senha</span>
                      <span className={cn("text-xs font-bold", strengthInfo.color.replace('bg-', 'text-'))}>
                        {strengthInfo.text}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5 w-full">
                       {[0, 1, 2, 3].map((level) => (
                         <div 
                           key={level}
                           className={cn(
                             "h-full flex-1 rounded-full transition-all duration-300", 
                             passwordStrength.score > level ? strengthInfo.color : "bg-slate-100"
                           )}
                         />
                       ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <div className="flex items-center text-xs text-slate-500">
                         {passwordStrength.hasMinLength ? 
                           <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                           <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mr-2 ml-1" />
                         }
                         Min. 8 caracteres
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                         {passwordStrength.hasMixedCase ? 
                           <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                           <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mr-2 ml-1" />
                         }
                         Maiúsculas/Minúsculas
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                         {passwordStrength.hasNumber ? 
                           <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                           <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mr-2 ml-1" />
                         }
                         Números
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                         {passwordStrength.hasSpecial ? 
                           <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                           <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mr-2 ml-1" />
                         }
                         Símbolos (!@#)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={cn(
                    formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-300 focus-visible:ring-red-200"
                  )}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                   <p className="text-xs text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      As senhas não conferem
                   </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 mt-4" 
                disabled={isLoading || (formData.password && formData.password.length < 6)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
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