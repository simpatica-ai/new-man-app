// Utility functions for detecting test/development mode across different environments

/**
 * Client-side development mode detection
 * Works in browser environment for various hosting platforms
 */
export const isClientDevelopmentMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  const hostname = window.location.hostname
  const origin = window.location.origin
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true
  }
  
  // Vercel preview deployments
  if (hostname.includes('.vercel.app')) {
    return true
  }
  
  // Netlify preview deployments
  if (hostname.includes('.netlify.app') || hostname.includes('--')) {
    return true
  }
  
  // Development/staging subdomains
  if (hostname.includes('dev.') || hostname.includes('staging.') || hostname.includes('test.')) {
    return true
  }
  
  // Check URL parameters for test mode
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('test-mode') === 'true') {
    return true
  }
  
  // Check for development environment variable (if available in client)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

/**
 * Check if we're explicitly in test mode (not just development mode)
 */
export const isTestMode = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('test-mode') === 'true') {
    return true
  }
  
  // Check if connection issues have been detected
  if (sessionStorage.getItem('supabase-connection-failed') === 'true') {
    return true
  }
  
  return false
}

/**
 * Server-side development mode detection
 * Works in Node.js environment for various hosting platforms
 */
export const isServerDevelopmentMode = (): boolean => {
  // Local development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // Vercel preview deployments
  if (process.env.VERCEL_ENV === 'preview') {
    return true
  }
  
  // Netlify preview deployments
  if (process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy') {
    return true
  }
  
  // Custom environment flag for enabling test mode in any environment
  if (process.env.ENABLE_TEST_MODE === 'true') {
    return true
  }
  
  // GitHub Codespaces
  if (process.env.CODESPACES === 'true') {
    return true
  }
  
  // GitPod
  if (process.env.GITPOD_WORKSPACE_ID) {
    return true
  }
  
  return false
}

/**
 * Check if test mode should be enabled based on request headers and environment
 */
export const shouldEnableTestMode = (request?: Request): boolean => {
  // Check for test mode header first
  if (request) {
    const testModeHeader = request.headers.get('x-test-mode')
    
    // Debug logging
    console.log('Test mode header:', testModeHeader)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV)
    
    // If test mode header is present, check if we're in a development environment
    if (testModeHeader === 'true') {
      const serverDevMode = isServerDevelopmentMode()
      console.log('Server development mode:', serverDevMode)
      
      // Allow test mode if:
      // 1. Server is in development mode, OR
      // 2. ENABLE_TEST_MODE is explicitly set, OR  
      // 3. We're running on localhost (check via request headers)
      const host = request.headers.get('host') || ''
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
      
      console.log('Host:', host)
      console.log('Is localhost:', isLocalhost)
      
      if (serverDevMode || process.env.ENABLE_TEST_MODE === 'true' || isLocalhost) {
        console.log('Test mode enabled')
        return true
      }
    }
  }
  
  console.log('Test mode disabled')
  return false
}