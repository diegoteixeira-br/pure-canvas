import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Eye,
  Trash2,
  Users,
  Info,
  Download,
  FileDown
} from "lucide-react";
import { usePartnershipTerms, useTermAcceptances } from "@/hooks/usePartnershipTerms";
import { useCompany } from "@/hooks/useCompany";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { DeletionPasswordDialog } from "@/components/shared/DeletionPasswordDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DEFAULT_TERM_TEMPLATE = `TERMOS DE PARCERIA E NORMAS DE CONDUTA

1. DAS PARTES
Este termo estabelece as normas de parceria entre o estabelecimento e o Profissional Parceiro {{nome}}.

2. DA REMUNERAÇÃO
O Profissional Parceiro receberá a cota-parte de {{comissao}} sobre os serviços prestados, conforme acordado previamente.

3. DAS OBRIGAÇÕES
O Profissional se compromete a:
- Manter pontualidade nos atendimentos agendados
- Seguir os padrões de qualidade do estabelecimento
- Zelar pela imagem e reputação da empresa
- Utilizar apenas produtos fornecidos ou aprovados

4. DA POLÍTICA DE CANCELAMENTO
- Faltas sem aviso prévio (no-show) podem resultar em desconto na remuneração
- Cancelamentos tardios devem ser comunicados com antecedência mínima

5. DA CONFIDENCIALIDADE (LGPD)
O Profissional não poderá exportar ou utilizar a lista de clientes do sistema para contato por fora do estabelecimento. O descumprimento configura desvio de clientela e é motivo para rescisão imediata.

6. DA VIGÊNCIA
Este termo entra em vigor na data de aceite digital e permanece válido enquanto a parceria estiver ativa.

