-- FINAL FIX: Completely prevent ANY duplicates in pf_item_mst
-- This ensures NO duplicate PF item codes AND NO duplicate PF item names within same platform

-- Step 1: Show current duplicate situation
SELECT 'DUPLICATE ITEM CODES:' as issue_type, pf_id, pf_itemcode, pf_itemname, COUNT(*) as duplicate_count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemcode, pf_itemname
HAVING COUNT(*) > 1
UNION ALL
SELECT 'DUPLICATE ITEM NAMES:' as issue_type, pf_id, pf_itemcode, pf_itemname, COUNT(*) as duplicate_count  
FROM pf_item_mst 
GROUP BY pf_id, pf_itemname
HAVING COUNT(*) > 1
ORDER BY issue_type, pf_id;

-- Step 2: CLEAN UP ALL DUPLICATES - Keep only the first occurrence of each
DELETE FROM pf_item_mst 
WHERE id NOT IN (
    -- Keep the item with lowest ID for each unique combination of pf_id + pf_itemcode + pf_itemname
    SELECT MIN(id)
    FROM pf_item_mst 
    GROUP BY pf_id, pf_itemcode, pf_itemname
);

-- Step 3: ADD IRON-CLAD UNIQUE CONSTRAINTS
-- Constraint 1: No duplicate item codes within same platform
ALTER TABLE pf_item_mst 
ADD CONSTRAINT pf_item_unique_code_per_platform 
UNIQUE (pf_id, pf_itemcode);

-- Constraint 2: No duplicate item names within same platform  
ALTER TABLE pf_item_mst 
ADD CONSTRAINT pf_item_unique_name_per_platform 
UNIQUE (pf_id, pf_itemname);

-- Step 4: VERIFY NO DUPLICATES EXIST
SELECT 'After cleanup - Duplicate item codes check:' as check_type, 
       pf_id, pf_itemcode, COUNT(*) as count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemcode 
HAVING COUNT(*) > 1

UNION ALL

SELECT 'After cleanup - Duplicate item names check:' as check_type,
       pf_id::text, pf_itemname, COUNT(*) as count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemname 
HAVING COUNT(*) > 1;

-- Step 5: Show final constraint status
SELECT 'CONSTRAINTS ADDED:' as status, conname as constraint_name, 
       pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'pf_item_mst'::regclass 
AND contype = 'u'
AND conname LIKE 'pf_item_unique%';

-- Step 6: Final verification - should return no rows if successful
SELECT 'FINAL CHECK - These should be ZERO:' as final_status,
       'Duplicate codes' as check_type, 
       COUNT(*) as duplicate_count
FROM (
    SELECT pf_id, pf_itemcode, COUNT(*) as cnt
    FROM pf_item_mst 
    GROUP BY pf_id, pf_itemcode 
    HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 'FINAL CHECK - These should be ZERO:' as final_status,
       'Duplicate names' as check_type,
       COUNT(*) as duplicate_count  
FROM (
    SELECT pf_id, pf_itemname, COUNT(*) as cnt
    FROM pf_item_mst 
    GROUP BY pf_id, pf_itemname 
    HAVING COUNT(*) > 1
) duplicates;