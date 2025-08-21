USE [jsap]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- Drop the procedure if it exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SP_GET_ITEM_DETAILS_BY_NAME]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[SP_GET_ITEM_DETAILS_BY_NAME]
GO

CREATE PROCEDURE [dbo].[SP_GET_ITEM_DETAILS_BY_NAME]
    @ItemName NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @ItemName IS NULL OR @ItemName = ''
    BEGIN
        -- Return all items if no search term provided
        SELECT * FROM OPENQUERY(HANADB112,'
            SELECT 
                "ItemCode",
                "ItemName",
                "ItmsGrpCod",
                "ItmsGrpNam",
                "U_TYPE",
                "U_Variety",
                "U_Sub_Group",
                "U_Brand",
                "InvntryUom",
                "SalPackUn",
                "U_IsLitre",
                "U_Tax_Rate",
                "LastPurPrc" as "BasicRate",
                "LastPurPrc" * (1 + IFNULL(CAST("U_Tax_Rate" AS DECIMAL) / 100, 0)) as "LandingRate"
            FROM "JIVO_MART_HANADB"."OITM"
            LIMIT 50
        ')
    END
    ELSE
    BEGIN
        -- Search items by name (case-insensitive)
        DECLARE @SearchPattern NVARCHAR(257) = '%' + @ItemName + '%'
        DECLARE @Query NVARCHAR(MAX) = '
            SELECT 
                "ItemCode",
                "ItemName",
                "ItmsGrpCod",
                "ItmsGrpNam",
                "U_TYPE",
                "U_Variety",
                "U_Sub_Group",
                "U_Brand",
                "InvntryUom",
                "SalPackUn",
                "U_IsLitre",
                "U_Tax_Rate",
                "LastPurPrc" as "BasicRate",
                "LastPurPrc" * (1 + IFNULL(CAST("U_Tax_Rate" AS DECIMAL) / 100, 0)) as "LandingRate"
            FROM "JIVO_MART_HANADB"."OITM"
            WHERE UPPER("ItemName") LIKE UPPER(''' + REPLACE(@SearchPattern, '''', '''''') + ''')
            LIMIT 50
        '
        
        EXEC('SELECT * FROM OPENQUERY(HANADB112, ''' + REPLACE(@Query, '''', '''''') + ''')')
    END
END
GO