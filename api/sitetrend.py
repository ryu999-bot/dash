"""Site-level monthly trend with MOM/YOY metrics + WOW."""
from datetime import date, timedelta
from flask import Blueprint, jsonify
from db.connection import query

bp = Blueprint("sitetrend", __name__)

SITE_CASE = """
    CASE o.sales_Gubun
        WHEN 'SB' THEN N'바른손카드'
        WHEN 'B'  THEN N'바른손몰'
        WHEN 'H'  THEN N'바른손몰'
        WHEN 'SD' THEN N'디얼디어'
        WHEN 'SS' THEN N'프리미어페이퍼'
    END"""

SQL = """
SELECT
    FORMAT(o.settle_date, 'yyyy-MM') AS month,
    {site_case} AS site,
    COUNT(DISTINCT o.order_seq) AS orders,
    SUM(o.settle_price) AS revenue,
    SUM(o.order_count) AS qty
FROM custom_order o WITH (NOLOCK)
WHERE o.settle_date >= '2024-01-01'
  AND o.status_seq NOT IN (0, 9)
  AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY FORMAT(o.settle_date, 'yyyy-MM'),
    {site_case}
ORDER BY month, site
""".format(site_case=SITE_CASE)

# 진행 중인 월의 동일 기간 비교용 (작년 같은 월, 같은 일수까지만)
PARTIAL_SQL = """
SELECT
    FORMAT(o.settle_date, 'yyyy-MM') AS month,
    {site_case} AS site,
    COUNT(DISTINCT o.order_seq) AS orders,
    SUM(o.settle_price) AS revenue,
    SUM(o.order_count) AS qty
FROM custom_order o WITH (NOLOCK)
WHERE o.settle_date >= %s AND o.settle_date <= %s
  AND o.status_seq NOT IN (0, 9)
  AND o.sales_Gubun IN ('SB','B','H','SD','SS')
GROUP BY FORMAT(o.settle_date, 'yyyy-MM'),
    {site_case}
""".format(site_case=SITE_CASE)


def _aggregate(rows):
    data = {}
    for r in rows:
        m = r["month"]
        s = r["site"]
        if m not in data:
            data[m] = {}
        if s not in data[m]:
            data[m][s] = {"orders": 0, "revenue": 0, "qty": 0}
        data[m][s]["orders"] += r["orders"] or 0
        data[m][s]["revenue"] += r["revenue"] or 0
        data[m][s]["qty"] += r["qty"] or 0
    return data


@bp.route("/api/sitetrend")
def sitetrend():
    rows = query("bar_shop1", SQL)
    data = _aggregate(rows)

    today = date.today()
    cur_month = today.strftime("%Y-%m")

    # 진행 중인 월: 작년 동일 기간 데이터 조회
    partial_yoy = {}
    if cur_month in data:
        ly_start = date(today.year - 1, today.month, 1).strftime("%Y-%m-%d")
        ly_end = date(today.year - 1, today.month, today.day).strftime("%Y-%m-%d")
        partial_rows = query("bar_shop1", PARTIAL_SQL, (ly_start, ly_end))
        partial_yoy = _aggregate(partial_rows)

    # WOW: 이번주(월~오늘) vs 지난주(월~같은 요일)
    today = date.today()
    dow = today.weekday()  # 0=Mon
    this_week_start = today - timedelta(days=dow)
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = last_week_start + timedelta(days=dow)

    wow_sql = """
    SELECT
        {site_case} AS site,
        COUNT(DISTINCT o.order_seq) AS orders,
        SUM(o.settle_price) AS revenue,
        SUM(o.order_count) AS qty
    FROM custom_order o WITH (NOLOCK)
    WHERE o.settle_date >= %s AND o.settle_date < %s
      AND o.status_seq NOT IN (0, 9)
      AND o.sales_Gubun IN ('SB','B','H','SD','SS')
    GROUP BY {site_case}
    """.format(site_case=SITE_CASE)

    this_week_rows = query("bar_shop1", wow_sql,
                           (this_week_start.isoformat(), (today + timedelta(days=1)).isoformat()))
    last_week_rows = query("bar_shop1", wow_sql,
                           (last_week_start.isoformat(), (last_week_end + timedelta(days=1)).isoformat()))

    def _wow_dict(rows):
        d = {}
        for r in rows:
            s = r["site"]
            d[s] = {"orders": r["orders"] or 0, "revenue": r["revenue"] or 0, "qty": r["qty"] or 0}
        return d

    wow = {
        "this_week": _wow_dict(this_week_rows),
        "last_week": _wow_dict(last_week_rows),
        "this_week_range": f"{this_week_start.isoformat()} ~ {today.isoformat()}",
        "last_week_range": f"{last_week_start.isoformat()} ~ {last_week_end.isoformat()}",
    }

    return jsonify({"data": data, "partial_yoy": partial_yoy, "wow": wow})
