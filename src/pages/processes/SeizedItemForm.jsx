import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, ChevronsUpDown, Search, Camera, Upload, Trash2, X, Sparkles, AlertTriangle, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeImage } from '@/lib/visionApi';
import { fetchProductByEAN } from '@/lib/eanApi';
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { formatAddress } from '@/lib/address';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SeizedItemForm = ({ isOpen, onOpenChange, processId, item, onSuccess, initialMode = 'manual', diligenceId = null }) => {
  const { toast } = useToast();
  const { user, CUSTOM_DOMAIN } = useAuth();
  
  // States
  const [formData, setFormData] = useState({
    item_description: '',
    brand: '',
    quantity: '1',
    characteristics: '',
    condition: 'Bom',
    initial_valuation: '', 
    display_valuation: '',
    photo_url: '',
    barcode: '',
    process_id: '',
    diligence_id: '',
  });

  const [processes, setProcesses] = useState([]);
  const [diligences, setDiligences] = useState([]); 
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false);
  
  // Image Handling States
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const isEditing = !!item;

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDiligenceLabel = (diligence) => {
      const date = new Date(diligence.date).toLocaleDateString('pt-BR');
      const status = diligence.status || 'N/A';
      
      let locationStr = 'Local não definido';
      try {
          const loc = typeof diligence.location === 'string' ? JSON.parse(diligence.location) : diligence.location;
          if (loc && typeof loc === 'object') {
              const parts = [];
              if (loc.logradouro) parts.push(loc.logradouro);
              if (loc.number) parts.push(loc.number);
              if (loc.city && loc.state) parts.push(`${loc.city}/${loc.state}`);
              else if (loc.city) parts.push(loc.city);
              
              if (parts.length > 0) locationStr = parts.join(', ');
          }
      } catch (e) {
          locationStr = formatAddress(diligence.location);
      }
      
      return `${date} - ${status} - ${locationStr}`;
  };

  // 1. Fetch available processes for the dropdown
  useEffect(() => {
    const fetchProcesses = async () => {
      if (!user || !isOpen) return;
      try {
        const { data, error } = await supabase
          .from('processes')
          .select('id, process_number')
          .eq('user_id', user.id);
          
        if (error) throw error;
        setProcesses(data || []);
      } catch (error) {
        console.error('Error fetching processes:', error);
      }
    };
    fetchProcesses();
  }, [user, isOpen]);

  // 2. Initialize Form Data when Modal Opens
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Edit Mode: Load Item
        setFormData({
          item_description: item.item_description || '',
          brand: item.brand || '',
          quantity: item.quantity || '1',
          characteristics: item.characteristics || '',
          condition: item.condition || 'Bom',
          initial_valuation: item.initial_valuation || '',
          display_valuation: item.initial_valuation ? formatCurrency(item.initial_valuation) : '',
          photo_url: item.photo_url || '',
          barcode: item.barcode || '',
          process_id: item.process_id || processId || '',
          diligence_id: item.diligence_id || '',
        });
        setPreviewUrl(item.photo_url || null);
        setImageFile(null);
      } else {
        // Create Mode: Reset and Pre-fill Process
        setFormData(prev => ({
          item_description: '',
          brand: '',
          quantity: '1',
          characteristics: '',
          condition: 'Bom',
          initial_valuation: '',
          display_valuation: '',
          photo_url: '',
          barcode: '',
          process_id: processId || '', 
          diligence_id: diligenceId || '', 
        }));
        
        setPreviewUrl(null);
        setImageFile(null);
        
        // Handle Initial Mode (Camera/Scan)
        if (initialMode === 'camera') {
             setIsCameraOpen(true);
             setIsScanning(false);
        } else if (initialMode === 'scan') {
             setIsScanning(true);
             setIsCameraOpen(false);
        } else {
             setIsCameraOpen(false);
             setIsScanning(false);
        }
      }
    } else {
        // Reset local UI states when closed
        setIsCameraOpen(false);
        setIsScanning(false);
        setAnalyzing(false);
    }
  }, [isOpen, item, processId, initialMode, diligenceId]);

  // 3. Fetch Diligences & Auto-select Closest Date
  useEffect(() => {
      const fetchAndSelectDiligence = async () => {
          const pid = formData.process_id || processId;
          
          if (!pid || !isOpen) {
              setDiligences([]);
              return;
          }
          
          try {
              const { data, error } = await supabase
                  .from('diligences')
                  .select('*')
                  .eq('process_id', pid)
                  .order('date', { ascending: false });
              
              if (error) throw error;
              
              const loadedDiligences = data || [];
              setDiligences(loadedDiligences);
              
              if (!item && !diligenceId) {
                  const currentDiligenceIsValid = loadedDiligences.some(d => d.id === formData.diligence_id);
                  
                  if (!currentDiligenceIsValid && loadedDiligences.length > 0) {
                      const now = new Date();
                      const closest = loadedDiligences.reduce((prev, curr) => {
                          const prevDate = prev.date ? new Date(prev.date) : new Date(0);
                          const currDate = curr.date ? new Date(curr.date) : new Date(0);
                          return Math.abs(currDate - now) < Math.abs(prevDate - now) ? curr : prev;
                      });
                      
                      setFormData(prev => ({ ...prev, diligence_id: closest.id }));
                  } else if (loadedDiligences.length === 0) {
                      setFormData(prev => ({ ...prev, diligence_id: '' }));
                  }
              }
          } catch (error) {
              console.error("Error fetching diligences:", error);
          }
      };

      fetchAndSelectDiligence();
  }, [formData.process_id, processId, isOpen, item, diligenceId]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Camera Logic
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
        if (isCameraOpen) {
            try {
                // First explicitly request permission
                await navigator.mediaDevices.getUserMedia({ video: true });
                // Then get the stream with specific constraints
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Play is required for some browsers
                    await videoRef.current.play();
                }
            } catch (err) {
                console.error("Camera Error: ", err);
                toast({ 
                    variant: 'destructive', 
                    title: "Erro na câmera", 
                    description: "Não foi possível acessar a câmera. Verifique as permissões do navegador." 
                });
                setIsCameraOpen(false);
            }
        }
    };

    if (isCameraOpen) {
        startCamera();
    }
    
    return () => { 
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };
  }, [isCameraOpen, toast]);

  // Scanner Logic
  useEffect(() => {
    if (isScanning && isOpen) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            const readerElement = document.getElementById("reader");
            if (readerElement && !scannerRef.current) {
                try {
                     const scanner = new Html5QrcodeScanner("reader", { 
                         fps: 10, 
                         qrbox: { width: 250, height: 250 },
                         aspectRatio: 1.0,
                         showTorchButtonIfSupported: true,
                         rememberLastUsedCamera: true
                     }, false);
                     
                     scannerRef.current = scanner;

                     scanner.render((decodedText) => {
                         setFormData(prev => ({...prev, barcode: decodedText}));

                         if(scannerRef.current) {
                             scannerRef.current.clear().catch(e => console.warn(e));
                             scannerRef.current = null;
                         }
                         setIsScanning(false);
                         handleBarcodeLookup(decodedText);
                     }, (error) => {
                         // Scanning errors are common while searching, no need to log constantly
                     });
                } catch(e) {
                    console.error("Scanner init error", e);
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }
    
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.warn("Scanner clear error", e));
            scannerRef.current = null;
        }
    };
  }, [isScanning, isOpen, toast]);


  const handleBarcodeLookup = async (barcode) => {
      const code = (barcode || formData.barcode).trim();
      if (!code) return;
      setLookingUpBarcode(true);
      try {
          const product = await fetchProductByEAN(code);
          if (product) {
              setFormData(prev => ({
                  ...prev,
                  item_description: product.name || prev.item_description,
                  characteristics: product.characteristics
                      ? (prev.characteristics ? prev.characteristics + '\n' + product.characteristics : product.characteristics)
                      : prev.characteristics,
              }));
              toast({ title: "Produto encontrado!", description: product.name, className: "bg-green-50 border-green-200" });
          }
      } catch {
          toast({ variant: "destructive", title: "Produto não encontrado", description: "Nenhum produto localizado para este código." });
      } finally {
          setLookingUpBarcode(false);
      }
  };

  const detectBarcodeFromImage = async (file) => {
      if (!('BarcodeDetector' in window)) return null;
      try {
          const detector = new BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });
          const bitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(bitmap);
          return barcodes.length > 0 ? barcodes[0].rawValue : null;
      } catch {
          return null;
      }
  };

  const runImageAnalysis = async (file, currentBarcode = '') => {
      setAnalyzing(true);
      try {
          // Try free barcode detection from image before calling AI
          const detectedBarcode = await detectBarcodeFromImage(file);
          if (detectedBarcode && !currentBarcode) {
              setFormData(prev => ({ ...prev, barcode: detectedBarcode }));
              handleBarcodeLookup(detectedBarcode);
          }

          const result = await analyzeImage(file);

          const modelNote = result.model ? `Modelo: ${result.model}` : '';
          const aiChars = [modelNote, result.characteristics].filter(Boolean).join('\n');

          setFormData(prev => ({
              ...prev,
              item_description: result.description || prev.item_description,
              brand: result.brand || prev.brand,
              characteristics: aiChars
                  ? (prev.characteristics ? prev.characteristics + '\n' + aiChars : aiChars)
                  : prev.characteristics,
          }));

          // If AI spotted a barcode in the photo and we don't have one yet
          if (result.barcode && !detectedBarcode && !currentBarcode) {
              setFormData(prev => ({ ...prev, barcode: result.barcode }));
              handleBarcodeLookup(result.barcode);
          }

          toast({ title: "Análise concluída", className: "bg-blue-50 border-blue-200" });
      } catch {
          toast({ variant: "destructive", title: "Falha na análise automática" });
      } finally {
          setAnalyzing(false);
      }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
            const file = new File([blob], "camera.jpg", { type: "image/jpeg" });
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setIsCameraOpen(false);
            runImageAnalysis(file, formData.barcode);
        }, 'image/jpeg', 0.8);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        runImageAnalysis(file, formData.barcode);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    const numericValue = parseFloat(value) / 100;
    if (isNaN(numericValue)) {
      setFormData(prev => ({ ...prev, initial_valuation: '', display_valuation: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, initial_valuation: numericValue, display_valuation: formatCurrency(numericValue) }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, condition: value }));
  };
  
  const handleDiligenceChange = (value) => {
    setFormData(prev => ({ ...prev, diligence_id: value }));
  };

  const requestCameraPermission = async () => {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
    } catch (err) {
        toast({
            variant: "destructive",
            title: "Permissão negada",
            description: "Por favor, permita o acesso à câmera nas configurações do seu navegador para usar esta função."
        });
        return false;
    }
  };

  const handleStartScanning = async () => {
      const hasPermission = await requestCameraPermission();
      if (hasPermission) {
          setIsScanning(true);
      }
  };
  
  const handleStartCamera = async () => {
      const hasPermission = await requestCameraPermission();
      if (hasPermission) {
          setIsCameraOpen(true);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.process_id) {
        toast({ variant: 'destructive', title: "Erro", description: "Selecione um processo." });
        return;
    }

    if (!formData.diligence_id) {
        toast({ variant: 'destructive', title: "Erro", description: "É obrigatório selecionar uma diligência para vincular o bem." });
        return;
    }

    setLoading(true);
    try {
      let finalPhotoUrl = formData.photo_url;
      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('item-photos').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('item-photos').getPublicUrl(fileName);
        
        // CRITICAL: Replace default Supabase domain with Custom Domain
        // If publicUrl is 'https://<project>.supabase.co/...', we change it to 'https://go.penhora.app.br/...'
        finalPhotoUrl = publicUrl.replace(/https:\/\/[^/]+\.supabase\.co/, CUSTOM_DOMAIN);
      }

      const itemData = {
        item_description: formData.item_description,
        brand: formData.brand,
        quantity: parseFloat(formData.quantity),
        characteristics: formData.characteristics,
        condition: formData.condition,
        initial_valuation: formData.initial_valuation ? parseFloat(formData.initial_valuation) : null,
        photo_url: finalPhotoUrl,
        barcode: formData.barcode,
        process_id: formData.process_id,
        diligence_id: formData.diligence_id 
      };

      let error;
      if (isEditing) {
        ({ error } = await supabase.from('seized_items').update(itemData).eq('id', item.id));
      } else {
        ({ error } = await supabase.from('seized_items').insert(itemData));
      }
      
      if (error) throw error;
      toast({ title: `Bem ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!` });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: `Erro ao salvar bem`, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = processes.filter(p => p.process_number?.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedProcessLabel = processes.find(p => p.id === formData.process_id)?.process_number || "Selecione o processo";

  const hasDiligences = diligences.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Bem' : 'Adicionar Novo Bem'}</DialogTitle>
          <DialogDescription>Detalhes do bem penhorado vinculado a uma diligência.</DialogDescription>
        </DialogHeader>

        {isCameraOpen ? (
            <div className="flex flex-col h-[400px] bg-black rounded-lg overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4 z-10 p-4">
                    <Button variant="outline" onClick={() => setIsCameraOpen(false)}><X className="mr-2 h-4 w-4"/> Cancelar</Button>
                    <Button onClick={capturePhoto}><Camera className="mr-2 h-4 w-4"/> Capturar</Button>
                </div>
            </div>
        ) : isScanning ? (
             <div className="flex flex-col min-h-[400px] bg-black rounded-lg overflow-hidden relative p-4 items-center justify-center">
                <div id="reader" className="w-full h-full bg-white rounded [&_#reader__dashboard_section_csr_span]:!hidden [&_#reader__dashboard_section_swaplink]:!hidden">
                    <style>{`
                        #reader__scan_region { background: white; }
                        #reader__dashboard_section_csr button { background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer; }
                        #reader__dashboard_section_csr button:hover { background-color: #1d4ed8; }
                        #reader select { padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px; width: 100%; }
                    `}</style>
                </div>
                <div className="absolute bottom-4 z-10 w-full flex justify-center flex-col items-center gap-2">
                     <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">Aponte a câmera para o código de barras</p>
                     <Button variant="outline" onClick={() => setIsScanning(false)} className="bg-white/90"><X className="mr-2 h-4 w-4"/> Cancelar Escaneamento</Button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                    <Label className="flex justify-between">
                        <span>Foto</span>
                        {analyzing && <span className="text-blue-600 text-xs animate-pulse flex items-center"><Sparkles className="w-3 h-3 mr-1"/> Analisando...</span>}
                    </Label>
                    {previewUrl ? (
                        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden group">
                            <img src={previewUrl} alt="Preview" className={cn("w-full h-full object-cover", analyzing && "opacity-50")} />
                            {!analyzing && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => { setImageFile(null); setPreviewUrl(null); setFormData(p => ({...p, photo_url: ''})); }}>
                                        <Trash2 className="h-4 w-4 mr-2"/> Remover
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <Button type="button" variant="outline" className="h-24 flex flex-col gap-2" onClick={() => fileInputRef.current?.click()} disabled={analyzing}>
                                <Upload className="h-6 w-6"/> <span className="text-xs">Upload</span>
                            </Button>
                            <Button type="button" variant="outline" className="h-24 flex flex-col gap-2" onClick={handleStartCamera} disabled={analyzing}>
                                <Camera className="h-6 w-6"/> <span className="text-xs">Câmera</span>
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Processo <span className="text-red-500">*</span></Label>
                    <div className="col-span-3">
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {formData.process_id ? selectedProcessLabel : "Selecione..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <div className="flex items-center border-b px-3">
                                    <Search className="mr-2 h-4 w-4 opacity-50" />
                                    <input className="flex h-11 w-full rounded-md bg-transparent text-sm outline-none" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                    {filteredProcesses.map(p => (
                                        <div key={p.id} className={cn("rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-muted", formData.process_id === p.id && "bg-muted")} onClick={() => { setFormData(prev => ({ ...prev, process_id: p.id })); setOpenCombobox(false); }}>
                                            <Check className={cn("mr-2 h-4 w-4 inline", formData.process_id === p.id ? "opacity-100" : "opacity-0")} />
                                            {p.process_number}
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {formData.process_id && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Diligência <span className="text-red-500">*</span></Label>
                        <div className="col-span-3">
                            {hasDiligences ? (
                                <Select value={formData.diligence_id} onValueChange={handleDiligenceChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a diligência" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {diligences.map(d => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {getDiligenceLabel(d)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Este processo não possui diligências. Crie uma diligência na página do processo antes de adicionar bens.
                                </div>
                            )}
                        </div>
                     </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Código de Barras</Label>
                    <div className="col-span-3 flex gap-2">
                        <Input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Opcional" />
                        <Button type="button" variant="outline" size="icon" onClick={handleStartScanning} title="Escanear Código de Barras">
                            <ScanLine className="h-4 w-4"/>
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => handleBarcodeLookup()} disabled={!formData.barcode || lookingUpBarcode} title="Buscar produto pelo código">
                            {lookingUpBarcode ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Descrição</Label>
                    <div className="col-span-3 relative">
                        <Input name="item_description" value={formData.item_description} onChange={handleChange} required disabled={analyzing} />
                        {analyzing && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin"/>}
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Marca</Label>
                    <Input name="brand" value={formData.brand} onChange={handleChange} disabled={analyzing} className="col-span-3" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Quantidade</Label>
                    <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required className="col-span-3" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Condição</Label>
                    <Select value={formData.condition} onValueChange={handleSelectChange}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Novo">Novo</SelectItem>
                            <SelectItem value="Excelente">Excelente</SelectItem>
                            <SelectItem value="Bom">Bom</SelectItem>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="Ruim">Ruim</SelectItem>
                            <SelectItem value="Sucata">Sucata</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Valor (R$)</Label>
                    <Input name="display_valuation" value={formData.display_valuation} onChange={handleCurrencyChange} className="col-span-3" placeholder="R$ 0,00" />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Detalhes</Label>
                    <Textarea name="characteristics" value={formData.characteristics} onChange={handleChange} className="col-span-3" rows={3} disabled={analyzing} />
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={loading || analyzing || !hasDiligences}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Salvar</Button>
                </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeizedItemForm;