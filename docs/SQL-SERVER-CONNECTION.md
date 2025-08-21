# SQL Server Connection Setup

This document describes the SQL Server connection configuration for the application connecting to the SAP database.

## Connection Details

- **Server**: 103.89.44.240
- **Port**: 1433 (default)
- **Database**: jsap
- **Username**: webm2
- **Password**: foxpro@7

## Environment Configuration

The connection details are stored in environment variables for security:

```bash
# SQL Server Configuration
SQLSERVER_HOST=103.89.44.240
SQLSERVER_PORT=1433
SQLSERVER_USER=webm2
SQLSERVER_PASSWORD=foxpro@7
SQLSERVER_DATABASE=jsap
SQLSERVER_ENCRYPT=false
SQLSERVER_TRUST_SERVER_CERT=true
```

## Security Features

### Environment Variables
- All credentials are stored in `.env` file
- Never hardcoded in source code
- Different configurations for development/production

### Connection Pooling
- Maximum 10 connections
- Automatic connection management
- 30-second idle timeout

### Query Security
- Only SELECT queries allowed in custom query endpoint
- Parameterized queries to prevent SQL injection
- Input validation with Zod schemas

## API Endpoints

### Connection Management

#### Health Check
```http
GET /api/sql/health
```
Response:
```json
{
  "success": true,
  "message": "SQL Server connection healthy",
  "data": {
    "isConnected": true,
    "server": "103.89.44.240",
    "database": "jsap",
    "user": "webm2",
    "responseTime": 150
  }
}
```

#### Connection Status
```http
GET /api/sql/status
```

### Data Operations

#### Get Item Details
```http
GET /api/sql/items
```
Executes: `SP_GET_ITEM_DETAILS` stored procedure

#### Search Items
```http
POST /api/sql/search-items
Content-Type: application/json

{
  "search": "laptop",
  "limit": 50
}
```

#### Get Platform Items
```http
GET /api/sql/platform-items?platformCode=AMZ
```

#### Custom Query (Development Only)
```http
POST /api/sql/query
Content-Type: application/json

{
  "query": "SELECT TOP 10 * FROM ItemMaster WHERE ItemName LIKE @search",
  "params": {
    "search": "%laptop%"
  }
}
```

#### Execute Stored Procedure
```http
POST /api/sql/stored-procedure
Content-Type: application/json

{
  "procedureName": "dbo.SP_GET_ITEM_DETAILS",
  "params": {
    "platformId": {
      "type": "int",
      "value": 1
    }
  }
}
```

### Schema Operations

#### Get Table Information
```http
GET /api/sql/table-info?tableName=ItemMaster
```

#### Performance Statistics
```http
GET /api/sql/performance
```

## Service Architecture

### SqlServerService Class
Located in `server/sql-service.ts`

```typescript
export class SqlServerService {
  // Singleton pattern
  public static getInstance(): SqlServerService

  // Core methods
  async testConnection(): Promise<QueryResult<boolean>>
  async executeQuery<T>(query: string, params?: Record<string, any>): Promise<QueryResult<T>>
  async executeStoredProcedure<T>(procedureName: string, params?: Record<string, any>): Promise<QueryResult<T>>
  async searchItems(searchTerm: string, limit?: number): Promise<QueryResult<any>>
  async getPlatformItems(platformCode?: string): Promise<QueryResult<any>>
  async getTableInfo(tableName?: string): Promise<QueryResult<any>>
  async getPerformanceStats(): Promise<QueryResult<any>>
}
```

### Response Format
All SQL endpoints return a consistent response format:

```typescript
interface QueryResult<T = any> {
  success: boolean;
  data?: T[];
  recordsAffected?: number[];
  error?: string;
  executionTime?: number;
}
```

## Client-Side Usage

### React Service
Located in `client/src/services/sql-service.ts`

```typescript
import { sqlService, sqlQueryKeys } from '@/services/sql-service';

// Health check
const health = await sqlService.healthCheck();

// Search items
const items = await sqlService.searchItems({
  search: 'laptop',
  limit: 50
});

// Custom query
const result = await sqlService.executeQuery({
  query: 'SELECT * FROM ItemMaster WHERE ItemCode = @code',
  params: { code: 'ITEM001' }
});
```

### React Query Integration
```tsx
import { useQuery } from '@tanstack/react-query';
import { sqlService, sqlQueryKeys } from '@/services/sql-service';

// Health monitoring
const { data: health } = useQuery({
  queryKey: sqlQueryKeys.health(),
  queryFn: () => sqlService.healthCheck(),
  refetchInterval: 30000, // Every 30 seconds
});

// Item search
const { data: items } = useQuery({
  queryKey: sqlQueryKeys.searchItems('laptop', 50),
  queryFn: () => sqlService.searchItems({ search: 'laptop', limit: 50 }),
});
```

## Demo Component

Use the `SqlDemo` component to test all functionality:

```tsx
import { SqlDemo } from '@/components/sql-demo';

// Provides tabs for:
// - Connection status and health
// - Item details retrieval
// - Item search functionality
// - Custom query execution
// - Database schema exploration
```

## Connection Testing

### Manual Testing
1. Start the server: `npm start`
2. Open browser to demo page
3. Check "Connection" tab for status
4. Test various operations in other tabs

### API Testing
```bash
# Test health endpoint
curl -X GET http://localhost:5000/api/sql/health

# Test search
curl -X POST http://localhost:5000/api/sql/search-items \
  -H "Content-Type: application/json" \
  -d '{"search": "laptop", "limit": 10}'
```

## Error Handling

### Common Connection Issues
1. **Network connectivity**: Check firewall and network access
2. **Authentication**: Verify username/password
3. **Database access**: Ensure user has proper permissions
4. **SSL/TLS**: Configure encryption settings appropriately

### Error Response Example
```json
{
  "success": false,
  "error": "Connection failed",
  "details": "Login failed for user 'webm2'",
  "executionTime": 5000
}
```

## Performance Monitoring

### Metrics Tracked
- Connection response time
- Query execution time
- Active connections count
- Database performance stats

### Optimization
- Connection pooling reduces overhead
- Query result caching with React Query
- Parameterized queries for better performance
- Configurable query limits

## Security Considerations

### Access Control
- Environment-based credential management
- Query type restrictions (SELECT only for custom queries)
- Input validation and sanitization
- Connection encryption options

### Best Practices
- Never log sensitive credentials
- Use parameterized queries
- Limit query complexity and result size
- Monitor connection usage

## Troubleshooting

### Connection Failures
1. Check network connectivity to 103.89.44.240:1433
2. Verify credentials are correct
3. Check SQL Server is running and accepting connections
4. Review firewall settings

### Query Issues
1. Verify SQL syntax
2. Check table and column names
3. Ensure user has appropriate permissions
4. Review parameter types and values

### Performance Issues
1. Monitor connection pool usage
2. Check query execution plans
3. Consider indexing frequently queried columns
4. Optimize query complexity

## Future Enhancements

1. **Read Replicas**: Support for read-only replicas
2. **Advanced Caching**: Redis integration for query caching
3. **Query Builder**: Visual query building interface
4. **Audit Logging**: Track all database operations
5. **Real-time Monitoring**: WebSocket-based live monitoring
6. **Batch Operations**: Support for bulk data operations