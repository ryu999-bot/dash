"""SQL queries for barunson DB (M-card / mobile invitation)."""

# M-card KPI: total users (via TB_Invitation) and paid users/revenue (via TB_Order)
KPI_MCARD = """
SELECT
    COUNT(DISTINCT i.Invitation_ID) AS total_users,
    COUNT(DISTINCT CASE WHEN o.Payment_Price > 0 THEN i.Invitation_ID END) AS paid_users,
    ISNULL(SUM(CASE WHEN o.Payment_Price > 0 THEN o.Payment_Price END), 0) AS revenue
FROM TB_Invitation i WITH (NOLOCK)
JOIN TB_Product p WITH (NOLOCK) ON i.Template_ID = p.Template_ID
LEFT JOIN TB_Order o WITH (NOLOCK) ON i.Order_ID = o.Order_ID
WHERE p.Product_Code LIKE 'MC%'
    AND i.Regist_DateTime >= %s AND i.Regist_DateTime < %s
"""

# M-card monthly trend
TREND_MCARD_MONTHLY = """
SELECT
    FORMAT(i.Regist_DateTime, 'yyyy-MM') AS ym,
    COUNT(DISTINCT i.Invitation_ID) AS total_users,
    COUNT(DISTINCT CASE WHEN o.Payment_Price > 0 THEN i.Invitation_ID END) AS paid_users,
    ISNULL(SUM(CASE WHEN o.Payment_Price > 0 THEN o.Payment_Price END), 0) AS revenue
FROM TB_Invitation i WITH (NOLOCK)
JOIN TB_Product p WITH (NOLOCK) ON i.Template_ID = p.Template_ID
LEFT JOIN TB_Order o WITH (NOLOCK) ON i.Order_ID = o.Order_ID
WHERE p.Product_Code LIKE 'MC%'
    AND i.Regist_DateTime >= %s AND i.Regist_DateTime < %s
GROUP BY FORMAT(i.Regist_DateTime, 'yyyy-MM')
ORDER BY ym
"""
