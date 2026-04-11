import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Package, 
  Plus, 
  ArrowRight, 
  Clock,
  CalendarCheck,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { formatAddress } from '@/lib/address';

const StatCard = ({ title, value, icon: Icon, description, loading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-slate-400" />}
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    processCount: 0,
    itemCount: 0,
    diligenceCount: 0,
    diligenceToday: 0,
    totalValue: 0
  });
  const [recentProcesses, setRecentProcesses] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 1. Process Count
        const { count: processCount, error: processError } = await supabase
          .from('processes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (processError) throw processError;

        // 2. Item Count — filtrado pelos processos do usuário
        const { count: itemCount, error: itemError } = await supabase
          .from('seized_items')
          .select('id, processes!inner(user_id)', { count: 'exact', head: true })
          .eq('processes.user_id', user.id);

        if (itemError) throw itemError;

        // 3. Diligences (Total & Today) — filtrado pelos processos do usuário
        const { count: totalDiligences } = await supabase
          .from('diligences')
          .select('id, processes!inner(user_id)', { count: 'exact', head: true })
          .eq('processes.user_id', user.id);

        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count: todayDiligences } = await supabase
          .from('diligences')
          .select('id, processes!inner(user_id)', { count: 'exact', head: true })
          .eq('processes.user_id', user.id)
          .gte('date', today.toISOString())
          .lt('date', tomorrow.toISOString());

        // 4. Total Value of Seized Items
        const { data: itemsValueData, error: valError } = await supabase
            .from('seized_items')
            .select(`
                initial_valuation, 
                quantity,
                processes!inner(user_id)
            `)
            .eq('processes.user_id', user.id);

        if (valError) throw valError;

        const totalCalculatedValue = itemsValueData?.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 1;
            const val = parseFloat(item.initial_valuation) || 0;
            return sum + (qty * val);
        }, 0) || 0;

        // 5. Recent Processes List
        const { data: processesData } = await supabase
          .from('processes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(0, 5);

        if (isMounted) {
          setStats({
            processCount: processCount || 0,
            itemCount: itemCount || 0,
            diligenceCount: totalDiligences || 0,
            diligenceToday: todayDiligences || 0,
            totalValue: totalCalculatedValue
          });
          setRecentProcesses(processesData || []);
        }

      } catch (error) {
        console.error("Dashboard Data Error:", error);
        if (isMounted) {
          toast({
            variant: "destructive",
            title: "Erro ao carregar dados",
            description: "Não foi possível atualizar as informações do dashboard."
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => { isMounted = false; };
  }, [user, toast]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Penhora.app</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Olá, {user?.user_metadata?.name?.split(' ')[0] || 'Visitante'}!
            </h1>
            <p className="text-slate-500 mt-1">
              Aqui está o resumo da sua atividade recente.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button asChild variant="outline" className="shadow-sm">
              <Link to="/audit">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Auditoria
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link to="/processes/new">
                <Plus className="mr-2 h-4 w-4" />
                Nova Penhora
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid - 4 Columns */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total de Penhoras" 
            value={stats.processCount} 
            icon={FileText} 
            loading={loading}
            description="Penhoras registradas" 
          />
          <StatCard 
            title="Bens à penhorar" 
            value={stats.itemCount} 
            icon={Package} 
            loading={loading}
            description="Total de bens capturados"
          />
          <StatCard 
            title="Diligências" 
            value={`${stats.diligenceToday} / ${stats.diligenceCount}`} 
            icon={CalendarCheck} 
            loading={loading}
            description="Hoje / Total acumulado"
          />
           <StatCard 
            title="Valor Total Estimado" 
            value={formatCurrency(stats.totalValue)} 
            icon={DollarSign} 
            loading={loading}
            description="Somatória das avaliações"
          />
        </div>

        <div className="grid gap-4 grid-cols-1">
          {/* Main Content Area: Recent Penhoras - Now Full Width */}
          <div className="col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Penhoras Recentes</CardTitle> 
                  <CardDescription>
                    Seus últimos registros de penhora e avaliação.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-slate-100 animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-[250px] bg-slate-100 animate-pulse rounded" />
                                    <div className="h-4 w-[200px] bg-slate-100 animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                  ) : recentProcesses.length > 0 ? (
                    <div className="space-y-1">
                      {recentProcesses.map((process) => (
                        <div
                          key={process.id}
                          className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                        >
                          <Link to={`/processes/${process.id}`} className="flex items-start gap-4 flex-1 w-full">
                            <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {process.process_number || "Penhora sem número"}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-3.5 w-3.5" />
                                  {formatDate(process.created_at)}
                                </span>
                                {process.execution_location && (
                                    <span>• {formatAddress(process.execution_location)}</span>
                                )}
                              </div>
                            </div>
                          </Link>
                          
                          <div className="mt-4 sm:mt-0 flex items-center self-end sm:self-center pl-0 sm:pl-4">
                            <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600">
                                <Link to={`/processes/${process.id}`}>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">Nenhuma penhora encontrada</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                          Você ainda não registrou nenhuma penhora. Comece criando a primeira agora. 
                        </p>
                      </div>
                      <Button asChild variant="outline" className="mt-4">
                        <Link to="/processes/new">
                          Criar Penhora
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;