"""SQL queries for SKU (product catalog) listing."""

# SKU list with card detail info
# Card_Name is EUC-KR → varbinary decode in Python
# XERP BOM join removed (permission issue) — Card_Material from S2_CardDetail used instead
SKU_LIST = """
SELECT
    c.Card_Seq,
    c.Card_Code,
    CAST(c.Card_Name AS varbinary(500)) AS card_name_bin,
    c.Card_Price,
    c.DISPLAY_YORN,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM S2_CardKind ck WITH (NOLOCK)
            WHERE ck.Card_Seq = c.Card_Seq AND ck.CardKind_Seq = 14
        ) THEN N'디지털'
        ELSE N'마스터'
    END AS product_type,
    c.Card_WSize,
    c.Card_HSize,
    d.Card_Folding,
    d.Card_Shape,
    CAST(d.Card_Material AS NVARCHAR(300)) AS card_material,
    c.CARD_GROUP,
    c.CardBrand,
    o.IsEmbo,
    o.isLetterPress,
    CASE WHEN o.isLaser = '1' OR o.isLaserCard = '1' THEN '1' ELSE '0' END AS isLaser,
    o.IsDisitalCut,
    o.IsPunching,
    o.isEnvSpecial,
    CAST(o.PrintMethod AS NVARCHAR(100)) AS print_method,
    gf.greeting_font
FROM S2_Card c WITH (NOLOCK)
LEFT JOIN S2_CardDetail d WITH (NOLOCK) ON d.Card_Seq = c.Card_Seq
LEFT JOIN S2_CardOption o WITH (NOLOCK) ON o.Card_Seq = c.Card_Seq
OUTER APPLY (
    SELECT TOP 1
        CASE WHEN sandoll_orders > 0 AND sandoll_orders >= myungjo_orders THEN N'산돌고딕'
             ELSE N'윤명조'
        END AS greeting_font
    FROM (
        SELECT
            COUNT(DISTINCT CASE WHEN cf.Font LIKE N'%Sandoll 고딕Neo%'
                                  OR cf.Font LIKE N'%산돌%'
                           THEN co.order_seq END) AS sandoll_orders,
            COUNT(DISTINCT CASE WHEN cf.Font LIKE N'%명조%'
                                  OR cf.Font LIKE N'%HY세명조%'
                                  OR cf.Font LIKE N'%Goldenbook%'
                                  OR cf.Font LIKE N'%은 펜%'
                                  OR cf.Font LIKE N'%김남윤%'
                           THEN co.order_seq END) AS myungjo_orders
        FROM ChoanFont cf WITH (NOLOCK)
        JOIN custom_order co WITH (NOLOCK) ON cf.order_seq = co.order_seq
        WHERE co.card_seq = c.Card_Seq AND co.settle_price > 0
          AND cf.Font IS NOT NULL AND cf.Font <> ''
    ) sub
    WHERE sandoll_orders + myungjo_orders > 0
) gf
ORDER BY c.Card_Seq DESC
"""

# Card kind mapping: Card_Seq -> CardKind names (EUC-KR)
SKU_KINDS = """
SELECT
    ck.Card_Seq,
    CAST(ki.CardKind AS varbinary(200)) AS kind_bin
FROM S2_CardKind ck WITH (NOLOCK)
JOIN S2_CardKindInfo ki WITH (NOLOCK) ON ck.CardKind_Seq = ki.CardKind_Seq
ORDER BY ck.Card_Seq, ki.CardKind_Seq
"""
