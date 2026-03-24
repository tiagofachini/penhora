import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Barcode, Camera, Edit } from 'lucide-react';

const ScanOption = ({ icon: Icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-start w-full text-left p-4 rounded-lg transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <div className="p-3 bg-slate-100 text-blue-600 rounded-lg mr-4">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </button>
);

const ScanItemDialog = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar um Novo Item</DialogTitle>
          <DialogDescription>
            Escolha como você gostaria de registrar o item apreendido.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <ScanOption
            icon={Barcode}
            title="Escanear Código de Barras"
            description="Use a câmera para ler um código de barras rapidamente."
            onClick={() => handleNavigate('/items/scan-barcode')}
          />
          <ScanOption
            icon={Camera}
            title="Fotografar Item"
            description="Capture uma foto do item para registro visual."
            onClick={() => handleNavigate('/items/capture-photo')}
          />
          <ScanOption
            icon={Edit}
            title="Incluir Manualmente"
            description="Insira os detalhes do item manualmente."
            onClick={() => handleNavigate('/items/manual-entry')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanItemDialog;