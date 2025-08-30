-- Manual constraint addition that can be run in SQL Query Runner
-- This adds the same constraints that would be applied by drizzle

-- Step 1: Clean up ALL existing duplicates first
DELETE FROM pf_item_mst 
WHERE id NOT IN (
    SELECT DISTINCT ON (pf_id, pf_itemcode) id
    FROM pf_item_mst 
    ORDER BY pf_id, pf_itemcode, id
);

DELETE FROM pf_item_mst 
WHERE id NOT IN (
    SELECT DISTINCT ON (pf_id, pf_itemname) id
    FROM pf_item_mst 
    ORDER BY pf_id, pf_itemname, id
);

-- Step 2: Add unique constraints to prevent future duplicates
ALTER TABLE pf_item_mst 
ADD CONSTRAINT pf_item_mst_pf_id_itemcode_unique 
UNIQUE (pf_id, pf_itemcode);

ALTER TABLE pf_item_mst 
ADD CONSTRAINT pf_item_mst_pf_id_itemname_unique 
UNIQUE (pf_id, pf_itemname);

-- Step 3: Verify the constraints were added
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'pf_item_mst'::regclass 
AND contype = 'u';

-- Step 4: Verify no duplicates exist
SELECT pf_id, pf_itemcode, COUNT(*) as count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemcode 
HAVING COUNT(*) > 1;

SELECT pf_id, pf_itemname, COUNT(*) as count
FROM pf_item_mst 
GROUP BY pf_id, pf_itemname 
HAVING COUNT(*) > 1;