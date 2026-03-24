import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    FileText, Calendar, MapPin, Users, Plus, Trash2, Edit, Scale, 
    Loader2, Box, Truck, Clock, AlertTriangle, ArrowLeft, Printer,
    CheckCircle2, XCircle, MoreVertical, Gavel, ExternalLink
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SeizedItemForm from '@/pages/processes/SeizedItemForm';
import DiligenceForm from '@/components/DiligenceForm';
import { formatAddress } from '@/lib/address';
import ScanItemDialog from '@/components/ScanItemDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';

// Helper to convert image URL to base64
const getBase64FromUrl = async (url) => {
    if (!url) return null;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn("Failed to load image for PDF:", url);
        return null;
    }
};

const ProcessDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [process, setProcess] = useState(null);
    const [seizedItems, setSeizedItems] = useState([]);
    const [diligences, setDiligences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [checkingLimits, setCheckingLimits] = useState(false);
    
    // Modals
    const [isItemFormOpen, setIsItemFormOpen] = useState(false);
    const [itemFormMode, setItemFormMode] = useState('manual');
    const [isDiligenceFormOpen, setIsDiligenceFormOpen] = useState(false);
    const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
    
    // Selection state
    const [currentItem, setCurrentItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentDiligence, setCurrentDiligence] = useState(null);
    const [diligenceToDelete, setDiligenceToDelete] = useState(null);
    const [selectedDiligenceId, setSelectedDiligenceId] = useState(null);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const fetchProcessDetails = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Process
            const { data: processData, error: processError } = await supabase
                .from('processes')
                .select('*')
                .eq('id', id)
                .single();
            if (processError) throw processError;
            setProcess(processData);
            
            // Fetch Diligences
            const { data: diligenceData, error: diligenceError } = await supabase
                .from('diligences')
                .select('*')
                .eq('process_id', id)
                .order('date', { ascending: false });
            if (diligenceError) throw diligenceError;
            setDiligences(diligenceData || []);

            // Fetch Bens
            const { data: itemsData, error: itemsError } = await supabase
                .from('seized_items')
                .select('*')
                .eq('process_id', id)
                .order('created_at', { ascending: true });
            if (itemsError) throw itemsError;
            setSeizedItems(itemsData);

        } catch (error) {
            console.error('Error fetching details:', error);
            toast({ variant: "destructive", title: "Erro ao carregar dados", description: error.message });
            navigate('/processes');
        } finally {
            setLoading(false);
        }
    }, [id, toast, navigate]);

    useEffect(() => {
        fetchProcessDetails();
    }, [fetchProcessDetails]);

    // Check Limit before opening item form
    const handleOpenItemForm = async (mode, dilId = null) => {
        setCheckingLimits(true);
        try {
            // 1. Get User Limits
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('item_limit, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            const limit = sub?.status === 'active' || sub?.status === 'trialing' ? (sub.item_limit ?? 100) : 100;

            // 2. Get Current Items Count (Total for User)
            const { count } = await supabase
                .from('seized_items')
                .select('*, processes!inner(user_id)', { count: 'exact', head: true })
                .eq('processes.user_id', user.id);

            // 3. Check
            if (count >= limit) {
                 toast({
                    variant: 'destructive',
                    title: "Limite de Itens Atingido",
                    description: `Você atingiu o limite de ${limit} itens do seu plano. Faça um upgrade na página Meu Plano.`,
                    action: <Button variant="outline" size="sm" onClick={() => navigate('/my-plan')} className="bg-white text-black border-slate-300">Meu Plano</Button>
                });
                return;
            }

            // Proceed
            setCurrentItem(null);
            setItemFormMode(mode);
            setSelectedDiligenceId(dilId);
            setIsItemFormOpen(true);

        } catch (error) {
             console.error("Limit check error", error);
             // Allow proceed on error to be safe/lenient
             setCurrentItem(null);
             setItemFormMode(mode);
             setSelectedDiligenceId(dilId);
             setIsItemFormOpen(true);
        } finally {
            setCheckingLimits(false);
        }
    };

    // Computed Info: Calculate Next Diligence
    const nextDiligence = useMemo(() => {
        const now = new Date();
        const future = diligences
            .filter(d => new Date(d.date) >= now && d.status === 'Agendada')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        return future[0] || null;
    }, [diligences]);

    // Computed Info: Display List with Priority Sorting
    const sortedDisplayDiligences = useMemo(() => {
        if (!nextDiligence) return diligences;
        const others = diligences
            .filter(d => d.id !== nextDiligence.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        return [nextDiligence, ...others];
    }, [diligences, nextDiligence]);

    const handleGeneratePDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let currentY = 20;

            // --- HEADER ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("AUTO DE PENHORA, AVALIAÇÃO E DEPÓSITO", pageWidth / 2, currentY, { align: "center" });
            currentY += 10;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("(Nos termos do Art. 838 do CPC)", pageWidth / 2, currentY, { align: "center" });
            currentY += 15;

            // --- PARTIES BOX ---
            doc.setDrawColor(0);
            doc.setFillColor(250, 250, 250);
            doc.rect(14, currentY, pageWidth - 28, 45, "F");
            doc.rect(14, currentY, pageWidth - 28, 45, "S");

            doc.setFontSize(10);
            
            const leftX = 18;
            const labelWidth = 35;
            
            // Process Number
            doc.setFont("helvetica", "bold");
            doc.text("Processo nº:", leftX, currentY + 8);
            doc.setFont("helvetica", "normal");
            doc.text(process.process_number || "Não informado", leftX + labelWidth, currentY + 8);

            // Exequente
            doc.setFont("helvetica", "bold");
            doc.text("Exequente:", leftX, currentY + 16);
            doc.setFont("helvetica", "normal");
            doc.text(process.parties_info?.exequente || "Não informado", leftX + labelWidth, currentY + 16);

            // Executado
            doc.setFont("helvetica", "bold");
            doc.text("Executado:", leftX, currentY + 24);
            doc.setFont("helvetica", "normal");
            doc.text(process.parties_info?.executado || "Não informado", leftX + labelWidth, currentY + 24);

            // Depositary
            doc.setFont("helvetica", "bold");
            doc.text("Depositário:", leftX, currentY + 32);
            doc.setFont("helvetica", "normal");
            doc.text(process.parties_info?.depositary || "A ser nomeado no ato", leftX + labelWidth, currentY + 32);

            // Deposit Location
            doc.setFont("helvetica", "bold");
            doc.text("Local Depósito:", leftX, currentY + 40);
            doc.setFont("helvetica", "normal");
            doc.text(process.parties_info?.deposit_location || "No local da penhora", leftX + labelWidth, currentY + 40);
            
            currentY += 55;

            // Group items by diligence
            const itemsByDiligence = {};
            diligences.forEach(d => itemsByDiligence[d.id] = []);
            const orphanedItems = [];
            
            seizedItems.forEach(item => {
                if (item.diligence_id && itemsByDiligence[item.diligence_id]) {
                    itemsByDiligence[item.diligence_id].push(item);
                } else {
                    orphanedItems.push(item);
                }
            });

            // Helper to add item table
            const addItemsTable = async (items) => {
                 const tableBody = [];
                 for (const item of items) {
                     const imgData = await getBase64FromUrl(item.photo_url);
                     const qtd = parseFloat(item.quantity) || 1;
                     const val = parseFloat(item.initial_valuation) || 0;
                     const total = qtd * val;
                     
                     let fullDesc = item.item_description;
                     if(item.brand) fullDesc += `\nMarca: ${item.brand}`;
                     if(item.condition) fullDesc += `\nEstado: ${item.condition}`;
                     if(item.characteristics) fullDesc += `\n${item.characteristics}`;
                     if(item.barcode) fullDesc += `\nCódigo: ${item.barcode}`;

                     tableBody.push([
                         imgData, 
                         fullDesc,
                         qtd.toString(),
                         formatCurrency(val),
                         formatCurrency(total)
                     ]);
                 }

                 doc.autoTable({
                    startY: currentY,
                    head: [['Foto', 'Descrição Detalhada e Características', 'Qtd', 'Avaliação Unit.', 'Total']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [40, 40, 40], halign: 'center', fontSize: 9 },
                    styles: { fontSize: 9, cellPadding: 3, valign: 'middle', overflow: 'linebreak' },
                    columnStyles: {
                        0: { cellWidth: 25, minCellHeight: 20 }, 
                        1: { cellWidth: 90 }, // Wider description
                        2: { halign: 'center', cellWidth: 15 },
                        3: { halign: 'right', cellWidth: 25 },
                        4: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
                    },
                    didParseCell: (data) => {
                        if (data.section === 'body' && data.column.index === 0) {
                             data.cell.customImages = data.cell.raw;
                             data.cell.text = ''; 
                        }
                    },
                    didDrawCell: (data) => {
                        if (data.section === 'body' && data.column.index === 0 && data.cell.customImages) {
                             try {
                                 const dim = 18; 
                                 const posX = data.cell.x + (data.cell.width - dim) / 2;
                                 const posY = data.cell.y + (data.cell.height - dim) / 2;
                                 doc.addImage(data.cell.customImages, 'JPEG', posX, posY, dim, dim);
                             } catch(err) { }
                        }
                    }
                });
                return doc.lastAutoTable.finalY + 5;
            };

            // Loop Diligences (Chronological)
            const sortedDiligences = [...diligences].sort((a,b) => new Date(a.date) - new Date(b.date));
            let grandTotalItems = 0;
            let grandTotalValue = 0;

            for (const dil of sortedDiligences) {
                const dItems = itemsByDiligence[dil.id] || [];
                
                if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                
                const dateObj = new Date(dil.date);
                const day = dateObj.toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'});
                const time = dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                const location = formatAddress(dil.location);

                const text = `Aos ${day}, às ${time}, em diligência realizada no endereço ${location}, procedi à penhora e avaliação dos bens abaixo relacionados, encontrados em posse do executado(a) ou responsável.`;
                
                const splitText = doc.splitTextToSize(text, pageWidth - 28);
                doc.text(splitText, 14, currentY);
                currentY += (splitText.length * 5) + 5;

                if (dItems.length > 0) {
                    currentY = await addItemsTable(dItems);
                    const dTotalItems = dItems.reduce((acc, i) => acc + (parseFloat(i.quantity) || 1), 0);
                    const dTotalValue = dItems.reduce((acc, i) => acc + ((parseFloat(i.initial_valuation) || 0) * (parseFloat(i.quantity) || 1)), 0);
                    grandTotalItems += dTotalItems;
                    grandTotalValue += dTotalValue;
                } else {
                    doc.setFont("helvetica", "italic");
                    doc.text("Nenhum bem apreendido nesta diligência.", 14, currentY);
                    currentY += 10;
                }
                currentY += 5;
            }

            if (orphanedItems.length > 0) {
                if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }
                doc.setFont("helvetica", "bold");
                doc.text("Bens Adicionais:", 14, currentY);
                currentY += 6;
                currentY = await addItemsTable(orphanedItems);
                
                const oTotalItems = orphanedItems.reduce((acc, i) => acc + (parseFloat(i.quantity) || 1), 0);
                const oTotalValue = orphanedItems.reduce((acc, i) => acc + ((parseFloat(i.initial_valuation) || 0) * (parseFloat(i.quantity) || 1)), 0);
                
                grandTotalItems += oTotalItems;
                grandTotalValue += oTotalValue;
            }

            if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }
            doc.setLineWidth(0.5);
            doc.line(14, currentY, pageWidth - 14, currentY);
            currentY += 8;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("NOMEAÇÃO DE DEPOSITÁRIO", 14, currentY);
            currentY += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const depositaryName = process.parties_info?.depositary || "__________________________________________________";
            const depText = `Para guarda e conservação dos bens penhorados, nomeio como fiel depositário(a) o(a) Sr(a). ${depositaryName}, que aceitou o encargo, comprometendo-se a não abrir mão dos mesmos sem autorização judicial, sob as penas da lei.`;
            const splitDep = doc.splitTextToSize(depText, pageWidth - 28);
            doc.text(splitDep, 14, currentY);
            currentY += (splitDep.length * 5) + 5;

            doc.setFont("helvetica", "bold");
            doc.text("LOCAL DO DEPÓSITO:", 14, currentY);
            doc.setFont("helvetica", "normal");
            doc.text(process.parties_info?.deposit_location || "No mesmo local da penhora", 60, currentY);
            currentY += 15;

            doc.setFillColor(240, 240, 240);
            doc.rect(14, currentY - 5, pageWidth - 28, 15, "F");
            doc.setFont("helvetica", "bold");
            doc.text(`VALOR TOTAL DA AVALIAÇÃO: ${formatCurrency(grandTotalValue)}`, pageWidth - 20, currentY + 4, { align: 'right' });
            currentY += 25;

            if (currentY > pageHeight - 80) { doc.addPage(); currentY = 30; }
            doc.setFontSize(9);
            const sigY = currentY + 10;
            doc.line(20, sigY, 90, sigY); 
            doc.text("Oficial de Justiça Avaliador", 55, sigY + 4, { align: 'center' });
            doc.line(120, sigY, 190, sigY);
            doc.text("Depositário(a)", 155, sigY + 4, { align: 'center' });

            const sigY2 = sigY + 30;
            doc.line(20, sigY2, 90, sigY2);
            doc.text("Testemunha 1 (CPF: ______________)", 55, sigY2 + 4, { align: 'center' });
            doc.line(120, sigY2, 190, sigY2);
            doc.text("Testemunha 2 (CPF: ______________)", 155, sigY2 + 4, { align: 'center' });

            doc.save(`Auto_Penhora_${process.process_number || 'legal'}.pdf`);
            toast({ title: "Auto de Penhora gerado!" });

        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Erro ao gerar PDF", description: e.message });
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    const handleDeleteDiligence = async () => {
        if (!diligenceToDelete) return;
        try {
            const { error: itemsError } = await supabase.from('seized_items').delete().eq('diligence_id', diligenceToDelete.id);
            if(itemsError) throw itemsError;
            const { error } = await supabase.from('diligences').delete().eq('id', diligenceToDelete.id);
            if(error) throw error;
            toast({ title: "Diligência excluída" });
            fetchProcessDetails();
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: error.message });
        } finally {
            setDiligenceToDelete(null);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            const { error } = await supabase.from('seized_items').delete().eq('id', itemToDelete.id);
            if (error) throw error;
            toast({ title: 'Bem excluído' });
            fetchProcessDetails(); 
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setItemToDelete(null);
        }
    };

    // Helper to group items
    const itemsByDiligence = {};
    diligences.forEach(d => itemsByDiligence[d.id] = []);
    const orphanedItems = [];

    seizedItems.forEach(item => {
        if (item.diligence_id && itemsByDiligence[item.diligence_id]) {
            itemsByDiligence[item.diligence_id].push(item);
        } else {
            orphanedItems.push(item);
        }
    });

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
    if (!process) return null;

    const totalValue = seizedItems.reduce((sum, item) => sum + ((parseFloat(item.initial_valuation)||0) * (parseFloat(item.quantity)||1)), 0);

    return (
        <>
            <Helmet>
                <title>{process.process_number} - Detalhes</title>
            </Helmet>

            <div className="space-y-6 pb-20">
                {/* Header */}
                <div className="bg-white border rounded-lg p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Scale className="h-32 w-32" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Link to="/processes" className="hover:text-blue-600 flex items-center transition-colors">
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                                </Link>
                                <span>/</span>
                                <span>Detalhes</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    {process.process_number || 'Sem número'}
                                </h1>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/processes/${id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar Processo
                                </Button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-6 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-medium uppercase text-xs tracking-wider">Exequente</span>
                                    <span className="font-semibold text-slate-700 text-lg">{process.parties_info?.exequente || '-'}</span>
                                </div>
                                <div className="hidden md:block w-px bg-slate-200"></div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-medium uppercase text-xs tracking-wider">Executado</span>
                                    <span className="font-semibold text-slate-700 text-lg">{process.parties_info?.executado || '-'}</span>
                                </div>
                                <div className="hidden md:block w-px bg-slate-200"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Depositário</span>
                                    <p className="font-medium text-slate-700 truncate">{process.parties_info?.depositary || <span className="text-slate-400 italic">Não informado</span>}</p>
                                </div>
                                <div className="hidden md:block w-px bg-slate-200"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Local do Depósito</span>
                                    <p className="font-medium text-slate-700 truncate">{process.parties_info?.deposit_location || <span className="text-slate-400 italic">Não informado</span>}</p>
                                </div>
                            </div>
                            {process.summary && (
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                     <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2"><FileText className="h-4 w-4"/> Resumo / Observações</h3>
                                     <div className="prose prose-sm max-w-none text-slate-600 bg-slate-50 p-3 rounded-md">
                                         <ReactQuill 
                                             value={process.summary} 
                                             readOnly={true} 
                                             theme="bubble" 
                                             modules={{toolbar: false}}
                                         />
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Actions Bar */}
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={handleGeneratePDF} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>} 
                        Gerar Auto (PDF)
                    </Button>
                    <Button size="sm" onClick={() => { setCurrentDiligence(null); setIsDiligenceFormOpen(true); }}>
                        <Truck className="mr-2 h-4 w-4" /> Agendar Diligência
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Col: Diligences List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                             <h2 className="text-xl font-bold text-slate-800">Histórico de diligências</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {sortedDisplayDiligences.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50">
                                    <p className="text-slate-500 text-sm">Nenhuma diligência registrada.</p>
                                </div>
                            ) : (
                                sortedDisplayDiligences.map((dil) => {
                                    const isNext = dil.id === nextDiligence?.id;
                                    const isCompleted = dil.status === 'Realizada';
                                    const isCancelled = ['Cancelada', 'Adiada'].includes(dil.status);
                                    const isFuture = !isNext && new Date(dil.date) > new Date() && dil.status === 'Agendada';
                                    
                                    const formattedAddr = formatAddress(dil.location);
                                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddr)}`;

                                    return (
                                        <div 
                                            key={dil.id} 
                                            className={cn(
                                                "relative transition-all rounded-lg overflow-hidden",
                                                isNext 
                                                    ? "border border-green-300 shadow-md bg-green-50/40 p-5 transform scale-[1.02] mb-4" 
                                                    : "pl-6 pb-6 border-l-2 border-slate-200 last:border-0 last:pb-0"
                                            )}
                                        >
                                            {!isNext && (
                                                <div className={cn(
                                                    "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 bg-white",
                                                    isCompleted ? "border-green-500 bg-green-50" :
                                                    isCancelled ? "border-slate-300 bg-slate-200" : 
                                                    "border-blue-400"
                                                )} />
                                            )}
                                            
                                            <div className={cn(
                                                "rounded-lg transition-all",
                                                !isNext ? "bg-white p-4 border shadow-sm" : "",
                                                !isNext && (isCompleted || isCancelled) ? "opacity-80 bg-slate-50/50" : "",
                                                isFuture ? "border-blue-200 shadow-sm" : ""
                                            )}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "font-bold", 
                                                                isNext ? "text-xl text-green-800" : 
                                                                isFuture ? "text-blue-700" :
                                                                "text-slate-700"
                                                            )}>
                                                                {new Date(dil.date).toLocaleDateString()}
                                                            </span>
                                                            <span className={cn(
                                                                "text-xs font-mono",
                                                                isNext ? "text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded" : "text-slate-500"
                                                            )}>
                                                                {new Date(dil.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            {isCompleted ? <CheckCircle2 className="h-3 w-3 text-green-600"/> : 
                                                             isCancelled ? <XCircle className="h-3 w-3 text-slate-400"/> :
                                                             isNext ? <Clock className="h-4 w-4 text-green-600 animate-pulse"/> :
                                                             <Clock className="h-3 w-3 text-blue-500"/>}
                                                             
                                                            <span className={cn("text-xs font-medium uppercase", 
                                                                isCompleted ? "text-green-700" : 
                                                                isCancelled ? "text-slate-500" : 
                                                                isNext ? "text-green-700 font-bold" :
                                                                "text-blue-600"
                                                            )}>
                                                                {dil.status}
                                                                {isNext && " (Próxima)"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-200">
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setCurrentDiligence(dil); setIsDiligenceFormOpen(true); }}>
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => setDiligenceToDelete(dil)}>
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                
                                                <div className={cn("mt-3 space-y-2 text-slate-600", isNext ? "text-base" : "text-sm")}>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className={cn("mt-0.5 shrink-0 text-slate-400", isNext ? "h-4 w-4" : "h-3.5 w-3.5")}/>
                                                        <span className="leading-tight">{formattedAddr}</span>
                                                    </div>
                                                    
                                                    <a 
                                                        href={mapsUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "inline-flex items-center hover:underline transition-colors mt-1",
                                                            isNext ? "text-green-600 font-medium" : "text-blue-600 text-xs"
                                                        )}
                                                    >
                                                        <ExternalLink className={cn("mr-1", isNext ? "h-3.5 w-3.5" : "h-3 w-3")} />
                                                        Ver no Google Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Col: Seizure Goods */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-xl font-bold text-slate-800">Bens localizados para penhora</h2>
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Total: {formatCurrency(totalValue)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {diligences.map((dil) => {
                                const items = itemsByDiligence[dil.id] || [];
                                
                                return (
                                    <div key={dil.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                <span className="font-semibold text-slate-700">
                                                    Diligência de {new Date(dil.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-slate-400">• {items.length} bens</span>
                                            </div>
                                            <Button 
                                                size="sm"
                                                variant="secondary"
                                                className="h-8 bg-yellow-400 hover:bg-yellow-500 text-slate-900 border border-yellow-500/20"
                                                onClick={() => handleOpenItemForm('manual', dil.id)}
                                                disabled={checkingLimits}
                                            >
                                                {checkingLimits ? <Loader2 className="h-3 w-3 animate-spin"/> : <Plus className="mr-2 h-3 w-3" />} 
                                                Adicionar Bens
                                            </Button>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {items.length === 0 ? (
                                                <div className="p-6 text-center text-slate-400 text-sm">
                                                    Nenhum bem registrado nesta diligência.
                                                </div>
                                            ) : (
                                                items.map(item => (
                                                    <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-slate-50/50 transition-colors">
                                                        <div className="w-full sm:w-32 h-32 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200">
                                                            {item.photo_url ? (
                                                                <img src={item.photo_url} alt="Bem" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                                    <Box className="h-8 w-8 mb-1" />
                                                                    <span className="text-[10px]">Sem foto</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="font-bold text-slate-800 text-lg truncate pr-4">
                                                                        {item.item_description}
                                                                    </h4>
                                                                    <div className="flex gap-1">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => { setCurrentItem(item); setIsItemFormOpen(true); }}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => setItemToDelete(item)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-slate-600">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] uppercase text-slate-400 font-bold">Qtd</span>
                                                                        <span className="font-medium">{item.quantity}</span>
                                                                    </div>
                                                                     <div className="flex flex-col">
                                                                        <span className="text-[10px] uppercase text-slate-400 font-bold">Valor Unit.</span>
                                                                        <span className="font-medium text-green-700">{formatCurrency(item.initial_valuation)}</span>
                                                                    </div>
                                                                </div>

                                                                {item.characteristics && (
                                                                    <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                                                                        {item.characteristics}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {orphanedItems.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm opacity-80">
                                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        <span className="font-semibold text-slate-700">Bens sem Diligência Vinculada</span>
                                    </div>
                                    <div className="p-4">
                                        {orphanedItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                                <span>{item.item_description}</span>
                                                <Button variant="ghost" size="sm" onClick={() => { setCurrentItem(item); setIsItemFormOpen(true); }}>Editar</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {seizedItems.length === 0 && diligences.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <Box className="h-12 w-12 text-slate-300 mb-3" />
                                    <h3 className="text-lg font-semibold text-slate-700">Nenhum bem registrado</h3>
                                    <p className="text-slate-500 max-w-sm text-center mb-6">
                                        Agende uma diligência para começar a adicionar bens.
                                    </p>
                                    <Button 
                                        size="sm" 
                                        onClick={() => { setCurrentDiligence(null); setIsDiligenceFormOpen(true); }}
                                    >
                                        <Truck className="mr-2 h-4 w-4" /> Agendar Diligência
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isDiligenceFormOpen} onOpenChange={setIsDiligenceFormOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentDiligence ? 'Editar Diligência' : 'Agendar Nova Diligência'}</DialogTitle>
                    </DialogHeader>
                    <DiligenceForm 
                        processId={id} 
                        diligence={currentDiligence} 
                        onSuccess={() => { setIsDiligenceFormOpen(false); fetchProcessDetails(); }} 
                        onCancel={() => setIsDiligenceFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <SeizedItemForm
                isOpen={isItemFormOpen}
                onOpenChange={setIsItemFormOpen}
                processId={id}
                item={currentItem}
                initialMode={itemFormMode}
                diligenceId={selectedDiligenceId}
                onSuccess={() => { setIsItemFormOpen(false); fetchProcessDetails(); }}
            />

            <ScanItemDialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen} />

            {/* Delete Confirmations */}
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Excluir bem?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!diligenceToDelete} onOpenChange={() => setDiligenceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Excluir diligência?</AlertDialogTitle><AlertDialogDescription>Atenção: Todos os bens vinculados a esta diligência também serão excluídos!</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDiligence} className="bg-red-600">Excluir Tudo</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ProcessDetail;