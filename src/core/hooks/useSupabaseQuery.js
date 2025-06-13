import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabase'

// 커스텀 훅: Supabase 쿼리
export const useSupabaseQuery = (key, queryFn, options = {}) => {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
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