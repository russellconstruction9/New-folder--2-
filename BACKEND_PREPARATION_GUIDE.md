# Backend Development Guide for ConstructTrack Pro

## Current State Analysis
Your application is a comprehensive construction management PWA with excellent features, but it currently uses localStorage for all data persistence. This document outlines the critical issues and provides a roadmap for backend integration.

## 🚨 Critical Security Issues

### 1. Exposed API Keys
**Problem:** Hardcoded Google Maps API key in useDataContext.ts
**Risk:** High - API key abuse, billing charges, rate limiting
**Solution:** Move to environment variables and backend proxy

### 2. No Authentication
**Problem:** Users stored in localStorage with no verification
**Risk:** No data security, no multi-user support
**Solution:** Implement JWT-based authentication

## 📊 Current Data Structure

### Entities Currently Using localStorage:
- **Users**: Profile, roles, hourly rates, clock status
- **Projects**: Details, budgets, timelines, punch lists
- **Tasks**: Assignments, status tracking, due dates
- **Time Logs**: Clock in/out with GPS coordinates
- **Inventory**: Stock levels, costs, order management
- **Invoices**: Billing with time log integration
- **Expenses**: Project cost tracking
- **Photos**: Stored in IndexedDB

## 🏗️ Recommended Backend Architecture

### Database Schema (PostgreSQL/MySQL)

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2),
    avatar_url VARCHAR(500),
    is_clocked_in BOOLEAN DEFAULT FALSE,
    current_project_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(12,2) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id INTEGER REFERENCES users(id),
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time logs table
CREATE TABLE time_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    duration_ms INTEGER,
    cost DECIMAL(10,2),
    clock_in_lat DECIMAL(10,8),
    clock_in_lng DECIMAL(11,8),
    clock_out_lat DECIMAL(10,8),
    clock_out_lng DECIMAL(11,8),
    clock_in_map_image_url VARCHAR(500),
    clock_out_map_image_url VARCHAR(500),
    invoice_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Punch list items table
CREATE TABLE punch_list_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project photos table
CREATE TABLE project_photos (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    cost DECIMAL(10,2),
    low_stock_threshold INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    date_issued DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice line items table
CREATE TABLE invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### REST API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

#### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Projects
- `GET /api/projects` - List projects with pagination
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Tasks
- `GET /api/tasks` - List tasks (filterable by project)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Time Tracking
- `POST /api/time-logs/clock-in` - Clock in to project
- `POST /api/time-logs/clock-out` - Clock out
- `GET /api/time-logs` - Get time logs (filterable)
- `PUT /api/time-logs/:id` - Update time log

#### File Upload
- `POST /api/upload/photo` - Upload project photo
- `GET /api/photos/:filename` - Serve photo files

#### Maps Proxy (to hide API key)
- `GET /api/maps/static` - Proxy to Google Maps Static API

#### AI Chat Proxy
- `POST /api/ai/chat` - Proxy to Gemini AI API

## 🔧 Frontend Modifications Needed

### 1. Replace localStorage with API calls
Create a service layer to handle all API communications:

```typescript
// services/api.ts
class ApiService {
    private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    
    async get(endpoint: string) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    async post(endpoint: string, data: any) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }
    
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
        };
    }
    
    private getToken(): string {
        return localStorage.getItem('auth_token') || '';
    }
    
    private async handleResponse(response: Response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
}

export const apiService = new ApiService();
```

### 2. Update useDataContext to use API
Replace all localStorage operations with API calls and add proper error handling.

### 3. Add Authentication Context
```typescript
// hooks/useAuth.ts
interface AuthContext {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}
```

### 4. Implement React Query
Replace the current data context with React Query for better caching, synchronization, and error handling:

```typescript
// hooks/useProjects.ts
export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: () => apiService.get('/projects')
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (project: Omit<Project, 'id'>) => 
            apiService.post('/projects', project),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};
```

## 🚀 Implementation Priority

### Phase 1 (Critical) - Security & Authentication
1. **Environment Variables**: Move API keys to .env files
2. **Backend Setup**: Choose your stack (Node.js/Express, Python/Django, etc.)
3. **Database**: Set up PostgreSQL/MySQL
4. **Authentication**: Implement JWT-based auth
5. **API Proxies**: Create proxies for Google Maps and Gemini AI

### Phase 2 - Core Data Migration
1. **User Management**: Migrate from localStorage to database
2. **Project Management**: API endpoints for CRUD operations
3. **File Upload**: Implement cloud storage for photos
4. **Error Handling**: Add comprehensive error boundaries

### Phase 3 - Advanced Features
1. **Real-time Updates**: WebSocket support for team collaboration
2. **Offline Support**: Service worker for offline functionality
3. **Performance**: Implement caching and pagination
4. **Monitoring**: Add logging and analytics

## 🛡️ Security Considerations

1. **Input Validation**: Validate all inputs server-side
2. **SQL Injection**: Use parameterized queries
3. **Rate Limiting**: Implement API rate limiting
4. **CORS**: Configure proper CORS policies
5. **HTTPS**: Enforce HTTPS in production
6. **File Upload**: Sanitize and validate uploaded files

## 📱 Mobile Considerations

1. **Offline First**: Design for intermittent connectivity
2. **Background Sync**: Queue operations when offline
3. **Push Notifications**: For task assignments and updates
4. **GPS Accuracy**: Handle location permissions properly

## 🔧 Development Tools

1. **API Documentation**: Use Swagger/OpenAPI
2. **Testing**: Implement unit and integration tests
3. **CI/CD**: Set up automated deployment
4. **Monitoring**: Use tools like Sentry for error tracking

This roadmap will transform your excellent frontend into a production-ready, scalable construction management platform. Focus on Phase 1 first to address the critical security issues, then gradually implement the remaining phases.