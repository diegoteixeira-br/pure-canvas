import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useSaasSettings } from "@/hooks/useSaasSettings";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function StripeSettingsCard() {
  const { settings, updateSettings, isUpdating } = useSaasSettings();
  
  const [stripeMode, setStripeMode] = useState<string>("test");
  const [testPublishableKey, setTestPublishableKey] = useState("");
  const [testSecretKey, setTestSecretKey] = useState("");
  const [livePublishableKey, setLivePublishableKey] = useState("");
  const [liveSecretKey, setLiveSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [maskedKeys, setMaskedKeys] = useState<Record<string, any>>({});
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Load stripe mode from non-sensitive settings
  useEffect(() => {
    if (settings) {
      setStripeMode(settings.stripe_mode || "test");
    }
  }, [settings]);

  // Load masked keys from edge function
  useEffect(() => {
    async function loadKeys() {
      try {
        const { data, error } = await supabase.functions.invoke("manage-stripe-keys", {
          body: { action: "get" },
        });
        if (error) throw error;
        setMaskedKeys(data);
        setTestPublishableKey(data.stripe_test_publishable_key || "");
        setLivePublishableKey(data.stripe_live_publishable_key || "");
      } catch (err) {
        console.error("Error loading stripe keys:", err);
      } finally {
        setLoadingKeys(false);
      }
    }
    loadKeys();
  }, []);

  const handleSave = async () => {
    // Save non-sensitive settings via client
    updateSettings({ stripe_mode: stripeMode });

    // Save secret keys via edge function
    try {
      const payload: Record<string, any> = {
        action: "save",
        stripe_test_publishable_key: testPublishableKey,
        stripe_live_publishable_key: livePublishableKey,
      };
      // Only send secret keys if user typed a new value (not masked)
      if (testSecretKey && !testSecretKey.includes("••••")) payload.stripe_test_secret_key = testSecretKey;
      if (liveSecretKey && !liveSecretKey.includes("••••")) payload.stripe_live_secret_key = liveSecretKey;
      if (webhookSecret && !webhookSecret.includes("••••")) payload.stripe_webhook_secret = webhookSecret;

      const { error } = await supabase.functions.invoke("manage-stripe-keys", { body: payload });
      if (error) throw error;
      toast.success("Chaves Stripe salvas com segurança");
      // Reset secret fields to masked
      setTestSecretKey("");
      setLiveSecretKey("");
      setWebhookSecret("");
      // Reload masked keys
      const { data } = await supabase.functions.invoke("manage-stripe-keys", { body: { action: "get" } });
      if (data) setMaskedKeys(data);
    } catch (err) {
      toast.error("Erro ao salvar chaves Stripe");
    }
  };

  const testConnection = async () => {
    toast.info("Funcionalidade de teste será implementada via Edge Function");
  };

  const isConfigured = stripeMode === "test" 
    ? !!(testPublishableKey && maskedKeys.has_test_secret)
    : !!(livePublishableKey && maskedKeys.has_live_secret);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white">Gateway de Pagamento - Stripe</CardTitle>
              <CardDescription className="text-slate-400">
                Configure as chaves de API do Stripe
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={isConfigured 
            ? "bg-green-500/20 text-green-400 border-green-500/30" 
            : "bg-red-500/20 text-red-400 border-red-500/30"
          }>
            {isConfigured ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Configurado</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Não Configurado</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-slate-300 mb-3 block">Modo</Label>
          <RadioGroup value={stripeMode} onValueChange={setStripeMode} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="test" id="test" className="border-slate-600 text-blue-500" />
              <Label htmlFor="test" className="text-white cursor-pointer">Teste</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="live" id="live" className="border-slate-600 text-blue-500" />
              <Label htmlFor="live" className="text-white cursor-pointer">Produção</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-300">Chaves de Teste</p>
          <div className="grid gap-4">
            <div>
              <Label className="text-slate-400 text-xs">Publishable Key</Label>
              <Input
                value={testPublishableKey}
                onChange={(e) => setTestPublishableKey(e.target.value)}
                placeholder="pk_test_..."
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Secret Key</Label>
              <div className="relative">
                <Input
                  type={showTestSecret ? "text" : "password"}
                  value={testSecretKey}
                  onChange={(e) => setTestSecretKey(e.target.value)}
                  placeholder={maskedKeys.has_test_secret ? maskedKeys.stripe_test_secret_key_masked : "sk_test_..."}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowTestSecret(!showTestSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showTestSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-300">Chaves de Produção</p>
          <div className="grid gap-4">
            <div>
              <Label className="text-slate-400 text-xs">Publishable Key</Label>
              <Input
                value={livePublishableKey}
                onChange={(e) => setLivePublishableKey(e.target.value)}
                placeholder="pk_live_..."
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Secret Key</Label>
              <div className="relative">
                <Input
                  type={showLiveSecret ? "text" : "password"}
                  value={liveSecretKey}
                  onChange={(e) => setLiveSecretKey(e.target.value)}
                  placeholder={maskedKeys.has_live_secret ? maskedKeys.stripe_live_secret_key_masked : "sk_live_..."}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLiveSecret(!showLiveSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showLiveSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-slate-400 text-xs">Webhook Secret</Label>
          <div className="relative">
            <Input
              type={showWebhookSecret ? "text" : "password"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={maskedKeys.has_webhook_secret ? maskedKeys.stripe_webhook_secret_masked : "whsec_..."}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={testConnection}
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Testar Conexão
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
