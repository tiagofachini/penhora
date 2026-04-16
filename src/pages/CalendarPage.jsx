import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MapPin, Clock, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import DiligenceForm from '@/components/DiligenceForm';
import { formatAddress } from '@/lib/address';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon for Leaflet bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CalendarPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diligences, setDiligences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDiligence, setSelectedDiligence] = useState(null);
  
  // Map state for detail modal
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  // New Diligence State
  const [selectedDate, setSelectedDate] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [isFetchingProcesses, setIsFetchingProcesses] = useState(false);

  const fetchDiligences = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch diligences belonging to the current user's processes only
      const { data, error } = await supabase
        .from('diligences')
        .select(`
          *,
          processes!inner (
            id,
            process_number,
            parties_info,
            user_id
          )
        `)
        .eq('processes.user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setDiligences(data || []);
    } catch (error) {
      console.error("Error fetching diligences:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar calendário' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProcesses = async () => {
    try {
      setIsFetchingProcesses(true);
      const { data, error } = await supabase
        .from('processes')
        .select('id, process_number, parties_info')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error("Error fetching processes:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar processos' });
    } finally {
      setIsFetchingProcesses(false);
    }
  };

  useEffect(() => {
    fetchDiligences();
  }, [user]);

  // Geocode when detail modal opens with a diligence that has a location
  useEffect(() => {
    if (!isDetailModalOpen || !selectedDiligence?.location) {
      setMapCoordinates(null);
      return;
    }
    const address = formatAddress(selectedDiligence.location);
    if (!address) { setMapCoordinates(null); return; }

    setMapCoordinates(null);
    setMapLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
      headers: { 'Accept-Language': 'pt-BR' },
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setMapCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(() => {}) // silently ignore geocoding failures
      .finally(() => setMapLoading(false));
  }, [isDetailModalOpen, selectedDiligence]);

  // Calendar Logic
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Open add modal pre-filled with this date
    setSelectedDate(clickedDate);
    setSelectedProcessId(null); // Reset process selection
    fetchProcesses(); // Load processes for selection
    setIsAddModalOpen(true);
  };

  const handleEventClick = (e, diligence) => {
    e.stopPropagation();
    setSelectedDiligence(diligence);
    setIsDetailModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedDate(new Date());
    setSelectedProcessId(null);
    fetchProcesses();
    setIsAddModalOpen(true);
  };

  const onDiligenceSaved = () => {
    setIsAddModalOpen(false);
    fetchDiligences();
    toast({ title: "Diligência agendada com sucesso!" });
  };

  const renderCells = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const rows = [];
    let days = [];
    
    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/30 border-r border-b border-slate-100"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === dateToCheck.toDateString();
      
      const dayDiligences = diligences.filter(d => {
        if (!d.date) return false;
        const dDate = new Date(d.date);
        return dDate.getDate() === day && 
               dDate.getMonth() === currentDate.getMonth() && 
               dDate.getFullYear() === currentDate.getFullYear();
      });

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`group h-24 sm:h-32 border-r border-b border-slate-200 p-1 sm:p-2 transition-colors hover:bg-slate-50 relative cursor-pointer ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
              {day}
            </span>
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-full transition-opacity">
                <Plus className="h-3 w-3 text-slate-500" />
            </button>
          </div>
          
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-2rem)]">
            {dayDiligences.map(dil => {
                const statusColor = 
                    dil.status === 'Realizada' ? 'bg-green-100 text-green-700 border-green-200' : 
                    dil.status === 'Cancelada' ? 'bg-red-100 text-red-700 border-red-200' : 
                    'bg-blue-100 text-blue-700 border-blue-200';
                
                return (
                    <div 
                        key={dil.id}
                        onClick={(e) => handleEventClick(e, dil)}
                        className={`text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity font-medium ${statusColor}`}
                        title={`${dil.processes?.process_number} - ${formatAddress(dil.location)}`}
                    >
                        {dil.date && new Date(dil.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {dil.processes?.process_number}
                    </div>
                );
            })}
          </div>
        </div>
      );
    }

    // Pad end of row if necessary
    const totalSlots = days.length;
    const remainingSlots = 7 - (totalSlots % 7);
    if (remainingSlots < 7) {
        for (let i = 0; i < remainingSlots; i++) {
            days.push(<div key={`empty-end-${i}`} className="h-24 sm:h-32 bg-slate-50/30 border-r border-b border-slate-100"></div>);
        }
    }

    // Create rows
    let cells = [];
    cells.push(
        <div key="grid" className="grid grid-cols-7 border-l border-t border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Headers */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-b border-slate-200 bg-slate-50">
                    {d}
                </div>
            ))}
            {days}
        </div>
    );

    return cells;
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <>
      <Helmet>
        <title>Agenda de Diligências - Penhora.app.br</title>
      </Helmet>

      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-blue-600"/>
                {monthName}
            </h1>
            <div className="flex items-center bg-white rounded-md border shadow-sm">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-none border-r"><ChevronLeft className="h-4 w-4"/></Button>
                <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 rounded-none px-3 font-medium text-xs">Hoje</Button>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-none border-l"><ChevronRight className="h-4 w-4"/></Button>
            </div>
          </div>
          <Button onClick={handleAddClick} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nova Diligência
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 min-h-[600px]">
            {renderCells()}
        </div>
      </div>

      {/* Add Diligence Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Nova Diligência</DialogTitle>
                <DialogDescription>
                    Selecione um processo para agendar uma nova diligência.
                </DialogDescription>
            </DialogHeader>

            {!selectedProcessId ? (
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label>Selecione o Processo</Label>
                        <Select onValueChange={setSelectedProcessId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Buscar processo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {processes.map(proc => (
                                    <SelectItem key={proc.id} value={proc.id}>
                                        {proc.process_number || 'Sem número'} - {proc.parties_info?.executado || 'Executado não inf.'}
                                    </SelectItem>
                                ))}
                                {processes.length === 0 && !isFetchingProcesses && (
                                    <div className="p-2 text-sm text-slate-500 text-center">Nenhum processo encontrado.</div>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                            Apenas processos ativos aparecem nesta lista.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                    </div>
                </div>
            ) : (
                <DiligenceForm 
                    processId={selectedProcessId}
                    diligence={selectedDate ? { date: selectedDate.toISOString(), status: 'Agendada' } : null}
                    onSuccess={onDiligenceSaved}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${selectedDiligence?.status === 'Realizada' ? 'bg-green-500' : selectedDiligence?.status === 'Cancelada' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                    Diligência {selectedDiligence?.status}
                </DialogTitle>
                <DialogDescription>
                    Detalhes do agendamento
                </DialogDescription>
            </DialogHeader>

            {selectedDiligence && (
                <div className="space-y-6 py-4">
                    <div className="grid gap-4">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm text-slate-700">Data e Hora</h4>
                                <p className="text-sm text-slate-600">
                                    {new Date(selectedDiligence.date).toLocaleDateString('pt-BR')} às {new Date(selectedDiligence.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-semibold text-sm text-slate-700">Localização</h4>
                                    {formatAddress(selectedDiligence.location) && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(selectedDiligence.location))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
                                        >
                                            Google Maps <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mt-0.5">{formatAddress(selectedDiligence.location)}</p>

                                {/* Leaflet Map */}
                                {mapLoading && (
                                    <div className="mt-3 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-sm text-slate-400 animate-pulse">
                                        Carregando mapa…
                                    </div>
                                )}
                                {mapCoordinates && !mapLoading && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200" style={{ height: '220px' }}>
                                        <MapContainer
                                            center={mapCoordinates}
                                            zoom={16}
                                            scrollWheelZoom={false}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={mapCoordinates} />
                                        </MapContainer>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                             <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                             <div>
                                <h4 className="font-semibold text-sm text-slate-700">Processo Vinculado</h4>
                                <p className="text-sm text-slate-600 font-medium">{selectedDiligence.processes?.process_number}</p>
                                <div className="text-xs text-slate-500 mt-1">
                                    Exequente: {selectedDiligence.processes?.parties_info?.exequente || '-'} <br/>
                                    Executado: {selectedDiligence.processes?.parties_info?.executado || '-'}
                                </div>
                             </div>
                        </div>

                        {selectedDiligence.observations && (
                            <div className="bg-slate-50 p-3 rounded-md border text-sm">
                                <span className="font-semibold text-slate-700">Observações:</span>
                                <p className="text-slate-600 mt-1">{selectedDiligence.observations}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
                 <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
                 {selectedDiligence && (
                    <Button asChild className="w-full sm:w-auto">
                        <Link to={`/processes/${selectedDiligence.process_id}`}>
                            Ver Processo Completo <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                 )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarPage;