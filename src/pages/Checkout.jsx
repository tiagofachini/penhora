import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Star, Zap, MessageCircle } from 'lucide-react';

const Checkout = () => {
  const { planId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Default values in case user navigates directly
  const config = location.state?.config || { seizures: 20, items: 200, price: '29.00' };

  const planDetails = {
    starter: {
      name: 'Starter',
      icon: Star,
      price: 'Grátis por 7 dias',
      description: 'Teste gratuito com acesso a funcionalidades essenciais.',
      seizures: 5,
      items: 100,
    },
    professional: {
      name: 'Professional',
      icon: Zap,
      price: `R$ ${config.price}`,
      description: 'Acesso completo com limites personalizados.',
      seizures: config.seizures,
      items: config.items,
    }
  };

  const selectedPlan = planDetails[planId];

  const handleStartTrial = async () => {
    setLoading(true);
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Upsert subscription for Starter
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan_type: 'starter',
      status: 'active', // Starter activates immediately
      next_billing_date: trialEndDate.toISOString(),
      seizure_limit: selectedPlan.seizures,
      item_limit: selectedPlan.items,
      monthly_value: 0,
      plan_config: { seizures: selectedPlan.seizures, items: selectedPlan.items }
    }, { onConflict: 'user_id' });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao iniciar o teste', description: error.message });
      setLoading(false);
    } else {
      toast({ title: 'Teste gratuito iniciado!', description: 'Aproveite todos os recursos por 7 dias.' });
      navigate('/dashboard');
    }
  };

  const handleWhatsAppCheckout = async () => {
    setLoading(true);
    try {
        // Register the request in the database with "pending_verification" status
        const { error } = await supabase.from('subscriptions').upsert({
            user_id: user.id,
            plan_type: 'professional',
            status: 'pending_verification', // Admin needs to approve/activate
            seizure_limit: selectedPlan.seizures,
            item_limit: selectedPlan.items,
            monthly_value: parseFloat(config.price),
            plan_config: { seizures: selectedPlan.seizures, items: selectedPlan.items }
        }, { onConflict: 'user_id' });

        if (error) throw error;

        // Whatsapp logic
        const phoneNumber = "5547992838844";
        const message = `Olá, quero contratar o plano ${selectedPlan?.name || 'Professional'}. Meu e-mail é ${user?.email}.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        toast({ 
            title: "Solicitação recebida!", 
            description: "Enviaremos o link de pagamento via WhatsApp em breve.",
            className: "bg-green-50 border-green-200 text-green-900"
        });

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/dashboard'), 2000);

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro ao processar solicitação', description: error.message });
    } finally {
        setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Plano não encontrado</h1>
        <Button asChild className="mt-4"><Link to="/plans">Ver Planos</Link></Button>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - {selectedPlan.name} - Penhora.app</title>
      </Helmet>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <Link to="/plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Planos
            </Link>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Order Details */}
                <div>
                    <h1 className="text-2xl font-bold mb-6">Confirme sua Escolha</h1>

                    <Card className="mb-6">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl font-bold text-primary">{selectedPlan.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedPlan.description}</p>
                                </div>
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                    <selectedPlan.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Limite de Penhoras</span>
                                    <span className="font-semibold">{selectedPlan.seizures}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Limite de Itens</span>
                                    <span className="font-semibold">{selectedPlan.items}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Ciclo</span>
                                    <span className="font-semibold">Mensal</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-2 border-t">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-extrabold text-primary">{selectedPlan.price}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Confirmation / Action */}
                <div>
                    <Card className="h-full flex flex-col justify-center border-2 border-blue-50 shadow-lg">
                        {planId === 'starter' ? (
                            <>
                                <CardHeader>
                                    <CardTitle>Teste Gratuito</CardTitle>
                                    <CardDescription>Comece agora mesmo</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <p className="text-muted-foreground">
                                        Você não será cobrado agora. Seu teste de 7 dias começa imediatamente.
                                    </p>
                                    <Button onClick={handleStartTrial} disabled={loading} size="lg" className="w-full">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Iniciar Teste Gratuito'}
                                    </Button>
                                </CardContent>
                            </>
                        ) : (
                            <>
                                <CardHeader>
                                    <CardTitle>Finalizar Contratação</CardTitle>
                                    <CardDescription>Fale diretamente com nossa equipe</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                        <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <p className="text-green-800 font-medium text-sm">
                                            Você receberá em breve o link de pagamento via WhatsApp
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-500">
                                        <p>Para sua segurança e comodidade, finalizamos a contratação do plano Professional através de nosso atendimento oficial no WhatsApp.</p>
                                    </div>
                                    
                                    <Button 
                                        onClick={handleWhatsAppCheckout} 
                                        disabled={loading}
                                        size="lg" 
                                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12"
                                    >
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageCircle className="mr-2 h-5 w-5" />}
                                        Concordar e contratar via WhatsApp
                                    </Button>
                                </CardContent>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div>
      </main>
    </>
  );
};

export default Checkout;