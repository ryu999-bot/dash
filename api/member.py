"""Member signup analysis endpoints."""
from flask import Blueprint, request, jsonify
from db.connection import query
from db.queries_member import MEMBER_MONTHLY

bp = Blueprint("member", __name__)

SITE_MAP = {"B": "바른손몰", "SB": "바른손카드", "BM": "M카드", "SS": "프리미어페이퍼", "SD": "디얼디어"}


@bp.route("/api/member/monthly")
def member_monthly():
    start = request.args.get("start", "2025-01-01")
    end = request.args.get("end", "2026-04-01")
    rows = query("bar_shop1", MEMBER_MONTHLY, (start, end))

    # Build: { month: { site: signups, ... }, ... }
    months = {}
    for r in rows:
        m = r["month"]
        site = SITE_MAP.get(r["site"], r["site"] or "기타")
        if m not in months:
            months[m] = {"month": m, "total": 0}
        months[m][site] = (months[m].get(site) or 0) + (r["signups"] or 0)
        months[m]["total"] += (r["signups"] or 0)

    result = sorted(months.values(), key=lambda x: x["month"])
    return jsonify(result)
