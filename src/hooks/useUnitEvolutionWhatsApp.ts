import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Unit } from "@/hooks/useUnits";

export type ConnectionState = "disconnected" | "connecting" | "open" | "loading" | "error";

export interface WhatsAppProfile {
  name: string | null;
  phone: string | null;
  pictureUrl: string | null;
}

interface UseUnitEvolutionWhatsAppReturn {
  connectionState: ConnectionState;
  qrCode: string | null;
  pairingCode: string | null;
  isLoading: boolean;
  error: string | null;
  profile: WhatsAppProfile | null;
  currentInstanceName: string | null;
  createInstance: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshQRCode: () => Promise<void>;
  checkStatus: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export function useUnitEvolutionWhatsApp(unit: Unit | null): UseUnitEvolutionWhatsAppReturn {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<WhatsAppProfile | null>(null);
  const [currentInstanceName, setCurrentInstanceName] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const quickCheckRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingRef = useRef(false);
  const previousUnitIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (quickCheckRef.current) {
      clearTimeout(quickCheckRef.current);
      quickCheckRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async (autoRefreshQR = false) => {
    if (!unit?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'status', unit_id: unit.id },
      });

      if (fnError) {
        console.error('Status check error:', fnError);
        return;
      }

      console.log('Status check result:', data);

      if (data.success) {
        const state = data.state?.toLowerCase();
        
        if (state === 'open' || state === 'connected') {
          setConnectionState("open");
          setQrCode(null);
          setPairingCode(null);
          stopPolling();
          
          // Set profile data from API response or unit data
          if (data.profile) {
            setProfile(data.profile);
          } else if (unit?.whatsapp_name || unit?.whatsapp_phone || unit?.whatsapp_picture_url) {
            setProfile({
              name: unit.whatsapp_name,
              phone: unit.whatsapp_phone,
              pictureUrl: unit.whatsapp_picture_url,
            });
          }
          
          toast({
            title: "WhatsApp conectado!",
            description: "Sua integração está funcionando.",
          });
        } else if (state === 'connecting') {
          setConnectionState("connecting");
          // Se está connecting mas não tem QR Code, buscar automaticamente
          if (autoRefreshQR && !qrCode) {
            console.log('State is connecting but no QR code, auto-refreshing...');
            try {
              const { data: qrData } = await supabase.functions.invoke('evolution-whatsapp', {
                body: { action: 'refresh-qr', unit_id: unit.id },
              });
              if (qrData?.success) {
                if (qrData.alreadyConnected) {
                  // Already connected! Update state accordingly
                  console.log('Instance already connected during QR refresh');
                  setConnectionState("open");
                  setQrCode(null);
                  setPairingCode(null);
                  stopPolling();
                } else if (qrData.qrCode) {
                  setQrCode(qrData.qrCode);
                  setPairingCode(qrData.pairingCode);
                }
              }
            } catch (e) {
              console.error('Auto-refresh QR failed:', e);
            }
          }
        } else if (state === 'close') {
          // 'close' state means session ended but instance still exists
          // Keep as 'connecting' and auto-refresh QR code to allow reconnection
          setConnectionState("connecting");
          console.log('State is close, auto-refreshing QR code for reconnection...');
          try {
            const { data: qrData } = await supabase.functions.invoke('evolution-whatsapp', {
              body: { action: 'refresh-qr', unit_id: unit.id },
            });
            if (qrData?.success) {
              if (qrData.alreadyConnected) {
                console.log('Instance already connected during QR refresh (close state)');
                setConnectionState("open");
                setQrCode(null);
                setPairingCode(null);
                stopPolling();
              } else if (qrData.qrCode) {
                setQrCode(qrData.qrCode);
                setPairingCode(qrData.pairingCode);
              }
            }
          } catch (e) {
            console.error('Auto-refresh QR on close failed:', e);
          }
        } else if (state === 'disconnected' || data.cleaned) {
          setConnectionState("disconnected");
          setQrCode(null);
          setPairingCode(null);
          stopPolling();
        }
      }
    } catch (err) {
      console.error('Status check failed:', err);
    }
  }, [unit?.id, toast, stopPolling, qrCode]);

  const startPolling = useCallback(() => {
    stopPolling();
    // First check after 1s for quick detection
    quickCheckRef.current = setTimeout(() => {
      checkStatus(true);
    }, 1000);
    // Then every 2s
    pollingRef.current = setInterval(() => {
      checkStatus(true);
    }, 2000);
  }, [checkStatus, stopPolling]);

  const createInstance = useCallback(async () => {
    if (!unit?.id) {
      toast({
        title: "Erro",
        description: "Unidade não encontrada",
        variant: "destructive",
      });
      return;
    }

    // Mark that we're creating - prevents useEffect from calling checkStatus
    isCreatingRef.current = true;
    setIsLoading(true);
    setError(null);
    setConnectionState("loading");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      const { data, error: fnError } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'create', unit_id: unit.id },
      });

      console.log('Create instance result:', data);

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao criar instância');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar instância');
      }

      // Save the instance name locally for cleanup purposes
      setCurrentInstanceName(data.instanceName);
      setQrCode(data.qrCode);
      setPairingCode(data.pairingCode);
      setConnectionState("connecting");
      
      // Start polling to check connection status
      startPolling();

      toast({
        title: "QR Code gerado!",
        description: "Escaneie com seu WhatsApp para conectar.",
      });
    } catch (err) {
      isCreatingRef.current = false;
      console.error('Create instance error:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setConnectionState("error");
      toast({
        title: "Erro ao conectar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset the creating flag after a short delay to allow state to settle
      setTimeout(() => {
        isCreatingRef.current = false;
      }, 500);
    }
  }, [unit?.id, toast, startPolling]);

  const disconnect = useCallback(async () => {
    if (!unit?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      const { data, error: fnError } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'disconnect', unit_id: unit.id },
      });

      console.log('Disconnect result:', data);

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao desconectar');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao desconectar');
      }

      stopPolling();
      setConnectionState("disconnected");
      setQrCode(null);
      setPairingCode(null);
      setProfile(null);
      setCurrentInstanceName(null);

      toast({
        title: "WhatsApp desconectado",
        description: "A integração foi removida.",
      });
    } catch (err) {
      console.error('Disconnect error:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: "Erro ao desconectar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [unit?.id, toast, stopPolling]);

  const refreshQRCode = useCallback(async () => {
    if (!unit?.id) return;

    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      const { data, error: fnError } = await supabase.functions.invoke('evolution-whatsapp', {
        body: { action: 'refresh-qr', unit_id: unit.id },
      });

      console.log('Refresh QR result:', data);

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao atualizar QR Code');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao atualizar QR Code');
      }

      setQrCode(data.qrCode);
      setPairingCode(data.pairingCode);
    } catch (err) {
      console.error('Refresh QR error:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: "Erro ao atualizar QR Code",
        description: message,
        variant: "destructive",
      });
    }
  }, [unit?.id, toast]);

  // Cleanup function - deletes the instance from Evolution API without relying on DB state
  const cleanup = useCallback(async () => {
    if (!unit?.id) return;

    const instanceToCleanup = currentInstanceName || unit.evolution_instance_name;
    if (!instanceToCleanup) {
      console.log('No instance to cleanup');
      return;
    }

    console.log(`Cleanup called for instance: ${instanceToCleanup}`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('evolution-whatsapp', {
        body: { 
          action: 'cleanup', 
          unit_id: unit.id,
          instance_name: instanceToCleanup,
        },
      });

      console.log('Cleanup completed successfully');
    } catch (err) {
      console.error('Cleanup error:', err);
    } finally {
      stopPolling();
      setConnectionState("disconnected");
      setQrCode(null);
      setPairingCode(null);
      setProfile(null);
      setCurrentInstanceName(null);
    }
  }, [unit?.id, currentInstanceName, unit?.evolution_instance_name, stopPolling]);

  // Reset state when unit changes (prevents state leakage between units)
  useEffect(() => {
    if (unit?.id && previousUnitIdRef.current && previousUnitIdRef.current !== unit.id) {
      console.log(`Unit changed from ${previousUnitIdRef.current} to ${unit.id}, resetting state`);
      stopPolling();
      setConnectionState("disconnected");
      setQrCode(null);
      setPairingCode(null);
      setError(null);
      setProfile(null);
      setCurrentInstanceName(null);
      isCreatingRef.current = false;
    }
    previousUnitIdRef.current = unit?.id || null;
  }, [unit?.id, stopPolling]);

  // Check initial status on mount (with auto-refresh QR)
  useEffect(() => {
    // Skip if we're in the process of creating an instance
    // This prevents the race condition where checkStatus clears the QR code
    if (isCreatingRef.current) {
      console.log('Skipping checkStatus - instance creation in progress');
      return;
    }

    // IMPORTANT: Don't reset to disconnected if we're already connected or connecting
    // This prevents race condition where stale unit data resets a successful connection
    if (connectionState === "open" || connectionState === "connecting") {
      console.log(`Skipping state reset - already in ${connectionState} state`);
      if (unit?.evolution_instance_name) {
        // Just update profile if available
        if (unit.whatsapp_name || unit.whatsapp_phone || unit.whatsapp_picture_url) {
          setProfile({
            name: unit.whatsapp_name,
            phone: unit.whatsapp_phone,
            pictureUrl: unit.whatsapp_picture_url,
          });
        }
      }
      return;
    }

    if (unit?.evolution_instance_name) {
      // Set initial profile from unit data if available
      if (unit.whatsapp_name || unit.whatsapp_phone || unit.whatsapp_picture_url) {
        setProfile({
          name: unit.whatsapp_name,
          phone: unit.whatsapp_phone,
          pictureUrl: unit.whatsapp_picture_url,
        });
      }
      checkStatus(true);
    } else {
      setConnectionState("disconnected");
      setQrCode(null);
      setPairingCode(null);
      setProfile(null);
    }
  }, [unit?.evolution_instance_name, checkStatus, connectionState]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    connectionState,
    qrCode,
    pairingCode,
    isLoading,
    error,
    profile,
    currentInstanceName,
    createInstance,
    disconnect,
    refreshQRCode,
    checkStatus,
    cleanup,
  };
}