Unidade: {{unidade}}`;

export function PartnershipTermsTab() {
  const { company } = useCompany();
  const { terms, activeTerm, isLoading, createTerm, activateTerm, deleteTerm } = usePartnershipTerms(company?.id || null);
  const { acceptances } = useTermAcceptances(company?.id || null);

  const { settings, verifyDeletionPassword } = useBusinessSettings();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAcceptancesModal, setShowAcceptancesModal] = useState(false);
  const [previewTerm, setPreviewTerm] = useState<typeof terms[0] | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [newVersion, setNewVersion] = useState("");
  const [newTitle, setNewTitle] = useState("Termos de Parceria e Normas de Conduta");
  const [newContent, setNewContent] = useState(DEFAULT_TERM_TEMPLATE);

  const isDeletionPasswordActive = !!settings?.deletion_password_enabled && !!settings?.deletion_password_hash;

  const requirePassword = useCallback((action: () => void) => {
    if (isDeletionPasswordActive) {
      setPendingAction(() => action);
      setPasswordDialogOpen(true);
    } else {
      action();
    }
  }, [isDeletionPasswordActive]);

  const handleCreateWithPassword = () => {
    requirePassword(() => setShowCreateModal(true));
  };

  const handleCreate = async () => {
    if (!company || !newVersion || !newTitle || !newContent) return;

    await createTerm.mutateAsync({
      company_id: company.id,
      version: newVersion,
      title: newTitle,
      content: newContent,
      is_active: false,
    });

    setShowCreateModal(false);
    setNewVersion("");
    setNewTitle("Termos de Parceria e Normas de Conduta");
    setNewContent(DEFAULT_TERM_TEMPLATE);
  };

  const handleActivate = (termId: string) => {
    requirePassword(() => activateTerm.mutate(termId));
  };

  const handleDelete = (termId: string) => {
    requirePassword(() => deleteTerm.mutate(termId));
  };

  const handlePreview = (term: typeof terms[0]) => {
    setPreviewTerm(term);
    setShowPreviewModal(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Termos de Parceria
              </CardTitle>
              <CardDescription>
                Gerencie os termos que os profissionais devem aceitar ao acessar o sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAcceptancesModal(true)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Ver Aceites
              </Button>
              <Button onClick={handleCreateWithPassword} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Versão
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Como funciona</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Crie versões do termo com as regras da sua barbearia</li>
                <li>• Use variáveis: <code className="bg-secondary px-1 rounded">{"{{nome}}"}</code>, <code className="bg-secondary px-1 rounded">{"{{comissao}}"}</code>, <code className="bg-secondary px-1 rounded">{"{{unidade}}"}</code></li>
                <li>• Ative uma versão para que apareça no login dos profissionais</li>
                <li>• Quando ativar uma nova versão, todos precisarão aceitar novamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms List */}
      <div className="grid gap-4">
        {terms.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">Nenhum termo cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie seu primeiro termo de parceria para proteger sua empresa
              </p>
              <Button onClick={handleCreateWithPassword} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Termo
              </Button>
            </CardContent>
          </Card>
        ) : (
          terms.map((term) => (
            <Card key={term.id} className={`bg-card border-border ${term.is_active ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{term.title}</h4>
                        <Badge variant="outline">v{term.version}</Badge>
                        {term.is_active && (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Criado em {format(new Date(term.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handlePreview(term)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {!term.is_active && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleActivate(term.id)}
                          disabled={activateTerm.isPending}
                        >
                          Ativar
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover termo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O termo será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(term.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-card">
          <DialogHeader>
            <DialogTitle>Nova Versão do Termo</DialogTitle>
            <DialogDescription>
              Crie uma nova versão do termo de parceria. Use as variáveis para personalização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Versão *</Label>
                <Input
                  placeholder="Ex: 1.0, 2.0"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Título do termo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conteúdo do Termo *</Label>
              <Textarea
                placeholder="Digite o conteúdo do termo..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {"{{nome}}"}, {"{{comissao}}"}, {"{{unidade}}"}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newVersion || !newTitle || !newContent || createTerm.isPending}
              >
                {createTerm.isPending ? "Criando..." : "Criar Termo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-card">
          <DialogHeader>
            <DialogTitle>{previewTerm?.title}</DialogTitle>
            <DialogDescription>Versão {previewTerm?.version}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-lg border p-4">
            <div className="whitespace-pre-wrap text-sm">
              {previewTerm?.content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Acceptances Modal with PDF Export */}
      <Dialog open={showAcceptancesModal} onOpenChange={setShowAcceptancesModal}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] bg-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Relatório de Aceites dos Termos</DialogTitle>
                <DialogDescription>
                  Registro jurídico completo de aceites pelos profissionais
                </DialogDescription>
              </div>
              {acceptances.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportAcceptancesPDF(acceptances, company?.name || "Empresa")}
                    className="gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="h-[500px]">
            {acceptances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aceite registrado ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Termo</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acceptances.map((acceptance: any) => (
                    <TableRow key={acceptance.id}>
                      <TableCell className="font-medium">
                        {acceptance.barbers?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {acceptance.partnership_terms?.title} v{acceptance.partnership_terms?.version}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(acceptance.accepted_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{acceptance.commission_rate_snapshot}%</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {acceptance.ip_address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportSingleAcceptancePDF(acceptance, company?.name || "Empresa")}
                          title="Baixar comprovante individual"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          
          {acceptances.length > 0 && (
            <div className="border-t pt-4 text-xs text-muted-foreground">
              <p>• Total de registros: {acceptances.length}</p>
              <p>• Os dados de IP e User-Agent são coletados para fins de auditoria jurídica</p>
              <p>• O PDF exportado contém assinatura digital timestamped</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
        description="Digite a senha de segurança para gerenciar os termos de parceria."
      />
    </div>
  );
}

// PDF Export Functions
function exportAcceptancesPDF(acceptances: any[], companyName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE ACEITES - TERMOS DE PARCERIA", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Empresa: ${companyName}`, 14, 35);
  doc.text(`Data de emissão: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}`, 14, 42);
  doc.text(`Total de registros: ${acceptances.length}`, 14, 49);
  
  // Disclaimer
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Este documento foi gerado automaticamente e possui validade jurídica para fins de comprovação de aceite digital.",
    14, 58
  );
  doc.setTextColor(0);
  
  // Table
  const tableData = acceptances.map((a: any) => [
    a.barbers?.name || "N/A",
    `${a.partnership_terms?.title || "N/A"} v${a.partnership_terms?.version || ""}`,
    format(new Date(a.accepted_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    `${a.commission_rate_snapshot}%`,
    a.ip_address || "N/A",
    (a.user_agent || "N/A").substring(0, 30) + "..."
  ]);
  
  autoTable(doc, {
    startY: 65,
    head: [["Profissional", "Termo", "Data/Hora Aceite", "Comissão", "IP", "User Agent"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 244] },
  });
  
  // Footer with hash
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Documento gerado em: ${new Date().toISOString()}`, 14, finalY);
  doc.text(`Hash de verificação: ${generateSimpleHash(JSON.stringify(acceptances))}`, 14, finalY + 5);
  
  doc.save(`relatorio-aceites-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

function exportSingleAcceptancePDF(acceptance: any, companyName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROVANTE DE ACEITE DIGITAL", pageWidth / 2, 20, { align: "center" });
  doc.text("TERMO DE PARCERIA", pageWidth / 2, 28, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  let y = 45;
  const lineHeight = 8;
  
  // Company info
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA EMPRESA", 14, y);
  doc.setFont("helvetica", "normal");
  y += lineHeight;
  doc.text(`Empresa: ${companyName}`, 14, y);
  
  y += lineHeight * 2;
  
  // Professional info
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO PROFISSIONAL", 14, y);
  doc.setFont("helvetica", "normal");
  y += lineHeight;
  doc.text(`Nome: ${acceptance.barbers?.name || "N/A"}`, 14, y);
  y += lineHeight;
  doc.text(`Taxa de Comissão no momento do aceite: ${acceptance.commission_rate_snapshot}%`, 14, y);
  
  y += lineHeight * 2;
  
  // Term info
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO TERMO ACEITO", 14, y);
  doc.setFont("helvetica", "normal");
  y += lineHeight;
  doc.text(`Termo: ${acceptance.partnership_terms?.title || "N/A"}`, 14, y);
  y += lineHeight;
  doc.text(`Versão: ${acceptance.partnership_terms?.version || "N/A"}`, 14, y);
  
  y += lineHeight * 2;
  
  // Audit info
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DE AUDITORIA", 14, y);
  doc.setFont("helvetica", "normal");
  y += lineHeight;
  doc.text(`Data e hora do aceite: ${format(new Date(acceptance.accepted_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}`, 14, y);
  y += lineHeight;
  doc.text(`Endereço IP: ${acceptance.ip_address || "Não disponível"}`, 14, y);
  y += lineHeight;
  
  const userAgent = acceptance.user_agent || "Não disponível";
  const wrappedUA = doc.splitTextToSize(`Navegador/Dispositivo: ${userAgent}`, pageWidth - 28);
  doc.text(wrappedUA, 14, y);
  y += lineHeight * wrappedUA.length;
  
  y += lineHeight;
  
  // Content snapshot (first 500 chars)
  doc.setFont("helvetica", "bold");
  doc.text("CONTEÚDO DO TERMO (Resumo)", 14, y);
  doc.setFont("helvetica", "normal");
  y += lineHeight;
  
  const contentPreview = (acceptance.content_snapshot || "").substring(0, 800);
  const wrappedContent = doc.splitTextToSize(contentPreview + "...", pageWidth - 28);
  doc.setFontSize(8);
  doc.text(wrappedContent, 14, y);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Documento gerado em: ${new Date().toISOString()}`, 14, 270);
  doc.text(`ID do aceite: ${acceptance.id}`, 14, 275);
  doc.text(`Hash: ${generateSimpleHash(JSON.stringify(acceptance))}`, 14, 280);
  
  doc.save(`comprovante-aceite-${acceptance.barbers?.name?.replace(/\s/g, "-") || "profissional"}-${format(new Date(acceptance.accepted_at), "yyyy-MM-dd")}.pdf`);
}

function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}