import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Scissors, Mail, Lock, Store, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import { useRecaptcha } from "@/hooks/useRecaptcha"; // TEMPORARILY DISABLED
import { z } from "zod";

const PLANS = [
  { value: "inicial", label: "Inicial", price: "R$ 99/mês" },
  { value: "profissional", label: "Profissional", price: "R$ 199/mês" },
  { value: "franquias", label: "Franquias", price: "R$ 499/mês" },
];

type AuthView = "auth" | "forgot-password";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  // TEMPORARILY DISABLED: const { isReady: isRecaptchaReady, executeRecaptcha } = useRecaptcha();
  const isRecaptchaReady = true;
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<AuthView>("auth");
  const [resetEmail, setResetEmail] = useState("");
  
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  
  // Get plan parameters from URL
  const planFromUrl = searchParams.get("plan");
  const billingFromUrl = searchParams.get("billing");
  const refFromUrl = searchParams.get("ref");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(planFromUrl || "profissional");
  const [selectedBilling, setSelectedBilling] = useState(billingFromUrl || "monthly");

  useEffect(() => {
    if (planFromUrl) {
      setSelectedPlan(planFromUrl);
    }
    if (billingFromUrl) {
      setSelectedBilling(billingFromUrl);
    }
    if (refFromUrl) {
      localStorage.setItem("referral_code", refFromUrl);
    }
  }, [planFromUrl, billingFromUrl, refFromUrl]);

  const validateLogin = () => {
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const validateSignup = () => {
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);

      if (!signupName.trim()) {
        toast({
          title: "Erro de validação",
          description: "Nome da barbearia é obrigatório",
          variant: "destructive",
        });
        return false;
      }

      if (!selectedPlan) {
        toast({
          title: "Erro de validação",
          description: "Selecione um plano",
          variant: "destructive",
        });
        return false;
      }

      if (signupPassword !== signupConfirmPassword) {
        toast({
          title: "Erro de validação",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // TEMPORARILY DISABLED: reCAPTCHA verification
  const verifyRecaptcha = async (_action: string): Promise<boolean> => {
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      // Verify reCAPTCHA first
      const isHuman = await verifyRecaptcha("login");
      if (!isHuman) {
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        let message = error.message;
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou senha incorretos";
        }
        toast({
          title: "Erro ao fazer login",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso",
        });
        navigate("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setIsLoading(true);
    try {
      // Verify reCAPTCHA first
      const isHuman = await verifyRecaptcha("signup");
      if (!isHuman) {
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupName,
            business_name: signupName,
          },
        },
      });

      if (error) {
        let message = error.message;
        if (error.message.includes("User already registered")) {
          message = "Este email já está cadastrado";
        }
        toast({
          title: "Erro ao criar conta",
          description: message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        
        const { error: companyError } = await supabase
          .from("companies")
          .insert({
            name: signupName,
            owner_user_id: data.user.id,
            plan_status: "trial",
            plan_type: selectedPlan,
            trial_ends_at: trialEndsAt.toISOString(),
          });

        if (companyError) {
          console.error("Error creating company:", companyError);
        } else {
          // Handle referral/influencer code after company creation
          const savedRefCode = localStorage.getItem("referral_code");
          if (savedRefCode) {
            try {
              // Get the newly created company
              const { data: newCompany } = await supabase
                .from("companies")
                .select("id")
                .eq("owner_user_id", data.user!.id)
                .maybeSingle();

              if (newCompany) {
                if (savedRefCode.startsWith("INF_")) {
                  // Influencer referral - store as inf:CODE in signup_source
                  await supabase
                    .from("companies")
                    .update({ signup_source: `inf:${savedRefCode}` })
                    .eq("id", newCompany.id);
                } else {
                  // Regular referral - use SECURITY DEFINER function
                  await supabase.rpc("process_referral_signup", {
                    p_referred_company_id: newCompany.id,
                    p_referral_code: savedRefCode,
                  });
                }
              }
            } catch (refErr) {
              console.error("Error processing referral:", refErr);
            }
            localStorage.removeItem("referral_code");
          }
        }

        toast({
          title: "Conta criada!",
          description: "Redirecionando para o checkout...",
        });

        try {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
            "create-checkout-session",
            { body: { plan: selectedPlan, billing: selectedBilling, businessName: signupName } }
          );

          if (checkoutError) {
            console.error("Checkout error:", checkoutError);
            toast({
              title: "Erro no checkout",
              description: "Não foi possível iniciar o checkout. Redirecionando para escolha de plano.",
              variant: "destructive",
            });
            navigate("/escolher-plano");
            return;
          }

          if (checkoutData?.url) {
            window.location.href = checkoutData.url;
            return;
          }
        } catch (checkoutErr) {
          console.error("Checkout exception:", checkoutErr);
          navigate("/escolher-plano");
          return;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      // Verify reCAPTCHA first
      const isHuman = await verifyRecaptcha("forgot_password");
      if (!isHuman) {
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/auth?tab=login`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setView("auth");
        setResetEmail("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // TEMPORARILY DISABLED: RecaptchaLegal
  const RecaptchaLegal = () => null;

  if (view === "forgot-password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex flex-col items-center group">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-gold group-hover:scale-105 transition-transform">
              <Scissors className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gold group-hover:text-gold/80 transition-colors">BarberSoft</h1>
            <p className="mt-1 text-muted-foreground">Gestão de Barbearias</p>
          </Link>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recuperar Senha</CardTitle>
              <CardDescription>
                Digite seu email para receber um link de recuperação de senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={isLoading || !isRecaptchaReady}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setView("auth")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o login
                </Button>
              </form>
              <RecaptchaLegal />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BarberSoft. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex flex-col items-center group">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-gold group-hover:scale-105 transition-transform">
            <Scissors className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gold group-hover:text-gold/80 transition-colors">BarberSoft</h1>
          <p className="mt-1 text-muted-foreground">Gestão de Barbearias</p>
        </Link>

        <Card className="border-border bg-card">
          <Tabs defaultValue={defaultTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Criar Conta
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading || !isRecaptchaReady}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setView("forgot-password")}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </form>
                <RecaptchaLegal />
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome da Barbearia</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Ex: Barbearia do João"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-plan">Plano</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map((plan) => (
                          <SelectItem key={plan.value} value={plan.value}>
                            <span className="flex items-center justify-between gap-4 w-full">
                              <span className="font-medium">{plan.label}</span>
                              <span className="text-muted-foreground text-sm">{plan.price}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      7 dias grátis, depois será cobrado automaticamente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90" 
                    disabled={isLoading || !isRecaptchaReady}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </form>
                <RecaptchaLegal />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BarberSoft. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
