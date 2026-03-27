"""Gift/Return-gift (답례품) order endpoints - CUSTOM_ETC_ORDER."""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from db.connection import query

bp = Blueprint("gift", __name__)

SITE_MAP = {"SB": "바른손카드", "B": "바른손몰", "H": "바른손몰", "SD": "디얼디어", "SS": "프리미어페이퍼"}


def _parse(args):
    today = datetime.now().date()
    start = args.get("start", today.replace(day=1).isoformat())
    end = args.get("end", (today + timedelta(days=1)).isoformat())
    return start, end


@bp.route("/api/gift/summary")
def gift_summary():
    start, end = _parse(request.args)
    rows = query("bar_shop1", """
        SELECT
            o.sales_gubun,
            COUNT(DISTINCT o.order_seq) AS order_cnt,
            SUM(ei.card_sale_price) AS revenue
        FROM CUSTOM_ETC_ORDER o WITH(NOLOCK)
        JOIN CUSTOM_ETC_ORDER_ITEM ei WITH(NOLOCK) ON o.order_seq = ei.Order_Seq
        JOIN S2_Card c WITH(NOLOCK) ON ei.Card_Seq = c.Card_Seq
        WHERE o.order_date >= %s AND o.order_date < %s
          AND o.settle_price > 0
          AND (c.Card_Code LIKE 'TG%%' OR c.Card_Code LIKE 'OS%%')
        GROUP BY o.sales_gubun
        ORDER BY revenue DESC
    """, (start, end))
    result = []
    for r in rows:
        sg = (r["sales_gubun"] or "").strip()
        result.append({
            "site": SITE_MAP.get(sg, sg),
            "site_code": sg,
            "order_cnt": r["order_cnt"],
            "revenue": r["revenue"] or 0,
        })
    return jsonify(result)


@bp.route("/api/gift/products")
def gift_products():
    start, end = _parse(request.args)
    site = request.args.get("site", "")

    site_filter = ""
    if site and site != "전체":
        codes = {"바른손카드": "'SB'", "바른손몰": "'B','H'", "디얼디어": "'SD'", "프리미어페이퍼": "'SS'"}
        if site in codes:
            site_filter = f"AND o.sales_gubun IN ({codes[site]})"

    sql = f"""
        SELECT
            c.Card_Code AS card_code,
            CAST(c.Card_Name AS NVARCHAR(200)) AS card_name,
            c.Card_Price AS card_price,
            c.Card_Div AS card_div,
            COUNT(DISTINCT o.order_seq) AS order_cnt,
            SUM(ei.order_count) AS total_qty,
            SUM(ei.card_sale_price) AS revenue
        FROM CUSTOM_ETC_ORDER o WITH(NOLOCK)
        JOIN CUSTOM_ETC_ORDER_ITEM ei WITH(NOLOCK) ON o.order_seq = ei.Order_Seq
        JOIN S2_Card c WITH(NOLOCK) ON ei.Card_Seq = c.Card_Seq
        WHERE o.order_date >= %s AND o.order_date < %s
          AND o.settle_price > 0
          AND (c.Card_Code LIKE 'TG%%' OR c.Card_Code LIKE 'OS%%')
          {site_filter}
        GROUP BY c.Card_Code, CAST(c.Card_Name AS NVARCHAR(200)), c.Card_Price, c.Card_Div
        ORDER BY order_cnt DESC
    """
    rows = query("bar_shop1", sql, (start, end))
    result = []
    for r in rows:
        name = r["card_name"] or ""
        if isinstance(name, (bytes, bytearray)):
            try:
                name = name.decode("euc-kr")
            except Exception:
                name = name.decode("utf-8", errors="replace")
        result.append({
            "card_code": (r["card_code"] or "").strip(),
            "card_name": name,
            "card_price": r["card_price"] or 0,
            "card_div": (r["card_div"] or "").strip(),
            "order_cnt": r["order_cnt"],
            "total_qty": r["total_qty"] or 0,
            "revenue": float(r["revenue"] or 0),
        })
    return jsonify(result)


@bp.route("/api/gift/monthly")
def gift_monthly():
    rows = query("bar_shop1", """
        SELECT
            CONVERT(varchar(7), o.order_date, 120) AS month,
            o.sales_gubun,
            COUNT(DISTINCT o.order_seq) AS order_cnt,
            SUM(ei.card_sale_price) AS revenue
        FROM CUSTOM_ETC_ORDER o WITH(NOLOCK)
        JOIN CUSTOM_ETC_ORDER_ITEM ei WITH(NOLOCK) ON o.order_seq = ei.Order_Seq
        JOIN S2_Card c WITH(NOLOCK) ON ei.Card_Seq = c.Card_Seq
        WHERE o.settle_price > 0
          AND o.order_date >= DATEADD(month, -12, GETDATE())
          AND (c.Card_Code LIKE 'TG%%' OR c.Card_Code LIKE 'OS%%')
        GROUP BY CONVERT(varchar(7), o.order_date, 120), o.sales_gubun
        ORDER BY month, o.sales_gubun
    """)
    result = []
    for r in rows:
        sg = (r["sales_gubun"] or "").strip()
        result.append({
            "month": r["month"],
            "site": SITE_MAP.get(sg, sg),
            "site_code": sg,
            "order_cnt": r["order_cnt"],
            "revenue": r["revenue"] or 0,
        })
    return jsonify(result)
