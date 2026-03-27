/**
 * Funnel analysis rendering - combined, per-site, M-card.
 */
const Funnel = {
    _stageColors: ['#4472C4', '#ED7D31', '#70AD47'],

    render(data) {
        // Combined paper funnel
        this._renderChart('funnelCombined', data.combined);
        this._renderDetail('funnelCombinedDetail', data.combined);

        // Per-site funnels
        this._renderSites(data.sites || []);

        // M-card funnel
        this._renderChart('funnelMcard', data.mcard);
        this._renderMcardDetail('funnelMcardDetail', data.mcard);
    },

    _renderChart(idPrefix, funnelData) {
        const chartId = idPrefix + 'Chart';
        Charts.destroy(chartId);
        const stages = funnelData.stages || [];
        const ctx = document.getElementById(chartId).getContext('2d');

        Charts.instances[chartId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stages.map(s => s.name),
                datasets: [{
                    label: '건수',
                    data: stages.map(s => s.count),
                    backgroundColor: this._stageColors.slice(0, stages.length),
                    borderRadius: 4,
                }],
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: ctx => `${Utils.fmt(ctx.raw)}건` },
                    },
                },
                scales: {
                    x: { beginAtZero: true, ticks: { callback: v => Utils.fmt(v) } },
                },
            },
        });
    },

    _renderDetail(containerId, funnelData) {
        const container = document.getElementById(containerId);
        const stages = funnelData.stages || [];
        const conv = funnelData.conversions || {};
        const maxCount = Math.max(...stages.map(s => s.count), 1);

        let html = stages.map((s, i) => {
            const width = Math.max((s.count / maxCount) * 100, 10);
            const revHtml = s.revenue != null ? ` | ${Utils.won(s.revenue)}` : '';
            return `
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-medium">${s.name}</span>
                        <span>${Utils.fmt(s.count)}건${revHtml}</span>
                    </div>
                    <div class="funnel-bar" style="width:${width}%; background:${this._stageColors[i]}">
                        ${s.rate}%
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="border-t pt-4 mt-4 text-sm space-y-2">
                ${conv.signup_to_sample != null ? `<div class="flex justify-between"><span>회원가입 → 샘플신청</span><span class="font-bold">${conv.signup_to_sample}%</span></div>` : ''}
                ${conv.sample_to_order != null ? `<div class="flex justify-between"><span>샘플신청 → 결제완료</span><span class="font-bold">${conv.sample_to_order}%</span></div>` : ''}
                ${conv.signup_to_order != null ? `<div class="flex justify-between"><span>회원가입 → 결제완료</span><span class="font-bold">${conv.signup_to_order}%</span></div>` : ''}
            </div>
        `;

        container.innerHTML = html;
    },

    _renderMcardDetail(containerId, funnelData) {
        const container = document.getElementById(containerId);
        const stages = funnelData.stages || [];
        const conv = funnelData.conversions || {};
        const maxCount = Math.max(...stages.map(s => s.count), 1);

        let html = stages.map((s, i) => {
            const width = Math.max((s.count / maxCount) * 100, 10);
            const revHtml = s.revenue != null ? ` | ${Utils.won(s.revenue)}` : '';
            return `
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-medium">${s.name}</span>
                        <span>${Utils.fmt(s.count)}건${revHtml}</span>
                    </div>
                    <div class="funnel-bar" style="width:${width}%; background:${this._stageColors[i]}">
                        ${s.rate}%
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="border-t pt-4 mt-4 text-sm space-y-2">
                ${conv.creation_to_paid != null ? `<div class="flex justify-between"><span>초대장 생성 → 유료 결제</span><span class="font-bold">${conv.creation_to_paid}%</span></div>` : ''}
            </div>
        `;

        container.innerHTML = html;
    },

    _renderSites(sites) {
        const grid = document.getElementById('funnelSitesGrid');

        // Destroy previous site charts
        sites.forEach((_, i) => Charts.destroy('funnelSite' + i + 'Chart'));

        grid.innerHTML = sites.map((site, i) => `
            <div class="bg-white rounded-lg shadow p-4">
                <h3 class="text-sm font-semibold mb-3">${site.site_name}</h3>
                <canvas id="funnelSite${i}Chart" height="120"></canvas>
                <div id="funnelSite${i}Detail" class="space-y-3 mt-3"></div>
            </div>
        `).join('');

        // Render each site chart + detail
        sites.forEach((site, i) => {
            this._renderChart('funnelSite' + i, site);
            this._renderSiteDetail('funnelSite' + i + 'Detail', site);
        });
    },

    _renderSiteDetail(containerId, siteData) {
        const container = document.getElementById(containerId);
        const stages = siteData.stages || [];
        const conv = siteData.conversions || {};
        const maxCount = Math.max(...stages.map(s => s.count), 1);

        let html = stages.map((s, i) => {
            const width = Math.max((s.count / maxCount) * 100, 10);
            const revHtml = s.revenue != null ? ` | ${Utils.won(s.revenue)}` : '';
            return `
                <div>
                    <div class="flex justify-between text-xs mb-1">
                        <span>${s.name}</span>
                        <span>${Utils.fmt(s.count)}건${revHtml}</span>
                    </div>
                    <div class="funnel-bar" style="width:${width}%; background:${this._stageColors[i]}; height:1.5rem; font-size:0.75rem;">
                        ${s.rate}%
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="border-t pt-2 mt-2 text-xs space-y-1">
                <div class="flex justify-between"><span>가입→샘플</span><span class="font-bold">${conv.signup_to_sample}%</span></div>
                <div class="flex justify-between"><span>샘플→결제</span><span class="font-bold">${conv.sample_to_order}%</span></div>
                <div class="flex justify-between"><span>가입→결제</span><span class="font-bold">${conv.signup_to_order}%</span></div>
            </div>
        `;

        container.innerHTML = html;
    },
};
