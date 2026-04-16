import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  FileText,
  ChevronDown,
  LogOut,
  PanelLeft,
  ShieldCheck,
  User,
  Users,
  Calendar,
  Shield,
  History,
  Gift,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',  module: null },
  { href: '/processes',  icon: FileText,         label: 'Penhoras',  module: 'processes' },
  { href: '/people',     icon: Users,            label: 'Pessoas',   module: 'people' },
  { href: '/calendar',   icon: Calendar,         label: 'Agenda',    module: 'calendar' },
];

const logoSrc = 'https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png';

// Returns true if the current user can view the given module.
// Account owners (no teamMembership) always can.
const canViewModule = (teamMembership, module) => {
  if (!module) return true;           // Dashboard — always visible
  if (!teamMembership) return true;   // Account owner — full access
  if (teamMembership.role === 'admin') return true;
  return !!(teamMembership.permissions?.[module]?.view);
};

const SidebarContent = ({ teamMembership }) => {
  const visibleItems = ALL_NAV_ITEMS.filter(item => canViewModule(teamMembership, item.module));

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logoSrc} alt="Penhora.app Logo" className="h-8 w-auto" />
          <span className="font-bold text-lg text-slate-800">Penhora.app.br</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 ${
                isActive ? 'bg-blue-50 text-blue-600 font-semibold' : ''
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Referral link — pinned to bottom */}
      <div className="px-4 pb-2">
        <NavLink
          to="/referrals"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-purple-100 text-purple-700'
                : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
            }`
          }
        >
          <Gift className="h-5 w-5" />
          Indicar Amigos
        </NavLink>
      </div>

      {/* Team member context badge */}
      {teamMembership && (
        <div className="m-4 p-3 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 font-medium truncate">
              {teamMembership.role === 'admin' ? 'Admin da conta' : 'Acesso compartilhado'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const UserMenu = () => {
  const { user, signOut, isAdmin, teamMembership } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/');
    }
  };

  // "Minha Equipe" is visible only to account owners (no membership) or team admins
  const canManageTeam = !teamMembership || teamMembership.role === 'admin';
  const canSeeAudit = canViewModule(teamMembership, 'audit');

  const userInitial =
    user?.user_metadata?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto px-2 space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">
            {userInitial}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || 'Usuário'}</p>
            <p className="text-xs text-slate-500">
              {teamMembership ? 'Acesso compartilhado' : user?.email}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            {teamMembership && (
              <p className="text-xs text-purple-600 font-medium mt-0.5">
                {teamMembership.role === 'admin' ? 'Administrador da equipe' : 'Membro da equipe'}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/account" className="w-full cursor-pointer flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Minha Conta</span>
          </Link>
        </DropdownMenuItem>

        {canManageTeam && (
          <DropdownMenuItem asChild>
            <Link to="/team" className="w-full cursor-pointer flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span>Equipe</span>
            </Link>
          </DropdownMenuItem>
        )}

        {canSeeAudit && (
          <DropdownMenuItem asChild>
            <Link to="/audit" className="w-full cursor-pointer flex items-center">
              <History className="mr-2 h-4 w-4" />
              <span>Auditoria</span>
            </Link>
          </DropdownMenuItem>
        )}

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="w-full cursor-pointer flex items-center text-blue-600 font-medium">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Gestão da Plataforma</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DashboardLayout = () => {
  const { teamMembership } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-slate-50/40 lg:block">
        <SidebarContent teamMembership={teamMembership} />
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-white px-4 md:px-6 lg:justify-end">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72 bg-white">
              <SidebarContent teamMembership={teamMembership} />
            </SheetContent>
          </Sheet>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
