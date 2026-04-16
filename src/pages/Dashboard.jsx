import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  Package,
  Plus,
  ArrowRight,
  CalendarCheck,
  DollarSign,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { formatAddress } from '@/lib/address';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const getDateInfo = (dateString) => {
  if (!dateString) return { label: 'N/A', variant: 'gray' };
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const t = new Date(today); t.setHours(0, 0, 0, 0);
  const tm = new Date(tomorrow); tm.setHours(0, 0, 0, 0);

  const fullDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (d.getTime() === t.getTime()) return { label: 'Hoje', fullDate, variant: 'red' };
  if (d.getTime() === tm.getTime()) return { label: 'Amanhã', fullDate, variant: 'amber' };
  const diffDays = (d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return { label: fullDate, fullDate, variant: 'orange' };
  return { label: fullDate, fullDate, variant: 'blue' };
};

const variantClasses = {
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-slate-100 text-slate-500',
};

const StatCard = ({ title, value, icon: Icon, description, loading, color = 'blue' }) => {
  const iconClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-28 bg-slate-100 animate-pulse rounded" />
            <div className="h-9 w-20 bg-slate-100 animate-pulse rounded" />
            <div className="h-3 w-36 bg-slate-100 animate-pulse rounded" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold text-slate-800 mt-1 truncate">{value}</p>
              {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
            </div>
            <div className={`p-3 rounded-xl flex-shrink-0 ${iconClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [periodDate, setPeriodDate] = useState(new Date());
  const [upcomingDiligences, setUpcomingDiligences] = useState([]);
  const [periodStats, setPeriodStats] = useState({
    processCount: 0,
    itemCount: 0,
    diligenceCount: 0,
    totalValue: 0,
  });

  const prevMonth = () => setPeriodDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setPeriodDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const isCurrentMonth =
    periodDate.getMonth() === new Date().getMonth() &&
    periodDate.getFullYear() === new Date().getFullYear();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const monthStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
      const monthEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // 1. Upcoming scheduled diligences (today onwards, status Agendada)
      const { data: upcoming } = await supabase
        .from('diligences')
        .select(`
          id,
          date,
          location,
          status,
          process_id,
          processes!inner(
            id,
            process_number,
            parties_info,
            execution_location,
            user_id
          )
        `)
        .eq('processes.user_id', user.id)
        .eq('status', 'Agendada')
        .gte('date', todayStart.toISOString())
        .order('date', { ascending: true })
        .limit(8);

      // 2. Completed diligences in the selected period
      const { data: completedDiligences, count: completedCount } = await supabase
        .from('diligences')
        .select('id, process_id, processes!inner(user_id)', { count: 'exact' })
        .eq('processes.user_id', user.id)
        .eq('status', 'Realizada')
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString());

      const completedProcessIds = [...new Set(completedDiligences?.map(d => d.process_id) || [])];
      const completedDiligenceIds = completedDiligences?.map(d => d.id) || [];

      // 3. Items from those completed diligences
      let itemCount = 0;
      let totalValue = 0;

      if (completedDiligenceIds.length > 0) {
        const { data: items } = await supabase
          .from('seized_items')
          .select('initial_valuation, quantity')
          .in('diligence_id', completedDiligenceIds);

        itemCount = items?.length || 0;
        totalValue = items?.reduce((sum, item) => {
          const qty = parseFloat(item.quantity) || 1;
          const val = parseFloat(item.initial_valuation) || 0;
          return sum + qty * val;
        }, 0) || 0;
      }

      setUpcomingDiligences(upcoming || []);
      setPeriodStats({
        processCount: completedProcessIds.length,
        itemCount,
        diligenceCount: completedCount || 0,
        totalValue,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível atualizar o dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, periodDate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLocation = (diligence) => {
    const loc = diligence.location || diligence.processes?.execution_location;
    if (!loc) return null;
    return formatAddress(loc);
  };

  const getExecutado = (diligence) => {
    const info = diligence.processes?.parties_info;
    if (!info) return null;
    try {
      const parsed = typeof info === 'string' ? JSON.parse(info) : info;
      return parsed?.executado || null;
    } catch {
      return null;
    }
  };

  const openMaps = (address) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const periodLabel = periodDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <>
      <Helmet>
        <title>Dashboard | Penhora.app.br</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-10 pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Olá, {user?.user_metadata?.name?.split(' ')[0] || 'Visitante'}!
            </h1>
            <p className="text-slate-500 mt-1">
              Aqui está o resumo das suas atividades.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link to="/processes/new">
                <Plus className="mr-2 h-4 w-4" />
                Nova Penhora
              </Link>
            </Button>
          </div>
        </div>

        {/* Section 1: Upcoming penhoras */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Próximas Penhoras</h2>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : upcomingDiligences.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                <div className="p-4 bg-slate-50 rounded-full">
                  <CalendarCheck className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-700">Nenhuma penhora agendada</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Você não tem diligências com status "Agendada" para os próximos dias.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link to="/processes/new">Agendar nova penhora</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingDiligences.map((diligence) => {
                const address = getLocation(diligence);
                const executado = getExecutado(diligence);
                const { label, fullDate, variant } = getDateInfo(diligence.date);

                return (
                  <Card key={diligence.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Date column */}
                        <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-2.5 flex-shrink-0 min-w-[60px] ${variantClasses[variant]}`}>
                          {label === 'Hoje' || label === 'Amanhã' ? (
                            <>
                              <Clock className="h-4 w-4 mb-1" />
                              <span className="text-xs font-bold leading-tight">{label}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl font-bold leading-none">
                                {new Date(diligence.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                              </span>
                              <span className="text-xs font-medium mt-0.5">
                                {new Date(diligence.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Info column */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {diligence.processes?.process_number || 'Penhora sem número'}
                          </p>

                          {executado && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <p className="text-sm text-slate-600 truncate">{executado}</p>
                            </div>
                          )}

                          {address && (
                            <div className="flex items-start gap-1.5 mt-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-500 line-clamp-2 leading-snug">{address}</p>
                            </div>
                          )}

                          {label !== 'Hoje' && label !== 'Amanhã' && (
                            <p className="text-xs text-slate-400 mt-1.5">{fullDate}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                        {address && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1.5"
                            onClick={() => openMaps(address)}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Ver no Mapa
                            <ExternalLink className="h-3 w-3 opacity-40" />
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                        >
                          <Link to={`/processes/${diligence.processes?.id}`}>
                            Ver Processo
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Period Summary */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Resumo do Período</h2>
            </div>

            {/* Month navigator */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevMonth}
                className="h-7 w-7 p-0 hover:bg-white rounded-md"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </Button>
              <span className="text-sm font-medium text-slate-700 capitalize px-3 min-w-[130px] text-center">
                {periodLabel}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                disabled={isCurrentMonth}
                className="h-7 w-7 p-0 hover:bg-white rounded-md disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Penhoras Realizadas"
              value={periodStats.processCount}
              icon={FileText}
              loading={loading}
              color="blue"
              description="Processos com diligência concluída"
            />
            <StatCard
              title="Bens Localizados"
              value={periodStats.itemCount}
              icon={Package}
              loading={loading}
              color="purple"
              description="Itens apreendidos no período"
            />
            <StatCard
              title="Diligências Executadas"
              value={periodStats.diligenceCount}
              icon={CheckCircle2}
              loading={loading}
              color="green"
              description='Status "Realizada" no período'
            />
            <StatCard
              title="Valor Total dos Bens"
              value={formatCurrency(periodStats.totalValue)}
              icon={DollarSign}
              loading={loading}
              color="amber"
              description="Somatória das avaliações"
            />
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
