import React from 'react';
import { Helmet } from 'react-helmet';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>Política de Privacidade - Penhora.app.br</title>
        <meta name="description" content="Política de privacidade e proteção de dados do Penhora.app.br" />
      </Helmet>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introdução</h2>
            <p>
              Sua privacidade é importante para nós. É política do Penhora.app.br respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Penhora.app.br e outros sites que possuímos e operamos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Coleta de Informações</h2>
            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
            </p>
            <p className="mt-2">
              Os tipos de dados coletados podem incluir:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Dados de identificação (Nome, E-mail, Telefone/WhatsApp).</li>
              <li>Dados relacionados aos processos e bens cadastrados na plataforma.</li>
              <li>Logs de acesso e informações técnicas do dispositivo para fins de segurança e melhoria do serviço.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Uso das Informações</h2>
            <p>
              Utilizamos as informações coletadas para operar, manter e melhorar nossos serviços. As informações dos processos e bens penhorados são armazenadas de forma segura e acessadas apenas pelo usuário proprietário da conta ou conforme permissões concedidas por ele.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Retenção de Dados</h2>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Compartilhamento de Dados</h2>
            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Cookies</h2>
            <p>
              Utilizamos cookies para melhorar a experiência do usuário, analisar o tráfego e personalizar conteúdo. Você pode configurar seu navegador para recusar todos ou alguns cookies, mas isso pode afetar a funcionalidade do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Seus Direitos (LGPD)</h2>
            <p>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, portar e eliminar seus dados pessoais, além de confirmar a existência de tratamento de dados. Para exercer esses direitos, entre em contato conosco através dos canais oficiais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Compromisso do Usuário</h2>
            <p>
              O usuário se compromete a fazer uso adequado dos conteúdos e informações que o Penhora.app.br oferece no site e com caráter enunciativo, mas não limitativo:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé e à ordem pública;</li>
              <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
              <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Penhora.app.br, de seus fornecedores ou terceiros.</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;