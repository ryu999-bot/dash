"""SQL queries for bar_shop1 (paper card sites).

date_basis: 'order_date' | 'settle_date' | 'delivery_date'
- order_date, settle_date: custom_order 직접 컬럼
- delivery_date: DELIVERY_INFO.DELIVERY_DATE JOIN custom_order
"""

SITE_CASE = """CASE
        WHEN o.sales_Gubun = 'SB' THEN N'바른손카드'
        WHEN o.sales_Gubun IN ('B','H') THEN N'바른손몰'
        WHEN o.sales_Gubun = 'SD' THEN N'디얼디어'
        WHEN o.sales_Gubun = 'SS' THEN N'프리미어페이퍼'
    END"""

TYPE_CASE = """CASE
        WHEN o.order_type = '1' THEN N'마스터'
        WHEN o.order_type = '6' THEN N'디지털'
        WHEN o.order_type = '7' THEN N'이니셜특수'
        WHEN o.order_type = '14' THEN N'감사장'
        ELSE N'기타'
    END"""


def _from_clause(basis):
    """Return FROM + WHERE date column expression based on basis."""
    if basis == "delivery_date":
        return (
            "FROM DELIVERY_INFO d WITH (NOLOCK) "
            "INNER JOIN custom_order o WITH (NOLOCK) ON d.ORDER_SEQ = o.order_seq",
            "d.DELIVERY_DATE",
        )
    else:
        return (
            "FROM custom_order o WITH (NOLOCK)",
            f"o.{basis}",
        )


