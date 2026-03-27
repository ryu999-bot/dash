#!/usr/bin/env python3
"""Barunson Sales Analysis Dashboard - Flask Application."""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from config import PORT
from api.kpi import bp as kpi_bp
from api.detail import bp as detail_bp
from api.trend import bp as trend_bp
from api.funnel import bp as funnel_bp
from api.export import bp as export_bp
from api.sku import bp as sku_bp
from api.affiliate import bp as affiliate_bp
from api.member import bp as member_bp
from api.sitetrend import bp as sitetrend_bp
from api.mail import bp as mail_bp
from api.gift import bp as gift_bp

app = Flask(__name__, static_folder="static", static_url_path="/static")

# Register blueprints
app.register_blueprint(kpi_bp)
app.register_blueprint(detail_bp)
app.register_blueprint(trend_bp)
app.register_blueprint(funnel_bp)
app.register_blueprint(export_bp)
app.register_blueprint(sku_bp)
app.register_blueprint(affiliate_bp)
app.register_blueprint(member_bp)
app.register_blueprint(sitetrend_bp)
app.register_blueprint(mail_bp)
app.register_blueprint(gift_bp)


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


if __name__ == "__main__":
    print(f"Dashboard running at http://localhost:{PORT}")
    import os
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=PORT, debug=debug)
