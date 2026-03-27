"""Funnel analysis endpoint - site-specific + combined + M-card."""
from flask import Blueprint, request, jsonify
from db.connection import query
from db import queries_bar_shop1 as q1
from db import queries_barunson as qb
from api.kpi import _parse_dates, _parse_basis

bp = Blueprint("funnel", __name__)

PAPER_SITES = ["바른손카드", "바른손몰", "디얼디어", "프리미어페이퍼"]


def _to_map(rows, key, val):
    """Convert list of dicts to {key_value: val_value} map."""
    return {r[key]: r[val] for r in rows}


def _conv(a, b):
    return round(b / a * 100, 1) if a else 0


@bp.route("/api/funnel")
def funnel():
    start, end = _parse_dates(request.args)
    basis = _parse_basis(request.args)

    # -- Paper card sites (site-specific) --
    signup_rows = query("bar_shop1", q1.FUNNEL_SIGNUP_BY_SITE, (start, end))
    sample_rows = query("bar_shop1", q1.FUNNEL_SAMPLE_BY_SITE, (start, end))
    order_rows = query("bar_shop1", q1.funnel_order_by_site(basis), (start, end))

    signup_map = _to_map(signup_rows, "site_name", "signup_count")
    sample_map = _to_map(sample_rows, "site_name", "sample_count")
    order_map = {r["site_name"]: r for r in order_rows}

    # Per-site funnel
    sites = []
    total_signup = 0
    total_sample = 0
    total_order = 0
    total_revenue = 0

    for site in PAPER_SITES:
        su = signup_map.get(site, 0)
        sa = sample_map.get(site, 0)
        o = order_map.get(site, {})
        oc = o.get("order_count", 0)
        rv = o.get("revenue", 0) or 0

        total_signup += su
        total_sample += sa
        total_order += oc
        total_revenue += rv

        sites.append({
            "site_name": site,
            "stages": [
                {"name": "회원가입", "count": su, "rate": 100},
                {"name": "샘플신청", "count": sa, "rate": _conv(su, sa)},
                {"name": "결제완료", "count": oc, "rate": _conv(su, oc), "revenue": rv},
            ],
            "conversions": {
                "signup_to_sample": _conv(su, sa),
                "sample_to_order": _conv(sa, oc),
                "signup_to_order": _conv(su, oc),
            },
        })

    # Combined paper funnel
    combined = {
        "site_name": "종이청첩장 전체",
        "stages": [
            {"name": "회원가입", "count": total_signup, "rate": 100},
            {"name": "샘플신청", "count": total_sample, "rate": _conv(total_signup, total_sample)},
            {"name": "결제완료", "count": total_order, "rate": _conv(total_signup, total_order), "revenue": total_revenue},
        ],
        "conversions": {
            "signup_to_sample": _conv(total_signup, total_sample),
            "sample_to_order": _conv(total_sample, total_order),
            "signup_to_order": _conv(total_signup, total_order),
        },
    }

    # -- M-card funnel (전체 사용자 → 유료 사용자) --
    mc = query("barunson", qb.KPI_MCARD, (start, end))
    mc = mc[0] if mc else {"total_users": 0, "paid_users": 0, "revenue": 0}
    mcard = {
        "site_name": "바른손 M카드",
        "stages": [
            {"name": "초대장 생성", "count": mc["total_users"], "rate": 100},
            {"name": "유료 결제", "count": mc["paid_users"],
             "rate": _conv(mc["total_users"], mc["paid_users"]),
             "revenue": mc["revenue"] or 0},
        ],
        "conversions": {
            "creation_to_paid": _conv(mc["total_users"], mc["paid_users"]),
        },
    }

    return jsonify({
        "period": {"start": start, "end": end},
        "basis": basis,
        "combined": combined,
        "sites": sites,
        "mcard": mcard,
    })
