# E-commerce Purchase Order Management System

## Overview

This is a comprehensive e-commerce purchase order management web application for suppliers distributing products across multiple Indian cities. The system streamlines purchase order management, replacing manual data entry with an automated, API-driven solution. It currently focuses on Platform PO management, with plans for expansion into distributor POs, secondary sales, and inventory management. Key capabilities include a unified PO upload system supporting five major platforms (Flipkart Grocery, Zepto, City Mall, Blinkit, and Swiggy Instamart), specialized inventory management, and a comprehensive secondary sales system for Amazon, Zepto, Blinkit, and Swiggy. The system also features a SQL query module for custom reporting and analytics with integrated terminal access for advanced data analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Layout**: Sidebar-based modular design with responsive mobile support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with consistent error handling
- **Request Processing**: JSON body parsing with URL encoding support

### Database Architecture
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Database**: PostgreSQL via Neon serverless
- **Connection**: WebSocket-based connection pooling
- **Migrations**: Drizzle Kit
- **Schema Design**: Normalized relational structure, SAP B1 Hanna ERP integration-ready item master, platform-specific item mappings, comprehensive PO and line item tracking.

### Core Database Tables
1. **sap_item_mst**: Master item catalog matching SAP B1 Hanna ERP structure
2. **pf_mst**: E-commerce platform registry
3. **pf_item_mst**: Platform-specific item mappings with SAP references
4. **pf_po**: Purchase order headers
5. **pf_order_items**: Line-item details for purchase orders

### Authentication & Security
- Session-based authentication
- CORS-enabled for cross-origin requests
- Environment-based configuration

### Development Workflow
- **Build System**: Vite for frontend, esbuild for backend production builds
- **Development**: Concurrent frontend/backend development with HMR
- **Code Quality**: TypeScript strict mode

### API Structure
- **Platform Management**: CRUD operations
- **Item Management**: SAP item synchronization and platform mapping
- **PO Management**: Full lifecycle PO creation, editing, and status tracking
- **Unified PO Upload**: Single endpoint for any vendor PO with platform selection and preview capabilities
- **Search & Filtering**: Dynamic item search

### File Organization
- **Monorepo Structure**: Shared TypeScript schemas
- **Client**: React application
- **Server**: Express API
- **Shared**: Common type definitions and database schemas

### Scalability Considerations
- **Modular Design**: Sidebar-based module system
- **API-First**: All data interactions through RESTful APIs
- **Type Safety**: End-to-end TypeScript
- **Caching Strategy**: React Query for optimistic updates

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: TypeScript-first ORM

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool
- **TypeScript**: Static typing
- **Replit Integration**: Development environment with cartographer plugin
- **Claude Code CLI**: Integrated for AI coding assistance (subscription-based authentication)

### State Management
- **TanStack React Query**: Server state management
- **React Hook Form**: Performance-optimized form handling
- **Zod**: Runtime type validation

### Integrations
- **SQL Server**: For SAP item master synchronization.