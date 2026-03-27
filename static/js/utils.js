/**
 * Utility functions for the dashboard.
 */
const Utils = {
    /** Format number with commas */
    fmt(n) {
        if (n == null) return '-';
        return Number(n).toLocaleString('ko-KR');
    },

    /** Format currency (원) */
    won(n) {
        if (n == null) return '-';
        return Number(n).toLocaleString('ko-KR') + '원';
    },

    /** Format percentage change with arrow */
    changeHtml(val) {
        if (val == null) return '<span class="kpi-change neutral">-</span>';
        const cls = val > 0 ? 'up' : val < 0 ? 'down' : 'neutral';
        const arrow = val > 0 ? '&#9650;' : val < 0 ? '&#9660;' : '';
        return `<span class="kpi-change ${cls}">${arrow} ${Math.abs(val)}%</span>`;
    },

    /** Format date as YYYY-MM-DD (KST local time) */
    _fmtDate(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },

    /** Get today in YYYY-MM-DD (KST local time, 00시 기준) */
    today() {
        return this._fmtDate(new Date());
    },

    /** Get first day of current month */
    monthStart() {
        const d = new Date();
        return this._fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
    },

    /** Add days to a date string */
    addDays(dateStr, n) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + n);
        return this._fmtDate(d);
    },

    /** Get Sunday of current week (일~토 기준) */
    weekStart() {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        return this._fmtDate(d);
    },

    /** Fetch JSON from API */
    async fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    },

    /** Chart.js color palette */
    colors: [
        '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5',
        '#70AD47', '#264478', '#9B57A0', '#636363',
    ],
};
