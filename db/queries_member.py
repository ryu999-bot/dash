"""SQL queries for member signup analysis."""

MEMBER_MONTHLY = """
SELECT
    FORMAT(reg_date, 'yyyy-MM') AS month,
    SELECT_SALES_GUBUN AS site,
    COUNT(*) AS signups
FROM S2_UserInfo WITH (NOLOCK)
WHERE reg_date >= %s AND reg_date < %s
GROUP BY FORMAT(reg_date, 'yyyy-MM'), SELECT_SALES_GUBUN
ORDER BY month, site
"""
