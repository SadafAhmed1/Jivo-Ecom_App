-- Fix tax rate for MUSTARD 2 LTR item
-- Current rate: 0.6% (incorrect)
-- Correct rate: 5% (standard GST rate for edible oils in India)

-- Update tax rate for MUSTARD 2 LTR item with platform code SL0000119
UPDATE pf_item_mst 
SET taxrate = 5.00
WHERE pf_itemcode = 'SL0000119' 
   OR ItemName LIKE '%MUSTARD%2%LTR%'
   OR ItemName = 'MUSTARD 2 LTR';

-- Also update in sap_item_mst if it exists there
UPDATE sap_item_mst 
SET taxrate = 5.00
WHERE itemname LIKE '%MUSTARD%2%LTR%'
   OR itemcode = 'SL0000119';

-- Check the updated values
SELECT ItemName, pf_itemcode, taxrate 
FROM pf_item_mst 
WHERE pf_itemcode = 'SL0000119' 
   OR ItemName LIKE '%MUSTARD%2%LTR%'
   OR ItemName = 'MUSTARD 2 LTR';