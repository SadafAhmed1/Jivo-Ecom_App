# E-commerce Purchase Order Management System

## Overview

This is a comprehensive e-commerce purchase order management web application designed for suppliers who distribute products to various platforms and distributors across multiple Indian cities (Punjab, Delhi, Bangalore, Mumbai, Calcutta). The system provides a structured approach to managing purchase orders with proper database storage and SQL queryability.

The application is built as a full-stack solution with a React frontend and Express backend, designed to replace manual data entry processes with an automated, API-driven system. Currently focused on Platform PO management with plans to expand to distributor POs, secondary sales tracking, and inventory management.

**Recent Major Update (August 2025):** Completed comprehensive unified PO upload system supporting all 5 platforms (Flipkart Grocery, Zepto, City Mall, Blinkit, and Swiggy Instamart) with custom preview displays and unified workflow. Each platform has specialized parsing (CSV for most, XML for Swiggy) and custom preview showing platform-specific fields while maintaining consistent 3-step workflow: platform selection → file upload → preview & review → database import.

**Critical Database Fix (August 8, 2025):** Resolved major Swiggy PO data persistence issue where multiple fields were not saving properly to database tables. Fixed null value handling so empty fields save as NULL instead of placeholder values like "0 days" or empty strings. Corrected data mapping for: hsn_code, unit_base_cost, taxable_value, po_date, po_release_date, expected_delivery_date, po_expiry_date, total_items, grand_total, and vendor_name. All fields now save correctly with proper null handling and accurate data extraction matching original PO files.

**Unified PO Import System Completion (August 8, 2025):** Successfully completed and tested comprehensive unified PO upload system. Fixed frontend crashes, enhanced multi-PO display, and verified end-to-end functionality for all 5 platforms. Blinkit multi-PO workflow now fully operational with individual PO parsing, preview, and database import. System includes duplicate detection, comprehensive error handling, and appropriate success/failure messaging for both single and multi-PO scenarios. All 5 vendor platforms working with consistent 3-step workflow.

**Routing and Navigation Fix (August 9, 2025):** Resolved City Mall preview display issues and standardized routing to unified PO upload system. Fixed field mapping for City Mall CSV parsing where "N/A" was displaying instead of actual product names and codes. Updated all navigation links from legacy platform-specific upload pages to unified `/unified-po-upload` route. Synchronized field mapping between UnifiedUploadComponent (modal) and UnifiedPoUpload (standalone page) so both use correct City Mall fields: article_name, article_id, quantity, base_cost_price, total_amount. Both embedded modal upload (within Platform PO) and standalone upload page now work consistently with proper data display.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/building
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Layout**: Sidebar-based modular design with responsive mobile support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with consistent error handling
- **Request Processing**: JSON body parsing with URL encoding support
- **Development**: Hot reload with tsx for TypeScript execution

### Database Architecture
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Database**: PostgreSQL via Neon serverless
- **Connection**: WebSocket-based connection pooling
- **Migrations**: Drizzle Kit for schema management
- **Schema Design**: 
  - Normalized relational structure
  - SAP B1 Hanna ERP integration-ready item master
  - Platform-specific item mappings
  - Comprehensive PO and line item tracking

### Core Database Tables
1. **sap_item_mst**: Master item catalog matching SAP B1 Hanna ERP structure
2. **pf_mst**: E-commerce platform registry
3. **pf_item_mst**: Platform-specific item mappings with SAP references
4. **pf_po**: Purchase order headers with platform, distributor, and delivery details
5. **pf_order_items**: Line-item details for purchase orders

### Authentication & Security
- Session-based authentication (infrastructure present)
- CORS-enabled for cross-origin requests
- Environment-based configuration for sensitive data

### Development Workflow
- **Build System**: Vite for frontend, esbuild for backend production builds
- **Development**: Concurrent frontend/backend development with HMR
- **Deployment**: Production-ready builds with static asset serving
- **Code Quality**: TypeScript strict mode with comprehensive type checking

### API Structure
- **Platform Management**: CRUD operations for e-commerce platforms
- **Item Management**: SAP item synchronization and platform mapping
- **PO Management**: Full lifecycle PO creation, editing, and status tracking
- **Unified PO Upload**: Single endpoint for uploading any vendor PO with platform selection and preview capabilities
- **Search & Filtering**: Dynamic item search across platforms and categories

### File Organization
- **Monorepo Structure**: Shared TypeScript schemas between frontend/backend
- **Client**: React application with component-based architecture
- **Server**: Express API with service layer pattern
- **Shared**: Common type definitions and database schemas

### Scalability Considerations
- **Modular Design**: Sidebar-based module system for future feature expansion
- **API-First**: All data interactions through RESTful APIs
- **Type Safety**: End-to-end TypeScript for runtime error prevention
- **Caching Strategy**: React Query for optimistic updates and background synchronization

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connections
- **Drizzle ORM**: TypeScript-first ORM with PostgreSQL dialect

### UI/UX Libraries
- **Radix UI**: Accessible component primitives for form controls, dialogs, and navigation
- **Tailwind CSS**: Utility-first CSS framework with design system
- **Lucide React**: Icon library for consistent visual elements

### Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **TypeScript**: Static typing for enhanced developer experience
- **Replit Integration**: Development environment with cartographer plugin

### State Management
- **TanStack React Query**: Server state management with caching and synchronization
- **React Hook Form**: Performance-optimized form handling
- **Zod**: Runtime type validation for API boundaries

### Future Integration Points
- **SAP B1 Hanna**: ERP system integration for item master synchronization
- **File Upload Services**: For PO attachments and document management
- **Notification Systems**: Real-time updates for PO status changes