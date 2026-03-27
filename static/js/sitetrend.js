/**
 * Site-level MOM/YOY trend analysis module.
 * 진행 중인 월은 작년 동일 기간(1일~오늘) 기준으로 YOY 비교.
 */
const SiteTrend = {
    _charts: {},
    data: null,
    partialYoy: null,
    curMonth: null,

    SITES: ['전체', '바른손카드', '바른손몰', '디얼디어', '프리미어페이퍼'],
    CHART_SITES: ['바른손카드', '바른손몰', '디얼디어', '프리미어페이퍼'],
    COLORS: {
        '전체': '#111827',
        '바른손카드': '#3B82F6',
        '바른손몰': '#10B981',
        '디얼디어': '#F59E0B',
        '프리미어페이퍼': '#8B5CF6',
    },
    wow: null,

    async load() {
        const resp = await Utils.fetchJson('api/sitetrend');
        this.data = resp.data;
        this.partialYoy = resp.partial_yoy || {};
        this.wow = resp.wow || {};
        // Detect current month (latest month in data)
        const months = Object.keys(this.data).sort();
        this.curMonth = months.length > 0 ? months[months.length - 1] : null;
        // Build "전체" aggregation per month
        for (const m of months) {
            const total = { orders: 0, revenue: 0, qty: 0 };
            for (const s of this.CHART_SITES) {
                const d = this.data[m] && this.data[m][s];
                if (d) { total.orders += d.orders; total.revenue += d.revenue; total.qty += d.qty; }
            }
            if (!this.data[m]) this.data[m] = {};
            this.data[m]['전체'] = total;
        }
        // Same for partial_yoy
        for (const m of Object.keys(this.partialYoy)) {
            const total = { orders: 0, revenue: 0, qty: 0 };
            for (const s of this.CHART_SITES) {
                const d = this.partialYoy[m] && this.partialYoy[m][s];
                if (d) { total.orders += d.orders; total.revenue += d.revenue; total.qty += d.qty; }
            }
            if (!this.partialYoy[m]) this.partialYoy[m] = {};
            this.partialYoy[m]['전체'] = total;
        }
        this.render();
    },

    render() {
        if (!this.data) return;
        const months = Object.keys(this.data).sort();
        this.renderKpi(months);
        this.renderWow();
        this.renderCharts(months);
    },

    /** Get metrics for a site in a given month */
    get(month, site) {
        const d = this.data[month] && this.data[month][site];
        if (!d) return { orders: 0, revenue: 0, qty: 0 };
        return d;
    },

    /** Get YOY comparison data - uses partial data for current month */
    getYoy(month, site) {
        const ym = this.yoyMonth(month);
        // 진행 중인 월이면 동일 기간 데이터 사용
        if (month === this.curMonth && this.partialYoy[ym]) {
            const d = this.partialYoy[ym][site];
            if (!d) return { orders: 0, revenue: 0, qty: 0 };
            return d;
        }
        return this.get(ym, site);
    },

    pctChange(cur, prev) {
        if (!prev || prev === 0) return null;
        return ((cur / prev - 1) * 100).toFixed(1);
    },

    prevMonth(m) {
        const [y, mo] = m.split('-').map(Number);
        const pm = mo === 1 ? 12 : mo - 1;
        const py = mo === 1 ? y - 1 : y;
        return `${py}-${String(pm).padStart(2, '0')}`;
    },

    yoyMonth(m) {
        const [y, mo] = m.split('-').map(Number);
        return `${y - 1}-${String(mo).padStart(2, '0')}`;
    },

    badge(val) {
        if (val == null) return '<span class="text-xs text-gray-400">-</span>';
        const n = parseFloat(val);
        const color = n > 0 ? 'text-green-600' : n < 0 ? 'text-red-500' : 'text-gray-500';
        const arrow = n > 0 ? '▲' : n < 0 ? '▼' : '';
        return `<span class="text-xs font-medium ${color}">${arrow}${Math.abs(n)}%</span>`;
    },

    _calcDerived(d) {
        return {
            avgPrice: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
            avgQty: d.orders > 0 ? parseFloat((d.qty / d.orders).toFixed(1)) : 0,
        };
    },

    renderKpi(months) {
        const container = document.getElementById('siteTrendKpi');
        if (!container) return;

        const recentMonths = months.slice(-3);
        let html = '';

        this.SITES.forEach(site => {
            html += `<div class="bg-white rounded-lg shadow p-4">
                <h3 class="text-sm font-bold mb-3" style="color:${this.COLORS[site]}">${site}</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-1.5 text-left">월</th>
                                <th class="px-2 py-1.5 text-right">매출</th>
                                <th class="px-2 py-1.5 text-right">MOM</th>
                                <th class="px-2 py-1.5 text-right">YOY</th>
                                <th class="px-2 py-1.5 text-right">주문</th>
                                <th class="px-2 py-1.5 text-right">MOM</th>
                                <th class="px-2 py-1.5 text-right">YOY</th>
                                <th class="px-2 py-1.5 text-right">객단가</th>
                                <th class="px-2 py-1.5 text-right">MOM</th>
                                <th class="px-2 py-1.5 text-right">YOY</th>
                                <th class="px-2 py-1.5 text-right">객수량</th>
                                <th class="px-2 py-1.5 text-right">MOM</th>
                                <th class="px-2 py-1.5 text-right">YOY</th>
                            </tr>
                        </thead>
                        <tbody>`;

            recentMonths.forEach(m => {
                const cur = this.get(m, site);
                const prev = this.get(this.prevMonth(m), site);
                const yoy = this.getYoy(m, site);

                const c = this._calcDerived(cur);
                const p = this._calcDerived(prev);
                const y = this._calcDerived(yoy);

                const isPartial = m === this.curMonth;
                const monthLabel = isPartial ? `${m} *` : m;

                html += `<tr class="border-t border-gray-100 hover:bg-blue-50">
                    <td class="px-2 py-1.5 font-medium">${monthLabel}</td>
                    <td class="px-2 py-1.5 text-right">${Utils.fmt(cur.revenue)}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(cur.revenue, prev.revenue))}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(cur.revenue, yoy.revenue))}</td>
                    <td class="px-2 py-1.5 text-right">${Utils.fmt(cur.orders)}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(cur.orders, prev.orders))}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(cur.orders, yoy.orders))}</td>
                    <td class="px-2 py-1.5 text-right">${Utils.fmt(c.avgPrice)}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(c.avgPrice, p.avgPrice))}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(c.avgPrice, y.avgPrice))}</td>
                    <td class="px-2 py-1.5 text-right">${c.avgQty}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(c.avgQty, p.avgQty))}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(c.avgQty, y.avgQty))}</td>
                </tr>`;
            });

            html += `</tbody></table></div>`;
            // 진행 중 월 안내
            if (recentMonths.includes(this.curMonth)) {
                html += `<p class="text-xs text-gray-400 mt-1">* 진행 중인 월 — YOY는 작년 동일 기간(1일~오늘) 기준 비교</p>`;
            }
            html += `</div>`;
        });

        container.innerHTML = html;
    },

    renderWow() {
        const container = document.getElementById('wowSection');
        if (!container || !this.wow) return;

        const tw = this.wow.this_week || {};
        const lw = this.wow.last_week || {};
        const twRange = this.wow.this_week_range || '';
        const lwRange = this.wow.last_week_range || '';

        // Build total for both weeks
        const sites = this.CHART_SITES;
        const twTotal = { orders: 0, revenue: 0, qty: 0 };
        const lwTotal = { orders: 0, revenue: 0, qty: 0 };
        sites.forEach(s => {
            if (tw[s]) { twTotal.orders += tw[s].orders; twTotal.revenue += tw[s].revenue; twTotal.qty += tw[s].qty; }
            if (lw[s]) { lwTotal.orders += lw[s].orders; lwTotal.revenue += lw[s].revenue; lwTotal.qty += lw[s].qty; }
        });

        const allSites = ['전체', ...sites];
        const getData = (site) => {
            if (site === '전체') return { tw: twTotal, lw: lwTotal };
            return { tw: tw[site] || {orders:0,revenue:0,qty:0}, lw: lw[site] || {orders:0,revenue:0,qty:0} };
        };

        let html = `<div class="bg-white rounded-lg shadow p-4">
            <h3 class="text-sm font-semibold mb-1">WOW (주간 비교)</h3>
            <p class="text-xs text-gray-400 mb-3">이번주: ${twRange} vs 지난주: ${lwRange} (동일 요일수)</p>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-2 py-1.5 text-left">사이트</th>
                            <th class="px-2 py-1.5 text-right">이번주 매출</th>
                            <th class="px-2 py-1.5 text-right">지난주 매출</th>
                            <th class="px-2 py-1.5 text-right">WOW</th>
                            <th class="px-2 py-1.5 text-right">이번주 주문</th>
                            <th class="px-2 py-1.5 text-right">지난주 주문</th>
                            <th class="px-2 py-1.5 text-right">WOW</th>
                        </tr>
                    </thead>
                    <tbody>`;

        allSites.forEach(site => {
            const d = getData(site);
            const revWow = this.pctChange(d.tw.revenue, d.lw.revenue);
            const ordWow = this.pctChange(d.tw.orders, d.lw.orders);
            const bold = site === '전체' ? 'font-bold bg-gray-50' : '';
            html += `<tr class="border-t border-gray-100 ${bold}">
                <td class="px-2 py-1.5" style="color:${this.COLORS[site]}">${site}</td>
                <td class="px-2 py-1.5 text-right">${Utils.fmt(d.tw.revenue)}</td>
                <td class="px-2 py-1.5 text-right">${Utils.fmt(d.lw.revenue)}</td>
                <td class="px-2 py-1.5 text-right">${this.badge(revWow)}</td>
                <td class="px-2 py-1.5 text-right">${Utils.fmt(d.tw.orders)}</td>
                <td class="px-2 py-1.5 text-right">${Utils.fmt(d.lw.orders)}</td>
                <td class="px-2 py-1.5 text-right">${this.badge(ordWow)}</td>
            </tr>`;
        });

        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
    },

    renderCharts(months) {
        const chartMonths = months.filter(m => m >= '2025-01');
        const labels = chartMonths;

        const makeDatasets = (metric) => {
            return this.CHART_SITES.map(site => ({
                label: site,
                data: chartMonths.map(m => {
                    const d = this.get(m, site);
                    if (metric === 'avgPrice') return d.orders > 0 ? Math.round(d.revenue / d.orders) : 0;
                    if (metric === 'avgQty') return d.orders > 0 ? parseFloat((d.qty / d.orders).toFixed(2)) : 0;
                    return d[metric];
                }),
                borderColor: this.COLORS[site],
                backgroundColor: this.COLORS[site] + '33',
                tension: 0.3,
                fill: false,
            }));
        };

        const chartDefs = [
            { id: 'stRevenueChart', metric: 'revenue', fmt: v => Utils.fmt(v) },
            { id: 'stOrderChart', metric: 'orders', fmt: v => Utils.fmt(v) },
            { id: 'stAvgPriceChart', metric: 'avgPrice', fmt: v => Utils.fmt(v) },
            { id: 'stAvgQtyChart', metric: 'avgQty', fmt: v => v },
        ];

        chartDefs.forEach(def => {
            const ctx = document.getElementById(def.id);
            if (!ctx) return;
            if (this._charts[def.id]) this._charts[def.id].destroy();

            this._charts[def.id] = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets: makeDatasets(def.metric) },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        y: { ticks: { callback: def.fmt } },
                    },
                },
            });
        });
    },
};
