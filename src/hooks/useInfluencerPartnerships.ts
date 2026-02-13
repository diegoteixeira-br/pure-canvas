import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface InfluencerPartnership {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram_handle: string | null;
  referral_code: string;
  commission_percent: number;
  status: string;
  started_at: string;
  ends_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InfluencerPayment {
  id: string;
  partnership_id: string;
  period_start: string;
  period_end: string;
  mrr_base: number;
  commission_percent: number;
  amount: number;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export function useInfluencerPartnerships() {
  const queryClient = useQueryClient();

  const partnershipsQuery = useQuery({
    queryKey: ["influencer-partnerships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("influencer_partnerships" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as InfluencerPartnership[];
    },
  });

  const createPartnership = useMutation({
    mutationFn: async (values: Omit<InfluencerPartnership, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("influencer_partnerships" as any)
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer-partnerships"] });
      toast({ title: "Influenciador cadastrado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    },
  });

  const updatePartnership = useMutation({
    mutationFn: async ({ id, ...values }: Partial<InfluencerPartnership> & { id: string }) => {
      const { data, error } = await supabase
        .from("influencer_partnerships" as any)
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer-partnerships"] });
      toast({ title: "Influenciador atualizado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deletePartnership = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("influencer_partnerships" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer-partnerships"] });
      toast({ title: "Influenciador removido!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  return { partnershipsQuery, createPartnership, updatePartnership, deletePartnership };
}

export function useInfluencerPayments(partnershipId?: string) {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ["influencer-payments", partnershipId],
    queryFn: async () => {
      let query = supabase
        .from("influencer_payments" as any)
        .select("*")
        .order("period_start", { ascending: false });
      if (partnershipId) {
        query = query.eq("partnership_id", partnershipId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as InfluencerPayment[];
    },
    enabled: !!partnershipId,
  });

  const createPayment = useMutation({
    mutationFn: async (values: Omit<InfluencerPayment, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("influencer_payments" as any)
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer-payments"] });
      toast({ title: "Pagamento registrado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao registrar pagamento", description: error.message, variant: "destructive" });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, payment_method }: { id: string; payment_method: string }) => {
      const { data, error } = await supabase
        .from("influencer_payments" as any)
        .update({ status: "paid", paid_at: new Date().toISOString(), payment_method })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer-payments"] });
      toast({ title: "Pagamento marcado como pago!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  return { paymentsQuery, createPayment, markAsPaid };
}

export function useMRR() {
  return useQuery({
    queryKey: ["mrr-total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("monthly_price")
        .in("plan_status", ["active", "trial"]);
      if (error) throw error;
      return (data || []).reduce((sum, c) => sum + (Number(c.monthly_price) || 0), 0);
    },
  });
}
