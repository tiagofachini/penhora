import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Camera, FileText, Shield, Zap, Smartphone, Cloud, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Home = () => {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Penhora.app",
    "headline": "Gestão Inteligente de Penhoras e Avaliações",
    "applicationCategory": "LegalSystem",
    "operatingSystem": "Web, iOS, Android",
    "description": "Ferramenta para Oficiais de Justiça. Realize penhoras, avaliações de bens e gere autos em PDF automaticamente conforme o CPC.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL",
      "seller": {
        "@type": "Organization",
        "name": "Penhora.app"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Penhora.app.br - O melhor software para Gestão de Penhoras</title>
        <meta name="description" content="Otimize suas diligências com o Penhora.app. Identificação por foto, conformidade com CPC (Art. 838), geração automática de autos em PDF e gestão completa de penhoras." />
        <meta name="keywords" content="penhora, oficial de justiça, avaliação de bens, cpc 838, auto de penhora, gestão de mandados, tribunal, judiciário, app para oficiais" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://penhora.app.br/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://penhora.app.br/" />
        <meta property="og:title" content="Penhora.app.br | O App do Oficial de Justiça" />
        <meta property="og:description" content="Automatize a descrição de bens, avaliações e a geração de autos de penhora. Economize tempo e garanta segurança jurídica." />
        <meta property="og:image" content="https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://penhora.app.br/" />
        <meta property="twitter:title" content="Penhora.app.br | Gestão de Penhoras" />
        <meta property="twitter:description" content="Otimize suas diligências de penhora. Identificação por foto e geração automática de autos." />
        <meta property="twitter:image" content="https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>
      
      <main className="bg-white">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-white">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    
                    {/* Hero Text */}
                    <div className="lg:w-1/2 text-center lg:text-left">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6 border border-secondary/20">
                                <span className="flex h-2 w-2 rounded-full bg-secondary mr-2"></span>
                                Nova versão 2.0 disponível
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6">
                                A revolução na <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">gestão de penhoras</span>
                            </h1>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">Simplifique a documentação de bens, garanta conformidade com o CPC e gere autos automaticamente. A ferramenta essencial para oficiais de justiça.</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 bg-accent text-primary hover:bg-accent/90 font-bold shadow-lg shadow-accent/20">
                                    <Link to="/signup">Começar Agora</Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 border-input hover:bg-secondary/5 hover:text-secondary text-primary">
                                    <Link to="/benefits" className="flex items-center">
                                        Ver Benefícios <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground font-medium">
                                <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-secondary mr-2" /> Conformidade CPC</div>
                                <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-secondary mr-2" /> Autos em PDF</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Hero Visual - Dashboard Mockup */}
                    <div className="lg:w-1/2 w-full perspective-1000">
                         <motion.div 
                            initial={{ opacity: 0, rotateX: 10, y: 40 }} 
                            animate={{ opacity: 1, rotateX: 0, y: 0 }} 
                            transition={{ duration: 0.8, delay: 0.2 }} 
                            className="relative"
                         >
                            {/* Main Window */}
                            <div className="bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
                                {/* Window Header */}
                                <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-accent"></div>
                                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                    </div>
                                    <div className="ml-4 bg-white border border-border rounded-md px-3 py-1 text-xs text-muted-foreground flex-1 flex items-center justify-between">
                                        <span>penhora.app.br/dashboard</span>
                                    </div>
                                </div>

                                {/* App Interface */}
                                <div className="flex h-[400px]">
                                    {/* Sidebar */}
                                    <div className="w-64 bg-muted/30 border-r border-border p-4 hidden md:block">
                                        <div className="flex items-center gap-2 mb-8">
                                            <img src="https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png" alt="Penhora.app Logo" className="h-7 w-auto" />
                                            <span className="font-bold text-lg text-slate-800">Penhora.app.br</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="bg-primary/10 text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3">
                                                <LayoutDashboard className="h-4 w-4" /> Dashboard
                                            </div>
                                            <div className="text-muted-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3">
                                                <FileText className="h-4 w-4" /> Processos
                                            </div>
                                            <div className="text-muted-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3">
                                                <Camera className="h-4 w-4" /> Itens
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-6 bg-white overflow-hidden">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-primary text-lg">Visão Geral</h3>
                                            <div className="w-8 h-8 rounded-full bg-muted"></div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            {[{
                                              label: 'Processos Ativos',
                                              val: '24',
                                              color: 'text-primary',
                                              bg: 'bg-primary/10'
                                            }, {
                                              label: 'Bens Avaliados',
                                              val: '156',
                                              color: 'text-secondary',
                                              bg: 'bg-secondary/10'
                                            }, {
                                              label: 'Total Avaliado',
                                              val: 'R$ 2.4M',
                                              color: 'text-accent-foreground',
                                              bg: 'bg-accent/20'
                                            }].map((stat, i) => (
                                                <div key={i} className="bg-white border border-border rounded-lg p-4 shadow-sm">
                                                    <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                                                    <div className={`text-xl font-bold ${stat.color}`}>{stat.val}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border border-border rounded-lg overflow-hidden">
                                            <div className="bg-muted/30 px-4 py-2 border-b border-border text-xs font-semibold text-muted-foreground">
                                                Processos Recentes
                                            </div>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="px-4 py-3 border-b border-border flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-primary">Proc. #8921-{i}</div>
                                                            <div className="text-xs text-muted-foreground">Vara Cível SP</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                                                        Ativo
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements for Depth */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }} 
                                transition={{ repeat: Infinity, duration: 5 }} 
                                className="absolute -right-8 top-20 bg-white p-4 rounded-lg shadow-xl border border-border max-w-[180px] hidden md:block"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Status</div>
                                        <div className="text-sm font-bold text-primary">Auto Gerado</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-secondary w-full"></div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-24 bg-muted/20" id="features">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true }} 
                        className="text-secondary font-semibold text-sm tracking-wider uppercase mb-2 block"
                    >
                        Funcionalidades Poderosas
                    </motion.span>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true }} 
                        transition={{ delay: 0.1 }} 
                        className="text-3xl md:text-4xl font-bold text-primary mb-4"
                    >
                        Tudo que você precisa para <br /> gerenciar penhoras com excelência
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true }} 
                        transition={{ delay: 0.2 }} 
                        className="text-lg text-muted-foreground"
                    >
                        Uma suite completa de ferramentas projetada para modernizar o trabalho de oficiais de justiça e escritórios de advocacia.
                    </motion.p>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[{
                      icon: Camera,
                      title: "Captura Inteligente",
                      description: "Fotografe bens e deixe o sistema organizar. Reconhecimento automático e leitura de códigos de barras.",
                      color: "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                    }, {
                      icon: Shield,
                      title: "Conformidade CPC",
                      description: "Totalmente alinhado com os artigos 835, 838 e 872. Segurança jurídica para todos os seus atos.",
                      color: "bg-secondary/5 text-secondary group-hover:bg-secondary group-hover:text-white"
                    }, {
                      icon: FileText,
                      title: "Autos Automáticos",
                      description: "Gere o Auto de Penhora e Avaliação em PDF com um clique, já formatado e com as fotos inseridas.",
                      color: "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                    }, {
                      icon: Cloud,
                      title: "Nuvem Segura",
                      description: "Seus dados criptografados e acessíveis de qualquer lugar. Nunca mais perca um documento importante.",
                      color: "bg-secondary/5 text-secondary group-hover:bg-secondary group-hover:text-white"
                    }, {
                      icon: Smartphone,
                      title: "Mobile First",
                      description: "Interface otimizada para tablets e smartphones. Realize a penhora direto do local da diligência.",
                      color: "bg-accent/10 text-accent-foreground group-hover:bg-accent group-hover:text-primary"
                    }, {
                      icon: Zap,
                      title: "Produtividade",
                      description: "Reduza em até 70% o tempo gasto na elaboração de relatórios e organização de fotos pós-diligência.",
                      color: "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                    }].map((feature, index) => (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: true }} 
                            transition={{ delay: index * 0.1 }} 
                            className="group bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 transition-colors duration-300 shadow-sm`}>
                                <feature.icon className="h-7 w-7" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                            
                            {/* Decorative element for hover */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-primary mb-4">Como funciona</h2>
                    <p className="text-lg text-muted-foreground">Do início ao fim em poucos minutos</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-muted z-0"></div>

                    {[{
                      step: '01',
                      title: 'Cadastre o Processo',
                      desc: 'Insira os dados básicos do processo e devedor.'
                    }, {
                      step: '02',
                      title: 'Registre os Bens',
                      desc: 'Fotografe e descreva os itens no local.'
                    }, {
                      step: '03',
                      title: 'Gere o Documento',
                      desc: 'O sistema cria o auto pronto para assinatura.'
                    }].map((item, i) => (
                        <div key={i} className="relative z-10 text-center">
                            <div className="w-24 h-24 bg-white rounded-full border-4 border-secondary/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <span className="text-3xl font-bold text-secondary">{item.step}</span>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">{item.title}</h3>
                            <p className="text-muted-foreground px-4">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-primary text-white relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#085454_1px,transparent_1px)] [background-size:16px_16px]"></div>
             <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para modernizar suas penhoras?</h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                    Junte-se a centenas de profissionais que já economizam tempo e garantem mais segurança jurídica.
                </p>
                <Button size="lg" asChild className="bg-accent text-primary hover:bg-accent/90 font-bold px-8 h-14 text-lg shadow-lg">
                    <Link to="/signup">Começar Agora</Link>
                </Button>
                <p className="mt-6 text-sm text-gray-400">Acesso completo e ilimitado • Sem restrições</p>
             </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};
export default Home;