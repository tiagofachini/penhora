import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, FileText, UserCircle } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth(); 
  const { toast } = useToast();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Benefícios', path: '/benefits' },
  ];

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } else {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logoSrc} alt="Penhora.app Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg text-slate-800">Penhora.app.br</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  isActive(item.path) ? 'text-accent font-bold' : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" className="text-primary hover:text-accent hover:bg-transparent">
                      <FileText className="h-4 w-4 mr-2" /> Minhas Penhoras
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <UserCircle className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account">Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                   <Button variant="ghost" asChild className="text-primary hover:text-accent hover:bg-transparent">
                      <Link to="/login">Entrar</Link>
                   </Button>
                   <Button asChild className="bg-accent text-primary hover:bg-accent/90 font-bold">
                      <Link to="/signup">Começar Agora</Link>
                   </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link key={item.name} to={item.path} className="block py-2 text-base text-muted-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-4 mt-2 space-y-3">
                {user ? (
                  <>
                    <Button asChild className="w-full border-primary text-primary" variant="ghost" onClick={() => setIsMenuOpen(false)}>
                       <Link to="/dashboard">
                          <FileText className="h-4 w-4 mr-2" /> Minhas Penhoras
                       </Link>
                    </Button>
                    <Button asChild className="w-full border-primary text-primary" variant="ghost" onClick={() => setIsMenuOpen(false)}>
                       <Link to="/account">
                          <UserCircle className="h-4 w-4 mr-2" /> Meu Perfil
                       </Link>
                    </Button>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center py-2 w-full text-left text-base text-destructive hover:bg-red-50 hover:text-red-700 rounded-md">
                      <LogOut className="h-5 w-5 mr-3" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full border-primary text-primary" variant="outline">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>Entrar</Link>
                    </Button>
                    <Button asChild className="w-full bg-accent text-primary hover:bg-accent/90 font-bold">
                      <Link to="/signup" onClick={() => setIsMenuOpen(false)}>Começar Agora</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Header;