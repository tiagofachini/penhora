import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  FileText, 
  Shield, 
  Zap, 
  Scale, 
  Clock, 
  Users, 
  TrendingUp, 
  Check, 
  Scan,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import Header from '@/components/Header'; // Removed as it's global in App.jsx
import Footer from '@/components/Footer';

// --- Custom Visual Components ---

const CaptureVisual = () => (
  <div className="relative w-full max-w-md mx-auto perspective-1000">
    <div className="relative bg-slate-900 rounded-[2.5rem] border-8 border-slate-800 shadow-2xl overflow-hidden aspect-[9/16] max-h-[400px] mx-auto">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 z-20 flex justify-center">
        <div className="w-1/3 h-4 bg-black rounded-b-xl"></div>
      </div>
      
      {/* Screen Content */}
      <div className="relative h-full w-full bg-slate-900 flex flex-col">
         {/* Camera View */}
         <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
                {/* Abstract Item */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-slate-600 text-4xl font-bold">?</div>
                </div>
            </div>
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full aspect-square border-2 border-blue-500/50 rounded-lg relative">
                    {/* Corners */}
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-sm"></div>
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-sm"></div>
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-sm"></div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-sm"></div>
                    
                    {/* Scanning Line Animation */}
                    <motion.div 
                        className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>

            {/* Detection Label */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap border border-white/10"
            >
                <Scan className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium">Código de barras detectado</span>
            </motion.div>
         </div>

         {/* Bottom Controls */}
         <div className="h-20 bg-black/40 backdrop-blur-sm flex items-center justify-around px-6 absolute bottom-0 w-full">
            <div className="w-10 h-10 rounded-full bg-slate-700/50"></div>
            <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-14 h-14 bg-white rounded-full"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-700/50"></div>
         </div>
      </div>
    </div>
  </div>
);

const DocumentationVisual = () => (
  <div className="relative w-full max-w-md mx-auto perspective-1000 group">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-100 p-6 transform transition-transform duration-500 group-hover:rotate-1 group-hover:scale-105">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText className="h-5 w-5" />
                  </div>
                  <div>
                      <div className="text-sm font-bold text-slate-800">Ficha do Bem #492</div>
                      <div className="text-xs text-slate-400">Atualizado há 2 min</div>
                  </div>
              </div>
              <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              </div>
          </div>

          {/* Form Content */}
          <div className="space-y-5">
              {/* Image Placeholder */}
              <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                      <div className="h-full bg-slate-50 rounded-lg"></div>
                  </div>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                  <div>
                      <div className="text-xs text-slate-400 mb-1 font-medium">Descrição</div>
                      <div className="h-9 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-sm text-slate-700">
                          Televisor LED 50" Samsung 4K
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                       <div>
                          <div className="text-xs text-slate-400 mb-1 font-medium">Valor Est.</div>
                          <div className="h-9 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-sm text-slate-700 font-semibold">
                              R$ 2.500,00
                          </div>
                       </div>
                       <div>
                          <div className="text-xs text-slate-400 mb-1 font-medium">Estado</div>
                          <div className="h-9 bg-green-50 border border-green-100 rounded-md flex items-center px-3 text-sm text-green-700 gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Bom
                          </div>
                       </div>
                  </div>
              </div>
          </div>

          {/* Success Floating Badge */}
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -right-3 -bottom-3 bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-200"
          >
              <Check className="h-5 w-5" />
          </motion.div>
      </div>
  </div>
);

const ComplianceVisual = () => (
  <div className="relative w-full max-w-md mx-auto px-4">
      {/* Stack Effect */}
      <div className="absolute top-3 left-6 right-2 h-full bg-slate-100 rounded-xl border border-slate-200 transform rotate-2"></div>
      <div className="absolute top-6 left-8 right-0 h-full bg-slate-50 rounded-xl border border-slate-200 transform rotate-4"></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transform transition-all hover:-translate-y-1">
          <div className="bg-slate-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-sm tracking-wide">Conformidade CPC</span>
              </div>
              <div className="px-2 py-1 bg-blue-600 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                  Verificado
              </div>
          </div>
          
          <div className="p-6 relative">
              {/* Articles List */}
              <div className="space-y-4">
                  {[
                      { code: "Art. 835", text: "Ordem de Penhora", color: "text-blue-600" },
                      { code: "Art. 838", text: "Termo de Penhora", color: "text-purple-600" },
                      { code: "Art. 872", text: "Avaliação e Laudo", color: "text-emerald-600" }
                  ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <div className="flex-1">
                              <div className={`text-xs font-bold ${item.color}`}>{item.code}</div>
                              <div className="text-sm text-slate-600 font-medium">{item.text}</div>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Seal */}
              <div className="absolute bottom-2 right-4 opacity-10 pointer-events-none">
                  <Scale className="h-24 w-24 text-slate-900" />
              </div>
          </div>
      </div>
  </div>
);

const AutoGenerationVisual = () => (
  <div className="relative w-full max-w-md mx-auto h-64 flex items-center justify-center">
      {/* Background Circle */}
      <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-blue-50 rounded-full opacity-50 animate-pulse"></div>
      </div>

      <div className="relative flex items-center gap-6 z-10">
          {/* Source Doc */}
          <motion.div 
            animate={{ x: [0, 40, 0], opacity: [1, 0, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-24 bg-white rounded-lg shadow-md border border-slate-200 p-2 space-y-2"
          >
              <div className="w-8 h-1 bg-slate-300 rounded"></div>
              <div className="w-full h-1 bg-slate-100 rounded"></div>
              <div className="w-full h-1 bg-slate-100 rounded"></div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                  <div className="bg-slate-100 rounded h-6"></div>
                  <div className="bg-slate-100 rounded h-6"></div>
              </div>
          </motion.div>

          {/* Central Processor */}
          <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center text-white z-20 relative">
                  <Zap className="h-6 w-6" />
              </div>
              {/* Particles */}
              <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 -m-1 border-2 border-dashed border-blue-300 rounded-xl"
              />
          </div>

          {/* Result PDF */}
          <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: [0.8, 1.1, 1], opacity: [0, 1, 1] }}
             transition={{ duration: 4, repeat: Infinity, times: [0, 0.6, 1] }}
             className="w-24 h-28 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden relative"
          >
              {/* PDF Header */}
              <div className="h-8 bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white tracking-wider">PDF</span>
              </div>
              <div className="p-3 space-y-1.5">
                   <div className="w-12 h-1.5 bg-slate-200 rounded mb-2"></div>
                   <div className="w-full h-1 bg-slate-100 rounded"></div>
                   <div className="w-full h-1 bg-slate-100 rounded"></div>
                   <div className="w-3/4 h-1 bg-slate-100 rounded"></div>
                   {/* Signature Area */}
                   <div className="mt-3 border-b border-slate-200 w-12 ml-auto"></div>
              </div>
              {/* Check Badge */}
              <div className="absolute bottom-1 left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Check className="h-3 w-3 text-white" />
              </div>
          </motion.div>
      </div>
  </div>
);

// --- Main Component ---

const Benefits = () => {
  const mainBenefits = [
    {
      icon: Camera,
      title: 'Identificação por Foto e Código de Barras',
      description: 'Utilize a câmera do seu dispositivo para capturar imagens dos bens penhorados. O sistema também suporta leitura de códigos de barras para identificação rápida de produtos.',
      details: [
        'Reconhecimento automático de produtos',
        'Múltiplas fotos por item',
        'Scanner de código de barras integrado',
        'Armazenamento seguro na nuvem'
      ],
      visual: <CaptureVisual />
    },
    {
      icon: FileText,
      title: 'Documentação Detalhada de Bens',
      description: 'Registre todas as informações relevantes sobre cada bem penhorado de forma organizada e estruturada.',
      details: [
        'Descrição completa do bem',
        'Estado de conservação',
        'Características técnicas',
        'Observações personalizadas'
      ],
      visual: <DocumentationVisual />
    },
    {
      icon: Shield,
      title: 'Conformidade com CPC 835-836 e 870-872',
      description: 'Sistema desenvolvido em total conformidade com os artigos do Código de Processo Civil que regulamentam a penhora de bens.',
      details: [
        'Atende requisitos do Art. 835 (ordem de penhora)',
        'Conforme Art. 836 (substituição de bens)',
        'Segue Art. 870 (auto de penhora)',
        'Respeita Art. 872 (avaliação)'
      ],
      visual: <ComplianceVisual />
    },
    {
      icon: Zap,
      title: 'Geração Automática de Auto de Penhora',
      description: 'Crie documentos oficiais automaticamente com base nos dados coletados durante a diligência.',
      details: [
        'Formatação profissional',
        'Inclusão automática de fotos',
        'Assinatura digital',
        'Exportação em PDF'
      ],
      visual: <AutoGenerationVisual />
    }
  ];

  const additionalBenefits = [
    {
      icon: Clock,
      title: 'Economia de Tempo',
      description: 'Reduza o tempo de documentação em até 70%'
    },
    {
      icon: Users,
      title: 'Trabalho em Equipe',
      description: 'Colabore com sua equipe em tempo real'
    },
    {
      icon: TrendingUp,
      title: 'Aumento de Produtividade',
      description: 'Realize mais diligências com a mesma equipe'
    },
    {
      icon: Scale,
      title: 'Segurança Jurídica',
      description: 'Documentação completa e conforme a lei'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Benefícios - Penhora.app.br</title>
        <meta name="description" content="Conheça todos os benefícios do Penhora.app: identificação por foto e código de barras, documentação detalhada, conformidade com CPC e geração automática de relatórios." />
      </Helmet>

      {/* <Header /> Removed as it's global in App.jsx */}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=fit')] opacity-10 bg-cover bg-center"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-blue-50">
              Recursos que transformam seu trabalho
            </h1>
            <p className="text-xl text-blue-100">
              Tecnologia avançada para simplificar cada etapa da penhora e avaliação de bens
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Benefits */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {mainBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content Side */}
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm">
                    <benefit.icon className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                    {benefit.title}
                  </h2>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    {benefit.description}
                  </p>
                  <ul className="space-y-4">
                    {benefit.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start group">
                        <div className="mt-1 mr-3 flex-shrink-0">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                        </div>
                        <span className="text-slate-700 font-medium">{detail}</span>
                      </li>
                    ))}
                  </ul>
                  {/* "Saiba mais" button removed */}
                </div>

                {/* Visual Side */}
                <div className="flex-1 w-full">
                    <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-inner">
                        {benefit.visual}
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Mais Vantagens
            </h2>
            <p className="text-xl text-slate-600">
              Benefícios adicionais que fazem a diferença no seu dia a dia
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-blue-50">
              Comece a economizar tempo hoje
            </h2>
            <p className="text-xl mb-10 text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Junte-se a profissionais que já modernizaram suas rotinas com o Penhora.app. Acesso gratuito e ilimitado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50">
                    <Link to="/signup">Criar Conta Gratuitamente</Link>
                </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Benefits;