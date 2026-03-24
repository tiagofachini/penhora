import React from 'react';
import { Helmet } from 'react-helmet';
import Footer from '@/components/Footer';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>Termos de Uso - Penhora.app.br</title>
        <meta name="description" content="Termos de uso e condições do Penhora.app.br" />
      </Helmet>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Termos de Uso</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o Penhora.app.br, você aceita e concorda em cumprir os seguintes termos e condições. Se você não concordar com qualquer parte destes termos, você não deve utilizar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Descrição do Serviço</h2>
            <p>
              O Penhora.app.br é uma ferramenta SaaS (Software as a Service) destinada a auxiliar oficiais de justiça, advogados e outros profissionais na identificação, documentação e avaliação de bens penhorados. O serviço inclui funcionalidades de captura de fotos, leitura de códigos de barras, armazenamento em nuvem e geração de relatórios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Cadastro e Segurança</h2>
            <p>
              Para utilizar o serviço, você deve criar uma conta fornecendo informações precisas e completas. Você é responsável por manter a confidencialidade de sua senha e conta, e por todas as atividades que ocorrem sob sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Uso Aceitável</h2>
            <p>
              Você concorda em não usar o serviço para qualquer finalidade ilegal ou não autorizada. O uso do serviço não deve violar nenhuma lei em sua jurisdição (incluindo, mas não se limitando a leis de direitos autorais ou privacidade).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Propriedade Intelectual</h2>
            <p>
              O serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva do Penhora.app.br e seus licenciadores. O serviço é protegido por direitos autorais, marcas registradas e outras leis do Brasil e de outros países.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Limitação de Responsabilidade</h2>
            <p>
              Em nenhum caso o Penhora.app.br, seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados, serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco através do suporte disponível na plataforma ou pelo WhatsApp oficial.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;