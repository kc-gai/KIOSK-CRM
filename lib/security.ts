// ===========================================
// Security Configuration & Validation
// ===========================================
// This file enforces security policies for the SEO Marketing CRM
// - Blocks Supabase and other unauthorized services
// - Validates API keys are from environment variables only
// - Prevents hardcoded credentials

// ===========================================
// BLOCKED SERVICES
// ===========================================
export const BLOCKED_SERVICES = [
  'supabase',
  'SUPABASE',
  'Supabase',
] as const

export const BLOCKED_DOMAINS = [
  'supabase.co',
  'supabase.com',
  'supabase.io',
] as const

// ===========================================
// Environment Variable Validation
// ===========================================
export function validateEnvironmentSecurity(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for blocked Supabase environment variables
  const blockedEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_JWT_SECRET',
  ]

  for (const envVar of blockedEnvVars) {
    if (process.env[envVar]) {
      errors.push(`[SECURITY VIOLATION] Blocked environment variable detected: ${envVar}`)
      // Clear the blocked variable
      delete process.env[envVar]
    }
  }

  // Ensure required variables are not hardcoded (basic check)
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'PIPEDRIVE_API_TOKEN',
  ]

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (value) {
      // Check for placeholder values that shouldn't be in production
      if (value.includes('YOUR_') || value.includes('your-') || value === 'undefined') {
        errors.push(`[WARNING] Environment variable ${envVar} appears to be a placeholder`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ===========================================
// URL Security Check
// ===========================================
export function isBlockedUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase()

  for (const service of BLOCKED_SERVICES) {
    if (lowerUrl.includes(service.toLowerCase())) {
      return true
    }
  }

  for (const domain of BLOCKED_DOMAINS) {
    if (lowerUrl.includes(domain)) {
      return true
    }
  }

  return false
}

// ===========================================
// API Key Validation
// ===========================================
export function getSecureApiKey(keyName: string): string {
  // Block any Supabase-related key requests
  if (keyName.toLowerCase().includes('supabase')) {
    throw new Error(`[SECURITY] Supabase API keys are not allowed: ${keyName}`)
  }

  const value = process.env[keyName]

  if (!value) {
    throw new Error(`[CONFIG] Missing required API key: ${keyName}`)
  }

  // Validate the key is not a placeholder
  if (value.includes('YOUR_') || value.includes('your-') || value === 'undefined') {
    throw new Error(`[CONFIG] Invalid API key value for ${keyName}. Please set a real value.`)
  }

  return value
}

// ===========================================
// Startup Security Check
// ===========================================
export function runSecurityCheck(): void {
  console.log('[SECURITY] Running startup security checks...')

  const { valid, errors } = validateEnvironmentSecurity()

  if (errors.length > 0) {
    console.warn('[SECURITY] Issues detected:')
    errors.forEach(err => console.warn(`  - ${err}`))
  }

  if (valid) {
    console.log('[SECURITY] All security checks passed')
  }
}

// Export a function to be called in _app.tsx or layout.tsx
export default {
  BLOCKED_SERVICES,
  BLOCKED_DOMAINS,
  validateEnvironmentSecurity,
  isBlockedUrl,
  getSecureApiKey,
  runSecurityCheck,
}
