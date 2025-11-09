# 🔧 ConstructTrack Pro - Environment Setup Guide

## 📋 Prerequisites

Before setting up the environment, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Git**
4. A code editor (VS Code recommended)

## 🔐 API Keys Setup

### 1. Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps Static API
   - Geocoding API
   - Places API (optional)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Gemini AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## 🌐 Environment Configuration

### Step 1: Create Environment File

Copy the example environment file and add your keys:

```bash
# Copy the example file
cp .env.example .env.local
```

### Step 2: Add Your API Keys

Open `.env.local` and replace the placeholder values:

```env
# Your actual Google Maps API key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM

# Your actual Gemini AI API key  
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here

# Backend configuration (when you set up backend)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BACKEND_URL=http://localhost:8000

# Application settings
VITE_ENVIRONMENT=development
VITE_DEBUG=true
```

### Step 3: Secure Your Keys

**IMPORTANT SECURITY NOTES:**

1. ✅ **NEVER** commit `.env.local` to git
2. ✅ Keys are already in `.gitignore`
3. ✅ Use environment variables in production
4. ✅ Restrict API keys in production

## 🚀 Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000`

## 🏗️ Backend Preparation

Your app currently uses localStorage. To prepare for backend integration:

### Phase 1: Environment Setup ✅ COMPLETED
- [x] API keys moved to environment variables
- [x] Created API service layer
- [x] Added data validation utilities
- [x] Implemented error handling

### Phase 2: Backend Development (Next Steps)

#### Option A: Node.js/Express Backend

1. **Create Backend Project**
```bash
mkdir constructtrack-backend
cd constructtrack-backend
npm init -y
npm install express cors helmet morgan bcryptjs jsonwebtoken
npm install -D nodemon typescript @types/node
```

2. **Database Setup**
```bash
# For PostgreSQL
npm install pg @types/pg
# Or for MongoDB
npm install mongoose
```

3. **Create Basic Server**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Option B: Supabase (Recommended for Quick Start)

1. **Sign up at [Supabase](https://supabase.com/)**
2. **Create new project**
3. **Update environment variables:**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Option C: Firebase

1. **Create Firebase project**
2. **Enable Firestore and Authentication**
3. **Update environment variables:**
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📁 Updated File Structure

Your project now has these new utilities:

```
utils/
├── environment.ts      # Environment configuration
├── apiService.ts       # Backend API communication
├── validation.ts       # Data validation utilities
├── errorHandler.ts     # Error handling
└── db.ts              # Existing IndexedDB utilities

env/
├── .env.development   # Development environment template
├── .env.production    # Production environment template
└── .env.local         # Local development file (git-ignored)

components/
└── ErrorBoundary.tsx  # Error boundary component
```

## 🔧 Next Steps for Backend Integration

### 1. Replace Data Context

Update `useDataContext.ts` to use the API service:

```typescript
// Before (localStorage)
const [users, setUsers] = useState(() => getStoredItem('scc_users', defaultUsers));

// After (API)
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => apiService.get('/users')
});
```

### 2. Implement Authentication

```typescript
// Add to your app
const { user, login, logout } = useAuth();

// Protect routes
if (!user) return <LoginPage />;
```

### 3. File Upload

Replace IndexedDB photo storage:

```typescript
// Upload to cloud storage
const uploadPhoto = async (file: File, projectId: number) => {
  const result = await apiService.uploadFile('/photos', file, { projectId });
  return result.url;
};
```

## 🛡️ Security Checklist

- [x] API keys in environment variables
- [x] .env files in .gitignore
- [ ] Set up HTTPS in production
- [ ] Add rate limiting to API
- [ ] Implement proper authentication
- [ ] Add input validation on backend
- [ ] Set up CORS properly
- [ ] Add API key restrictions

## 🚨 Important Security Notes

1. **Google Maps API Key**: Your current key `AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM` is exposed. Consider:
   - Creating a new key for production
   - Adding domain restrictions
   - Setting up billing alerts

2. **Gemini API Key**: Get your key from Google AI Studio and add it to `.env.local`

3. **Production**: Use different API keys for production with proper restrictions

## 📚 Additional Resources

- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Gemini AI Documentation](https://developers.googleblog.com/2023/12/how-its-made-gemini-multimodal-prompting.html)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Troubleshooting

### Environment Variables Not Loading
- Check file name is exactly `.env.local`
- Restart development server after changes
- Use `console.log(import.meta.env)` to debug

### API Key Errors
- Verify keys are correct in `.env.local`
- Check API quotas in respective consoles
- Ensure APIs are enabled (for Google Maps)

### CORS Errors (Future Backend)
- Add frontend domain to CORS allowlist
- Include credentials if needed
- Check preflight requests

---

Your app is now properly configured for backend development! 🎉