-- Immediate fix: Delete the specific duplicate entries shown in the screenshot
-- Based on the screenshot, these are the duplicate rows that need to be removed

-- First, let's see the duplicates
SELECT id, pf_id, pf_itemcode, pf_itemname, sap_id 
FROM pf_item_mst 
WHERE pf_itemcode = '1SA3344' 
AND pf_itemname = 'AMAZON-101' 
AND pf_id = 6
ORDER BY id;

-- Delete the duplicate entries, keeping only the first one (lowest ID)
DELETE FROM pf_item_mst 
WHERE pf_itemcode = '1SA3344' 
AND pf_itemname = 'AMAZON-101' 
AND pf_id = 6
AND id NOT IN (
    SELECT MIN(id) 
    FROM pf_item_mst 
    WHERE pf_itemcode = '1SA3344' 
    AND pf_itemname = 'AMAZON-101' 
    AND pf_id = 6
);

-- Verify the cleanup
SELECT id, pf_id, pf_itemcode, pf_itemname, sap_id 
FROM pf_item_mst 
WHERE pf_itemcode = '1SA3344' 
AND pf_itemname = 'AMAZON-101' 
AND pf_id = 6;