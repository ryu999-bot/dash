/**
 * SKU list - download only (no table rendering).
 */
const SKU = {
    async load() {
        const data = await Utils.fetchJson('/api/sku/count');
        document.getElementById('skuCount').textContent = `전체 ${Utils.fmt(data.total)}개 상품`;
    },
};
