/**
 * Affiliate (제휴업체) analysis tab - month-based view.
 * 월 기준으로 그룹핑, 각 월 내 업체별 매출/주문/객수량 표시.
 * 해당 월에 0건인 업체도 모두 노출.
 */
const Affiliate = {
    data: [],
    initialized: false,

    getDateRange() {
        const startSel = document.getElementById('affStartMonth');
        const endSel = document.getElementById('affEndMonth');
        const start = startSel.value;
        const endVal = endSel.value;
        const [ey, em] = endVal.split('-').map(Number);
        const endDate = em === 12
            ? `${ey + 1}-01-01`
            : `${ey}-${String(em + 1).padStart(2, '0')}-01`;
        return { start: start + '-01', end: endDate, startMonth: start, endMonth: endVal, label: `${start} ~ ${endVal}` };
    },

    initFilters() {
        if (this.initialized) return;
        this.initialized = true;
        const startSel = document.getElementById('affStartMonth');
        const endSel = document.getElementById('affEndMonth');
        const months = [];
        const now = new Date();
        let y = 2023, m = 1;
        while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
            months.push(`${y}-${String(m).padStart(2, '0')}`);
            m++;
            if (m > 12) { m = 1; y++; }
        }
        months.forEach(mo => {
            startSel.add(new Option(mo, mo));
            endSel.add(new Option(mo, mo));
        });
        startSel.value = '2025-01';
        endSel.value = '2026-02';
    },

    async load() {
        this.initFilters();
        const { start, end, label } = this.getDateRange();
        const data = await Utils.fetchJson(`/api/affiliate/monthly?start=${start}&end=${end}`);
        this.data = data;
        this.render(label);
    },

    render(label) {
        const tbody = document.querySelector('#affiliateTable tbody');
        if (!tbody) return;

        // Collect all companies and all months
        const allMonths = new Set();
        const companies = this.data.map(comp => {
            Object.keys(comp.months || {}).forEach(m => allMonths.add(m));
            return comp;
        });
        const monthsSorted = [...allMonths].sort();

        // If no months from data, generate from filter range
        if (monthsSorted.length === 0) {
            const { startMonth, endMonth } = this.getDateRange();
            let [sy, sm] = startMonth.split('-').map(Number);
            const [ey, em] = endMonth.split('-').map(Number);
            while (sy < ey || (sy === ey && sm <= em)) {
                monthsSorted.push(`${sy}-${String(sm).padStart(2, '0')}`);
                sm++;
                if (sm > 12) { sm = 1; sy++; }
            }
        }

        let grandOrders = 0, grandRevenue = 0, grandQty = 0;
        let html = '';

        monthsSorted.forEach(month => {
            // Build rows for this month: all companies with their data (0 if missing)
            const rows = companies.map(comp => {
                const d = (comp.months || {})[month] || { orders: 0, revenue: 0, total_qty: 0 };
                return {
                    name: comp.company_name,
                    kind: comp.jaehu_kind,
                    orders: d.orders || 0,
                    revenue: d.revenue || 0,
                    qty: d.total_qty || 0,
                };
            });

            // Sort by revenue desc within month
            rows.sort((a, b) => b.revenue - a.revenue);

            const monthRevenue = rows.reduce((s, r) => s + r.revenue, 0);
            const monthOrders = rows.reduce((s, r) => s + r.orders, 0);
            const monthQty = rows.reduce((s, r) => s + r.qty, 0);
            grandOrders += monthOrders;
            grandRevenue += monthRevenue;
            grandQty += monthQty;

            // Month header row
            html += `<tr class="bg-blue-100">
                <td colspan="8" class="px-3 py-2 font-bold text-blue-800">
                    ${month} | 주문 ${Utils.fmt(monthOrders)}건 | 매출 ${Utils.fmt(monthRevenue)}원
                </td>
            </tr>`;

            // Company rows
            rows.forEach((r, idx) => {
                const share = monthRevenue ? ((r.revenue / monthRevenue) * 100).toFixed(1) : '0';
                const avgPrice = r.orders ? Math.round(r.revenue / r.orders) : 0;
                const avgQty = r.orders ? (r.qty / r.orders).toFixed(1) : '0';
                html += `<tr class="hover:bg-blue-50 border-t border-gray-100">
                    <td class="px-3 py-1 text-center">${idx + 1}</td>
                    <td class="px-3 py-1">${r.name}</td>
                    <td class="px-3 py-1 text-center">${r.kind}</td>
                    <td class="px-3 py-1 text-right">${Utils.fmt(r.orders)}</td>
                    <td class="px-3 py-1 text-right">${Utils.fmt(r.revenue)}</td>
                    <td class="px-3 py-1 text-right">${share}%</td>
                    <td class="px-3 py-1 text-right">${Utils.fmt(avgPrice)}</td>
                    <td class="px-3 py-1 text-right">${avgQty}</td>
                </tr>`;
            });
        });

        tbody.innerHTML = html;

        const gAvgPrice = grandOrders ? Math.round(grandRevenue / grandOrders) : 0;
        const gAvgQty = grandOrders ? (grandQty / grandOrders).toFixed(1) : '0';
        const periodInfo = label ? ` | ${label} (결제일)` : '';
        document.getElementById('affSummary').innerHTML =
            `전체 ${Utils.fmt(this.data.length)}개 업체 | ${monthsSorted.length}개월 | 주문 ${Utils.fmt(grandOrders)}건 | 매출 ${Utils.fmt(grandRevenue)}원 | 객단가 ${Utils.fmt(gAvgPrice)}원 | 객수량 ${gAvgQty}장${periodInfo}`;
    },

    exportUrl() {
        const { start, end } = this.getDateRange();
        return `/api/affiliate/export?start=${start}&end=${end}`;
    }
};
