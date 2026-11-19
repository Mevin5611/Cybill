import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import type { AxiosError } from 'axios';

export function useFetch<T>(
  key: string[],
  url: string,
  options?: { enabled?: boolean }
) {
  return useQuery<T, AxiosError>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await apiClient.get(url);
      return data.data;
    },
    ...options
  });
}

export function useMutate<T, D>(url: string, method: 'post' | 'put' | 'patch' = 'post') {
  const queryClient = useQueryClient();

  return useMutation<T, AxiosError, D>({
    mutationFn: async (data: D) => {
      const response = await apiClient[method](url, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });
}