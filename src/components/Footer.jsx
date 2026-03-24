import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const whatsappNumber = '5547992838844';
  const whatsappMessage = encodeURIComponent('Gostaria de falar sobre o penhora.app.br');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <footer className="bg-white text-slate-900 border-t border-slate-100">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center space-x-3 mb-8 group transition-colors duration-200">
              <img 
                src="https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png" 
                alt="Penhora.app Logo" 
                className="h-9 w-auto"
              />
              <span className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors duration-200">Penhora.app.br</span>
            </Link>
            <p className="text-slate-600 text-base leading-relaxed">
              Solução completa para identificação e documentação de bens penhorados. Modernize suas diligências hoje mesmo.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <span className="font-bold text-xl mb-6 block text-slate-900 tracking-wide">Links Rápidos</span>
            <ul className="space-y-3 text-slate-600 text-base">
              <li><Link to="/" className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block">Home</Link></li>
              <li><Link to="/benefits" className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block">Benefícios</Link></li>
              {/* Removed /plans link as per previous task */}
              <li>
                <a 
                  href={whatsappLink}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <span className="font-bold text-xl mb-6 block text-slate-900 tracking-wide">Legal</span>
            <ul className="space-y-3 text-slate-600 text-base">
              <li><Link to="/termos-de-uso" className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block">Termos de uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block">Política de privacidade</Link></li>
            </ul>
          </div>

          {/* Partner Offerings */}
          <div>
            <span className="font-bold text-xl mb-6 block text-slate-900 tracking-wide">Parceiros</span>
            <ul className="space-y-3 text-slate-600 text-base">
              <li>
                <a 
                  href="https://sumulando.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Sumulando
                </a>
              </li>
              <li>
                <a 
                  href="https://agendar.adv.br" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Agendar
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-slate-100 mt-16 pt-8 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Penhora.app. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;