import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatAddress } from '@/lib/address';

// Fix Leaflet icons
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/shadow-icon.png';
let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DiligenceForm = ({ processId, diligence, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    status: 'Agendada',
    property_owner: '',
    observations: '',
    cep: '',
    logradouro: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    if (diligence) {
      let addressData = {};
      try {
        addressData = typeof diligence.location === 'string' 
            ? JSON.parse(diligence.location) 
            : diligence.location || {};
      } catch (e) {
        // legacy or simple string handling if needed
      }

      const dateObj = diligence.date ? new Date(diligence.date) : null;
      
      setFormData({
        date: dateObj ? dateObj.toISOString().split('T')[0] : '',
        time: dateObj ? dateObj.toTimeString().split(' ')[0].substring(0, 5) : '',
        status: diligence.status || 'Agendada',
        property_owner: diligence.property_owner || '',
        observations: diligence.observations || '',
        cep: addressData.cep || '',
        logradouro: addressData.logradouro || '',
        number: addressData.number || '',
        complement: addressData.complement || '',
        neighborhood: addressData.neighborhood || '',
        city: addressData.city || '',
        state: addressData.state || ''
      });

      if (addressData.logradouro) {
         fetchCoordinates(`${addressData.logradouro}, ${addressData.number}, ${addressData.city}, ${addressData.state}, Brazil`);
      }
    }
  }, [diligence]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cep' && value.replace(/\D/g, '').length === 8) {
      handleCepBlur({ target: { value } });
    }
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const fetchCoordinates = async (query) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
             headers: { 'User-Agent': 'PenhoraApp/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            setMapCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
    } catch (error) {
        console.error("Error fetching coordinates:", error);
    }
  };

  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
            cep: cep
          }));
          
          // Try to fetch map preview immediately
          const query = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brazil`;
          fetchCoordinates(query);
          toast({ title: 'Endereço encontrado!' });
        } else {
           toast({ variant: 'destructive', title: 'CEP não encontrado' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP' });
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construct Location JSON
      const location = {
        cep: formData.cep,
        logradouro: formData.logradouro,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state
      };

      // Construct Date
      let fullDate = null;
      if (formData.date) {
        fullDate = new Date(`${formData.date}T${formData.time || '00:00:00'}`);
      }

      const payload = {
        process_id: processId,
        date: fullDate,
        location: JSON.stringify(location),
        property_owner: formData.property_owner,
        observations: formData.observations,
        status: formData.status
      };

      let error;
      if (diligence?.id) {
        ({ error } = await supabase.from('diligences').update(payload).eq('id', diligence.id));
      } else {
        ({ error } = await supabase.from('diligences').insert(payload));
      }

      if (error) throw error;
      
      toast({ title: diligence ? 'Diligência atualizada' : 'Diligência criada' });
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date & Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <Input type="time" id="time" name="time" value={formData.time} onChange={handleChange} />
        </div>
      </div>

      {/* Status & Owner Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={handleSelectChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Agendada">Agendada</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Adiada">Adiada</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
             <Label htmlFor="property_owner">Responsável / Proprietário</Label>
             <Input id="property_owner" name="property_owner" value={formData.property_owner} onChange={handleChange} placeholder="Nome do responsável no local" />
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4 border rounded-md p-4 bg-slate-50">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
            <MapPin className="h-4 w-4"/> Local da Diligência
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
                <Label htmlFor="cep">CEP</Label>
                <Input
                    id="cep" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" maxLength={9}
                />
                {cepLoading && <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-slate-400" />}
            </div>
            <div>
                 <Label htmlFor="number">Número</Label>
                 <Input id="number" name="number" value={formData.number} onChange={handleChange} />
            </div>
        </div>

        <div className="space-y-2">
             <Label htmlFor="logradouro">Logradouro</Label>
             <Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                 <Label htmlFor="neighborhood">Bairro</Label>
                 <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                 <Label htmlFor="complement">Complemento</Label>
                 <Input id="complement" name="complement" value={formData.complement} onChange={handleChange} />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
                 <Label htmlFor="city">Cidade</Label>
                 <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                 <Label htmlFor="state">UF</Label>
                 <Input id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} />
            </div>
        </div>

        {mapCoordinates && (
             <div className="h-[250px] w-full rounded border mt-2 overflow-hidden relative z-0">
                <MapContainer center={mapCoordinates} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={mapCoordinates} />
                </MapContainer>
            </div>
        )}
      </div>

      <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t mt-4">
         <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="mt-2">Cancelar</Button>
         <Button type="submit" disabled={loading} className="mt-2">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Diligência
         </Button>
      </div>
    </form>
  );
};

export default DiligenceForm;