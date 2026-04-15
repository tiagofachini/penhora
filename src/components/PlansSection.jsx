import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Infinity, Zap, Shield, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  'Penhoras ilimitadas',
  'Itens e bens ilimitados',
  'Geração de Auto de Penhora em PDF',
  'Fotos e armazenamento em nuvem',
  'Reconhecimento de imagem por IA',
  'Agenda de diligências',
  'Equipe colaborativa',
  'Suporte via WhatsApp',
];

const PlansSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-6 border border-green-200">
            <Gift className="h-4 w-4" /> Acesso gratuito e ilimitado
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Sem planos. Sem limites.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            O Penhora.app.br é gratuito e ilimitado para todos os usuários neste momento.
            Cadastre-se e use todos os recursos sem restrições.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Plano atual</p>
                <h3 className="text-3xl font-extrabold">Gratuito e Ilimitado</h3>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <Infinity className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-300 flex-shrink-0" />
              <p className="text-sm text-blue-100">
                Todos os recursos desbloqueados. Sem cobrança, sem cartão de crédito.
              </p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              asChild
              className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold text-base h-12"
            >
              <Link to="/signup">Criar conta gratuitamente</Link>
            </Button>

            <p className="text-center text-blue-200 text-xs mt-4 flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Dados protegidos e criptografados
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlansSection;
