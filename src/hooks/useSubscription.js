import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useSubscription() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSubscription', {});
      return res.data;
    },
    staleTime: 60 * 1000, // cache for 1 minute
  });

  return {
    isPro: data?.isPro ?? false,
    plan: data?.plan ?? 'free',
    status: data?.status ?? 'none',
    currentPeriodEnd: data?.current_period_end,
    isLoading,
    refetch,
  };
}