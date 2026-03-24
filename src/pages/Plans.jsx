import React from 'react';
import { Helmet } from 'react-helmet';
// import Header from '@/components/Header'; // Removed as it's global in App.jsx
import Footer from '@/components/Footer';
import PlansSection from '@/components/PlansSection';

const Plans = () => {
  return (
    <>
      <Helmet>
        <title>Planos e preços - Penhora.app</title>
        <meta name="description" content="Escolha o plano ideal: Starter com 7 dias de teste gratuito ou Professional com preços dinâmicos a partir de R$ 29/mês." />
      </Helmet>

      {/* <Header /> Removed as it's global in App.jsx */}

      <main>
        <PlansSection />
      </main>

      <Footer />
    </>
  );
};

export default Plans;