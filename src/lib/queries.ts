import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient, list } from './apiClient'
export function useList<T>(resource: string) {
  return useQuery({
    queryKey: [resource],
    staleTime: resource === 'products' ? 0 : 30000,
    queryFn: () => list<T>(`/${resource}`),
  })
}
export function useSave<T>(resource: string, onSuccess: (result: T) => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      path = `/${resource}`,
      method = 'POST',
      body,
    }: {
      path?: string
      method?: string
      body?: unknown
    }) => apiClient<T>(path, method, body),
    onSuccess: (result) => {
      void client.invalidateQueries({
        predicate: (q) => q.queryKey[0] !== 'auth',
      })
      toast.success(
        resource === 'sales'
          ? 'Sale recorded successfully.'
          : resource === 'purchases'
            ? 'Purchase recorded successfully.'
            : resource === 'damaged-items'
              ? 'Damaged item recorded.'
              : resource === 'owner-money'
                ? 'Owner money saved.'
                : resource === 'expenses'
                  ? 'Expense saved.'
                  : 'Saved successfully.',
      )
      onSuccess(result)
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
