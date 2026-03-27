"""KPI summary endpoint."""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from db.connection import query
from db import queries_bar_shop1 as q1
from db import queries_barunson as qb

bp = Blueprint("kpi", __name__)

VALID_BASIS = {"order_date", "settle_date", "delivery_date"}


def _parse_dates(args):
    """Parse start/end from query args. Default: this month."""
    today = datetime.now().date()
    start = args.get("start", today.replace(day=1).isoformat())
    end = args.get("end", (today + timedelta(days=1)).isoformat())
    return start, end


def _parse_basis(args):
    """Parse date basis. Default: order_date."""
    basis = args.get("basis", "order_date")
    return basis if basis in VALID_BASIS else "order_date"


def _prev_period(start, end):
    """Calculate previous period of same length for comparison."""
    s = datetime.fromisoformat(start).date()
    e = datetime.fromisoformat(end).date()
    delta = e - s
    return (s - delta).isoformat(), s.isoformat()


@bp.route("/api/kpi")
def kpi():
    start, end = _parse_dates(request.args)
    basis = _parse_basis(request.args)
    prev_start, prev_end = _prev_period(start, end)

    # Current period - paper cards
    orders = query("bar_shop1", q1.kpi_orders(basis), (start, end))
    samples = query("bar_shop1", q1.KPI_SAMPLES, (start, end))

    # Current period - M-card
    mcard = query("barunson", qb.KPI_MCARD, (start, end))

    # Previous period
    prev_orders = query("bar_shop1", q1.kpi_orders(basis), (prev_start, prev_end))
    prev_samples = query("bar_shop1", q1.KPI_SAMPLES, (prev_start, prev_end))
    prev_mcard = query("barunson", qb.KPI_MCARD, (prev_start, prev_end))

    # Aggregate paper card totals
    total_orders = sum(r["order_count"] for r in orders)
    total_revenue = sum(r["revenue"] or 0 for r in orders)
    total_samples = samples[0]["sample_count"] if samples else 0

    prev_total_orders = sum(r["order_count"] for r in prev_orders)
    prev_total_revenue = sum(r["revenue"] or 0 for r in prev_orders)
    prev_total_samples = prev_samples[0]["sample_count"] if prev_samples else 0

    # M-card
    mc = mcard[0] if mcard else {"total_users": 0, "paid_users": 0, "revenue": 0}
    pmc = prev_mcard[0] if prev_mcard else {"total_users": 0, "paid_users": 0, "revenue": 0}

    def pct_change(cur, prev):
        if not prev:
            return None
        return round((cur - prev) / prev * 100, 1)

    aov = round(total_revenue / total_orders) if total_orders else 0
    prev_aov = round(prev_total_revenue / prev_total_orders) if prev_total_orders else 0

    return jsonify({
        "period": {"start": start, "end": end},
        "prev_period": {"start": prev_start, "end": prev_end},
        "basis": basis,
        "paper": {
            "sites": [
                {
                    "site_name": r["site_name"],
                    "order_count": r["order_count"],
                    "revenue": r["revenue"] or 0,
                }
                for r in orders
            ],
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "aov": aov,
            "samples": total_samples,
            "change": {
                "orders": pct_change(total_orders, prev_total_orders),
                "revenue": pct_change(total_revenue, prev_total_revenue),
                "aov": pct_change(aov, prev_aov),
                "samples": pct_change(total_samples, prev_total_samples),
            },
        },
        "mcard": {
            "total_users": mc["total_users"],
            "paid_users": mc["paid_users"],
            "revenue": mc["revenue"] or 0,
            "change": {
                "total_users": pct_change(mc["total_users"], pmc["total_users"]),
                "paid_users": pct_change(mc["paid_users"], pmc["paid_users"]),
                "revenue": pct_change(mc["revenue"] or 0, pmc["revenue"] or 0),
            },
        },
    })
