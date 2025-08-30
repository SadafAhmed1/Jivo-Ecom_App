-- Quick check to see current duplicate situation
-- Run this first to see what duplicates currently exist

SELECT 'Current Duplicates in pf_item_mst:' as info;

-- Show duplicate item codes within same platform
SELECT 'DUPLICATE ITEM CODES:' as type, 
       pf_id, 
       pf_itemcode, 
       string_agg(DISTINCT pf_itemname, ', ') as item_names,
       COUNT(*) as count,
       string_agg(id::text, ', ') as duplicate_ids
FROM pf_item_mst 
GROUP BY pf_id, pf_itemcode 
HAVING COUNT(*) > 1
ORDER BY pf_id, pf_itemcode;

-- Show duplicate item names within same platform  
SELECT 'DUPLICATE ITEM NAMES:' as type,
       pf_id,
       pf_itemname,
       string_agg(DISTINCT pf_itemcode, ', ') as item_codes,
       COUNT(*) as count,
       string_agg(id::text, ', ') as duplicate_ids
FROM pf_item_mst 
GROUP BY pf_id, pf_itemname 
HAVING COUNT(*) > 1
ORDER BY pf_id, pf_itemname;

-- Show the specific duplicates from your screenshot
SELECT 'SPECIFIC SCREENSHOT DUPLICATES:' as type,
       id, pf_id, pf_itemcode, pf_itemname, sap_id
FROM pf_item_mst 
WHERE pf_itemcode = '1SA3344' 
AND pf_itemname = 'AMAZON-101'
ORDER BY id;