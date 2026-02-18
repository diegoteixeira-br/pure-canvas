import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SaasSettings {
  id: string;
  stripe_mode: string | null;
  stripe_test_publishable_key: string | null;
  stripe_test_secret_key: string | null;
  stripe_live_publishable_key: string | null;
  stripe_live_secret_key: string | null;
  stripe_webhook_secret: string | null;
  default_trial_days: number | null;
  // Legacy plan prices (keeping for backwards compatibility)
  professional_plan_price: number | null;
  elite_plan_price: number | null;
  empire_plan_price: number | null;
  // New plan prices
  inicial_plan_price: number | null;
  inicial_plan_annual_price: number | null;
  profissional_plan_price: number | null;
  profissional_plan_annual_price: number | null;
  franquias_plan_price: number | null;
  franquias_plan_annual_price: number | null;
  annual_discount_percent: number | null;
  // Tracking pixels
  meta_pixel_id: string | null;
  meta_access_token: string | null;
  google_tag_id: string | null;
  google_conversion_id: string | null;
  tiktok_pixel_id: string | null;
  // Maintenance
  maintenance_mode: boolean | null;
  maintenance_message: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface PlanFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_type: 'limit' | 'boolean';
  inicial_value: string | null;
  profissional_value: string | null;
  franquias_value: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useSaasSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["saas-settings"],
    queryFn: async (): Promise<SaasSettings | null> => {
      // Only select non-sensitive columns - secret keys are managed server-side
      const { data, error } = await supabase
        .from("saas_settings")
        .select("id, stripe_mode, default_trial_days, professional_plan_price, elite_plan_price, empire_plan_price, inicial_plan_price, inicial_plan_annual_price, profissional_plan_price, profissional_plan_annual_price, franquias_plan_price, franquias_plan_annual_price, annual_discount_percent, meta_pixel_id, google_tag_id, google_conversion_id, tiktok_pixel_id, maintenance_mode, maintenance_message, updated_at, updated_by")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as SaasSettings | null;
    }
  });

  const featuresQuery = useQuery({
    queryKey: ["plan-features"],
    queryFn: async (): Promise<PlanFeature[]> => {
      const { data, error } = await supabase
        .from("plan_features")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return (data || []) as PlanFeature[];
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SaasSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Remove secret fields - those are managed via edge function
      const { stripe_test_secret_key, stripe_live_secret_key, stripe_webhook_secret, stripe_test_publishable_key, stripe_live_publishable_key, ...safeUpdates } = updates as any;

      const { error } = await supabase
        .from("saas_settings")
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq("id", settingsQuery.data?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      queryClient.invalidateQueries({ queryKey: ["saas-settings"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async (feature: Partial<PlanFeature> & { id: string }) => {
      const { error } = await supabase
        .from("plan_features")
        .update({
          ...feature,
          updated_at: new Date().toISOString()
        })
        .eq("id", feature.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature atualizada");
      queryClient.invalidateQueries({ queryKey: ["plan-features"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar feature: " + error.message);
    }
  });

  const createFeatureMutation = useMutation({
    mutationFn: async (feature: Omit<PlanFeature, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from("plan_features")
        .insert(feature);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature criada");
      queryClient.invalidateQueries({ queryKey: ["plan-features"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar feature: " + error.message);
    }
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plan_features")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature removida");
      queryClient.invalidateQueries({ queryKey: ["plan-features"] });
    },
    onError: (error) => {
      toast.error("Erro ao remover feature: " + error.message);
    }
  });

  return {
    settings: settingsQuery.data,
    features: featuresQuery.data || [],
    isLoading: settingsQuery.isLoading,
    isFeaturesLoading: featuresQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateSettingsMutation.mutate,
    updateFeature: updateFeatureMutation.mutate,
    createFeature: createFeatureMutation.mutate,
    deleteFeature: deleteFeatureMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    isUpdatingFeature: updateFeatureMutation.isPending
  };
}
