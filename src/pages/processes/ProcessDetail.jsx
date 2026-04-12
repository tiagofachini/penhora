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

    // Upcoming: Agendada, sorted soonest first
    const upcomingDiligences = useMemo(() => {
        return diligences
            .filter(d => d.status === 'Agendada')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [diligences]);

    // Past: everything else, sorted most recent first
    const pastDiligences = useMemo(() => {
        return diligences
            .filter(d => d.status !== 'Agendada')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [diligences]);

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

                    {/* ── LEFT COL: Diligências ── */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Diligências</h2>
                            <Button size="sm" onClick={() => { setCurrentDiligence(null); setIsDiligenceFormOpen(true); }}>
                                <Plus className="mr-1.5 h-4 w-4" /> Agendar
                            </Button>
                        </div>

                        {/* PRÓXIMAS (Agendada) */}
                        {upcomingDiligences.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                                <Clock className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Nenhuma diligência agendada</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Próximas</p>
                                {upcomingDiligences.map((dil, index) => {
                                    const isNext = index === 0;
                                    const addr = formatAddress(dil.location);
                                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
                                    const dateObj = new Date(dil.date);
                                    const isOverdue = dateObj < new Date();
                                    const dilItemCount = (itemsByDiligence[dil.id] || []).length;

                                    return (
                                        <div key={dil.id} className={cn(
                                            "rounded-xl border p-4 transition-shadow",
                                            isNext && !isOverdue ? "border-blue-300 bg-blue-50/40 shadow-md" :
                                            isOverdue ? "border-amber-300 bg-amber-50/30 shadow-sm" :
                                            "border-slate-200 bg-white shadow-sm"
                                        )}>
                                            <div className="flex items-start gap-3">
                                                {/* Date box */}
                                                <div className={cn(
                                                    "flex flex-col items-center rounded-xl px-3 py-2 flex-shrink-0 min-w-[56px] text-center",
                                                    isNext && !isOverdue ? "bg-blue-100 text-blue-700" :
                                                    isOverdue ? "bg-amber-100 text-amber-700" :
                                                    "bg-slate-100 text-slate-600"
                                                )}>
                                                    <span className="text-2xl font-bold leading-none">
                                                        {dateObj.toLocaleDateString('pt-BR', { day: '2-digit' })}
                                                    </span>
                                                    <span className="text-xs font-medium mt-0.5 uppercase">
                                                        {dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                                    </span>
                                                    <span className="text-[10px] opacity-70 mt-0.5">
                                                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                        <span className={cn(
                                                            "text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full",
                                                            isOverdue ? "bg-amber-100 text-amber-700" :
                                                            isNext ? "bg-blue-100 text-blue-700" :
                                                            "bg-slate-100 text-slate-600"
                                                        )}>
                                                            {isOverdue ? "Vencida" : isNext ? "Próxima" : "Agendada"}
                                                        </span>
                                                        {dilItemCount > 0 && (
                                                            <span className="text-xs text-slate-500">{dilItemCount} {dilItemCount === 1 ? 'bem' : 'bens'}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-start gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-slate-600 leading-snug line-clamp-2">{addr}</p>
                                                    </div>
                                                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1.5">
                                                        <ExternalLink className="h-3 w-3" /> Ver no mapa
                                                    </a>
                                                    {dil.observations && (
                                                        <p className="mt-1 text-xs text-slate-400 italic line-clamp-1">{dil.observations}</p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-7 w-7 p-0 flex-shrink-0">
                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setCurrentDiligence(dil); setIsDiligenceFormOpen(true); }}>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => setDiligenceToDelete(dil)}>Excluir</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* HISTÓRICO (Realizada / Cancelada / Adiada) */}
                        {pastDiligences.length > 0 && (
                            <div className="space-y-2 pt-1">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Histórico</p>
                                {pastDiligences.map(dil => {
                                    const isCompleted = dil.status === 'Realizada';
                                    const isCancelled = ['Cancelada', 'Adiada'].includes(dil.status);
                                    const dilItemCount = (itemsByDiligence[dil.id] || []).length;
                                    const dilTotal = (itemsByDiligence[dil.id] || []).reduce((s, i) =>
                                        s + ((parseFloat(i.initial_valuation) || 0) * (parseFloat(i.quantity) || 1)), 0);

                                    return (
                                        <div key={dil.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className={cn(
                                                "h-2.5 w-2.5 rounded-full flex-shrink-0",
                                                isCompleted ? "bg-green-500" :
                                                isCancelled ? "bg-slate-300" : "bg-amber-400"
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {new Date(dil.date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs px-1.5 py-0.5 rounded font-medium",
                                                        isCompleted ? "bg-green-50 text-green-700" :
                                                        isCancelled ? "bg-slate-100 text-slate-500" :
                                                        "bg-amber-50 text-amber-700"
                                                    )}>
                                                        {dil.status}
                                                    </span>
                                                    {dilItemCount > 0 && (
                                                        <span className="text-xs text-slate-400">{dilItemCount} {dilItemCount === 1 ? 'bem' : 'bens'}</span>
                                                    )}
                                                </div>
                                                {dilTotal > 0 && (
                                                    <span className="text-xs font-semibold text-green-700">{formatCurrency(dilTotal)}</span>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-6 w-6 p-0 opacity-40 hover:opacity-100">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setCurrentDiligence(dil); setIsDiligenceFormOpen(true); }}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => setDiligenceToDelete(dil)}>Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COL: Bens e Resumo ── */}
                    <div className="lg:col-span-7 space-y-5">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <h2 className="text-xl font-bold text-slate-800">Bens Localizados</h2>
                            {seizedItems.length > 0 && (
                                <>
                                    <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {seizedItems.length} {seizedItems.length === 1 ? 'bem' : 'bens'}
                                    </span>
                                    <span className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                        {formatCurrency(totalValue)}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="space-y-6">
                            {[...diligences]
                                .sort((a, b) => {
                                    // Realizada first, then by date desc
                                    if (a.status === 'Realizada' && b.status !== 'Realizada') return -1;
                                    if (b.status === 'Realizada' && a.status !== 'Realizada') return 1;
                                    return new Date(b.date) - new Date(a.date);
                                })
                                .map(dil => {
                                    const items = itemsByDiligence[dil.id] || [];
                                    const isCompleted = dil.status === 'Realizada';
                                    const dilTotal = items.reduce((s, i) =>
                                        s + ((parseFloat(i.initial_valuation) || 0) * (parseFloat(i.quantity) || 1)), 0);

                                    return (
                                        <div key={dil.id} className={cn(
                                            "rounded-xl border overflow-hidden",
                                            isCompleted ? "border-slate-200 shadow-sm" : "border-dashed border-slate-200"
                                        )}>
                                            {/* Diligence header */}
                                            <div className={cn(
                                                "px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap",
                                                isCompleted ? "bg-slate-50/80" : "bg-slate-50/40"
                                            )}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="font-semibold text-slate-700 text-sm">
                                                        {new Date(dil.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full font-medium",
                                                        isCompleted ? "bg-green-100 text-green-700" :
                                                        dil.status === 'Agendada' ? "bg-blue-100 text-blue-700" :
                                                        "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {dil.status}
                                                    </span>
                                                    {items.length > 0 && (
                                                        <span className="text-xs text-slate-400">• {items.length} {items.length === 1 ? 'bem' : 'bens'}</span>
                                                    )}
                                                    {dilTotal > 0 && (
                                                        <span className="text-xs font-bold text-green-700">{formatCurrency(dilTotal)}</span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-xs bg-yellow-400 hover:bg-yellow-500 text-slate-900 flex-shrink-0"
                                                    onClick={() => handleOpenItemForm('manual', dil.id)}
                                                    disabled={checkingLimits}
                                                >
                                                    {checkingLimits ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                                    Adicionar Bem
                                                </Button>
                                            </div>

                                            {/* Items list */}
                                            <div className="divide-y divide-slate-100 bg-white">
                                                {items.length === 0 ? (
                                                    <div className="px-4 py-5 text-center text-sm text-slate-400">
                                                        Nenhum bem registrado nesta diligência.
                                                    </div>
                                                ) : (
                                                    items.map(item => {
                                                        const qty = parseFloat(item.quantity) || 1;
                                                        const val = parseFloat(item.initial_valuation) || 0;

                                                        return (
                                                            <div key={item.id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                                                                {/* Photo */}
                                                                <div className="w-28 h-28 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                                                    {item.photo_url ? (
                                                                        <img
                                                                            src={item.photo_url}
                                                                            alt={item.item_description}
                                                                            className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform"
                                                                            onClick={() => window.open(item.photo_url, '_blank')}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                                            <Box className="h-8 w-8 mb-1" />
                                                                            <span className="text-[10px]">Sem foto</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <h4 className="font-bold text-slate-800 leading-snug">
                                                                                {item.item_description}
                                                                            </h4>
                                                                            {item.brand && (
                                                                                <p className="text-sm text-slate-500 mt-0.5">
                                                                                    Marca: <span className="font-medium text-slate-700">{item.brand}</span>
                                                                                </p>
                                                                            )}
                                                                            {item.condition && (
                                                                                <span className={cn(
                                                                                    "inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium",
                                                                                    item.condition === 'Novo' ? "bg-green-100 text-green-700" :
                                                                                    item.condition === 'Excelente' ? "bg-emerald-100 text-emerald-700" :
                                                                                    item.condition === 'Bom' ? "bg-blue-100 text-blue-700" :
                                                                                    item.condition === 'Regular' ? "bg-amber-100 text-amber-700" :
                                                                                    item.condition === 'Ruim' ? "bg-orange-100 text-orange-700" :
                                                                                    "bg-red-100 text-red-700"
                                                                                )}>
                                                                                    {item.condition}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex gap-1 flex-shrink-0">
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                                                onClick={() => { setCurrentItem(item); setIsItemFormOpen(true); }}>
                                                                                <Edit className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                                                                                onClick={() => setItemToDelete(item)}>
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {item.characteristics && (
                                                                        <p className="mt-2 text-sm text-slate-500 leading-snug line-clamp-3">
                                                                            {item.characteristics}
                                                                        </p>
                                                                    )}

                                                                    {/* Values row */}
                                                                    <div className="mt-3 flex items-end gap-4 flex-wrap">
                                                                        <div>
                                                                            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Qtd</span>
                                                                            <span className="font-semibold text-slate-700">{item.quantity}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Valor Unit.</span>
                                                                            <span className="font-semibold text-slate-700">{formatCurrency(val)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            }

                            {/* Orphaned items */}
                            {orphanedItems.length > 0 && (
                                <div className="rounded-xl border border-dashed border-orange-200 overflow-hidden">
                                    <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        <span className="font-semibold text-slate-700 text-sm">Bens sem Diligência Vinculada</span>
                                    </div>
                                    <div className="divide-y divide-slate-100 bg-white">
                                        {orphanedItems.map(item => (
                                            <div key={item.id} className="p-3 flex items-center justify-between gap-2">
                                                <span className="text-sm text-slate-700 truncate">{item.item_description}</span>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                        onClick={() => { setCurrentItem(item); setIsItemFormOpen(true); }}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                                                        onClick={() => setItemToDelete(item)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty states */}
                            {seizedItems.length === 0 && diligences.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <Box className="h-12 w-12 text-slate-300 mb-3" />
                                    <h3 className="text-lg font-semibold text-slate-700">Nenhum bem registrado</h3>
                                    <p className="text-slate-500 max-w-sm text-center mb-6 text-sm">
                                        Agende uma diligência para começar a registrar bens.
                                    </p>
                                    <Button size="sm" onClick={() => { setCurrentDiligence(null); setIsDiligenceFormOpen(true); }}>
                                        <Truck className="mr-2 h-4 w-4" /> Agendar Diligência
                                    </Button>
                                </div>
                            )}
                            {seizedItems.length === 0 && diligences.length > 0 && (
                                <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <Box className="h-9 w-9 text-slate-300 mb-2" />
                                    <p className="text-slate-400 text-sm text-center">
                                        Nenhum bem localizado ainda.<br />Adicione bens a uma diligência realizada.
                                    </p>
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