import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { analyzeImage } from '@/lib/visionApi';

const CapturePhotoPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível acessar a câmera." });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
          setIsCapturing(false);
          return;
      }

      try {
        // 1. Upload image
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('item-photos').upload(fileName, blob);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('item-photos').getPublicUrl(fileName);

        // 2. Analyze image (optional, but helpful)
        let analysis = {};
        try {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            analysis = await analyzeImage(file);
        } catch (e) {
            console.log("Analysis skipped or failed", e);
        }

        // 3. Navigate to Manual Entry with data
        stopCamera();
        navigate('/items/manual-entry', { 
            state: { 
                photo_url: publicUrl,
                item_description: analysis.description || '',
                brand: analysis.brand || '',
                characteristics: analysis.characteristics || ''
            } 
        });

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro", description: "Falha ao processar imagem." });
        setIsCapturing(false);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="p-4 flex justify-between items-center z-10">
        <Button variant="ghost" className="text-white" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-6 w-6" /> Cancelar
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-8 flex justify-center items-center bg-black/50 backdrop-blur-sm">
        <Button 
          size="lg" 
          className="h-20 w-20 rounded-full border-4 border-white bg-transparent hover:bg-white/20 p-1"
          onClick={handleCapture}
          disabled={isCapturing}
        >
          {isCapturing ? (
              <RefreshCw className="h-8 w-8 text-white animate-spin" />
          ) : (
              <div className="h-full w-full rounded-full bg-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default CapturePhotoPage;