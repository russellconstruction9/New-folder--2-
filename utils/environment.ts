/**
 * Environment Configuration
 * Centralizes all environment variable access and provides type safety
 */

export interface EnvironmentConfig {
  // API Keys
  googleMapsApiKey: string;
  geminiApiKey: string;
  
  // Backend Configuration
  apiBaseUrl: string;
  backendUrl: string;
  
  // File Upload Settings
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Application Settings
  environment: 'development' | 'production' | 'test';
  isDebug: boolean;
  
  // Feature Flags
  enableAI: boolean;
  enableMaps: boolean;
  enableOfflineMode: boolean;
}

class EnvironmentService {
  private config: EnvironmentConfig;
  
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }
  
  private loadConfig(): EnvironmentConfig {
    return {
      // API Keys
      googleMapsApiKey: this.getEnvVar('VITE_GOOGLE_MAPS_API_KEY', ''),
      geminiApiKey: this.getEnvVar('VITE_GEMINI_API_KEY', ''),
      
      // Backend Configuration
      apiBaseUrl: this.getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api'),
      backendUrl: this.getEnvVar('VITE_BACKEND_URL', 'http://localhost:8000'),
      
      // File Upload Settings
      maxFileSize: parseInt(this.getEnvVar('VITE_MAX_FILE_SIZE', '10485760')), // 10MB
      allowedFileTypes: this.getEnvVar('VITE_ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/webp').split(','),
      
      // Application Settings
      environment: this.getEnvVar('VITE_ENVIRONMENT', 'development') as 'development' | 'production' | 'test',
      isDebug: this.getEnvVar('VITE_DEBUG', 'true') === 'true',
      
      // Feature Flags
      enableAI: this.getEnvVar('VITE_ENABLE_AI', 'true') === 'true',
      enableMaps: this.getEnvVar('VITE_ENABLE_MAPS', 'true') === 'true',
      enableOfflineMode: this.getEnvVar('VITE_ENABLE_OFFLINE', 'true') === 'true',
    };
  }
  
  private getEnvVar(key: string, defaultValue: string = ''): string {
    // Support both process.env (for Vite define) and import.meta.env
    return (process.env as any)?.[key] || (import.meta as any)?.env?.[key] || defaultValue;
  }
  
  private validateConfig(): void {
    const errors: string[] = [];
    
    // Check required API keys in production
    if (this.config.environment === 'production') {
      if (!this.config.googleMapsApiKey) {
        errors.push('Google Maps API key is required in production');
      }
      if (!this.config.geminiApiKey) {
        errors.push('Gemini API key is required in production');
      }
    }
    
    // Validate URLs
    try {
      new URL(this.config.apiBaseUrl);
      new URL(this.config.backendUrl);
    } catch (e) {
      errors.push('Invalid API URL configuration');
    }
    
    // Validate file size
    if (this.config.maxFileSize <= 0 || this.config.maxFileSize > 50 * 1024 * 1024) {
      errors.push('Max file size must be between 1 byte and 50MB');
    }
    
    if (errors.length > 0) {
      console.error('Environment Configuration Errors:', errors);
      if (this.config.environment === 'production') {
        throw new Error(`Environment configuration errors: ${errors.join(', ')}`);
      }
    }
  }
  
  public getConfig(): EnvironmentConfig {
    return { ...this.config }; // Return a copy to prevent mutation
  }
  
  public isFeatureEnabled(feature: keyof Pick<EnvironmentConfig, 'enableAI' | 'enableMaps' | 'enableOfflineMode'>): boolean {
    return this.config[feature];
  }
  
  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }
  
  public isProduction(): boolean {
    return this.config.environment === 'production';
  }
  
  public getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.config.apiBaseUrl}/${cleanEndpoint}`;
  }
}

// Export singleton instance
export const envService = new EnvironmentService();
export const config = envService.getConfig();

// Export individual values for convenience
export const {
  googleMapsApiKey,
  geminiApiKey,
  apiBaseUrl,
  backendUrl,
  maxFileSize,
  allowedFileTypes,
  environment,
  isDebug
} = config;