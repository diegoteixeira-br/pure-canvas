import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashFlowTab } from "@/components/financeiro/CashFlowTab";
import { CommissionReportTab } from "@/components/financeiro/CommissionReportTab";
import { ExpensesTab } from "@/components/financeiro/ExpensesTab";
import { InventoryTab } from "@/components/financeiro/InventoryTab";
import { CourtesyReportTab } from "@/components/financeiro/CourtesyReportTab";
import { DeletionPasswordDialog } from "@/components/shared/DeletionPasswordDialog";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useBarberAuth } from "@/hooks/useBarberAuth";
import { DollarSign, FileText, TrendingDown, Package, Gift, Lock } from "lucide-react";

// Tabs that require password (all except commission)
const PROTECTED_TABS = ["cash-flow", "expenses", "inventory", "courtesy"];

export default function Financeiro() {
  const { settings, verifyDeletionPassword } = useBusinessSettings();
  const { isBarber } = useBarberAuth();
  const isDeletionPasswordActive = !!settings?.deletion_password_enabled && !!settings?.deletion_password_hash;

  // Barbers always start on commission and can only see commission
  const defaultTab = isBarber ? "commission" : "cash-flow";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [unlockedTabs, setUnlockedTabs] = useState<Set<string>>(new Set());
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // Owner with password active needs to unlock protected tabs
  const needsPassword = isDeletionPasswordActive && !isBarber;

  const handleTabChange = (tab: string) => {
    // Barbers can only access commission
    if (isBarber && PROTECTED_TABS.includes(tab)) return;

    if (needsPassword && PROTECTED_TABS.includes(tab) && !unlockedTabs.has(tab)) {
      setPendingTab(tab);
      setPasswordDialogOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const isTabLocked = (tab: string) => {
    return needsPassword && PROTECTED_TABS.includes(tab) && !unlockedTabs.has(tab);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Financeiro</h1>
          <p className="mt-1 text-muted-foreground">Controle de caixa, despesas, estoque e comissões</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted">
            {!isBarber && (
              <TabsTrigger value="cash-flow" className="flex items-center gap-2">
                {isTabLocked("cash-flow") ? <Lock className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                Fluxo de Caixa
              </TabsTrigger>
            )}
            {!isBarber && (
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                {isTabLocked("expenses") ? <Lock className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                Despesas
              </TabsTrigger>
            )}
            {!isBarber && (
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                {isTabLocked("inventory") ? <Lock className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                Estoque
              </TabsTrigger>
            )}
            <TabsTrigger value="commission" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Comissões
            </TabsTrigger>
            {!isBarber && (
              <TabsTrigger value="courtesy" className="flex items-center gap-2">
                {isTabLocked("courtesy") ? <Lock className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                Cortesias
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="cash-flow" className="mt-6">
            <CashFlowTab />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <ExpensesTab />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="commission" className="mt-6">
            <CommissionReportTab />
          </TabsContent>

          <TabsContent value="courtesy" className="mt-6">
            <CourtesyReportTab />
          </TabsContent>
        </Tabs>
      </div>

      <DeletionPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) setPendingTab(null);
        }}
        onVerify={async (password) => {
          const valid = await verifyDeletionPassword(password);
          if (valid && pendingTab) {
            setUnlockedTabs((prev) => new Set([...prev, pendingTab]));
            setActiveTab(pendingTab);
            setPendingTab(null);
          }
          return valid;
        }}
        title="Senha de Segurança"
        description="Digite a senha de segurança para acessar esta seção do financeiro."
      />
    </DashboardLayout>
  );
}
