-- Clean up existing duplicate PF items
-- This will keep only the first occurrence of each duplicate combination

-- Step 1: Find and display duplicates first (for review)
SELECT pf_id, pf_itemcode, pf_itemname, COUNT(*) as duplicate_count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemcode, pf_itemname
HAVING COUNT(*) > 1
ORDER BY pf_id, pf_itemcode;

-- Step 2: Delete duplicate entries, keeping only the one with the smallest ID
DELETE FROM pf_item_mst 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM pf_item_mst 
    GROUP BY pf_id, pf_itemcode, pf_itemname
);

-- Step 3: Verify no duplicates remain
SELECT pf_id, pf_itemcode, pf_itemname, COUNT(*) as count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemcode, pf_itemname
HAVING COUNT(*) > 1;