# Tax Rate Field Mapping Issue

## Problem Analysis:
The tax rate is stored and accessed using different field names throughout the application:

1. **Database schema**: `gst_rate` (in pfOrderItems, distributorOrderItems)
2. **PF Items API**: `taxrate` (from pf-item-picker)
3. **Modern PO Form**: `tax_percent` (internal state)
4. **Line Item Row**: `gst_rate` (displayed in form)

## Issues Found:
- When creating: tax comes from PF item as `taxrate` 
- When editing: tax comes from DB as `gst_rate`
- Internal form state uses `tax_percent` 
- Display components expect `gst_rate`

## Solution:
Standardize the tax rate handling with proper field mapping and conversion functions.