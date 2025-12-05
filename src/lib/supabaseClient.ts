import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { isClientDevelopmentMode } from './testMode'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Mock Supabase client for test mode or connection failures
const createMockSupabaseClient = (): any => {
  console.log('🧪 Using mock Supabase client (test mode or connection issues)')
  
  const mockAuth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Call callback immediately with no session
      setTimeout(() => callback('SIGNED_OUT', null), 0)
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
  }

  const mockFrom = () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  })

  return {
    auth: mockAuth,
    from: mockFrom,
    rpc: () => Promise.resolve({ data: null, error: null }),
  }
}

// Check if we should use mock client
const shouldUseMockClient = (): boolean => {
  if (typeof window === 'undefined') return false // Server-side always uses real client
  
  // Use mock client if:
  // 1. We're in development mode AND
  // 2. Either explicitly in test mode OR missing config OR connection issues detected
  const isDevMode = isClientDevelopmentMode()
  const isTestMode = window.location.search.includes('test-mode=true')
  const hasValidConfig = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('localhost')
  
  // Check if we've detected connection issues (stored in sessionStorage)
  const hasConnectionIssues = sessionStorage.getItem('supabase-connection-failed') === 'true'
  
  return isDevMode && (isTestMode || !hasValidConfig || hasConnectionIssues)
}

// Create client with connection error handling
let _supabaseClient: SupabaseClient<Database> | any = null
let _connectionTested = false

const createRealSupabaseClient = (): SupabaseClient<Database> => {
  console.log('🔗 Creating real Supabase client')
  
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public',
    },
    // Connection pooling optimization
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit realtime events
      },
    },
  })

  // Test connection and fallback to mock if it fails
  if (!_connectionTested && typeof window !== 'undefined') {
    _connectionTested = true
    
    // Test the connection with a timeout
    const testConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        await client.auth.getSession()
        clearTimeout(timeoutId)
        
        // Connection successful, clear any previous failure flag
        sessionStorage.removeItem('supabase-connection-failed')
      } catch (error) {
        console.warn('⚠️ Supabase connection test failed:', error)
        
        // Mark connection as failed for future requests
        sessionStorage.setItem('supabase-connection-failed', 'true')
        
        // If we're in development mode, switch to mock client
        if (isClientDevelopmentMode()) {
          console.log('🔄 Switching to mock client due to connection failure')
          _supabaseClient = createMockSupabaseClient()
        }
      }
    }
    
    // Test connection in background
    testConnection()
  }

  return client
}

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (_supabaseClient) return _supabaseClient
  
  if (shouldUseMockClient()) {
    _supabaseClient = createMockSupabaseClient()
  } else {
    _supabaseClient = createRealSupabaseClient()
  }
  
  return _supabaseClient
}

// Export the client using a proxy to handle lazy loading
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof SupabaseClient<Database>]
    
    // Bind methods to maintain context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    
    return value
  }
})

// Server-side client (if needed)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null