def kpi_orders(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    {SITE_CASE} AS site_name,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY {SITE_CASE}
"""


def detail_daily(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    CONVERT(varchar(10), {date_col}, 23) AS order_day,
    {SITE_CASE} AS site_name,
    {TYPE_CASE} AS product_type,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY
    CONVERT(varchar(10), {date_col}, 23),
    {SITE_CASE},
    {TYPE_CASE}
ORDER BY order_day, site_name, product_type
"""


def trend_monthly(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    FORMAT({date_col}, 'yyyy-MM') AS ym,
    {SITE_CASE} AS site_name,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY
    FORMAT({date_col}, 'yyyy-MM'),
    {SITE_CASE}
ORDER BY ym, site_name
"""


def trend_monthly_by_type(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    FORMAT({date_col}, 'yyyy-MM') AS ym,
    {TYPE_CASE} AS product_type,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY
    FORMAT({date_col}, 'yyyy-MM'),
    {TYPE_CASE}
ORDER BY ym, product_type
"""


def trend_weekly(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    CONVERT(varchar(10), DATEADD(day, -(DATEPART(weekday, {date_col}) - 1), {date_col}), 23) AS week_start,
    {SITE_CASE} AS site_name,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY
    CONVERT(varchar(10), DATEADD(day, -(DATEPART(weekday, {date_col}) - 1), {date_col}), 23),
    {SITE_CASE}
ORDER BY week_start, site_name
"""


def trend_weekly_by_type(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    CONVERT(varchar(10), DATEADD(day, -(DATEPART(weekday, {date_col}) - 1), {date_col}), 23) AS week_start,
    {TYPE_CASE} AS product_type,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY
    CONVERT(varchar(10), DATEADD(day, -(DATEPART(weekday, {date_col}) - 1), {date_col}), 23),
    {TYPE_CASE}
ORDER BY week_start, product_type
"""


def funnel_order(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
"""


# These don't change by basis (sample/signup have their own date columns)
KPI_SAMPLES = """
SELECT COUNT(*) AS sample_count
FROM CUSTOM_SAMPLE_ORDER WITH (NOLOCK)
WHERE SETTLE_DATE >= %s AND SETTLE_DATE < %s
    AND STATUS_SEQ >= 1
"""

DETAIL_SAMPLES_DAILY = """
SELECT
    CONVERT(varchar(10), SETTLE_DATE, 23) AS order_day,
    COUNT(*) AS sample_count
FROM CUSTOM_SAMPLE_ORDER WITH (NOLOCK)
WHERE SETTLE_DATE >= %s AND SETTLE_DATE < %s
    AND STATUS_SEQ >= 1
GROUP BY CONVERT(varchar(10), SETTLE_DATE, 23)
ORDER BY order_day
"""

FUNNEL_SIGNUP = """
SELECT COUNT(DISTINCT uid) AS signup_count
FROM S2_UserInfo WITH (NOLOCK)
WHERE reg_date >= %s AND reg_date < %s
"""

FUNNEL_SAMPLE = """
SELECT COUNT(*) AS sample_count
FROM CUSTOM_SAMPLE_ORDER WITH (NOLOCK)
WHERE SETTLE_DATE >= %s AND SETTLE_DATE < %s
    AND STATUS_SEQ >= 1
"""

# -- Site-specific funnel queries --

FUNNEL_SIGNUP_BY_SITE = """
SELECT
    CASE
        WHEN SELECT_SALES_GUBUN = 'SB' THEN N'바른손카드'
        WHEN SELECT_SALES_GUBUN = 'B' THEN N'바른손몰'
        WHEN SELECT_SALES_GUBUN = 'BM' THEN N'바른손몰(프리미어)'
        WHEN SELECT_SALES_GUBUN = 'SD' THEN N'디얼디어'
        WHEN SELECT_SALES_GUBUN = 'SS' THEN N'프리미어페이퍼'
        ELSE N'기타'
    END AS site_name,
    COUNT(DISTINCT uid) AS signup_count
FROM S2_UserInfo WITH (NOLOCK)
WHERE reg_date >= %s AND reg_date < %s
    AND SELECT_SALES_GUBUN IN ('SB','B','BM','SD','SS')
GROUP BY
    CASE
        WHEN SELECT_SALES_GUBUN = 'SB' THEN N'바른손카드'
        WHEN SELECT_SALES_GUBUN = 'B' THEN N'바른손몰'
        WHEN SELECT_SALES_GUBUN = 'BM' THEN N'바른손몰(프리미어)'
        WHEN SELECT_SALES_GUBUN = 'SD' THEN N'디얼디어'
        WHEN SELECT_SALES_GUBUN = 'SS' THEN N'프리미어페이퍼'
        ELSE N'기타'
    END
"""

FUNNEL_SAMPLE_BY_SITE = """
SELECT
    CASE
        WHEN SALES_GUBUN = 'SB' THEN N'바른손카드'
        WHEN SALES_GUBUN IN ('B','H') THEN N'바른손몰'
        WHEN SALES_GUBUN = 'SD' THEN N'디얼디어'
        WHEN SALES_GUBUN = 'SS' THEN N'프리미어페이퍼'
        ELSE N'기타'
    END AS site_name,
    COUNT(*) AS sample_count
FROM CUSTOM_SAMPLE_ORDER WITH (NOLOCK)
WHERE SETTLE_DATE >= %s AND SETTLE_DATE < %s
    AND STATUS_SEQ >= 1
    AND SALES_GUBUN IN ('SB','B','H','SD','SS')
GROUP BY
    CASE
        WHEN SALES_GUBUN = 'SB' THEN N'바른손카드'
        WHEN SALES_GUBUN IN ('B','H') THEN N'바른손몰'
        WHEN SALES_GUBUN = 'SD' THEN N'디얼디어'
        WHEN SALES_GUBUN = 'SS' THEN N'프리미어페이퍼'
        ELSE N'기타'
    END
"""


def funnel_order_by_site(basis="order_date"):
    from_cl, date_col = _from_clause(basis)
    return f"""
SELECT
    {SITE_CASE} AS site_name,
    COUNT(*) AS order_count,
    CAST(SUM(CAST(o.last_total_price AS bigint)) AS bigint) AS revenue
{from_cl}
WHERE {date_col} >= %s AND {date_col} < %s
    AND o.status_seq >= 1
    AND o.settle_cancel_date IS NULL
    AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY {SITE_CASE}
"""
