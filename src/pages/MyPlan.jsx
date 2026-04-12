import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Star, AlertTriangle, CheckCircle, ArrowRight, Minus, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Reusing helper from PlansSection
const getItemPriceTier = (itemCount) => {
  if (itemCount <= 100) return { price: 0.50, tier: '1-100' };
  if (itemCount <= 500) return { price: 0.35, tier: '101-500' };
  if (itemCount <= 1000) return { price: 0.25, tier: '501-1000' };
  return { price: 0.15, tier: '1001+' };
};

const NumberInput = ({ value, onValueChange, min = 0, max = Infinity, step = 1 }) => {
    const handleChange = (newValue, operation) => {
    let num = newValue;
    if (operation === 'decrement') {
        const remainder = (value - min) % step;
        if (remainder !== 0) {
            num = value - remainder;
        } else {
            num = value - step;
        }
    }
    const finalValue = Math.max(min, Math.min(max, num));
    onValueChange(finalValue);
  };
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
        onClick={() => handleChange(value - step, 'decrement')}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">Diminuir</span>
      </Button>
      <Input
        type="number"
        className="w-full text-center font-bold text-lg"
        value={value}
        onChange={(e) => onValueChange(parseInt(e.target.value, 10) || min)}
        onBlur={(e) => {
            const val = parseInt(e.target.value, 10) || min;
            const constrainedVal = Math.max(min, Math.min(max, val));
            const roundedVal = Math.round(constrainedVal / step) * step;
            onValueChange(Math.max(min, roundedVal));
        }}
        min={min}
        max={max}
        step={step}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
        onClick={() => handleChange(value + step, 'increment')}
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Aumentar</span>
      </Button>
    </div>
  );
};

const MyPlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({ seizures: 0, items: 0 });
  
  // Simulator State
  const [simSeizures, setSimSeizures] = useState(20);
  const [simItems, setSimItems] = useState(200);

  // Pricing Logic
  const { totalPrice, baseFee, seizureCost, itemsCost } = useMemo(() => {
    const baseFee = 29.00;
    const seizureCost = simSeizures * 2.00;
    const { price: itemPrice } = getItemPriceTier(simItems);
    const itemsCost = simItems * itemPrice;
    return {
      totalPrice: (baseFee + seizureCost + itemsCost).toFixed(2),
      baseFee: baseFee.toFixed(2),
      seizureCost: seizureCost.toFixed(2),
      itemsCost: itemsCost.toFixed(2),
    };
  }, [simSeizures, simItems]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Subscription
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!subError) {
          setSubscription(subData);
          if (subData?.plan_config) {
             setSimSeizures(subData.plan_config.seizures || 20);
             setSimItems(subData.plan_config.items || 200);
          }
        }

        // 2. Fetch Usage (Processes count as seizures)
        const { count: processCount } = await supabase
          .from('processes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // 3. Fetch Items Usage
        // Fetch items by joining processes filtered by user_id
        const { count: itemsCount } = await supabase
          .from('seized_items')
          .select('*, processes!inner(user_id)', { count: 'exact', head: true })
          .eq('processes.user_id', user.id);

        setUsage({
          seizures: processCount || 0,
          items: itemsCount || 0
        });

      } catch (error) {
        console.error("Error fetching plan data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpgrade = () => {
    navigate(`/checkout/professional`, { 
        state: { 
            config: { 
                seizures: simSeizures, 
                items: simItems, 
                price: totalPrice 
            } 
        } 
    });
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  // Derived Values
  const isFreePlan = !subscription || subscription.plan_type === 'starter';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isPending = subscription?.status === 'pending_verification';
  
  const planName = subscription ? (subscription.plan_type === 'starter' ? 'Starter (Gratuito)' : 'Professional') : 'Plano Gratuito (Limitado)';
  
  // Use limits from subscription or default to free limits (5/100)
  const seizureLimit = subscription?.seizure_limit ?? 5;
  const itemLimit = subscription?.item_limit ?? 100;
  const monthlyValue = subscription?.monthly_value || 0;

  const seizurePercentage = seizureLimit > 0 ? Math.min(100, (usage.seizures / seizureLimit) * 100) : 100;
  const itemPercentage = itemLimit > 0 ? Math.min(100, (usage.items / itemLimit) * 100) : 100;

  return (
    <>
      <Helmet><title>Meu Plano - Penhora.app.br</title></Helmet>

      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Plano</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura e limites de uso.</p>
        </div>

        {/* Current Status Card */}
        <Card className={cn("border-l-4", isPending ? "border-l-yellow-500" : "border-l-blue-600")}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            {isFreePlan ? <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> : <Zap className="h-5 w-5 text-blue-600 fill-blue-100" />}
                            {planName}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {isPending && "Sua solicitação de plano está pendente de aprovação."}
                            {isActive && subscription.status === 'trialing' && 'Período de testes ativo.'}
                            {isActive && subscription.status === 'active' && 'Sua assinatura está ativa.'}
                            {!isActive && !isPending && 'Você não possui uma assinatura ativa.'}
                        </CardDescription>
                    </div>
                    {subscription && (
                        <Badge className={cn(
                            isPending ? "bg-yellow-100 text-yellow-800" : 
                            isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                        )}>
                            {isPending ? <><Clock className="w-3 h-3 mr-1"/> Pendente</> : 
                             subscription.status === 'active' ? 'Ativo' : 
                             subscription.status === 'trialing' ? 'Teste Gratuito' : 'Inativo'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Usage Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Penhoras Utilizadas</span>
                            <span className="text-muted-foreground font-mono">{usage.seizures} / {seizureLimit}</span>
                        </div>
                        <Progress value={seizurePercentage} className="h-2" />
                        {seizurePercentage >= 90 && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" /> Limite próximo!
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Itens Cadastrados</span>
                            <span className="text-muted-foreground font-mono">{usage.items} / {itemLimit}</span>
                        </div>
                        <Progress value={itemPercentage} className="h-2" />
                         {itemPercentage >= 90 && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" /> Limite próximo!
                            </p>
                        )}
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg border text-center">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Valor Mensal</span>
                        <div className="text-2xl font-bold text-slate-800">
                             {monthlyValue > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyValue) : 'Grátis'}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Upgrade / Configuration Section */}
        <div className="grid md:grid-cols-1 gap-8">
            <Card className="overflow-hidden">
                <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        {isFreePlan ? 'Faça Upgrade para o Professional' : 'Ajustar meu Plano Professional'}
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                        {isFreePlan 
                            ? 'Desbloqueie limites maiores e recursos exclusivos agora mesmo.' 
                            : 'Precisa de mais espaço? Ajuste seus limites conforme sua necessidade.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                        {/* Sliders Area */}
                        <div className="space-y-8">
                             <div className="space-y-4">
                                <Label htmlFor="seizures" className="text-base font-semibold flex justify-between">
                                    <span>Penhoras por mês</span>
                                    <span className="text-blue-600">{simSeizures}</span>
                                </Label>
                                <NumberInput value={simSeizures} onValueChange={setSimSeizures} min={20} max={1000} step={20} />
                                <p className="text-xs text-muted-foreground">R$ 2,00 por penhora adicional</p>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="items" className="text-base font-semibold flex justify-between">
                                    <span>Itens por mês</span>
                                    <span className="text-blue-600">{simItems}</span>
                                </Label>
                                <NumberInput value={simItems} onValueChange={setSimItems} min={200} max={5000} step={20} />
                                <p className="text-xs text-muted-foreground">Preço progressivo (quanto mais itens, menor o custo unitário)</p>
                            </div>
                        </div>

                        {/* Price Summary Area */}
                        <div className="bg-slate-50 rounded-xl p-6 border shadow-sm">
                            <h3 className="font-semibold text-lg mb-4 text-center">Resumo da Simulação</h3>
                            <div className="space-y-2 mb-6">
                                <div className="border-t pt-2 mt-2 flex justify-between items-baseline">
                                    <span className="font-bold text-slate-900">Total Mensal</span>
                                    <span className="text-3xl font-extrabold text-blue-600">R$ {totalPrice}</span>
                                </div>
                            </div>

                            <Button onClick={handleUpgrade} size="lg" className="w-full text-lg h-12 shadow-lg hover:shadow-xl transition-all">
                                {isFreePlan ? (
                                    <>Contratar Agora <ArrowRight className="ml-2 h-5 w-5" /></>
                                ) : (
                                    <>Atualizar Assinatura <CheckCircle className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Você será redirecionado para o WhatsApp para finalizar a solicitação.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
};

export default MyPlan;