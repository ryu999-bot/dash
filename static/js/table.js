/**
 * Detail table rendering with site filtering.
 */
const DetailTable = {
    data: null,
    currentSite: '전체',

    render(data) {
        this.data = data;
        this.filterAndRender();
    },

    setSite(site) {
        this.currentSite = site;
        document.getElementById('detailTitle').textContent = '상세 데이터 - ' + site;
        if (this.data) this.filterAndRender();
    },

    getFilteredRows() {
        if (!this.data || !this.data.rows) return [];
        if (this.currentSite === '전체') return this.data.rows;
        return this.data.rows.filter(r => r.site_name === this.currentSite);
    },

    filterAndRender() {
        const filtered = this.getFilteredRows();
        const tbody = document.querySelector('#detailTable tbody');

        // Render table rows
        const rows = filtered.map(r => `
            <tr>
                <td class="px-3 py-2">${r.order_day}</td>
                <td class="px-3 py-2">${r.site_name}</td>
                <td class="px-3 py-2">${r.product_type}</td>
                <td class="px-3 py-2 text-right">${Utils.fmt(r.order_count)}</td>
                <td class="px-3 py-2 text-right">${Utils.won(r.revenue)}</td>
                <td class="px-3 py-2 text-right">${Utils.won(r.aov)}</td>
            </tr>
        `);
        tbody.innerHTML = rows.join('');

        // Render site KPI summary
        this.renderSiteKpi(filtered);
    },

    renderSiteKpi(filtered) {
        const container = document.getElementById('detailKpiCards');
        const totalOrders = filtered.reduce((s, r) => s + r.order_count, 0);
        const totalRevenue = filtered.reduce((s, r) => s + (r.revenue || 0), 0);
        const aov = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
        const days = new Set(filtered.map(r => r.order_day)).size;

        const cards = [
            { label: '주문수', value: Utils.fmt(totalOrders) },
            { label: '매출액', value: Utils.won(totalRevenue) },
            { label: '객단가', value: Utils.won(aov) },
            { label: '조회일수', value: days + '일' },
        ];

        container.innerHTML = cards.map(c => `
            <div class="kpi-card">
                <div class="kpi-label">${c.label}</div>
                <div class="kpi-value">${c.value}</div>
            </div>
        `).join('');
    },
};
