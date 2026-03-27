"""Trend analysis endpoint - monthly/weekly, site/type breakdown."""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db.connection import query
from db import queries_bar_shop1 as q1
from db import queries_barunson as qb
from api.kpi import _parse_basis

bp = Blueprint("trend", __name__)


@bp.route("/api/trend")
def trend():
    today = datetime.now().date()
    tomorrow = (today + timedelta(days=1)).isoformat()
    view = request.args.get("view", "site")
    basis = _parse_basis(request.args)

    # Monthly: fixed from 2025-01-01
    monthly_start = "2025-01-01"
    monthly_end = tomorrow

    if view == "type":
        monthly_rows = query("bar_shop1", q1.trend_monthly_by_type(basis), (monthly_start, monthly_end))
    else:
        monthly_rows = query("bar_shop1", q1.trend_monthly(basis), (monthly_start, monthly_end))

    # M-card monthly
    mcard = query("barunson", qb.TREND_MCARD_MONTHLY, (monthly_start, monthly_end))

    for r in monthly_rows:
        r["revenue"] = r["revenue"] or 0

    # Weekly: last 12 weeks (일~토 기준)
    days_since_sunday = today.weekday() + 1 if today.weekday() != 6 else 0
    this_sunday = today - timedelta(days=days_since_sunday)
    weekly_start = (this_sunday - timedelta(weeks=11)).isoformat()
    weekly_end = tomorrow

    if view == "type":
        weekly_rows = query("bar_shop1", q1.trend_weekly_by_type(basis), (weekly_start, weekly_end))
    else:
        weekly_rows = query("bar_shop1", q1.trend_weekly(basis), (weekly_start, weekly_end))

    for r in weekly_rows:
        r["revenue"] = r["revenue"] or 0

    return jsonify({
        "view": view,
        "basis": basis,
        "monthly": {"start": monthly_start, "end": monthly_end, "rows": monthly_rows},
        "weekly": {"start": weekly_start, "end": weekly_end, "rows": weekly_rows},
        "mcard": mcard,
    })
