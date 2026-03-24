import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const getItemPriceTier = (itemCount) => {
  if (itemCount <= 100) return { price: 0.50, tier: '1-100' };
  if (itemCount <= 500) return { price: 0.35, tier: '101-500' };
  if (itemCount <= 1000) return { price: 0.25, tier: '501-1000' };
  return { price: 0.15, tier: '1001+' };
};

const getSeizurePriceTier = (count) => {
  if (count <= 200) return 2.00;
  if (count <= 500) return 1.80;
  return 1.50;
};

const NumberInput = ({ value, onValueChange, min = 0, max = Infinity, step = 1 }) => {
    const handleChange = (newValue, operation) => {
    let num = newValue;
    if (operation === 'decrement') {
        // If current value is not a multiple of step, snap to the lower multiple.
        // Otherwise, just decrement by step.
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

const PlansSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [seizures, setSeizures] = useState(20);
  const [items, setItems] = useState(200);

  const { totalPrice, baseFee, seizureCost, itemsCost, itemTierPrice, seizureTierPrice } = useMemo(() => {
    const baseFee = 29.00;
    
    const seizureUnitCost = getSeizurePriceTier(seizures);
    const seizureCost = seizures * seizureUnitCost;

    const { price: itemPrice } = getItemPriceTier(items);
    const itemsCost = items * itemPrice;
    
    return {
      totalPrice: (baseFee + seizureCost + itemsCost).toFixed(2),
      baseFee: baseFee.toFixed(2),
      seizureCost: seizureCost.toFixed(2),
      itemsCost: itemsCost.toFixed(2),
      itemTierPrice: itemPrice.toFixed(2),
      seizureTierPrice: seizureUnitCost.toFixed(2)
    };
  }, [seizures, items]);

  const handleSelectPlan = (planId, config) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    navigate(`/checkout/${planId}`, { state: { config } });
  };

  const starterFeatures = [
    { text: 'Até 5 penhoras', included: true },
    { text: 'Até 100 itens no total', included: true },
    { text: 'Geração de auto de penhora em PDF', included: true },
    { text: 'Armazenamento em nuvem seguro', included: true },
    { text: 'Relatórios avançados', included: false },
    { text: 'Suporte prioritário', included: false },
  ];

  const proFeatures = [
    { text: 'Penhoras personalizáveis', included: true },
    { text: 'Itens personalizáveis', included: true },
    { text: 'Geração de auto de penhora em PDF', included: true },
    { text: 'Armazenamento em nuvem seguro', included: true },
    { text: 'Relatórios avançados', included: true },
    { text: 'Suporte prioritário', included: true },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
        >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Encontre o plano certo para você
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Comece gratuitamente e depois escolha um plano que se adapte ao seu volume de trabalho.
            </p>
        </motion.div>
        <div className="flex flex-col lg:flex-row justify-center gap-8 items-stretch max-w-6xl mx-auto">
          {/* Starter Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:w-1/2">
            <Card className="flex flex-col h-full shadow-lg p-4">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-slate-100 text-slate-600 p-2 rounded-full"><Star className="w-6 h-6" /></div>
                  <CardTitle className="text-2xl font-bold">Starter</CardTitle>
                </div>
                <CardDescription>Ideal para experimentar e para casos de uso esporádicos.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="my-6">
                  <span className="text-5xl font-extrabold">Grátis</span>
                  <span className="text-slate-500"> / 7 dias</span>
                </div>
                <ul className="space-y-4 text-slate-700 flex-grow mb-8">
                  {starterFeatures.map((feature, i) => (
                    <li key={i} className={cn("flex items-start", !feature.included && "text-slate-400 line-through")}>
                      <Check className={cn("w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0", !feature.included && "text-slate-400")} />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan('starter', { seizures: 5, items: 100 })}
                  size="lg"
                  variant="outline"
                  className="w-full mt-auto"
                >
                  Começar teste gratuito
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Professional Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="lg:w-1/2">
            <Card className="flex flex-col h-full ring-2 ring-blue-600 shadow-2xl p-4 relative">
               <div className="absolute top-0 right-8 -mt-3 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-full">Mais popular</div>
              <CardHeader className="pb-4">
                 <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><Zap className="w-6 h-6" /></div>
                  <CardTitle className="text-2xl font-bold">Professional</CardTitle>
                </div>
                <CardDescription>Para profissionais e escritórios que buscam máxima eficiência.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                
                <div className="space-y-6 my-6">
                  <div>
                    <Label htmlFor="seizures" className="font-semibold text-sm">Número de penhoras / mês</Label>
                    <NumberInput value={seizures} onValueChange={setSeizures} min={20} max={1000} step={20} />
                  </div>
                  <div>
                    <Label htmlFor="items" className="font-semibold text-sm">Número de itens / mês</Label>
                     <NumberInput value={items} onValueChange={setItems} min={200} max={5000} step={20} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg my-6 border">
                   <div className="text-center mb-4">
                      <span className="text-sm text-slate-500">Total mensal</span>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-extrabold text-slate-900">R$ {totalPrice}</span>
                      </div>
                    </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between"><span>Assinatura:</span> <span>R$ {baseFee}</span></div>
                    <div className="flex justify-between"><span>{seizures} penhoras × R$ {seizureTierPrice}:</span> <span>R$ {seizureCost}</span></div>
                    <div className="flex justify-between"><span>{items} itens × R$ {itemTierPrice}:</span> <span>R$ {itemsCost}</span></div>
                  </div>
                </div>


                <ul className="space-y-4 text-slate-700 flex-grow mb-8">
                   {proFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan('professional', { seizures, items, price: totalPrice })}
                  size="lg"
                  className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Selecionar plano
                </Button>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PlansSection;