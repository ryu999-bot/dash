/**
 * Chart rendering (Chart.js).
 */
const Charts = {
    instances: {},

    destroy(id) {
        if (this.instances[id]) {
            this.instances[id].destroy();
            delete this.instances[id];
        }
    },

    /** Pie chart for site revenue share */
    renderSitePie(data) {
        this.destroy('sitePie');
        const sites = data.paper.sites || [];
        const ctx = document.getElementById('sitePieChart').getContext('2d');
        this.instances['sitePie'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: sites.map(s => s.site_name),
                datasets: [{
                    data: sites.map(s => s.revenue || 0),
                    backgroundColor: Utils.colors.slice(0, sites.length),
                }],
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${Utils.won(ctx.raw)}`,
                        },
                    },
                },
            },
        });
    },

    /** Bar chart for site order comparison */
    renderSiteBar(data) {
        this.destroy('siteBar');
        const sites = data.paper.sites || [];
        const ctx = document.getElementById('siteBarChart').getContext('2d');
        this.instances['siteBar'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sites.map(s => s.site_name),
                datasets: [{
                    label: '주문수',
                    data: sites.map(s => s.order_count),
                    backgroundColor: Utils.colors.slice(0, sites.length),
                }],
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => Utils.fmt(v) } },
                },
            },
        });
    },

    /** Helper: build line chart datasets from grouped data */
    _buildDatasets(rows, seriesKey, labelKey) {
        const grouped = {};
        for (const r of rows) {
            if (!grouped[r[seriesKey]]) grouped[r[seriesKey]] = {};
            grouped[r[seriesKey]][r[labelKey]] = r;
        }
        const labels = [...new Set(rows.map(r => r[labelKey]))].sort();
        const seriesNames = Object.keys(grouped);
        return { labels, seriesNames, grouped };
    },

    /** Monthly trend line charts (2025-01~) */
    renderTrend(data) {
        this.destroy('trendOrder');
        this.destroy('trendRevenue');

        const seriesKey = data.view === 'type' ? 'product_type' : 'site_name';
        const rows = data.monthly.rows || [];
        const { labels, seriesNames, grouped } = this._buildDatasets(rows, seriesKey, 'ym');

        const orderDS = seriesNames.map((name, i) => ({
            label: name,
            data: labels.map(k => grouped[name]?.[k]?.order_count || 0),
            borderColor: Utils.colors[i],
            backgroundColor: Utils.colors[i] + '33',
            tension: 0.3, fill: false,
        }));
        const revDS = seriesNames.map((name, i) => ({
            label: name,
            data: labels.map(k => grouped[name]?.[k]?.revenue || 0),
            borderColor: Utils.colors[i],
            backgroundColor: Utils.colors[i] + '33',
            tension: 0.3, fill: false,
        }));

        this.instances['trendOrder'] = new Chart(
            document.getElementById('trendOrderChart').getContext('2d'),
            { type: 'line', data: { labels, datasets: orderDS }, options: this._lineOpts(v => Utils.fmt(v)) }
        );
        this.instances['trendRevenue'] = new Chart(
            document.getElementById('trendRevenueChart').getContext('2d'),
            { type: 'line', data: { labels, datasets: revDS }, options: this._lineOpts(v => Utils.won(v)) }
        );
    },

    /** Weekly trend line charts (last 12 weeks) */
    renderWeekly(data) {
        this.destroy('weeklyOrder');
        this.destroy('weeklyRevenue');

        const seriesKey = data.view === 'type' ? 'product_type' : 'site_name';
        const rows = data.weekly.rows || [];
        const { labels, seriesNames, grouped } = this._buildDatasets(rows, seriesKey, 'week_start');

        // Format labels: "03.02~03.08" style
        const fmtLabels = labels.map(ws => {
            const s = new Date(ws + 'T00:00:00');
            const e = new Date(s); e.setDate(e.getDate() + 6);
            const fm = (d) => `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
            return `${fm(s)}~${fm(e)}`;
        });

        const orderDS = seriesNames.map((name, i) => ({
            label: name,
            data: labels.map(k => grouped[name]?.[k]?.order_count || 0),
            borderColor: Utils.colors[i],
            backgroundColor: Utils.colors[i] + '33',
            tension: 0.3, fill: false,
        }));
        const revDS = seriesNames.map((name, i) => ({
            label: name,
            data: labels.map(k => grouped[name]?.[k]?.revenue || 0),
            borderColor: Utils.colors[i],
            backgroundColor: Utils.colors[i] + '33',
            tension: 0.3, fill: false,
        }));

        this.instances['weeklyOrder'] = new Chart(
            document.getElementById('weeklyOrderChart').getContext('2d'),
            { type: 'line', data: { labels: fmtLabels, datasets: orderDS }, options: this._lineOpts(v => Utils.fmt(v)) }
        );
        this.instances['weeklyRevenue'] = new Chart(
            document.getElementById('weeklyRevenueChart').getContext('2d'),
            { type: 'line', data: { labels: fmtLabels, datasets: revDS }, options: this._lineOpts(v => Utils.won(v)) }
        );
    },

    /** Common line chart options */
    _lineOpts(tickFn) {
        return {
            scales: { y: { beginAtZero: true, ticks: { callback: tickFn } } },
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' } },
        };
    },

    /** M-card trend chart */
    renderMcardTrend(data) {
        this.destroy('mcardTrend');
        const mcard = data.mcard || [];
        const labels = mcard.map(r => r.ym);

        const ctx = document.getElementById('mcardTrendChart').getContext('2d');
        this.instances['mcardTrend'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '전체 사용자',
                        data: mcard.map(r => r.total_users),
                        backgroundColor: '#4472C4',
                        yAxisID: 'y',
                    },
                    {
                        label: '유료 사용자',
                        data: mcard.map(r => r.paid_users),
                        backgroundColor: '#ED7D31',
                        yAxisID: 'y',
                    },
                    {
                        label: '매출',
                        data: mcard.map(r => r.revenue || 0),
                        type: 'line',
                        borderColor: '#70AD47',
                        backgroundColor: '#70AD4733',
                        yAxisID: 'y1',
                        tension: 0.3,
                    },
                ],
            },
            options: {
                scales: {
                    y: { beginAtZero: true, position: 'left', ticks: { callback: v => Utils.fmt(v) } },
                    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => Utils.won(v) } },
                },
                interaction: { mode: 'index', intersect: false },
            },
        });
    },
};
