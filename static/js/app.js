/**
 * Main application controller.
 *
 * 날짜 규칙: 화면의 시작일/종료일은 모두 "포함"(inclusive).
 * 내부 API 호출 시 end에 +1일하여 exclusive 처리.
 */
(function () {
    // State
    let currentTab = 'dashboard';
    let dateBasis = 'order_date';

    const basisLabels = {
        order_date: '주문일',
        settle_date: '결제일',
        delivery_date: '배송일',
    };

    // Initialize dates (이번달 1일 ~ 오늘)
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    startInput.value = Utils.monthStart();
    endInput.value = Utils.today();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
            document.getElementById('tab-' + currentTab).classList.remove('hidden');
            loadTab(currentTab);
        });
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyPreset(btn.dataset.preset);
            loadAll();
        });
    });

    function applyPreset(preset) {
        const today = Utils.today();
        switch (preset) {
            case 'today':
                startInput.value = today;
                endInput.value = today;
                break;
            case 'yesterday':
                startInput.value = Utils.addDays(today, -1);
                endInput.value = Utils.addDays(today, -1);
                break;
            case 'thisWeek':
                startInput.value = Utils.weekStart();
                endInput.value = today;
                break;
            case 'lastWeek': {
                const ws = Utils.weekStart();
                startInput.value = Utils.addDays(ws, -7);
                endInput.value = Utils.addDays(ws, -1);
                break;
            }
            case 'thisMonth':
                startInput.value = Utils.monthStart();
                endInput.value = today;
                break;
            case 'lastMonth': {
                const d = new Date();
                const lmFirst = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                const lmLast = new Date(d.getFullYear(), d.getMonth(), 0);
                startInput.value = Utils._fmtDate(lmFirst);
                endInput.value = Utils._fmtDate(lmLast);
                break;
            }
        }
    }

    // Search button
    document.getElementById('searchBtn').addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        loadAll();
    });

    // Date basis toggle (주문일 / 결제일 / 배송일)
    document.querySelectorAll('.date-basis-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-basis-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            dateBasis = btn.dataset.basis;
            loadAll();
        });
    });

    // Site sub-tab buttons (사이트별 상세)
    document.querySelectorAll('.site-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.site-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            DetailTable.setSite(btn.dataset.site);
        });
    });

    // Export buttons
    document.getElementById('exportXlsx').addEventListener('click', () => Export.downloadServer());
    document.getElementById('exportClient').addEventListener('click', () => Export.downloadClient());

    // Affiliate buttons
    document.getElementById('affExport').addEventListener('click', () => {
        window.location.href = Affiliate.exportUrl();
    });
    document.getElementById('affSearchBtn').addEventListener('click', () => {
        Affiliate.load();
    });

    // Member search button
    document.getElementById('memSearchBtn').addEventListener('click', () => {
        Member.load();
    });

    // SKU export button
    document.getElementById('skuExportServer').addEventListener('click', () => {
        window.location.href = '/api/sku/export';
    });

    /**
     * Build query string.
     * 화면: start~end (inclusive)
     * API:  start~end+1 (exclusive end) + basis
     */
    function qs() {
        const s = startInput.value;
        const e = Utils.addDays(endInput.value, 1);
        return `start=${s}&end=${e}&basis=${dateBasis}`;
    }

    async function loadAll() {
        loadTab(currentTab);
    }

    async function loadTab(tab) {
        try {
            switch (tab) {
                case 'dashboard':
                    const kpiData = await Utils.fetchJson(`/api/kpi?${qs()}`);
                    KPI.render(kpiData);
                    KPI.renderSiteTable(kpiData);
                    Charts.renderSitePie(kpiData);
                    Charts.renderSiteBar(kpiData);
                    break;
                case 'detail':
                    const detailData = await Utils.fetchJson(`/api/detail?${qs()}`);
                    DetailTable.render(detailData);
                    break;
                case 'trend':
                    await SiteTrend.load();
                    await Member.load();
                    break;
                case 'funnel':
                    const funnelData = await Utils.fetchJson(`/api/funnel?${qs()}`);
                    Funnel.render(funnelData);
                    break;
                case 'affiliate':
                    await Affiliate.load();
                    break;
                case 'sku':
                    await SKU.load();
                    break;
                case 'gift':
                    await Gift.load();
                    break;
                case 'glossary':
                    Glossary.init();
                    break;
            }
            const label = basisLabels[dateBasis] || dateBasis;
            document.getElementById('lastUpdate').textContent =
                `기준: ${label} | 마지막 조회: ${new Date().toLocaleTimeString('ko-KR')}`;
        } catch (err) {
            console.error('Load error:', err);
        }
    }

    // Initial load
    loadTab('dashboard');
})();
