import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      base: '/', // Set to your subdirectory if deploying to a subdirectory
      server: {
        port: 3000,
        host: '0.0.0.0',
        open: true
      },
      preview: {
        port: 4173,
        host: '0.0.0.0'
      },
      plugins: [
        react({
          // Enable React Fast Refresh in development
          fastRefresh: !isProduction,
          // Optimize JSX in production
          jsxRuntime: 'automatic'
        })
      ],
      define: {
        // Legacy support for existing code
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
        // Add all other environment variables for process.env access
        'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        'process.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
        'process.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT),
        'process.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG),
        // Build info
        '__BUILD_DATE__': JSON.stringify(new Date().toISOString()),
        '__VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '~': path.resolve(__dirname, './src')
        }
      },
      css: {
        postcss: './postcss.config.js' // If you add PostCSS later
      },
      build: {
        // Output directory
        outDir: 'dist',
        
        // Generate sourcemaps for debugging in production
        sourcemap: isProduction ? false : true,
        
        // Minimize in production
        minify: isProduction ? 'terser' : false,
        
        // Terser options for better compression
        terserOptions: isProduction ? {
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true
          }
        } : {},
        
        // Rollup options
        rollupOptions: {
          output: {
            // Code splitting for better caching
            manualChunks: {
              // Vendor chunk for third-party libraries
              vendor: ['react', 'react-dom', 'react-router-dom'],
              // UI chunk for date utilities
              utils: ['date-fns'],
              // AI chunk for Google AI
              ai: ['@google/genai']
            },
            // Clean file names
            chunkFileNames: isProduction ? 'assets/js/[name].[hash].js' : 'assets/js/[name].js',
            entryFileNames: isProduction ? 'assets/js/[name].[hash].js' : 'assets/js/[name].js',
            assetFileNames: isProduction ? 'assets/[ext]/[name].[hash].[ext]' : 'assets/[ext]/[name].[ext]'
          }
        },
        
        // Chunk size warning limit
        chunkSizeWarningLimit: 1000,
        
        // Asset size limit
        assetsInlineLimit: 4096, // Inline assets smaller than 4kb as base64
        
        // Clear output directory before build
        emptyOutDir: true
      },
      
      // Dependency optimization
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'date-fns',
          '@google/genai'
        ],
        exclude: []
      },
      
      // Performance optimizations
      esbuild: {
        // Drop console and debugger in production
        drop: isProduction ? ['console', 'debugger'] : [],
        // Target ES2020 for better compatibility
        target: 'es2020'
      }
    };
});
