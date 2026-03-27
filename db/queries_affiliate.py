"""SQL queries for 바른손몰 affiliate (제휴업체) analysis."""

# Monthly revenue by affiliate (25.01 ~ 26.02)
AFFILIATE_MONTHLY = """
SELECT
    cp.COMPANY_SEQ AS company_seq,
    CAST(cp.COMPANY_NAME AS varbinary(500)) AS company_name_bin,
    cp.JAEHU_KIND,
    FORMAT(o.settle_date, 'yyyy-MM') AS month,
    COUNT(DISTINCT o.order_seq) AS orders,
    SUM(o.settle_price) AS revenue,
    SUM(o.order_count) AS total_qty
FROM custom_order o WITH (NOLOCK)
JOIN COMPANY cp WITH (NOLOCK) ON cp.COMPANY_SEQ = o.company_seq
WHERE o.sales_Gubun IN ('B','H')
  AND o.settle_date >= %s AND o.settle_date < %s
  AND o.status_seq NOT IN (0, 9)
GROUP BY cp.COMPANY_SEQ, cp.COMPANY_NAME, cp.JAEHU_KIND,
         FORMAT(o.settle_date, 'yyyy-MM')
ORDER BY revenue DESC
"""

# Summary ranking by affiliate for a period
AFFILIATE_RANKING = """
SELECT
    cp.COMPANY_SEQ AS company_seq,
    CAST(cp.COMPANY_NAME AS varbinary(500)) AS company_name_bin,
    cp.JAEHU_KIND,
    COUNT(DISTINCT o.order_seq) AS orders,
    SUM(o.settle_price) AS revenue,
    SUM(o.order_count) AS total_qty,
    CAST(AVG(o.settle_price * 1.0) AS DECIMAL(10,0)) AS avg_price,
    CAST(SUM(o.order_count) * 1.0 / NULLIF(COUNT(DISTINCT o.order_seq), 0) AS DECIMAL(10,1)) AS avg_qty
FROM custom_order o WITH (NOLOCK)
JOIN COMPANY cp WITH (NOLOCK) ON cp.COMPANY_SEQ = o.company_seq
WHERE o.sales_Gubun IN ('B','H')
  AND o.settle_date >= %s AND o.settle_date < %s
  AND o.status_seq NOT IN (0, 9)
GROUP BY cp.COMPANY_SEQ, cp.COMPANY_NAME, cp.JAEHU_KIND
ORDER BY revenue DESC
"""
