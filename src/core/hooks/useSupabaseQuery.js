import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import cacheService from '../services/cacheService'

// Enhanced cache times for different data types
const CACHE_TIMES = {
  organizations: { staleTime: 10 * 60 * 1000, cacheTime: 30 * 60 * 1000 },
  customers: { staleTime: 5 * 60 * 1000, cacheTime: 15 * 60 * 1000 },
  testCodes: { staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000 },
  testResults: { staleTime: 30 * 60 * 1000, cacheTime: 60 * 60 * 1000 },
  reports: { staleTime: 60 * 60 * 1000, cacheTime: 2 * 60 * 60 * 1000 },
  default: { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
};

// Get cache configuration based on query key
const getCacheTimes = (key) => {
  if (Array.isArray(key)) {
    const keyString = key[0]?.toString().toLowerCase() || '';
    for (const [type, times] of Object.entries(CACHE_TIMES)) {
      if (keyString.includes(type)) {
        return times;
      }
    }
  }
  return CACHE_TIMES.default;
};

// 커스텀 훅: Supabase 쿼리 with enhanced caching
export const useSupabaseQuery = (key, queryFn, options = {}) => {
  const cacheTimes = getCacheTimes(key);
  
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      // Try to get from custom cache first for persistent data
      const cacheKey = Array.isArray(key) ? key.join(':') : key;
      const cached = await cacheService.get(cacheKey);
      
      if (cached && !options.forceRefresh) {
        return cached;
      }
      
      // Fetch fresh data
      const data = await queryFn();
      
      // Store in custom cache for persistence
      if (data && options.persistent) {
        await cacheService.set(cacheKey, data, {
          namespace: Array.isArray(key) ? `api.${key[0]}` : 'api',
          persistent: true
        });
      }
      
      return data;
    },
    staleTime: options.staleTime || cacheTimes.staleTime,
    cacheTime: options.cacheTime || cacheTimes.cacheTime,
    retry: options.retry ?? 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options
  })
}

// 커스텀 훅: Supabase 뮤테이션
export const useSupabaseMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // 성공 시 관련 쿼리 무효화
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
      
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      console.error('Mutation error:', error)
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    ...options
  })
}

// 실시간 구독 훅
export const useSupabaseRealtime = (table, filter, onUpdate) => {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        (payload) => {
          console.log('Realtime update:', payload)
          
          // 콜백 함수 실행
          if (onUpdate) {
            onUpdate(payload)
          }
          
          // 관련 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: [table] })
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, queryClient, onUpdate])
}

// 페이지네이션 훅
export const useSupabasePagination = (table, options = {}) => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(options.pageSize || 20)
  
  const { data, isLoading, error } = useSupabaseQuery(
    [table, page, pageSize, options.filter],
    async () => {
      let query = supabase.from(table).select('*', { count: 'exact' })
      
      // 필터 적용
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value) {
            query = query.eq(key, value)
          }
        })
      }
      
      // 정렬 적용
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        })
      }
      
      // 페이지네이션 적용
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  )
  
  return {
    data: data?.data || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage: page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    nextPage: () => setPage(p => Math.min(p + 1, data?.totalPages || 1)),
    prevPage: () => setPage(p => Math.max(p - 1, 1))
  }
}