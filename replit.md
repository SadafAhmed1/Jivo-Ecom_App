# E-commerce Purchase Order Management System

## Overview

This is a comprehensive e-commerce purchase order management web application designed for suppliers who distribute products to various platforms and distributors across multiple Indian cities (Punjab, Delhi, Bangalore, Mumbai, Calcutta). The system provides a structured approach to managing purchase orders with proper database storage and SQL queryability.

The application is built as a full-stack solution with a React frontend and Express backend, designed to replace manual data entry processes with an automated, API-driven system. Currently focused on Platform PO management with plans to expand to distributor POs, secondary sales tracking, and inventory management.

**Recent Major Update (August 2025):** Completed comprehensive unified PO upload system supporting all 5 platforms (Flipkart Grocery, Zepto, City Mall, Blinkit, and Swiggy Instamart) with custom preview displays and unified workflow. Each platform has specialized parsing (CSV for most, XML for Swiggy) and custom preview showing platform-specific fields while maintaining consistent 3-step workflow: platform selection → file upload → preview & review → database import.

**Critical Database Fix (August 8, 2025):** Resolved major Swiggy PO data persistence issue where multiple fields were not saving properly to database tables. Fixed null value handling so empty fields save as NULL instead of placeholder values like "0 days" or empty strings. Corrected data mapping for: hsn_code, unit_base_cost, taxable_value, po_date, po_release_date, expected_delivery_date, po_expiry_date, total_items, grand_total, and vendor_name. All fields now save correctly with proper null handling and accurate data extraction matching original PO files.

**Unified PO Import System Completion (August 8, 2025):** Successfully completed and tested comprehensive unified PO upload system. Fixed frontend crashes, enhanced multi-PO display, and verified end-to-end functionality for all 5 platforms. Blinkit multi-PO workflow now fully operational with individual PO parsing, preview, and database import. System includes duplicate detection, comprehensive error handling, and appropriate success/failure messaging for both single and multi-PO scenarios. All 5 vendor platforms working with consistent 3-step workflow.

**SQL Query Module with Terminal Implementation (August 11, 2025):** Successfully implemented comprehensive SQL Query module for custom database reporting and analytics with integrated terminal access. Created secure backend API with validation to only allow SELECT statements, preventing destructive operations. Built complete frontend interface with query editor, syntax highlighting, results display, and CSV export functionality. Module includes database table browser showing all 56+ available tables, sample queries for common reporting needs (sales by platform, top products, monthly trends, inventory status), and query history tracking with execution time monitoring. Added integrated terminal interface with full source code access for running AI agents like Claude Code for business analysis and data analysis. Terminal includes security restrictions to prevent destructive operations, command history tracking, directory navigation support, and 30-second timeout protection. System provides full access to all database tables and application source code, making it perfect for running agentic AI tools for advanced analytics and business intelligence. Fixed scrolling issues in all sections for optimal user experience.

**Blinkit Inventory System Implementation (August 11, 2025):** Successfully completed Blinkit inventory management system alongside existing Jio Mart inventory platform. Created complete infrastructure with INV_Blinkit_JM_Daily and INV_Blinkit_JM_Range database tables, specialized Blinkit inventory parser with flexible field mapping, and enhanced frontend with platform-specific summary cards. Fixed TypeScript errors and added comprehensive debugging. System supports 16 inventory fields including SKU ID, product name, category, brand, stock levels, reserved/available quantities, damaged/expired quantities, warehouse location, and supplier information. Verified end-to-end functionality with sample data - preview, database import, and data retrieval all working correctly. Parser includes fallback field mapping to handle different CSV formats and provides detailed error messages for troubleshooting.

**Routing and Navigation Fix (August 9, 2025):** Resolved City Mall preview display issues and standardized routing to unified PO upload system. Fixed field mapping for City Mall CSV parsing where "N/A" was displaying instead of actual product names and codes. Updated all navigation links from legacy platform-specific upload pages to unified `/unified-po-upload` route. Synchronized field mapping between UnifiedUploadComponent (modal) and UnifiedPoUpload (standalone page) so both use correct City Mall fields: article_name, article_id, quantity, base_cost_price, total_amount. Both embedded modal upload (within Platform PO) and standalone upload page now work consistently with proper data display.

**SQL Server Integration for SAP Data (August 9, 2025):** Successfully implemented comprehensive SQL Server integration system for SAP item master synchronization at 103.89.44.240:1433. Created new `sap_item_mst_api` database table for item master data. Built complete backend API with `server/sqlserver.ts` for SQL Server connection management, stored procedure calls to `SP_GET_ITEM_DETAILS`, and robust error handling. Added frontend SAP Sync interface at `/sap-sync` route with real-time status monitoring, sync progress tracking, and comprehensive item display. System includes proper connection timeout handling, detailed error messages for connectivity issues, and navigation menu integration. Uses SQL Server stored procedures to access SAP data. API endpoints: `/api/sap-items-api` for data retrieval and `/api/sap-items-api/sync` for triggering synchronization from SQL Server database.

**Secondary Sales Comprehensive Multi-Platform System (August 10, 2025):** Successfully completed comprehensive secondary sales system supporting all four major platforms: Amazon, Zepto, Blinkit, and Swiggy. Implemented complete workflow integration with platform-specific parsers, database tables, and frontend displays. Created specialized database tables for each platform: SC_Amazon_JW_Daily/Range and SC_Amazon_JM_Daily/Range (Amazon), SC_Zepto_JM_Daily/Range (Zepto - 13 columns), SC_Blinkit_JM_Daily/Range (Blinkit - 10 columns), and SC_Swiggy_JM_Daily/Range (Swiggy - 17 columns). Each platform has unique data structures and parsing requirements with proper CSV format handling. Implemented intelligent business unit filtering where Amazon supports both Jivo Wellness and Jivo Mart, while all new platforms are restricted to Jivo Mart only. Added platform-specific preview displays with conditional summary cards showing relevant metrics (Amazon: ordered/shipped revenue and units; new platforms: total records, sales value, unique products). Created comprehensive table layouts with platform-specific column headers and data presentation matching each platform's unique CSV structure. Fixed all TypeScript type issues and implemented proper null handling across all parsers. System maintains consistent 6-step workflow while accommodating different data structures: platform selection → business unit filtering → period type selection → optional date range → file upload → preview & database import.

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