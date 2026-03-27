/**
 * Excel export functions.
 */
const Export = {
    /** Server-side export (openpyxl, styled) */
    downloadServer() {
        const start = document.getElementById('startDate').value;
        const end = Utils.addDays(document.getElementById('endDate').value, 1);
        const basis = document.querySelector('.date-basis-btn.active')?.dataset.basis || 'order_date';
        window.location.href = `api/export?start=${start}&end=${end}&basis=${basis}`;
    },

    /** Client-side export (SheetJS, fast) */
    downloadClient() {
        if (!DetailTable.data || !DetailTable.data.rows) return;
        const rows = DetailTable.data.rows.map(r => ({
            '날짜': r.order_day,
            '사이트': r.site_name,
            '상품구분': r.product_type,
            '주문수': r.order_count,
            '매출액': r.revenue || 0,
            '객단가': r.aov || 0,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '상세데이터');
        XLSX.writeFile(wb, `sales_detail.xlsx`);
    },
};
