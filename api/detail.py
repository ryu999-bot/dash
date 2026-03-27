"""Detail data endpoint - daily breakdown by site and product type."""
from flask import Blueprint, request, jsonify
from db.connection import query
from db import queries_bar_shop1 as q1
from api.kpi import _parse_dates, _parse_basis

bp = Blueprint("detail", __name__)


@bp.route("/api/detail")
def detail():
    start, end = _parse_dates(request.args)
    basis = _parse_basis(request.args)

    rows = query("bar_shop1", q1.detail_daily(basis), (start, end))
    samples = query("bar_shop1", q1.DETAIL_SAMPLES_DAILY, (start, end))

    sample_map = {r["order_day"]: r["sample_count"] for r in samples}

    for r in rows:
        r["aov"] = round(r["revenue"] / r["order_count"]) if r["order_count"] else 0
        r["revenue"] = r["revenue"] or 0

    return jsonify({
        "period": {"start": start, "end": end},
        "basis": basis,
        "rows": rows,
        "samples": sample_map,
    })
