import { useState, useEffect } from "react";
import { CreditCard, Info, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { DeletionPasswordDialog } from "@/components/shared/DeletionPasswordDialog";

export function FinancialFeesTab() {
  const { settings, isLoading, updateSettings, verifyDeletionPassword } = useBusinessSettings();
  
  const [debitFee, setDebitFee] = useState("1.50");
  const [creditFee, setCreditFee] = useState("3.00");
  const [calculationBase, setCalculationBase] = useState<"gross" | "net">("gross");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const isDeletionPasswordActive = !!settings?.deletion_password_enabled && !!settings?.deletion_password_hash;

  const requirePassword = (action: () => void) => {
    if (isDeletionPasswordActive) {
      setPendingAction(() => action);
      setPasswordDialogOpen(true);
    } else {
      action();
    }
  };

  useEffect(() => {
    if (settings) {
      setDebitFee(settings.debit_card_fee_percent?.toString() ?? "1.50");
      setCreditFee(settings.credit_card_fee_percent?.toString() ?? "3.00");
      setCalculationBase((settings.commission_calculation_base as "gross" | "net") ?? "gross");
    }
  }, [settings]);

  const handleSave = () => {
    requirePassword(async () => {
      setIsSaving(true);
      try {
        await updateSettings.mutateAsync({
          debit_card_fee_percent: parseFloat(debitFee) || 1.50,
          credit_card_fee_percent: parseFloat(creditFee) || 3.00,
          commission_calculation_base: calculationBase,
        });
      } finally {
        setIsSaving(false);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Example calculation for display
  const examplePrice = 50;
  const exampleCreditFee = examplePrice * (parseFloat(creditFee) / 100);
  const exampleNetValue = examplePrice - exampleCreditFee;
  const exampleCommissionGross = examplePrice * 0.5;
  const exampleCommissionNet = exampleNetValue * 0.5;

  return (
    <div className="space-y-6">
      {/* Card Fees Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Taxas de Cartão
          </CardTitle>
          <CardDescription>
            Configure as taxas cobradas pela sua operadora de cartão. Dinheiro e PIX não têm taxa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debit-fee" className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-500" />
                Taxa Débito (%)
              </Label>
              <Input
                id="debit-fee"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={debitFee}
                onChange={(e) => setDebitFee(e.target.value)}
                placeholder="1.50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-fee" className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-purple-500" />
                Taxa Crédito (%)
              </Label>
              <Input
                id="credit-fee"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={creditFee}
                onChange={(e) => setCreditFee(e.target.value)}
                placeholder="3.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Calculation Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Base de Cálculo da Comissão
          </CardTitle>
          <CardDescription>
            Escolha se a comissão do profissional será calculada sobre o valor bruto ou líquido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={calculationBase}
            onValueChange={(value) => setCalculationBase(value as "gross" | "net")}
            className="space-y-3"
          >
            <div className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
              calculationBase === "gross" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}>
              <RadioGroupItem value="gross" id="gross" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="gross" className="font-medium cursor-pointer">
                  Valor Bruto
                </Label>
                <p className="text-sm text-muted-foreground">
                  Comissão calculada sobre o valor que o cliente pagou, sem descontar a taxa do cartão.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ex: R$ {examplePrice.toFixed(2)} em cartão → Comissão de 50% = <span className="font-medium text-primary">R$ {exampleCommissionGross.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
              calculationBase === "net" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}>
              <RadioGroupItem value="net" id="net" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="net" className="font-medium cursor-pointer">
                  Valor Líquido
                </Label>
                <p className="text-sm text-muted-foreground">
                  Comissão calculada após descontar a taxa do cartão (valor que a barbearia realmente recebe).
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ex: R$ {examplePrice.toFixed(2)} em cartão ({creditFee}% taxa = R$ {exampleCreditFee.toFixed(2)}) → Comissão de 50% sobre R$ {exampleNetValue.toFixed(2)} = <span className="font-medium text-primary">R$ {exampleCommissionNet.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 mt-4">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Dinheiro e PIX não têm taxa de operadora, então o valor bruto e líquido são iguais para esses métodos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <DeletionPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onVerify={async (password) => {
          const valid = await verifyDeletionPassword(password);
          if (valid && pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
          return valid;
        }}
        title="Senha de Segurança"
        description="Digite a senha de segurança para alterar as taxas e configurações financeiras."
      />
    </div>
  );
}
