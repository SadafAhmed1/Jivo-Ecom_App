# Backend Master Agent

The Master Agent is a comprehensive backend service that coordinates all backend operations, applies business logic, and provides enhanced API endpoints with built-in validation and analytics.

## Features

### 🚀 Core Functionality
- **Purchase Order Management**: Create, validate, and process POs with business rules
- **Platform Management**: Filter platforms by company with intelligent categorization
- **Distributor Management**: Platform-specific distributor filtering (e.g., Amazon → RK WORLD)
- **Item Search**: Advanced search and filtering for platform items
- **Analytics**: Comprehensive order analytics and reporting
- **Health Monitoring**: System health checks and status monitoring

### 🔧 Technical Features
- **Singleton Pattern**: Ensures single instance across the application
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling with detailed responses
- **Business Rules**: Configurable business logic and validation rules
- **Caching**: Built-in caching with React Query integration

## API Endpoints

### Core Operations

#### Create Purchase Order
```http
POST /api/agent/purchase-orders
Content-Type: application/json

{
  "po": {
    "company": "Jivo Mart",
    "po_number": "PO-2024-001",
    "platform": 1,
    "status": "Open",
    "order_date": "2024-01-01",
    "region": "North",
    "state": "Delhi",
    "city": "New Delhi"
  },
  "items": [
    {
      "item_name": "Product A",
      "quantity": 10,
      "basic_rate": "100.00",
      "gst_rate": "18.00"
    }
  ]
}
```

#### Get Platforms with Company Filter
```http
GET /api/agent/platforms?company=Jivo%20Mart
```

#### Get Platform-Specific Distributors
```http
GET /api/agent/distributors/1
```

#### Search Platform Items
```http
GET /api/agent/platform-items?platformId=1&search=laptop&limit=10
```

#### Get Analytics
```http
GET /api/agent/analytics?platform=1&dateFrom=2024-01-01
```

#### Health Check
```http
GET /api/agent/health
```

#### Validate PO (without creating)
```http
POST /api/agent/validate-po
Content-Type: application/json

{
  "po": { ... },
  "items": [ ... ]
}
```

## Response Format

All Master Agent endpoints return responses in this format:

```typescript
interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}
```

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "metadata": {
    "totalItems": 5,
    "processingTime": "120ms"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "metadata": {
    "errors": ["PO number is required", "Platform selection is required"]
  }
}
```

## Business Rules

### Platform-Company Mapping
- **Jivo Mart**: Amazon, Flipkart, BigBasket, JioMart, Swiggy, Instamart
- **Jivo Wellness**: Blinkit, Zepto, Dunzo, 1mg, Pharmeasy, Wellness

### Distributor Rules
- **Amazon Platform**: Only allows "RK WORLD" distributor
- **Other Platforms**: Allow all available distributors

### Validation Rules
- **Required Fields**: company, po_number, platform, region, state, city
- **File Limits**: Max 10MB file size
- **Order Limits**: Max 100 items per order
- **Minimum Order Value**: ₹100

## Client-Side Usage

### React Hook Usage
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { masterAgentService, masterAgentKeys } from '@/services/master-agent';

// Get platforms with company filter
const { data: platforms } = useQuery({
  queryKey: masterAgentKeys.platforms('Jivo Mart'),
  queryFn: () => masterAgentService.getPlatforms('Jivo Mart'),
});

// Create purchase order
const createPOMutation = useMutation({
  mutationFn: masterAgentService.createPurchaseOrder,
  onSuccess: (result) => {
    if (result.success) {
      console.log('PO created:', result.data);
    }
  },
});
```

### Direct Service Usage
```tsx
import { masterAgentService } from '@/services/master-agent';

// Health check
const health = await masterAgentService.healthCheck();

// Search items
const items = await masterAgentService.searchPlatformItems({
  platformId: 1,
  search: 'laptop',
  limit: 10
});

// Get analytics
const analytics = await masterAgentService.getOrderAnalytics({
  platform: 1,
  dateFrom: '2024-01-01'
});
```

## Architecture

### Master Agent Class
```typescript
export class MasterAgent {
  private static instance: MasterAgent;
  private businessRules: BusinessRules;

  // Core methods
  async createPurchaseOrder(request: POCreationRequest): Promise<AgentResponse>
  async getPlatformData(companyFilter?: string): Promise<AgentResponse>
  async getDistributorsForPlatform(platformId: number): Promise<AgentResponse>
  async searchPlatformItems(query: SearchQuery): Promise<AgentResponse>
  async getOrderAnalytics(filters?: AnalyticsFilters): Promise<AgentResponse>
  async healthCheck(): Promise<AgentResponse>
}
```

### Business Rules Configuration
```typescript
interface BusinessRules {
  platform: {
    amazonDistributor: string;     // "RK WORLD"
    minOrderValue: number;         // 100
    maxItemsPerOrder: number;      // 100
  };
  validation: {
    requiredFields: string[];      // ["company", "po_number", ...]
    maxFileSize: number;           // 10MB
    allowedFileTypes: string[];    // [".pdf", ".doc", ...]
  };
}
```

## Monitoring and Analytics

### Health Check Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": {
      "database": true,
      "storage": true,
      "businessRules": true
    },
    "version": "1.0.0",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Analytics Response
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalValue": 450000,
    "ordersByStatus": {
      "Open": 45,
      "Closed": 105
    },
    "ordersByPlatform": {
      "Amazon": 75,
      "Flipkart": 45,
      "BigBasket": 30
    },
    "recentOrders": [...]
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Validation Errors**: Missing required fields, invalid data types
2. **Business Rule Violations**: Amazon platform with wrong distributor
3. **Database Errors**: Connection issues, constraint violations
4. **System Errors**: Service unavailable, timeout issues

### Error Response Examples
```json
// Validation Error
{
  "success": false,
  "error": "Validation failed",
  "metadata": {
    "errors": [
      "PO number is required",
      "Platform selection is required"
    ]
  }
}

// Business Rule Violation
{
  "success": false,
  "error": "Amazon platform should use RK WORLD distributor"
}

// System Error
{
  "success": false,
  "error": "Database connection failed"
}
```

## Testing

### Demo Component
Use the `MasterAgentDemo` component to test all functionality:
```tsx
import { MasterAgentDemo } from '@/components/master-agent-demo';

// Renders tabs for:
// - Health Check
// - Platforms
// - Analytics  
// - Operations (PO creation/validation)
```

### Health Check Endpoint
Monitor system status:
```bash
curl -X GET http://localhost:5000/api/agent/health
```

## Performance

- **Response Time**: < 200ms for most operations
- **Caching**: Built-in caching for platforms and distributors
- **Pagination**: Configurable limits for search results
- **Connection Pooling**: Optimized database connections

## Security

- **Input Validation**: Comprehensive request validation with Zod
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **Rate Limiting**: Configurable rate limits (to be implemented)
- **Authentication**: Integrates with existing auth system

## Future Enhancements

1. **Real-time Notifications**: WebSocket support for order updates
2. **Advanced Analytics**: Time-series data and predictive analytics  
3. **Batch Operations**: Bulk PO creation and processing
4. **API Versioning**: Support for multiple API versions
5. **Caching Layer**: Redis integration for better performance
6. **Audit Logging**: Comprehensive audit trail for all operations