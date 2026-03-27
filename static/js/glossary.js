/**
 * Glossary - DB terminology reference for the sales dashboard.
 */
const Glossary = (() => {
    let currentCategory = "all";

    const DATA = [
        // === 사이트 구분 (sales_Gubun) ===
        { cat: "site", term: "SB", ko: "바른손카드", desc: "bar_shop1.custom_order.sales_Gubun = 'SB'. 바른손카드 쇼핑몰 주문", db: "bar_shop1" },
        { cat: "site", term: "B", ko: "바른손몰", desc: "bar_shop1.custom_order.sales_Gubun = 'B'. 바른손몰 직접 주문", db: "bar_shop1" },
        { cat: "site", term: "H", ko: "바른손몰(비핸즈)", desc: "bar_shop1.custom_order.sales_Gubun = 'H'. 비핸즈 채널 주문 (바른손몰로 합산)", db: "bar_shop1" },
        { cat: "site", term: "SD", ko: "디얼디어", desc: "bar_shop1.custom_order.sales_Gubun = 'SD'. 디얼디어(뚜비뚜비) 웨딩카드", db: "bar_shop1" },
        { cat: "site", term: "SS", ko: "프리미어페이퍼", desc: "bar_shop1.custom_order.sales_Gubun = 'SS'. 프리미어페이퍼 쇼핑몰", db: "bar_shop1" },
        { cat: "site", term: "BR", ko: "바른손", desc: "sales_Gubun = 'BR'. 바른손 직접 채널", db: "bar_shop1" },
        { cat: "site", term: "ST", ko: "스토어", desc: "sales_Gubun = 'ST'. 오프라인 스토어 채널", db: "bar_shop1" },
        { cat: "site", term: "SA", ko: "쇼핑몰A", desc: "sales_Gubun = 'SA'. 쇼핑몰 A 채널", db: "bar_shop1" },

        // === 주문 유형 (order_type) ===
        { cat: "order", term: "order_type = 1", ko: "마스터(실물)", desc: "실물 청첩장 주문. 인쇄/제본/배송 프로세스 진행", db: "bar_shop1" },
        { cat: "order", term: "order_type = 6", ko: "디지털(모바일청첩장)", desc: "모바일 청첩장 주문. 디지털 상품으로 배송 없음", db: "bar_shop1" },
        { cat: "order", term: "order_type = 7", ko: "이니셜특수", desc: "이니셜/특수 인쇄 옵션 포함 주문", db: "bar_shop1" },
        { cat: "order", term: "order_type = 14", ko: "감사장", desc: "결혼 감사장 주문", db: "bar_shop1" },
        { cat: "order", term: "order_type = 3", ko: "셀프디자인", desc: "고객이 직접 디자인한 커스텀 주문", db: "bar_shop1" },

        // === 주문 상태 (status_seq) ===
        { cat: "order", term: "status_seq >= 1", ko: "유효 주문", desc: "결제 완료 이상의 유효한 주문만 필터링할 때 사용하는 조건", db: "bar_shop1" },
        { cat: "order", term: "settle_price > 0", ko: "결제 완료", desc: "실제 결제가 이루어진 주문 (settle_price = 정산가/결제금액)", db: "bar_shop1" },

        // === 테이블 (bar_shop1) ===
        { cat: "table", term: "custom_order", ko: "주문", desc: "bar_shop1의 주문 마스터 테이블. 모든 사이트(SB/B/H/SD/SS) 주문 통합 관리", db: "bar_shop1" },
        { cat: "table", term: "custom_order_item", ko: "주문 항목", desc: "주문별 개별 상품 항목. item_price(단가), item_count(수량) 포함", db: "bar_shop1" },
        { cat: "table", term: "custom_order_WeddInfo", ko: "결혼식 정보", desc: "주문별 예식 정보. event_year/event_month/event_Day(예식일), wedd_name(예식장명)", db: "bar_shop1" },
        { cat: "table", term: "S2_Card", ko: "카드 상품", desc: "카드 상품 마스터 (8,458건). Card_Code(상품코드), Card_Price(단가), CardBrand(브랜드)", db: "bar_shop1" },
        { cat: "table", term: "S2_CardKind", ko: "카드 종류", desc: "카드-종류 M:N 매핑 테이블. S2_CardKindInfo와 조인", db: "bar_shop1" },
        { cat: "table", term: "S2_CardKindInfo", ko: "카드 종류 마스터", desc: "카드 종류 정의 (청첩장, 초대장, 감사장, 돌잔치 등 16종)", db: "bar_shop1" },
        { cat: "table", term: "S2_UserInfo", ko: "사용자 정보", desc: "회원 마스터 (108만건). 가입정보, 연락처 등", db: "bar_shop1" },
        { cat: "table", term: "DELIVERY_INFO", ko: "배송 정보", desc: "주문별 배송 정보. 택배사, 송장번호, 배송상태", db: "bar_shop1" },
        { cat: "table", term: "custom_order_plist", ko: "인쇄 목록", desc: "주문별 인쇄 대상 목록", db: "bar_shop1" },
        { cat: "table", term: "custom_order_printjob", ko: "인쇄 작업", desc: "인쇄 작업 진행 현황", db: "bar_shop1" },

        // === 테이블 (barunson - 디지털) ===
        { cat: "table", term: "TB_Invitation", ko: "초대장 (디지털)", desc: "모바일 청첩장 마스터. 무료+유료 모든 사용자 기록. MC 사용자 집계 시 반드시 이 테이블 사용", db: "barunson" },
        { cat: "table", term: "TB_Order", ko: "주문 (디지털)", desc: "디지털 상품 주문. 주의: 전체의 34%만 캡처. 2025.06 이후 유료만 기록됨", db: "barunson" },
        { cat: "table", term: "TB_Product", ko: "상품 (디지털)", desc: "디지털 상품 마스터. Product_Code(MC4114 등), Product_ID(URL용)", db: "barunson" },
        { cat: "table", term: "TB_Invitation_Detail", ko: "초대장 상세", desc: "초대장 입력 필드 98개. 신랑/신부 정보, 예식장, 인사말 등", db: "barunson" },
        { cat: "table", term: "TB_Order_Product", ko: "주문 상품 (디지털)", desc: "디지털 주문별 상품 항목 상세", db: "barunson" },

        // === 테이블 (DD - 뚜비뚜비) ===
        { cat: "table", term: "orders (DD)", ko: "주문 (DD)", desc: "DD 웨딩 주문 마스터 (19.6만건). barunson_order_seq로 bar_shop1과 연동", db: "DD" },
        { cat: "table", term: "order_items (DD)", ko: "주문 항목 (DD)", desc: "DD 주문 항목 (216만건). 개별 상품 내역", db: "DD" },
        { cat: "table", term: "users (DD)", ko: "회원 (DD)", desc: "DD 회원 마스터 (11.2만건)", db: "DD" },
        { cat: "table", term: "products (DD)", ko: "상품 (DD)", desc: "DD 상품 마스터 (1,241건)", db: "DD" },
        { cat: "table", term: "mobile_cards (DD)", ko: "모바일 청첩장 (DD)", desc: "DD 모바일 청첩장 (3.75만건)", db: "DD" },

        // === 테이블 (XERP) ===
        { cat: "table", term: "ERP_SalesData", ko: "ERP 판매 데이터", desc: "XERP 판매 트랜잭션 (1,810만건). 반드시 h_date 필드로 조회 (reg_date 사용 시 타임아웃)", db: "XERP" },

        // === 금액 컬럼 ===
        { cat: "column", term: "settle_price", ko: "정산가/결제금액", desc: "custom_order의 실제 결제 금액. 매출 집계의 기준 컬럼", db: "bar_shop1" },
        { cat: "column", term: "order_price", ko: "주문가", desc: "할인 전 원래 주문 금액", db: "bar_shop1" },
        { cat: "column", term: "order_total_price", ko: "주문총액", desc: "할인 적용 후 주문 합계", db: "bar_shop1" },
        { cat: "column", term: "last_total_price", ko: "최종 합계", desc: "배송비, 제본비 등 모든 부가비용 포함 최종 금액", db: "bar_shop1" },
        { cat: "column", term: "delivery_price", ko: "배송비", desc: "배송 비용", db: "bar_shop1" },
        { cat: "column", term: "jebon_price", ko: "제본비", desc: "청첩장 제본 비용", db: "bar_shop1" },
        { cat: "column", term: "discount_rate", ko: "할인율", desc: "주문 할인율 (%)", db: "bar_shop1" },
        { cat: "column", term: "reduce_price", ko: "할인금액", desc: "할인 적용 금액", db: "bar_shop1" },
        { cat: "column", term: "point_price", ko: "포인트 사용", desc: "포인트로 차감된 금액", db: "bar_shop1" },
        { cat: "column", term: "Card_Price", ko: "카드 단가", desc: "S2_Card 테이블의 개별 카드 가격", db: "bar_shop1" },
        { cat: "column", term: "CardSet_Price", ko: "세트 가격", desc: "카드+봉투 등 세트 상품 가격", db: "bar_shop1" },
        { cat: "column", term: "Payment_Price", ko: "결제 금액 (디지털)", desc: "barunson TB_Order 결제 금액. 0이면 무료 사용자", db: "barunson" },
        { cat: "column", term: "item_price", ko: "항목 단가", desc: "custom_order_item의 개별 상품 단가", db: "bar_shop1" },
        { cat: "column", term: "item_count", ko: "항목 수량", desc: "custom_order_item의 주문 수량", db: "bar_shop1" },

        // === 날짜 컬럼 ===
        { cat: "column", term: "order_date", ko: "주문일", desc: "주문 생성 일시", db: "bar_shop1" },
        { cat: "column", term: "settle_date", ko: "결제일", desc: "실제 결제 완료 일시", db: "bar_shop1" },
        { cat: "column", term: "src_send_date", ko: "발송일", desc: "택배 발송 일시", db: "bar_shop1" },
        { cat: "column", term: "src_print_date", ko: "인쇄일", desc: "인쇄 완료 일시", db: "bar_shop1" },
        { cat: "column", term: "src_cancel_date", ko: "취소일", desc: "주문 취소 일시", db: "bar_shop1" },
        { cat: "column", term: "h_date", ko: "거래일 (XERP)", desc: "ERP_SalesData의 거래일. XERP 조회 시 반드시 이 필드 사용", db: "XERP" },
        { cat: "column", term: "event_year/month/Day", ko: "예식일", desc: "custom_order_WeddInfo의 예식 연/월/일. 예식일 분석 시 사용", db: "bar_shop1" },
        { cat: "column", term: "wedd_date", ko: "예식일 (텍스트)", desc: "custom_order_WeddInfo의 예식일 텍스트 형식", db: "bar_shop1" },

        // === 상품 코드 패턴 ===
        { cat: "product", term: "MC*", ko: "모바일카드", desc: "바른손 모바일 청첩장. 예: MC4114. 평균 ~30,000원", db: "barunson" },
        { cat: "product", term: "BC*", ko: "바른손카드", desc: "바른손카드 실물 청첩장. 예: BC5755. 평균 ~950원/장", db: "bar_shop1" },
        { cat: "product", term: "BH*", ko: "비핸즈", desc: "비핸즈 브랜드 카드. 예: BH9221. 평균 ~1,200원/장", db: "bar_shop1" },
        { cat: "product", term: "TC*", ko: "더카드", desc: "더카드 브랜드. 평균 ~864원/장", db: "bar_shop1" },
        { cat: "product", term: "DDC_*", ko: "디얼디어카드", desc: "디얼디어 브랜드 카드. 예: DDC_BC5995. 평균 ~1,000원/장", db: "bar_shop1" },
        { cat: "product", term: "WC*", ko: "W카드", desc: "W카드 브랜드. 평균 ~776원/장", db: "bar_shop1" },
        { cat: "product", term: "BE*", ko: "봉투", desc: "봉투 상품 코드. 예: BE004", db: "bar_shop1" },
        { cat: "product", term: "BSI*", ko: "스티커", desc: "스티커 상품 코드. 예: BSI080", db: "bar_shop1" },
        { cat: "product", term: "FST*", ko: "식권/부속", desc: "식권, 부속품 코드. 예: FST43_C", db: "bar_shop1" },

        // === 브랜드 코드 (CardBrand) ===
        { cat: "brand", term: "CardBrand = B", ko: "바른손카드", desc: "S2_Card.CardBrand. 1,581개 상품, 평균 969원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = C", ko: "더카드", desc: "662개 상품, 평균 864원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = S", ko: "비핸즈", desc: "550개 상품, 평균 1,526원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = X", ko: "디얼디어", desc: "488개 상품, 평균 1,054원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = W", ko: "W카드", desc: "215개 상품, 평균 776원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = N", ko: "네이처", desc: "182개 상품, 평균 770원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = I", ko: "이니스", desc: "143개 상품, 평균 1,267원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = H", ko: "비핸즈프리미엄", desc: "121개 상품, 평균 648원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = F", ko: "플라워", desc: "98개 상품, 평균 750원", db: "bar_shop1" },
        { cat: "brand", term: "CardBrand = P", ko: "프리미어", desc: "68개 상품, 평균 892원", db: "bar_shop1" },

        // === 카드 분류 (Card_Div) ===
        { cat: "category", term: "Card_Div = A01", ko: "일반청첩장", desc: "4,334개 등록. 주력 상품", db: "bar_shop1" },
        { cat: "category", term: "Card_Div = A02", ko: "봉투", desc: "682개 등록", db: "bar_shop1" },
        { cat: "category", term: "Card_Div = A03", ko: "감사장", desc: "39개 등록", db: "bar_shop1" },
        { cat: "category", term: "Card_Div = A04", ko: "스티커", desc: "314개 등록", db: "bar_shop1" },
        { cat: "category", term: "Card_Div = A05", ko: "식권/부속", desc: "388개 등록", db: "bar_shop1" },
        { cat: "category", term: "Card_Div = B01", ko: "포토북/앨범", desc: "1,140개 등록", db: "bar_shop1" },

        // === 카드 종류 (S2_CardKindInfo) ===
        { cat: "category", term: "CardKind_ID = 1", ko: "청첩장", desc: "웨딩 청첩장", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 2", ko: "초대장", desc: "일반 초대장", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 3", ko: "감사장", desc: "감사 인사 카드", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 10", ko: "미니청첩장", desc: "소형 청첩장", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 13", ko: "디지털감사장", desc: "디지털 형태 감사장", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 16", ko: "결혼답례카드", desc: "결혼 답례용 카드", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 17", ko: "식순지", desc: "예식 순서 안내지", db: "bar_shop1" },
        { cat: "category", term: "CardKind_ID = 18", ko: "돈봉투", desc: "축의금 봉투", db: "bar_shop1" },

        // === 비즈니스 용어 ===
        { cat: "biz", term: "객단가", ko: "ARPU", desc: "Average Revenue Per User. 매출액 / 주문수. 1인당 평균 결제 금액", db: "-" },
        { cat: "biz", term: "객수량", ko: "주문당 평균 수량", desc: "총 수량 / 주문수. 1건당 평균 청첩장 매수", db: "-" },
        { cat: "biz", term: "ARPPU", ko: "유료사용자 객단가", desc: "매출액 / 유료 주문수. MC 시리즈에서 유료 전환 사용자 기준", db: "-" },
        { cat: "biz", term: "MOM", ko: "전월 대비", desc: "Month Over Month. 직전월 대비 증감률", db: "-" },
        { cat: "biz", term: "YOY", ko: "전년 동기 대비", desc: "Year Over Year. 전년 같은 기간 대비 증감률", db: "-" },
        { cat: "biz", term: "WOW", ko: "전주 대비", desc: "Week Over Week. 직전주 대비 증감률", db: "-" },
        { cat: "biz", term: "전환율", ko: "Conversion Rate", desc: "퍼널 단계별 전환 비율. 예: 가입 → 샘플신청 → 결제", db: "-" },
        { cat: "biz", term: "무료 사용자", ko: "Free User", desc: "MC 시리즈에서 Payment_Price = 0인 사용자. 전체의 약 96%", db: "barunson" },
        { cat: "biz", term: "유료 사용자", ko: "Paid User", desc: "MC 시리즈에서 Payment_Price > 0인 사용자. 전체의 약 4%", db: "barunson" },

        // === DB 구분 ===
        { cat: "db", term: "bar_shop1", ko: "실물 상품 DB", desc: "MSSQL. 실물 청첩장, 감사장, 봉투 등 물리적 상품 주문/생산/배송 관리", db: "bar_shop1" },
        { cat: "db", term: "barunson", ko: "디지털 상품 DB", desc: "MSSQL. 모바일 청첩장(MC 시리즈) 등 디지털 상품. TB_ 접두어", db: "barunson" },
        { cat: "db", term: "DD", ko: "뚜비뚜비 웨딩 DB", desc: "MySQL(주의!). 디얼디어 웨딩 쇼핑몰. Laravel 기반, snake_case 테이블명", db: "DD" },
        { cat: "db", term: "XERP", ko: "ERP DB", desc: "MSSQL. 회계/매출/재고 등 ERP 데이터. h_date 필드로 조회 필수", db: "XERP" },
        { cat: "db", term: "BHC", ko: "디얼디어 재고 DB", desc: "MSSQL. 디얼디어 재고관리. XERP와 동일 구조, 코드페이지 949(EUC-KR)", db: "BHC" },

        // === 표시/상태 플래그 ===
        { cat: "column", term: "DISPLAY_YORN", ko: "상품 전시 여부", desc: "S2_Card의 전시 상태. Y=전시, N=미전시. (isDisplay 아님 주의!)", db: "bar_shop1" },
        { cat: "column", term: "is_display (DD)", ko: "상품 전시 여부 (DD)", desc: "DD products 테이블. T=전시, F=미전시", db: "DD" },
        { cat: "column", term: "sales_Gubun", ko: "판매 구분", desc: "주문이 발생한 사이트/채널 구분 코드 (SB, B, H, SD, SS 등)", db: "bar_shop1" },
        { cat: "column", term: "order_count", ko: "주문 수량", desc: "청첩장 매수 (장 수)", db: "bar_shop1" },
        { cat: "column", term: "Card_Code", ko: "상품 코드", desc: "S2_Card의 상품 코드. varchar(30). 예: BC5755, BH9221", db: "bar_shop1" },
        { cat: "column", term: "card_seq", ko: "카드 시퀀스", desc: "custom_order에서 S2_Card를 참조하는 키", db: "bar_shop1" },
        { cat: "column", term: "member_id", ko: "회원 ID", desc: "주문자 회원 아이디", db: "bar_shop1" },
        { cat: "column", term: "order_seq", ko: "주문 시퀀스", desc: "주문 고유 번호 (PK). 다른 테이블에서 FK로 참조", db: "bar_shop1" },
        { cat: "column", term: "barunson_order_seq", ko: "바른손 주문번호 (DD)", desc: "DD orders 테이블에서 bar_shop1.custom_order.order_seq를 참조", db: "DD" },
    ];

    const CATEGORIES = {
        all:      "전체",
        site:     "사이트 구분",
        order:    "주문 유형/상태",
        table:    "테이블",
        column:   "컬럼",
        product:  "상품 코드",
        brand:    "브랜드",
        category: "카드 분류/종류",
        biz:      "비즈니스 용어",
        db:       "데이터베이스",
    };

    const DB_COLORS = {
        "bar_shop1": "bg-blue-100 text-blue-700",
        "barunson":  "bg-purple-100 text-purple-700",
        "DD":        "bg-green-100 text-green-700",
        "XERP":      "bg-orange-100 text-orange-700",
        "BHC":       "bg-yellow-100 text-yellow-700",
        "-":         "bg-gray-100 text-gray-600",
    };

    function init() {
        renderCategoryBtns();
        render(DATA);
    }

    function renderCategoryBtns() {
        const container = document.getElementById("glossaryCategoryBtns");
        if (!container) return;
        container.innerHTML = Object.entries(CATEGORIES).map(([key, label]) =>
            `<button class="site-tab-btn${key === "all" ? " active" : ""}" data-gcat="${key}">${label}</button>`
        ).join("");
        container.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentCategory = btn.dataset.gcat;
                filter(document.getElementById("glossarySearch")?.value || "");
            });
        });
    }

    function filter(query) {
        const q = query.trim().toLowerCase();
        let filtered = DATA;
        if (currentCategory !== "all") {
            filtered = filtered.filter(d => d.cat === currentCategory);
        }
        if (q) {
            filtered = filtered.filter(d =>
                d.term.toLowerCase().includes(q) ||
                d.ko.toLowerCase().includes(q) ||
                d.desc.toLowerCase().includes(q) ||
                d.db.toLowerCase().includes(q)
            );
        }
        render(filtered);
    }

    function render(items) {
        const container = document.getElementById("glossaryContent");
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `<div class="bg-white rounded-lg shadow p-8 text-center text-gray-400">검색 결과가 없습니다</div>`;
            return;
        }

        // Group by category
        const grouped = {};
        items.forEach(item => {
            const catLabel = CATEGORIES[item.cat] || item.cat;
            if (!grouped[catLabel]) grouped[catLabel] = [];
            grouped[catLabel].push(item);
        });

        container.innerHTML = Object.entries(grouped).map(([catLabel, catItems]) => `
            <div class="bg-white rounded-lg shadow">
                <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <h3 class="font-semibold text-sm text-gray-700">${catLabel} <span class="text-gray-400 font-normal">(${catItems.length})</span></h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-xs text-gray-500 border-b">
                                <th class="px-4 py-2 text-left w-48">코드/영문</th>
                                <th class="px-4 py-2 text-left w-40">한글명</th>
                                <th class="px-4 py-2 text-left">설명</th>
                                <th class="px-4 py-2 text-center w-24">DB</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${catItems.map(item => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 font-mono text-xs font-semibold text-gray-800">${esc(item.term)}</td>
                                    <td class="px-4 py-2 font-medium">${esc(item.ko)}</td>
                                    <td class="px-4 py-2 text-gray-600">${esc(item.desc)}</td>
                                    <td class="px-4 py-2 text-center">
                                        <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${DB_COLORS[item.db] || "bg-gray-100"}">${esc(item.db)}</span>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join("");
    }

    function esc(s) {
        const d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
    }

    return { init, filter };
})();
