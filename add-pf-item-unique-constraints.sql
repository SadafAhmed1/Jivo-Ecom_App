-- Add unique constraints to prevent duplicate PF items within the same platform

-- Add unique constraint for pf_id + pf_itemcode combination
ALTER TABLE pf_item_mst ADD CONSTRAINT pf_item_mst_pf_id_itemcode_unique 
UNIQUE (pf_id, pf_itemcode);

-- Add unique constraint for pf_id + pf_itemname combination  
ALTER TABLE pf_item_mst ADD CONSTRAINT pf_item_mst_pf_id_itemname_unique 
UNIQUE (pf_id, pf_itemname);

-- Optional: Clean up existing duplicates first (if any exist)
-- You may want to run this first to remove duplicates before adding constraints:

-- DELETE FROM pf_item_mst 
-- WHERE id NOT IN (
--   SELECT MIN(id) 
--   FROM pf_item_mst 
--   GROUP BY pf_id, pf_itemcode
-- );

-- DELETE FROM pf_item_mst 
-- WHERE id NOT IN (
--   SELECT MIN(id) 
--   FROM pf_item_mst 
--   GROUP BY pf_id, pf_itemname  
-- );