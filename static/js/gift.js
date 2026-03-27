/**
 * Gift (답례품) tab controller.
 */
const Gift = (() => {
    let currentSite = "전체";
    let monthlyChart = null;

    async function load() {
        const start = document.getElementById("startDate").value;
        const endRaw = document.getElementById("endDate").value;
        const end = Utils.addDays(endRaw, 1);

        const [summary, products, monthly] = await Promise.all([
            Utils.fetchJson(`api/gift/summary?start=${start}&end=${end}`),
            Utils.fetchJson(`api/gift/products?start=${start}&end=${end}&site=${encodeURIComponent(currentSite)}`),
            Utils.fetchJson("api/gift/monthly"),
        ]);

        renderSummary(summary);
        renderProducts(products);
        renderMonthlyChart(monthly);
    }

    function renderSummary(data) {
        const container = document.getElementById("giftKpiCards");
        const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
        const totalCnt = data.reduce((s, d) => s + d.order_cnt, 0);

        let html = `
            <div class="kpi-card">
                <div class="kpi-label">총 매출</div>
                <div class="kpi-value">${Utils.won(totalRevenue)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">총 주문수</div>
                <div class="kpi-value">${Utils.fmt(totalCnt)}건</div>
            </div>
        `;
        data.forEach(d => {
            html += `
                <div class="kpi-card">
                    <div class="kpi-label">${d.site}</div>
                    <div class="kpi-value">${Utils.won(d.revenue)}</div>
                    <div class="kpi-change neutral">${Utils.fmt(d.order_cnt)}건</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderProducts(data) {
        const tbody = document.querySelector("#giftProductTable tbody");
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-4 text-center text-gray-400">데이터가 없습니다</td></tr>';
            return;
        }
        tbody.innerHTML = data.map((d, i) => `
            <tr>
                <td class="px-3 py-2 text-center">${i + 1}</td>
                <td class="px-3 py-2">${d.card_code}</td>
                <td class="px-3 py-2">${d.card_name}</td>
                <td class="px-3 py-2 text-right">${Utils.fmt(d.card_price)}원</td>
                <td class="px-3 py-2 text-right">${Utils.fmt(d.order_cnt)}</td>
                <td class="px-3 py-2 text-right">${Utils.fmt(d.total_qty)}</td>
                <td class="px-3 py-2 text-right">${Utils.won(d.revenue)}</td>
            </tr>
        `).join("");
    }

    function renderMonthlyChart(data) {
        const ctx = document.getElementById("giftMonthlyChart");
        if (!ctx) return;

        // Group by month, aggregate all sites
        const monthMap = {};
        data.forEach(d => {
            if (!monthMap[d.month]) monthMap[d.month] = 0;
            monthMap[d.month] += d.revenue;
        });
        const months = Object.keys(monthMap).sort();
        const revenues = months.map(m => monthMap[m]);

        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: months,
                datasets: [{
                    label: "답례품 매출",
                    data: revenues,
                    backgroundColor: "rgba(234, 88, 12, 0.7)",
                    borderRadius: 4,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => Utils.won(ctx.raw),
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: v => (v / 10000).toLocaleString() + "만",
                        },
                    },
                },
            },
        });
    }

    function setSite(site) {
        currentSite = site;
        load();
    }

    return { load, setSite };
})();
