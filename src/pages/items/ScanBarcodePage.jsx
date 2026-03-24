import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ScanBarcodePage = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, []);

  const onScanSuccess = (decodedText, decodedResult) => {
    if (scannerRef.current) {
        scannerRef.current.clear();
    }
    setScanResult(decodedText);
    
    // Navigate to manual entry with the barcode
    navigate('/items/manual-entry', { 
        state: { 
            barcode: decodedText,
            item_description: `Item Código: ${decodedText}` // Placeholder
        } 
    });
  };

  const onScanFailure = (error) => {
    // console.warn(`Code scan error = ${error}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Escanear Código de Barras</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Aponte a câmera para um código de barras ou QR code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanBarcodePage;