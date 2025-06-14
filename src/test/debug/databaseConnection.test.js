import { describe, it, expect } from 'vitest'
import { supabase } from '../../core/services/supabase'

/**
 * Database Connection Debug Tests
 * 
 * These tests help identify database connection issues
 * Run with: npm run test:debug
 */

describe('Database Connection Tests', () => {
  it('should verify Supabase URL and key are configured', () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojwknqceiqzgutyhefwc.supabase.co'
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseAnonKey)
    console.log('Supabase Key length:', supabaseAnonKey?.length || 0)
    
    expect(supabaseUrl).toBeTruthy()
    expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/)
    expect(supabaseAnonKey).toBeTruthy()
    expect(supabaseAnonKey.length).toBeGreaterThan(100)
  })

  it('should connect to Supabase and fetch tables', async () => {
    try {
      // Test basic connection by fetching table info
      const { data, error } = await supabase
        .from('customer_info')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Database connection error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
      } else {
        console.log('Successfully connected to database')
        console.log('Query result:', data)
      }
      
      expect(error).toBeNull()
    } catch (err) {
      console.error('Connection test failed:', err)
      throw err
    }
  })

  it('should verify required tables exist', async () => {
    const requiredTables = [
      'customer_info',
      'test_codes',
      'organizations',
      'test_responses',
      'final_scores',
      'rulebook_scores',
      'group_averages',
      'group_deviations',
      'test_interpretations'
    ]
    
    const tableStatus = {}
    
    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        tableStatus[tableName] = error ? `Error: ${error.message}` : 'OK'
      } catch (err) {
        tableStatus[tableName] = `Exception: ${err.message}`
      }
    }
    
    console.log('Table Status:', tableStatus)
    
    // Check if all tables are accessible
    const allTablesOk = Object.values(tableStatus).every(status => status === 'OK')
    
    if (!allTablesOk) {
      console.error('Some tables are not accessible:')
      Object.entries(tableStatus).forEach(([table, status]) => {
        if (status !== 'OK') {
          console.error(`  ${table}: ${status}`)
        }
      })
    }
    
    expect(allTablesOk).toBe(true)
  })

  it('should test data insertion and retrieval', async () => {
    // Create test data
    const testCustomerId = `test-${Date.now()}`
    const testData = {
      id: testCustomerId,
      name: 'Test User',
      gender: 'male',
      birth_date: '2000-01-01',
      test_type: 'adult',
      standard_group: 'adult',
      org_number: 'TEST001',
      created_at: new Date().toISOString()
    }
    
    try {
      // Insert test data
      const { data: insertData, error: insertError } = await supabase
        .from('customer_info')
        .insert(testData)
        .select()
      
      if (insertError) {
        console.error('Insert error:', insertError)
      } else {
        console.log('Insert successful:', insertData)
      }
      
      // Retrieve test data
      const { data: selectData, error: selectError } = await supabase
        .from('customer_info')
        .select('*')
        .eq('id', testCustomerId)
        .single()
      
      if (selectError) {
        console.error('Select error:', selectError)
      } else {
        console.log('Select successful:', selectData)
      }
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('customer_info')
        .delete()
        .eq('id', testCustomerId)
      
      if (deleteError) {
        console.error('Delete error:', deleteError)
      } else {
        console.log('Cleanup successful')
      }
      
      expect(insertError).toBeNull()
      expect(selectError).toBeNull()
      expect(selectData?.id).toBe(testCustomerId)
      
    } catch (err) {
      console.error('Data operation test failed:', err)
      // Attempt cleanup even if test fails
      await supabase
        .from('customer_info')
        .delete()
        .eq('id', testCustomerId)
      throw err
    }
  })

  it('should check authentication status', async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('Auth session exists:', !!session)
      console.log('Auth error:', error)
      
      if (session) {
        console.log('User ID:', session.user?.id)
        console.log('User email:', session.user?.email)
        console.log('User role:', session.user?.role)
      }
      
      // For anonymous access, session might be null
      expect(error).toBeNull()
      
    } catch (err) {
      console.error('Auth check failed:', err)
      throw err
    }
  })

  it('should verify RLS policies', async () => {
    // Test read access
    const tables = ['customer_info', 'test_codes', 'organizations']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      console.log(`RLS test for ${table}:`, {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message
      })
      
      // For tables with RLS, we might get empty data but no error
      // or we might get a permission error
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.warn(`RLS might be blocking access to ${table}:`, error.message)
      }
    }
  })
})