/**
 * Member signup analysis - SiteTrend 동일 KPI 카드 형식.
 */
const Member = {
    data: [],
    initialized: false,
    _chart: null,

    SITES: ['바른손카드', '바른손몰', 'M카드', '프리미어페이퍼'],
    COLORS: {
        '바른손카드': '#3B82F6',
        '바른손몰': '#10B981',
        'M카드': '#F59E0B',
        '프리미어페이퍼': '#8B5CF6',
    },

    initFilters() {
        if (this.initialized) return;
        this.initialized = true;
        const startSel = document.getElementById('memStartMonth');
        const endSel = document.getElementById('memEndMonth');
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
        endSel.value = months[months.length - 1];
    },

    getDateRange() {
        const start = document.getElementById('memStartMonth').value;
        const endVal = document.getElementById('memEndMonth').value;
        const [ey, em] = endVal.split('-').map(Number);
        const endDate = em === 12
            ? `${ey + 1}-01-01`
            : `${ey}-${String(em + 1).padStart(2, '0')}-01`;
        return { start: start + '-01', end: endDate, label: `${start} ~ ${endVal}` };
    },

    async load() {
        this.initFilters();
        const { start, end, label } = this.getDateRange();
        const data = await Utils.fetchJson(`/api/member/monthly?start=${start}&end=${end}`);
        this.data = data;
        this.render(label);
    },

    /** Build a lookup: month -> { site: count, total } */
    _buildMap() {
        const map = {};
        this.data.forEach(row => {
            map[row.month] = row;
        });
        return map;
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

    pctChange(cur, prev) {
        if (!prev || prev === 0) return null;
        return ((cur / prev - 1) * 100).toFixed(1);
    },

    badge(val) {
        if (val == null) return '<span class="text-xs text-gray-400">-</span>';
        const n = parseFloat(val);
        const color = n > 0 ? 'text-green-600' : n < 0 ? 'text-red-500' : 'text-gray-500';
        const arrow = n > 0 ? '▲' : n < 0 ? '▼' : '';
        return `<span class="text-xs font-medium ${color}">${arrow}${Math.abs(n)}%</span>`;
    },

    render(label) {
        const container = document.getElementById('memberKpi');
        if (!container) return;

        const map = this._buildMap();
        const months = this.data.map(r => r.month);
        let grandTotal = 0;
        this.data.forEach(r => grandTotal += (r.total || 0));

        const periodInfo = label ? ` | ${label}` : '';
        document.getElementById('memSummary').innerHTML =
            `${Utils.fmt(this.data.length)}개월 | 총 ${Utils.fmt(grandTotal)}명${periodInfo}`;

        let html = '';

        this.SITES.forEach(site => {
            html += `<div class="bg-white rounded-lg shadow p-4">
                <h3 class="text-sm font-bold mb-3" style="color:${this.COLORS[site]}">${site}</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-1.5 text-left">월</th>
                                <th class="px-2 py-1.5 text-right">가입수</th>
                                <th class="px-2 py-1.5 text-right">MOM</th>
                                <th class="px-2 py-1.5 text-right">YOY</th>
                            </tr>
                        </thead>
                        <tbody>`;

            let siteTotal = 0;
            months.forEach(m => {
                const row = map[m] || {};
                const cur = row[site] || 0;
                siteTotal += cur;

                const pm = this.prevMonth(m);
                const ym = this.yoyMonth(m);
                const prevRow = map[pm] || {};
                const yoyRow = map[ym] || {};
                const prev = prevRow[site] || 0;
                const yoy = yoyRow[site] || 0;

                html += `<tr class="border-t border-gray-100 hover:bg-blue-50">
                    <td class="px-2 py-1.5 font-medium">${m}</td>
                    <td class="px-2 py-1.5 text-right">${Utils.fmt(cur)}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(cur, prev))}</td>
                    <td class="px-2 py-1.5 text-right">${this.badge(this.pctChange(cur, yoy))}</td>
                </tr>`;
            });

            // 합계 row
            html += `<tr class="bg-gray-100 font-bold border-t-2 border-gray-300">
                <td class="px-2 py-1.5">합계</td>
                <td class="px-2 py-1.5 text-right">${Utils.fmt(siteTotal)}</td>
                <td class="px-2 py-1.5"></td>
                <td class="px-2 py-1.5"></td>
            </tr>`;

            html += `</tbody></table></div></div>`;
        });

        container.innerHTML = html;
        this.renderChart();
    },

    renderChart() {
        const ctx = document.getElementById('memberChart');
        if (!ctx) return;
        if (this._chart) this._chart.destroy();

        const datasets = this.SITES.map(s => ({
            label: s,
            data: this.data.map(r => r[s] || 0),
            backgroundColor: this.COLORS[s] || '#999',
        }));

        this._chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.map(r => r.month),
                datasets: datasets,
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, ticks: { callback: v => Utils.fmt(v) } },
                },
            },
        });
    },
};
