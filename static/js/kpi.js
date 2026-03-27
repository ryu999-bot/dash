/**
 * KPI cards rendering.
 */
const KPI = {
    render(data) {
        const container = document.getElementById('kpiCards');
        const cards = [
            { label: '종이 주문수', value: Utils.fmt(data.paper.total_orders), change: data.paper.change.orders },
            { label: '종이 매출', value: Utils.won(data.paper.total_revenue), change: data.paper.change.revenue },
            { label: '객단가', value: Utils.won(data.paper.aov), change: data.paper.change.aov },
            { label: '샘플 주문', value: Utils.fmt(data.paper.samples), change: data.paper.change.samples },
            { label: 'M카드 사용자', value: Utils.fmt(data.mcard.total_users), change: data.mcard.change.total_users },
            { label: 'M카드 매출', value: Utils.won(data.mcard.revenue), change: data.mcard.change.revenue },
        ];

        container.innerHTML = cards.map(c => `
            <div class="kpi-card">
                <div class="kpi-label">${c.label}</div>
                <div class="kpi-value">${c.value}</div>
                ${Utils.changeHtml(c.change)}
            </div>
        `).join('');
    },

    renderSiteTable(data) {
        const tbody = document.querySelector('#siteSummaryTable tbody');
        const sites = data.paper.sites || [];
        const total = data.paper.total_revenue || 1;

        let rows = sites.map(s => {
            const aov = s.order_count ? Math.round(s.revenue / s.order_count) : 0;
            const pct = ((s.revenue / total) * 100).toFixed(1);
            return `<tr>
                <td class="px-3 py-2">${s.site_name}</td>
                <td class="px-3 py-2 text-right">${Utils.fmt(s.order_count)}</td>
                <td class="px-3 py-2 text-right">${Utils.won(s.revenue)}</td>
                <td class="px-3 py-2 text-right">${Utils.won(aov)}</td>
                <td class="px-3 py-2 text-right">${pct}%</td>
            </tr>`;
        });

        // M-card row
        rows.push(`<tr class="bg-blue-50">
            <td class="px-3 py-2">M카드</td>
            <td class="px-3 py-2 text-right">${Utils.fmt(data.mcard.total_users)} (유저)</td>
            <td class="px-3 py-2 text-right">${Utils.won(data.mcard.revenue)}</td>
            <td class="px-3 py-2 text-right">-</td>
            <td class="px-3 py-2 text-right">-</td>
        </tr>`);

        // Total row
        const grandRevenue = data.paper.total_revenue + (data.mcard.revenue || 0);
        rows.push(`<tr class="font-bold bg-gray-100">
            <td class="px-3 py-2">합계</td>
            <td class="px-3 py-2 text-right">${Utils.fmt(data.paper.total_orders)}</td>
            <td class="px-3 py-2 text-right">${Utils.won(grandRevenue)}</td>
            <td class="px-3 py-2 text-right">${Utils.won(data.paper.aov)}</td>
            <td class="px-3 py-2 text-right">100%</td>
        </tr>`);

        tbody.innerHTML = rows.join('');
    },
};
