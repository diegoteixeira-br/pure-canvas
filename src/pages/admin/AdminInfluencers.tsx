import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, DollarSign, Users, TrendingUp, AlertCircle, Copy, FileText, Eye, Send, Save, Loader2 } from "lucide-react";
import { useInfluencerPartnerships, useInfluencerPayments, useMRR, useInfluencerTermTemplate, InfluencerPartnership } from "@/hooks/useInfluencerPartnerships";
import { InfluencerFormModal } from "@/components/admin/InfluencerFormModal";
import { InfluencerPaymentModal } from "@/components/admin/InfluencerPaymentModal";
import { InfluencerPaymentsTable } from "@/components/admin/InfluencerPaymentsTable";
import { InfluencerTermPreviewModal } from "@/components/admin/InfluencerTermPreviewModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { generateInfluencerTermPDF } from "@/utils/generateInfluencerTermPDF";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  paused: { label: "Pausado", variant: "secondary" },
  ended: { label: "Encerrado", variant: "destructive" },
};

export default function AdminInfluencers() {
  const { partnershipsQuery, createPartnership, updatePartnership, deletePartnership } = useInfluencerPartnerships();
  const termTemplateQuery = useInfluencerTermTemplate();
  const termTemplate = termTemplateQuery.data;
  const { data: mrr } = useMRR();
  const [termEditorOpen, setTermEditorOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editContent, setEditContent] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InfluencerPartnership | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<InfluencerPartnership | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState("pix");
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [termPreviewTarget, setTermPreviewTarget] = useState<InfluencerPartnership | null>(null);
  const siteUrl = window.location.origin;

  // Query companies linked to influencers
  const { data: linkedCompanies } = useQuery({
    queryKey: ["influencer-linked-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, signup_source, created_at, plan_status, monthly_price")
        .like("signup_source", "inf:%");
      if (error) throw error;
      return data || [];
    },
  });

  const getLinkedCount = (code: string) => 
    (linkedCompanies || []).filter(c => c.signup_source === `inf:${code}`).length;

  const getLinkedLeads = (code: string) =>
    (linkedCompanies || []).filter(c => c.signup_source === `inf:${code}`);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${siteUrl}/auth?tab=signup&ref=${code}`);
    toast({ title: "Link copiado!" });
  };

  const { paymentsQuery, createPayment, markAsPaid } = useInfluencerPayments(selectedId || undefined);

  const influencers = partnershipsQuery.data || [];
  const payments = paymentsQuery.data || [];

  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  const handleFormSubmit = (values: any) => {
    if (values.id) {
      updatePartnership.mutate(values);
    } else {
      createPartnership.mutate(values);
    }
  };

  const handleDownloadTerm = (inf: InfluencerPartnership) => {
    if (!termTemplate) {
      toast({ title: "Nenhum modelo de termo encontrado", variant: "destructive" });
      return;
    }
    generateInfluencerTermPDF(inf, termTemplate.content, termTemplate.title);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Influenciadores</h1>
            <p className="text-slate-400">Gerencie parcerias e comissões de influenciadores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => {
              if (termTemplate) {
                setEditTitle(termTemplate.title);
                setEditVersion(termTemplate.version);
                setEditContent(termTemplate.content);
              }
              setTermEditorOpen(!termEditorOpen);
            }}>
              <FileText className="h-4 w-4 mr-2" /> {termEditorOpen ? "Fechar Editor" : "Editar Termo"}
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Influenciador
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Influenciadores</p>
                <p className="text-2xl font-bold text-white">{influencers.filter(i => i.status === "active").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">MRR Atual</p>
                <p className="text-2xl font-bold text-white">R$ {(mrr || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Pendente</p>
                <p className="text-2xl font-bold text-yellow-400">R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-sm text-slate-400">Total Pago</p>
                <p className="text-2xl font-bold text-emerald-400">R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Term Editor */}
        {termEditorOpen && termTemplate && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400" />
                Editar Termo de Parceria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Título</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Versão</Label>
                  <Input
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Ex: 2.1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Conteúdo do Termo
                  <span className="text-xs text-slate-500 ml-2">
                    Variáveis: {"{NOME_INFLUENCIADOR}"}, {"{PERCENTUAL}"}, {"{DATA}"}
                  </span>
                </Label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white min-h-[300px] font-mono text-sm"
                  placeholder="Conteúdo do termo de parceria..."
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    termTemplateQuery.updateTemplate.mutate({
                      id: termTemplate.id,
                      title: editTitle,
                      content: editContent,
                      version: editVersion,
                    });
                  }}
                  disabled={termTemplateQuery.updateTemplate.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {termTemplateQuery.updateTemplate.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Termo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Influencers Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Parcerias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Nome</TableHead>
                  <TableHead className="text-slate-300">Instagram</TableHead>
                  <TableHead className="text-slate-300">Comissão</TableHead>
                  <TableHead className="text-slate-300">Leads</TableHead>
                  <TableHead className="text-slate-300">Link</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map((inf) => {
                  const s = statusMap[inf.status] || statusMap.active;
                  return (
                    <TableRow key={inf.id} className="border-slate-700 cursor-pointer" onClick={() => setSelectedId(inf.id)}>
                      <TableCell className="text-white font-medium">{inf.name}</TableCell>
                      <TableCell className="text-slate-300">{inf.instagram_handle || "—"}</TableCell>
                      <TableCell className="text-slate-300">{inf.commission_percent}%</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getLinkedCount(inf.referral_code)} leads</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-blue-400 text-xs" onClick={(e) => { e.stopPropagation(); copyLink(inf.referral_code); }}>
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                      </TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" title="Visualizar Termo" onClick={() => setTermPreviewTarget(inf)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setPaymentTarget(inf); setPaymentOpen(true); }}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(inf); setFormOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400" onClick={() => setDeleteTarget(inf.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!influencers.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      Nenhum influenciador cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payments Section */}
        {selectedId && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Pagamentos — {influencers.find(i => i.id === selectedId)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfluencerPaymentsTable
                payments={payments}
                onMarkAsPaid={(p) => setMarkPaidId(p.id)}
              />
            </CardContent>
          </Card>
        )}

        {/* Leads Section */}
        {selectedId && (() => {
          const selectedInf = influencers.find(i => i.id === selectedId);
          if (!selectedInf) return null;
          const leads = getLinkedLeads(selectedInf.referral_code);
          const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
            active: { label: "Ativo", variant: "default" },
            trial: { label: "Trial", variant: "secondary" },
            cancelled: { label: "Cancelado", variant: "destructive" },
            expired: { label: "Expirado", variant: "destructive" },
          };
          return (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leads Vinculados — {selectedInf.name} ({leads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Nome</TableHead>
                      <TableHead className="text-slate-300">Data de Cadastro</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Valor Mensal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => {
                      const ls = statusLabels[lead.plan_status || ""] || { label: lead.plan_status || "—", variant: "secondary" as const };
                      return (
                        <TableRow key={lead.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">{lead.name}</TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(lead.created_at || "").toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ls.variant}>{ls.label}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            R$ {(Number(lead.monthly_price) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!leads.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                          Nenhum lead vinculado a este influenciador
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      <InfluencerFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        influencer={editing}
        onSubmit={handleFormSubmit}
        isLoading={createPartnership.isPending || updatePartnership.isPending}
      />

      <InfluencerTermPreviewModal
        open={!!termPreviewTarget}
        onOpenChange={(open) => !open && setTermPreviewTarget(null)}
        influencer={termPreviewTarget}
        termTemplate={termTemplate || null}
      />

      <InfluencerPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        influencer={paymentTarget}
        onSubmit={(values) => createPayment.mutate(values)}
        isLoading={createPayment.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover influenciador?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação irá remover o influenciador e todos os pagamentos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => { if (deleteTarget) deletePartnership.mutate(deleteTarget); setDeleteTarget(null); }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid */}
      <AlertDialog open={!!markPaidId} onOpenChange={() => setMarkPaidId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Marcar como pago?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={markPaidMethod} onValueChange={setMarkPaidMethod}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (markPaidId) markAsPaid.mutate({ id: markPaidId, payment_method: markPaidMethod }); setMarkPaidId(null); }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
