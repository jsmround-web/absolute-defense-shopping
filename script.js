// 절대방어 쇼핑 - 가격비교 사이트

// 관리자 인증 시스템
class AdminAuth {
    constructor() {
        this.adminPassword = 'jsmwta5556'; // 관리자 비밀번호
        this.isAuthenticated = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30분 세션 타임아웃
        this.sessionStartTime = null;
    }

    // 관리자 인증
    authenticate() {
        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            this.sessionStartTime = Date.now();
            localStorage.setItem('admin_session', 'true');
            localStorage.setItem('admin_time', this.sessionStartTime.toString());
            console.log('관리자 인증 성공');
            return true;
        } else {
            alert('잘못된 비밀번호입니다.');
            console.log('관리자 인증 실패');
            return false;
        }
    }

    // 세션 확인
    checkSession() {
        const session = localStorage.getItem('admin_session');
        const sessionTime = localStorage.getItem('admin_time');
        
        if (session === 'true' && sessionTime) {
            const elapsed = Date.now() - parseInt(sessionTime);
            if (elapsed < this.sessionTimeout) {
                this.isAuthenticated = true;
                this.sessionStartTime = parseInt(sessionTime);
                return true;
            } else {
                // 세션 만료
                this.logout();
                return false;
            }
        }
        return false;
    }

    // 로그아웃
    logout() {
        this.isAuthenticated = false;
        this.sessionStartTime = null;
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_time');
        console.log('관리자 세션 종료');
    }

    // 관리자 권한 확인
    requireAuth() {
        if (this.checkSession()) {
            return true;
        } else {
            return this.authenticate();
        }
    }
}

// 전역 관리자 인증 객체
const adminAuth = new AdminAuth();

// Google Analytics 추적 시스템
class GoogleAnalyticsTracker {
    constructor() {
        this.isGAReady = false;
        this.checkGAReady();
    }

    checkGAReady() {
        // Google Analytics가 로드되었는지 확인
        if (typeof gtag !== 'undefined' && window.gtag) {
            this.isGAReady = true;
            console.log('Google Analytics 추적 시스템 활성화됨');
            
            // 즉시 페이지뷰 전송
            this.sendInitialPageView();
        } else {
            // GA가 아직 로드되지 않았다면 잠시 후 다시 확인 (최대 10초)
            if (this.checkAttempts < 100) {
                this.checkAttempts = (this.checkAttempts || 0) + 1;
                setTimeout(() => this.checkGAReady(), 100);
            } else {
                console.log('Google Analytics 로드 타임아웃 - 대체 추적 모드로 전환');
                this.isGAReady = true; // 대체 모드에서도 추적 허용
            }
        }
    }
    
    sendInitialPageView() {
        if (this.isGAReady && typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: '절대방어 쇼핑 - 가격비교 사이트',
                page_location: window.location.href,
                page_path: window.location.pathname
            });
            console.log('초기 페이지뷰 이벤트 전송 완료');
        }
    }

    // 이벤트 추적
    trackEvent(action, category, label, value) {
        if (this.isGAReady) {
            // gtag 함수가 있으면 사용, 없으면 대체 방법 사용
            if (typeof gtag !== 'undefined' && window.gtag) {
                gtag('event', action, {
                    event_category: category,
                    event_label: label,
                    value: value,
                    custom_map: {
                        dimension1: 'local_test'
                    }
                });
                console.log(`GA 이벤트 추적 (정상): ${action} - ${category} - ${label}`, {
                    isGAReady: this.isGAReady,
                    gtagExists: typeof gtag !== 'undefined',
                    timestamp: new Date().toISOString()
                });
            } else {
                // 대체 추적 방법 (Measurement Protocol 또는 로컬 로깅)
                console.log(`GA 이벤트 추적 (대체): ${action} - ${category} - ${label}`, {
                    isGAReady: this.isGAReady,
                    gtagExists: typeof gtag !== 'undefined',
                    timestamp: new Date().toISOString(),
                    fallbackMode: true
                });
                
                // 로컬 스토리지에 이벤트 저장 (나중에 전송 가능)
                this.saveEventLocally(action, category, label, value);
            }
        } else {
            console.log('Google Analytics가 준비되지 않음', {
                isGAReady: this.isGAReady,
                gtagExists: typeof gtag !== 'undefined'
            });
        }
    }
    
    // 로컬 이벤트 저장 (대체 방법)
    saveEventLocally(action, category, label, value) {
        try {
            const events = JSON.parse(localStorage.getItem('ga_events') || '[]');
            const event = {
                action,
                category,
                label,
                value,
                timestamp: new Date().toISOString(),
                page_title: document.title,
                page_location: window.location.href,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                language: navigator.language
            };
            
            events.push(event);
            localStorage.setItem('ga_events', JSON.stringify(events.slice(-100))); // 최근 100개만 유지
            
            console.log('로컬 이벤트 저장 완료:', action, category, label);
            console.log(`총 저장된 이벤트: ${events.length}개`);
            
            // 이벤트 내보내기 안내
            if (events.length >= 5) {
                console.log('💡 이벤트 데이터 내보내기: localStorage.getItem("ga_events")');
            }
            
        } catch (error) {
            console.log('로컬 이벤트 저장 실패:', error);
        }
    }

    // 페이지뷰 추적
    trackPageView(pageName, pagePath) {
        if (this.isGAReady && typeof gtag !== 'undefined') {
            gtag('config', 'G-4B3GWTJ2B3', {
                page_title: pageName,
                page_location: pagePath || window.location.href
            });
            console.log(`GA 페이지뷰 추적: ${pageName}`);
        }
    }

    // 검색 추적
    trackSearch(searchTerm, resultsCount) {
        this.trackEvent('search', 'engagement', searchTerm, resultsCount);
    }

    // 제품 클릭 추적
    trackProductClick(productName, productCategory) {
        this.trackEvent('product_click', 'engagement', `${productName} (${productCategory})`);
    }

    // 카테고리 변경 추적
    trackCategoryChange(category) {
        this.trackEvent('category_change', 'navigation', category);
    }

    // 가격 신고 추적
    trackPriceReport(productName, price) {
        this.trackEvent('price_report', 'conversion', productName, price);
    }

    // 폼 제출 추적
    trackFormSubmit(formType, success) {
        this.trackEvent('form_submit', 'conversion', formType, success ? 1 : 0);
    }

    // 에러 추적
    trackError(errorType, errorMessage) {
        this.trackEvent('error', 'technical', errorType, 0);
    }
}

// 전역 추적기 인스턴스
const gaTracker = new GoogleAnalyticsTracker();

// 전역 추적 함수들
function trackProductClick(productName, productCategory) {
    gaTracker.trackProductClick(productName, productCategory);
}

function trackPurchaseClick(productName, productCategory) {
    gaTracker.trackEvent('purchase_click', 'conversion', `${productName} (${productCategory})`);
}

// 페이지가 로드되면 앱 실행
document.addEventListener('DOMContentLoaded', function() {
    const app = new PriceComparisonSite();
});
class PriceComparisonSite {
    constructor() {
        this.products = [];
        this.priceReports = []; // 가격 변경 신고 배열 초기화
        this.currentCategory = '전체';
        this.currentSearchTerm = '';
        this.isSubmitting = false; // 중복 제출 방지 플래그
        this.init();
    }

    async init() {
        // 페이지뷰 추적
        gaTracker.trackPageView('절대방어 쇼핑 - 메인 페이지');
        
        // 테스트 이벤트 전송 (GA 연결 확인용)
        setTimeout(() => {
            gaTracker.trackEvent('test_event', 'debug', 'site_loaded', 1);
            console.log('테스트 이벤트 전송 완료');
        }, 2000);
        
        // 추가 자동 이벤트 생성 (데이터 수집용)
        setTimeout(() => {
            gaTracker.trackEvent('page_interaction', 'engagement', 'auto_scroll', 1);
        }, 5000);
        
        setTimeout(() => {
            gaTracker.trackEvent('user_behavior', 'engagement', 'time_on_page', 10);
        }, 10000);
        
        // this.loadSampleData(); // 샘플 데이터 로드 제거 - Firebase 데이터만 사용
        
        // 테스트 제품 데이터 제거 - Firebase 데이터만 사용
        this.products = [];
        
        console.log('임시 테스트 데이터 로드 완료:', this.products.length, '개');
        
        this.setupEventListeners();
        await this.initFirebase();
    }


    performSearch() {
        console.log('=== performSearch 시작 ===');
        
        const searchInput = document.getElementById('searchInput');
        console.log('검색 입력 요소:', searchInput);
        
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        console.log('검색어:', searchTerm);
        
        // 검색어가 없으면 빈 검색으로 처리
        const finalSearchTerm = searchTerm;
        console.log('최종 검색어:', finalSearchTerm);
        
        this.currentSearchTerm = finalSearchTerm;
        
        console.log('현재 제품 목록:', this.products);
        console.log('현재 제품 개수:', this.products.length);
        console.log('승인된 제품 목록:', this.products.filter(p => p.status === 'approved'));
        
        let resultsCount = 0;
        
        if (!finalSearchTerm) {
            console.log('검색어가 없어서 전체 제품 표시');
            this.displayAllProducts();
            resultsCount = this.products.filter(p => p.status === 'approved').length;
        } else {
            console.log('검색어가 있어서 검색 결과 표시');
            this.displaySearchResults(finalSearchTerm);
            // 검색 결과 개수 계산
            resultsCount = this.products.filter(product => {
                const nameMatch = product.name.toLowerCase().includes(finalSearchTerm.toLowerCase());
                const categoryMatch = product.category.toLowerCase().includes(finalSearchTerm.toLowerCase());
                const matchesSearch = nameMatch || categoryMatch;
                const isApproved = product.status === 'approved';
                return matchesSearch && isApproved;
            }).length;
        }
        
        // 검색 이벤트 추적
        if (finalSearchTerm) {
            gaTracker.trackSearch(finalSearchTerm, resultsCount);
        }
        
        console.log('=== performSearch 완료 ===');
    }

    displaySearchResults(searchTerm) {
        console.log('=== displaySearchResults 시작 ===');
        console.log('검색어:', searchTerm);
        console.log('전체 제품 목록:', this.products);
        console.log('전체 제품 개수:', this.products.length);
        console.log('검색 결과 필터링 시작:', searchTerm);
        
        const filteredProducts = this.products.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = product.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSearch = nameMatch || categoryMatch;
            const isApproved = product.status === 'approved';
            
            console.log(`제품 분석:`, {
                name: product.name,
                category: product.category,
                status: product.status,
                searchTerm: searchTerm,
                nameMatch: nameMatch,
                categoryMatch: categoryMatch,
                matchesSearch: matchesSearch,
                isApproved: isApproved,
                willShow: matchesSearch && isApproved
            });
            
            return matchesSearch && isApproved;
        });

        console.log('필터링된 제품 개수:', filteredProducts.length);
        console.log('필터링된 제품 목록:', filteredProducts);

        // 가격순 정렬 (낮은 가격부터 높은 가격 순)
        filteredProducts.sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB;
        });

        console.log('가격순 정렬된 제품 목록:', filteredProducts);

        console.log('renderProducts 호출 전');
        this.renderProducts(filteredProducts, searchTerm);
        console.log('renderProducts 호출 후');
        console.log('=== displaySearchResults 완료 ===');
    }

    displayAllProducts() {
        console.log('=== displayAllProducts 시작 ===');
        console.log('전체 제품 목록:', this.products);
        console.log('제품 상태별 분류:', this.products.map(p => ({ name: p.name, status: p.status })));
        
        // 승인된 제품만 표시
        let approvedProducts = this.products.filter(p => p.status === 'approved');
        console.log('표시할 제품 목록 (승인된 제품만):', approvedProducts);
        console.log('표시할 제품 개수:', approvedProducts.length);
        
        // 가격순 정렬 (낮은 가격부터 높은 가격 순)
        approvedProducts.sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB;
        });
        
        console.log('가격순 정렬된 제품 목록:', approvedProducts);
        
        // 제품이 없으면 빈 화면 표시
        if (approvedProducts.length === 0) {
            console.log('승인된 제품이 없습니다.');
        }
        
        console.log('renderProducts 호출 전');
        this.renderProducts(approvedProducts);
        console.log('renderProducts 호출 후');
        console.log('=== displayAllProducts 완료 ===');
    }

    displayCategoryResults(category) {
        console.log('=== displayCategoryResults 시작 ===');
        console.log('선택된 카테고리:', category);
        console.log('전체 제품 목록:', this.products);
        
        // 카테고리 변경 추적
        if (this.currentCategory !== category) {
            gaTracker.trackCategoryChange(category);
            this.currentCategory = category;
        }
        
        const filteredProducts = this.products.filter(product => {
            const categoryMatch = product.category === category;
            console.log(`제품 분석:`, {
                name: product.name,
                category: product.category,
                selectedCategory: category,
                categoryMatch: categoryMatch,
                willShow: categoryMatch
            });
            return categoryMatch && product.status === 'approved';
        });
        
        console.log('필터링된 제품 개수:', filteredProducts.length);
        console.log('필터링된 제품 목록:', filteredProducts);
        
        // 가격순 정렬 (낮은 가격부터 높은 가격 순)
        filteredProducts.sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB;
        });
        
        console.log('가격순 정렬된 제품 목록:', filteredProducts);
        
        console.log('renderProducts 호출 전');
        this.renderProducts(filteredProducts);
        console.log('renderProducts 호출 후');
        console.log('=== displayCategoryResults 완료 ===');
    }

    renderProducts(products, searchTerm = '') {
        console.log('제품 렌더링 시작, 제품 개수:', products.length);
        console.log('렌더링할 제품 목록:', products);
        
        const productList = document.getElementById('productList');
        console.log('productList DOM 요소:', productList);
        
        if (!productList) {
            console.error('productList DOM 요소를 찾을 수 없습니다!');
            return;
        }
        
        // 중요: hidden 클래스 제거하여 제품 표시
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.classList.remove('hidden');
            console.log('searchResults에서 hidden 클래스 제거 완료');
        }
        
        if (products.length === 0) {
            console.log('제품이 없어서 빈 화면 표시');
            const message = searchTerm ? 
                `<h3>검색 결과가 없습니다</h3><p>"${searchTerm}"에 대한 검색 결과가 없습니다.</p>` :
                `<h3>등록된 제품이 없습니다</h3>`;
            
            productList.innerHTML = `
                <div class="no-products">
                    ${message}
                    <p>최저가 신고를 통해 제품을 등록해보세요!</p>
                </div>
            `;
            return;
        }

        // 가격 낮은 순으로 정렬
        console.log('정렬 전 제품 목록:', products.map(p => ({ 
            name: p.name, 
            price: this.calculateFinalPrice(p)
        })));
        
        // 가격 낮은 순으로 정렬
        products.sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            
            console.log(`정렬 비교: "${a.name}" (${priceA}원) vs "${b.name}" (${priceB}원)`);
            
            return priceA - priceB; // 낮은 가격이 위로
        });
        
        console.log('정렬 후 제품 목록 (가격 낮은 순):', products.map((p, index) => ({ 
            순위: index + 1,
            name: p.name, 
            price: this.calculateFinalPrice(p)
        })));

        console.log('HTML 생성 시작');
        const htmlContent = products.map(product => this.createProductElement(product)).join('');
        console.log('생성된 HTML 길이:', htmlContent.length);
        console.log('생성된 HTML 미리보기:', htmlContent.substring(0, 200) + '...');
        
        console.log('DOM에 HTML 삽입 시작');
        productList.innerHTML = htmlContent;
        console.log('DOM에 HTML 삽입 완료');
        
        // DOM 삽입 후 실제 내용 확인
        console.log('삽입 후 productList 내용 길이:', productList.innerHTML.length);
        console.log('삽입 후 productList 자식 요소 개수:', productList.children.length);
        
        console.log('HTML 삽입 완료');
    }

    createProductElement(product) {
        try {
        console.log(`제품 요소 생성 시작: ${product.name}`);
        
            const finalPrice = this.calculateFinalPrice(product) || 0;
        
        console.log(`제품 "${product.name}" 최종 가격:`, finalPrice);
        

            const htmlElement = `
                <div class="product-item" onclick="trackProductClick('${product.name}', '${product.category}')">
                    <div class="product-info">
                        <div class="product-row-1">
                            <div class="product-title">${product.name || '제품명 없음'}</div>
                        </div>
                        <div class="product-row-2">
                            <div class="row-top">
                                <span class="product-category">${product.category || '기타'}</span>
                                <span class="product-price">${finalPrice.toLocaleString()}원</span>
                                <a href="${product.link || '#'}" target="_blank" class="product-link-btn" onclick="event.stopPropagation(); trackPurchaseClick('${product.name}', '${product.category}')">구매</a>
                            </div>
                            <div class="row-bottom">
                                <div class="store-time-info">
                                    <span class="product-store">${product.store || '미선택'}</span>
                                    ${this.formatUpdateTime(product.lastUpdated || product.createdAt)}
                                </div>
                                <button class="price-report-btn" onclick="event.stopPropagation(); reportPriceChange('${product.id}', '${product.originalPrice || 0}')">변경</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        
        console.log(`제품 "${product.name}" HTML 요소 생성 완료`);
        return htmlElement;
        } catch (error) {
            console.error(`제품 "${product.name}" HTML 요소 생성 오류:`, error);
            return `
                <div class="product-item">
                    <div class="product-info">
                        <div class="product-row-1">
                            <div class="product-title">${product.name || '제품명 없음'}</div>
                        </div>
                        <div class="product-row-2">
                            <div class="row-top">
                                <span class="product-category">${product.category || '기타'}</span>
                                <span class="product-price">가격 정보 없음</span>
                                <a href="${product.link || '#'}" target="_blank" class="product-link-btn">구매</a>
                            </div>
                            <div class="row-bottom">
                                <div class="store-time-info">
                                    <span class="product-store">${product.store || '미선택'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    calculateFinalPrice(product) {
        try {
        console.log(`가격 계산 시작 - 제품: ${product.name}`, {
            originalPrice: product.originalPrice,
            deliveryFee: product.deliveryFee
        });
        
            const originalPrice = parseInt(product.originalPrice) || 0;
            const deliveryFee = parseInt(product.deliveryFee) || 0;
        const finalPrice = originalPrice + deliveryFee;
        
        console.log(`가격 계산 완료 - 제품: ${product.name}, 최종가격: ${finalPrice}`);
        return finalPrice;
        } catch (error) {
            console.error(`가격 계산 오류 - 제품: ${product.name}`, error);
            return 0;
        }
    }

    formatUpdateTime(date) {
        try {
            const now = new Date();
            let updateTime;
            
            // 날짜 타입에 따른 처리
            if (typeof date === 'string') {
                updateTime = new Date(date);
            } else if (date instanceof Date) {
                updateTime = date;
            } else if (date && date.toDate) {
                // Firebase Timestamp 객체 처리
                updateTime = date.toDate();
            } else {
                updateTime = new Date();
            }
            
            // 유효하지 않은 날짜 처리
            if (isNaN(updateTime.getTime())) {
                return '시간 정보 없음';
            }
            
            const diffMs = now - updateTime;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            let timeText = '';
            let cssClass = '';
            
            if (diffMinutes < 60) {
                timeText = `${diffMinutes}분 전`;
                cssClass = 'recent'; // 6시간 이내
            } else if (diffHours < 24) {
                timeText = `${diffHours}시간 전`;
                cssClass = diffHours <= 6 ? 'recent' : 'daily'; // 6시간 이내는 recent, 그 외는 daily
            } else if (diffDays < 7) {
                timeText = `${diffDays}일 전`;
                cssClass = 'old'; // 1일 이상
            } else {
                timeText = updateTime.toLocaleDateString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                cssClass = 'old'; // 1일 이상
            }
            
            return `<span class="update-time ${cssClass}">${timeText}</span>`;
        } catch (error) {
            console.error('시간 포맷팅 오류:', error);
            return '시간 정보 없음';
        }
    }

    async reportPriceChange(productId, currentPrice) {
        try {
            const currentPriceNum = parseInt(currentPrice) || 0;
            const newPrice = prompt(`현재 가격: ${currentPriceNum.toLocaleString()}원\n새로운 가격을 입력해주세요:`, '');
            
            if (!newPrice || isNaN(newPrice) || parseInt(newPrice) <= 0) {
                alert('올바른 가격을 입력해주세요.');
                gaTracker.trackFormSubmit('price_report', false);
                return;
            }
        
            const priceChange = {
                productId: productId,
                oldPrice: currentPriceNum,
                newPrice: parseInt(newPrice),
                reporter: 'anonymous', // 나중에 사용자 시스템과 연동
                reportedAt: new Date(),
                status: 'pending'
            };
            
            // 가격 신고 추적
            const product = this.products.find(p => p.id === productId);
            if (product) {
                gaTracker.trackPriceReport(product.name, parseInt(newPrice));
            }
            
            // Firebase에 가격 변경 신고 저장
            await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), priceChange);
            alert('가격 변경 신고가 접수되었습니다. 검토 후 반영됩니다.');
            gaTracker.trackFormSubmit('price_report', true);
        } catch (error) {
            console.error('가격 변경 신고 실패:', error);
            alert('신고 접수에 실패했습니다. 다시 시도해주세요.');
            gaTracker.trackError('price_report_error', error.message);
        }
    }

    setupEventListeners() {
        // 검색 버튼
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        // 엔터키 검색
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // 폼 제출 - 폼이 열릴 때마다 이벤트 리스너 재설정
        this.setupFormSubmitListener();
        
        // 관리자 버튼들
        document.getElementById('loadPendingProducts').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
            this.loadPendingProducts();
            }
        });
        
        document.getElementById('loadAllProducts').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
            this.loadAllProducts();
            }
        });
        
        document.getElementById('loadPriceReports').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
            this.loadPriceReports();
            }
        });
        
        // 관리자 로그아웃 버튼
        document.getElementById('adminLogout').addEventListener('click', () => {
            adminAuth.logout();
            alert('관리자 세션이 종료되었습니다.');
            // 관리자 패널 닫기
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.classList.add('collapsed');
            }
        });
    }

    setupFormSubmitListener() {
        const form = document.getElementById('productForm');
        if (form) {
            // 기존 이벤트 리스너 완전 제거
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // 새 이벤트 리스너 추가
            document.getElementById('productForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }
    }

    handleFormSubmission() {
        // 중복 제출 방지
        if (this.isSubmitting) {
            console.log('이미 제출 중입니다. 중복 제출 방지');
            return;
        }
        
        console.log('폼 제출 시작');
        this.isSubmitting = true;
        
        const formData = {
            name: document.getElementById('productName').value.trim() || '제품명 미입력',
            price: parseInt(document.getElementById('productPrice').value) || 0,
            link: document.getElementById('productLink').value.trim() || '링크 미입력',
            store: document.getElementById('productStore').value.trim() || '미선택',
            userType: document.querySelector('input[name="userType"]:checked').value
        };

        console.log('폼 데이터:', formData);

        // 관리자 등록 시 인증 확인
        if (formData.userType === 'admin') {
            if (!adminAuth.requireAuth()) {
                this.isSubmitting = false; // 인증 실패 시 플래그 리셋
                gaTracker.trackFormSubmit('admin_submission', false);
                return;
            }
        }

        if (!this.validateFormData(formData)) {
            this.isSubmitting = false; // 검증 실패 시 플래그 리셋
            gaTracker.trackFormSubmit('product_submission', false);
            return;
        }

        console.log('폼 검증 통과, Firebase 저장 시작');
        gaTracker.trackFormSubmit('product_submission', true);
        this.saveProductToFirebase(formData);
    }

    validateFormData(data) {
        // 관리자 등록 시에는 빈칸 허용
        if (data.userType === 'admin') {
            console.log('관리자 등록 - 빈칸 허용');
            return true;
        }

        // 고객 신청 시에는 기존 검증 로직 적용
        if (!data.name) {
            alert('제품명을 입력해주세요.');
            return false;
        }
        if (!data.price || data.price <= 0) {
            alert('올바른 가격을 입력해주세요.');
            return false;
        }
        if (!data.link) {
            alert('제품 링크를 입력해주세요.');
            return false;
        }
        if (!data.store) {
            alert('쇼핑몰을 입력해주세요.');
            return false;
        }
        return true;
    }

    async saveProductToFirebase(productData) {
        try {
            console.log('Firebase 저장 시작');
            console.log('Firebase DB 상태:', window.firebaseDb);
            
            // Firebase 연결 확인
            if (!window.firebaseDb) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            const product = {
                name: productData.name,
                store: productData.store,
                originalPrice: productData.price,
                deliveryFee: 0, // 기본값
                rating: 4.0, // 기본값
                category: this.detectCategory(productData.name),
                status: productData.userType === 'customer' ? 'pending' : 'approved',
                submittedBy: productData.userType,
                link: productData.link,
                createdAt: new Date().toISOString()
            };

            console.log('저장할 제품 데이터:', product);
            console.log('사용자 타입:', productData.userType);
            console.log('설정된 상태:', product.status);

            const docRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'products'), product);
            console.log('제품 저장 성공, 문서 ID:', docRef.id);
            
            this.showThankYouMessage(productData.userType);
            this.clearForm();
            this.closeForm();
            
            // 카테고리 카운트 업데이트
            this.updateCategoryCounts();
            
            // 현재 화면 새로고침
            if (this.currentCategory === '전체') {
                this.displayAllProducts();
            } else {
                this.displayCategoryResults(this.currentCategory);
            }
            
            // 제출 완료 후 플래그 리셋
            this.isSubmitting = false;
            
        } catch (error) {
            console.error('Firebase에 제품 저장 실패:', error);
            console.error('에러 상세:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            // 더 구체적인 에러 메시지 제공
            let errorMessage = '제품 저장에 실패했습니다.';
            if (error.message.includes('Firebase가 초기화되지 않았습니다')) {
                errorMessage = 'Firebase 연결에 문제가 있습니다. 페이지를 새로고침해주세요.';
            } else if (error.message.includes('permission')) {
                errorMessage = '권한이 없습니다. 관리자에게 문의해주세요.';
            } else if (error.message.includes('network')) {
                errorMessage = '네트워크 연결을 확인해주세요.';
            }
            
            alert(errorMessage + '\n\n상세 에러: ' + error.message);
            
            // 에러 추적
            gaTracker.trackError('product_save_error', error.message);
            
            // 에러 발생 시에도 플래그 리셋
            this.isSubmitting = false;
        }
    }

    showThankYouMessage(userType) {
        const message = userType === 'customer' 
            ? '신고해주셔서 감사합니다!\n관리자 검토 후 승인되면 사이트에 표시됩니다.\n\n관리자 승인 패널에서 승인 대기 제품을 확인할 수 있습니다.' 
            : '제품이 등록되었습니다!';
        
        alert(message);
    }

    clearForm() {
        document.getElementById('productForm').reset();
        document.querySelector('input[name="userType"][value="customer"]').checked = true;
    }

    closeForm() {
        const formDropdown = document.getElementById('productFormDropdown');
        if (formDropdown) {
            formDropdown.classList.add('collapsed');
        }
    }

    detectCategory(productName) {
        const name = productName.toLowerCase();
        console.log(`카테고리 감지 - 제품명: "${productName}"`);
        
        if (name.includes('노트북') || name.includes('laptop') || name.includes('맥북') || 
            name.includes('lg그램') || name.includes('lg gram') || name.includes('그램')) {
            console.log('→ 노트북 카테고리로 분류');
            return '노트북';
        } else if (name.includes('마우스') || name.includes('mouse')) {
            console.log('→ 마우스 카테고리로 분류');
            return '마우스';
        } else if (name.includes('이어폰') || name.includes('헤드폰') || name.includes('earphone')) {
            console.log('→ 이어폰 카테고리로 분류');
            return '이어폰';
        } else if (name.includes('두유') || name.includes('soy milk') || name.includes('콩우유') || name.includes('두유음료') || 
                   name.includes('두유제품') || name.includes('콩음료') || name.includes('식물성우유') || name.includes('비건우유') ||
                   name.includes('베지밀') || name.includes('vegemil') || name.includes('베지밀a') || name.includes('베지밀a')) {
            console.log('→ 두유 카테고리로 분류');
            return '두유';
        } else if (name.includes('우유') || name.includes('milk')) {
            console.log('→ 우유 카테고리로 분류');
            return '우유';
        } else if (name.includes('라면') || name.includes('ramen') || name.includes('면')) {
            console.log('→ 라면 카테고리로 분류');
            return '라면';
        } else if (name.includes('생수') || name.includes('물') || name.includes('water')) {
            console.log('→ 생수 카테고리로 분류');
            return '생수';
        } else if (name.includes('화장지') || name.includes('티슈') || name.includes('tissue')) {
            console.log('→ 화장지 카테고리로 분류');
            return '화장지';
        } else if (name.includes('세제') || name.includes('detergent') || name.includes('유연제')) {
            console.log('→ 세제 카테고리로 분류');
            return '세제';
        } else if (name.includes('샴푸') || name.includes('shampoo') || name.includes('린스')) {
            console.log('→ 샴푸 카테고리로 분류');
            return '샴푸';
        } else if (name.includes('기저귀') || name.includes('diaper')) {
            console.log('→ 기저귀 카테고리로 분류');
            return '기저귀';
        } else if (name.includes('분유') || name.includes('formula')) {
            console.log('→ 분유 카테고리로 분류');
            return '분유';
        } else if (name.includes('물티슈') || name.includes('wet wipe')) {
            console.log('→ 물티슈 카테고리로 분류');
            return '물티슈';
        } else if (name.includes('이유식') || name.includes('baby food')) {
            console.log('→ 이유식 카테고리로 분류');
            return '이유식';
        } else if (name.includes('키보드') || name.includes('keyboard')) {
            console.log('→ 키보드 카테고리로 분류');
            return '키보드';
        } else if (name.includes('모니터') || name.includes('monitor')) {
            console.log('→ 모니터 카테고리로 분류');
            return '모니터';
        } else {
            console.log('→ 기타 카테고리로 분류');
            return '기타';
        }
    }

    // Firebase 관련 메서드들
    async initFirebase() {
        try {
            console.log('Firebase 초기화 시작...');
            await this.waitForFirebase();
            console.log('Firebase 초기화 완료');
            console.log('Firebase DB 객체:', window.firebaseDb);
            
            // Firebase 함수들 정의
            this.setupFirebaseFunctions();
            
            await this.loadProductsFromFirebase();
            await this.loadPriceReportsFromFirebase(); // 가격 변경 신고 불러오기 추가
            this.setupRealtimeListener();
            
            console.log('Firebase 설정 완료');
        } catch (error) {
            console.error('Firebase 초기화 실패:', error);
            gaTracker.trackError('firebase_init_error', error.message);
            alert('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    }

    // Firebase 함수들 설정
    setupFirebaseFunctions() {
        try {
            // Firebase 함수들이 이미 정의되어 있는지 확인
            if (window.firebaseDeleteDoc && window.firebaseDoc && window.firebaseDb) {
                console.log('Firebase 함수들이 이미 정의되어 있습니다.');
                return;
            }

            // Firebase 함수들을 전역으로 정의
            if (window.firebase && window.firebase.firestore) {
                window.firebaseDb = window.firebase.firestore();
                window.firebaseCollection = window.firebase.firestore().collection.bind(window.firebase.firestore());
                window.firebaseDoc = window.firebase.firestore().doc.bind(window.firebase.firestore());
                window.firebaseGetDocs = window.firebase.firestore().getDocs.bind(window.firebase.firestore());
                window.firebaseAddDoc = window.firebase.firestore().addDoc.bind(window.firebase.firestore());
                window.firebaseUpdateDoc = window.firebase.firestore().updateDoc.bind(window.firebase.firestore());
                window.firebaseDeleteDoc = window.firebase.firestore().deleteDoc.bind(window.firebase.firestore());
                window.firebaseQuery = window.firebase.firestore().query.bind(window.firebase.firestore());
                window.firebaseWhere = window.firebase.firestore().where.bind(window.firebase.firestore());
                window.firebaseOnSnapshot = window.firebase.firestore().onSnapshot.bind(window.firebase.firestore());
                
                console.log('Firebase 함수들이 성공적으로 정의되었습니다.');
            } else {
                console.error('Firebase가 로드되지 않았습니다.');
            }
        } catch (error) {
            console.error('Firebase 함수 설정 실패:', error);
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5초 대기 (50 * 100ms)
            
            const checkFirebase = () => {
                attempts++;
                console.log(`Firebase 대기 중... (${attempts}/${maxAttempts})`);
                
                if (window.firebaseDb) {
                    console.log('Firebase DB 발견됨');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('Firebase 초기화 타임아웃');
                    reject(new Error('Firebase 초기화 타임아웃'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    async loadProductsFromFirebase() {
        try {
            const querySnapshot = await window.firebaseGetDocs(window.firebaseCollection(window.firebaseDb, 'products'));
            const firebaseProducts = [];
            
            querySnapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                
                // createdAt 필드 안전하게 처리
                if (!product.createdAt) {
                    product.createdAt = new Date().toISOString();
                } else if (product.createdAt instanceof Date) {
                    product.createdAt = product.createdAt.toISOString();
                }
                
                // 카테고리 재감지 (베지밀 등 새로운 키워드 적용)
                const detectedCategory = this.detectCategory(product.name);
                console.log(`카테고리 재감지 결과: "${product.name}" - 기존: ${product.category}, 감지: ${detectedCategory}`);
                if (detectedCategory !== product.category) {
                    console.log(`카테고리 수정: "${product.name}" ${product.category} → ${detectedCategory}`);
                    product.category = detectedCategory;
                }
                
                // 제품 상태 확인 및 로그
                console.log(`Firebase에서 불러온 제품:`, {
                    name: product.name,
                    status: product.status,
                    category: product.category,
                    submittedBy: product.submittedBy,
                    store: product.store,
                    willShow: product.status === 'approved'
                });
                
                firebaseProducts.push(product);
            });
            
            // 테스트 데이터와 Firebase 데이터 병합 (중복 제거)
            const existingIds = new Set(this.products.map(p => p.id));
            const newFirebaseProducts = firebaseProducts.filter(p => !existingIds.has(p.id));
            this.products = [...this.products, ...newFirebaseProducts];
            
            console.log('Firebase에서 제품 데이터 불러오기 완료:', firebaseProducts.length, '개');
            console.log('새로 추가된 Firebase 제품:', newFirebaseProducts.length, '개');
            console.log('전체 제품 목록:', this.products.map(p => ({ name: p.name, category: p.category, status: p.status })));
            
            console.log('updateCategoryCounts 호출 전');
            this.updateCategoryCounts();
            console.log('updateCategoryCounts 호출 후');
            
            console.log('displayAllProducts 호출 전');
            this.displayAllProducts();
            console.log('displayAllProducts 호출 후');
            
        } catch (error) {
            console.error('Firebase에서 제품 데이터 불러오기 실패:', error);
        }
    }

    async loadPriceReportsFromFirebase() {
        try {
            console.log('Firebase에서 가격 변경 신고 불러오기 시작...');
            const querySnapshot = await window.firebaseGetDocs(window.firebaseCollection(window.firebaseDb, 'priceReports'));
            const firebaseReports = [];
            
            querySnapshot.forEach((doc) => {
                const report = { id: doc.id, ...doc.data() };
                
                // reportedAt 필드 안전하게 처리
                if (!report.reportedAt) {
                    report.reportedAt = new Date().toISOString();
                } else if (report.reportedAt instanceof Date) {
                    report.reportedAt = report.reportedAt.toISOString();
                }
                
                console.log(`Firebase에서 불러온 가격 변경 신고:`, {
                    id: report.id,
                    productId: report.productId,
                    oldPrice: report.oldPrice,
                    newPrice: report.newPrice,
                    status: report.status,
                    reporter: report.reporter
                });
                
                firebaseReports.push(report);
            });
            
            // 기존 데이터와 병합 (중복 제거)
            const existingIds = new Set(this.priceReports.map(r => r.id));
            const newFirebaseReports = firebaseReports.filter(r => !existingIds.has(r.id));
            this.priceReports = [...this.priceReports, ...newFirebaseReports];
            
            console.log('Firebase에서 가격 변경 신고 불러오기 완료:', firebaseReports.length, '개');
            console.log('새로 추가된 Firebase 신고:', newFirebaseReports.length, '개');
            console.log('전체 가격 변경 신고 목록:', this.priceReports.map(r => ({ 
                id: r.id, 
                productId: r.productId, 
                status: r.status,
                oldPrice: r.oldPrice,
                newPrice: r.newPrice
            })));
            
        } catch (error) {
            console.error('Firebase에서 가격 변경 신고 불러오기 실패:', error);
        }
    }

    setupRealtimeListener() {
        try {
            // 제품 컬렉션 실시간 리스너
            if (window.firebase && window.firebase.firestore) {
                const db = window.firebase.firestore();
                const productsRef = db.collection('products');
                
                productsRef.onSnapshot((snapshot) => {
                    console.log('제품 실시간 데이터 업데이트 감지:', snapshot.docChanges().length, '개 변경');
                    
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'removed') {
                            console.log('제품 삭제 감지:', change.doc.id);
                            // 삭제된 제품을 로컬 데이터에서도 제거
                            this.products = this.products.filter(p => p.id !== change.doc.id);
                            
                            // DOM에서도 제거
                            const productElement = document.querySelector(`[data-product-id="${change.doc.id}"]`);
                            if (productElement) {
                                productElement.remove();
                                console.log('DOM에서 삭제된 제품 요소 제거 완료');
                            }
                            
                            // UI 강제 업데이트
                            this.forceUIUpdate();
                            
                            // 메인 화면도 즉시 업데이트
                            this.updateMainProductList();
                        } else if (change.type === 'added' || change.type === 'modified') {
                            console.log('제품 추가/수정 감지:', change.doc.id);
                            // 전체 목록 새로고침
            this.loadProductsFromFirebase();
                        }
                    });
                });
                
                // 가격 변경 신고 컬렉션 실시간 리스너
                const reportsRef = db.collection('priceReports');
                reportsRef.onSnapshot((snapshot) => {
                    console.log('신고 실시간 데이터 업데이트 감지:', snapshot.docChanges().length, '개 변경');
                    
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'removed') {
                            console.log('신고 삭제 감지:', change.doc.id);
                            // 삭제된 신고를 로컬 데이터에서도 제거
                            if (this.priceReports) {
                                this.priceReports = this.priceReports.filter(r => r.id !== change.doc.id);
                            }
                            
                            // DOM에서도 제거
                            const reportElement = document.querySelector(`[data-report-id="${change.doc.id}"]`);
                            if (reportElement) {
                                reportElement.remove();
                                console.log('DOM에서 삭제된 신고 요소 제거 완료');
                            }
                        } else if (change.type === 'added' || change.type === 'modified') {
                            console.log('신고 추가/수정 감지:', change.doc.id);
                            const reportData = { id: change.doc.id, ...change.doc.data() };
                            
                            if (change.type === 'added') {
                                // 새 신고 추가
                                this.priceReports.push(reportData);
                                console.log('새 가격 변경 신고 추가됨:', reportData);
                            } else if (change.type === 'modified') {
                                // 기존 신고 수정
                                const index = this.priceReports.findIndex(r => r.id === change.doc.id);
                                if (index !== -1) {
                                    this.priceReports[index] = reportData;
                                    console.log('가격 변경 신고 수정됨:', reportData);
                                }
                            }
                            
                            // 신고 목록 새로고침
                            this.loadPriceReports();
                        }
                    });
                });
                
        console.log('실시간 리스너가 설정되었습니다.');
            } else {
                console.warn('Firebase가 로드되지 않아 실시간 리스너를 설정할 수 없습니다.');
            }
        } catch (error) {
            console.error('실시간 리스너 설정 실패:', error);
        }
    }

    // 관리자 기능들
    async loadPendingProducts() {
        try {
            console.log('승인 대기 제품 불러오기 시작 - 로컬 데이터 사용');
            
            // 로컬 데이터 사용 (실시간 동기화된 데이터)
            const products = this.products.filter(p => p.status === 'pending');
            
            console.log('로컬에서 필터링된 대기 제품 수:', products.length);
            console.log('승인 대기 제품 목록:', products.map(p => ({ name: p.name, status: p.status })));
            
            this.displayPendingProducts(products);
            this.setupWheelNavigation(products, 'pending');
        } catch (error) {
            console.error('대기 중인 제품 불러오기 실패:', error);
        }
    }

    async loadAllProducts() {
        try {
            console.log('전체 제품 불러오기 시작 - 로컬 데이터 사용');
            
            // 로컬 데이터 사용 (실시간 동기화된 데이터)
            const products = this.products.filter(p => p.status !== 'rejected');
            
            console.log('로컬에서 필터링된 제품 수:', products.length);
            console.log('전체 제품 목록:', products.map(p => ({ name: p.name, status: p.status })));
            
            this.displayAllProductsAdmin(products);
            this.setupWheelNavigation(products, 'all');
        } catch (error) {
            console.error('전체 제품 불러오기 실패:', error);
        }
    }

    displayPendingProducts(products) {
        const adminContent = document.getElementById('pendingProductsList');
        adminContent.innerHTML = `
            <h3>승인 대기 중인 제품 (${products.length}개)</h3>
            <div class="pending-products">
                ${products.map(product => this.createPendingProductElement(product)).join('')}
            </div>
        `;
    }

    displayAllProductsAdmin(products) {
        const adminContent = document.getElementById('pendingProductsList');
        adminContent.innerHTML = `
            <h3>전체 제품 관리 (${products.length}개)</h3>
            <div class="all-products">
                ${products.map(product => this.createAllProductElement(product)).join('')}
            </div>
        `;
        
        // 마우스 휠 네비게이션 설정
        this.setupWheelNavigation(products, 'all');
    }

    createPendingProductElement(product) {
        const finalPrice = this.calculateFinalPrice(product);
        
        return `
            <div class="pending-product-item" data-product-id="${product.id}" draggable="true">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p><strong>쇼핑몰:</strong> ${product.store}</p>
                    <p><strong>가격:</strong> ${product.originalPrice.toLocaleString()}원</p>
                    <p><strong>최종가격:</strong> ${finalPrice.toLocaleString()}원</p>
                    <p><strong>카테고리:</strong> ${product.category}</p>
                    <p><strong>신고자:</strong> ${product.submittedBy}</p>
                    <p><strong>링크:</strong> <a href="${product.link}" target="_blank">제품 보기</a></p>
                </div>
                <div class="admin-controls">
                    <button class="approve-btn" onclick="approveProduct('${product.id}')">승인</button>
                    <button class="edit-btn" onclick="editProduct('${product.id}')">수정</button>
                    <button class="reject-btn" onclick="showDeleteConfirmation('product', '${product.id}', '${product.name}')">삭제</button>
                    <a href="${product.link || '#'}" target="_blank" class="link-btn">연결</a>
                </div>
            </div>
        `;
    }

    createAllProductElement(product) {
        const finalPrice = this.calculateFinalPrice(product);
        const statusText = product.status === 'approved' ? '승인됨' : 
                          product.status === 'pending' ? '대기중' : '거부됨';
        const statusClass = product.status === 'approved' ? 'status-approved' : 
                           product.status === 'pending' ? 'status-pending' : 'status-rejected';
        
        return `
            <div class="admin-product-item all-product-item" data-product-id="${product.id}" draggable="true">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p><strong>쇼핑몰:</strong> ${product.store}</p>
                    <p><strong>가격:</strong> ${product.originalPrice.toLocaleString()}원</p>
                    <p><strong>최종가격:</strong> ${finalPrice.toLocaleString()}원</p>
                    <p><strong>카테고리:</strong> ${product.category}</p>
                    <p><strong>상태:</strong> <span class="${statusClass}">${statusText}</span></p>
                    <p><strong>등록자:</strong> ${product.submittedBy}</p>
                </div>
                <div class="admin-controls">
                    ${product.status !== 'approved' ? `<button class="approve-btn" onclick="approveProduct('${product.id}')">승인</button>` : ''}
                    <button class="edit-btn" onclick="editProduct('${product.id}')">수정</button>
                    ${product.status !== 'rejected' ? `<button class="reject-btn" onclick="showDeleteConfirmation('product', '${product.id}', '${product.name}')">삭제</button>` : ''}
                    <a href="${product.link || '#'}" target="_blank" class="link-btn">연결</a>
                </div>
            </div>
        `;
    }


    // UI 강제 업데이트 함수
    forceUIUpdate() {
        console.log('UI 강제 업데이트 시작');
        
        // 메인 제품 목록 업데이트
        this.updateMainProductList();
        
        // 검색 결과도 업데이트
        if (this.currentSearchTerm) {
            this.performSearch();
        }
        
        // 관리자 패널이 열려있다면 새로고침
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel && adminPanel.style.display !== 'none') {
            // 현재 어떤 관리자 뷰가 열려있는지 확인하고 새로고침
            const pendingList = document.getElementById('pendingProductsList');
            if (pendingList && pendingList.innerHTML.includes('승인 대기')) {
                this.loadPendingProducts();
            } else if (pendingList && pendingList.innerHTML.includes('전체 제품')) {
                this.loadAllProducts();
            } else if (pendingList && pendingList.innerHTML.includes('가격 변경 신고')) {
                this.loadPriceReports();
            }
        }
        
        console.log('UI 강제 업데이트 완료');
    }

    // 메인 제품 목록 업데이트 함수
    updateMainProductList() {
        const productList = document.getElementById('productList');
        if (!productList) {
            console.warn('productList 요소를 찾을 수 없습니다.');
            return;
        }

        // 현재 필터링된 제품들만 표시
        let filteredProducts = this.products;
        
        // 현재 선택된 카테고리 필터 적용
        const activeCategory = document.querySelector('.category-item.active');
        if (activeCategory) {
            const categoryName = activeCategory.querySelector('.category-name').textContent;
            if (categoryName !== '전체') {
                filteredProducts = this.products.filter(product => 
                    this.getCategoryFromName(product.name) === categoryName
                );
            }
        }

        // 가격순 정렬 (낮은 가격부터 높은 가격 순)
        filteredProducts.sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB;
        });

        // 제품 목록 렌더링
        if (filteredProducts.length === 0) {
            productList.innerHTML = '<div class="no-products">등록된 제품이 없습니다.</div>';
        } else {
            productList.innerHTML = filteredProducts.map(product => this.createProductElement(product)).join('');
        }

        // 카테고리 카운트 업데이트
        this.updateCategoryCounts();
        
        console.log(`메인 제품 목록 업데이트 완료: ${filteredProducts.length}개 제품 표시 (가격순 정렬)`);
    }

    // 제품 수정 기능
    editProduct(productId) {
        if (!adminAuth.requireAuth()) {
            return;
        }

        // 제품 정보 찾기
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            // 제품이 로컬 데이터에 없으면 DOM에서도 제거
            const productElements = document.querySelectorAll(`[data-product-id="${productId}"]`);
            productElements.forEach(element => {
                element.remove();
                console.log('수정 시도 중 삭제된 제품 요소 제거:', productId);
            });
            
            alert('제품을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.');
            return;
        }

        // 수정 폼 표시
        this.showEditForm(product);
    }

    // 수정 폼 표시 (팝업창)
    showEditForm(product) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('editPopup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // 팝업 HTML 생성
        const popupHTML = `
            <div id="editPopup" class="edit-popup-overlay">
                <div class="edit-popup-container">
                    <div class="edit-popup-header">
                        <h3>제품 수정</h3>
                        <button class="edit-popup-close" onclick="closeEditPopup()">×</button>
                    </div>
                    <div class="edit-popup-content">
                        <form id="productEditForm" class="product-form">
                            <div class="form-group">
                                <label for="editProductName">제품명</label>
                                <input type="text" id="editProductName" value="${product.name}" placeholder="제품명을 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editProductPrice">가격 (원)</label>
                                <input type="number" id="editProductPrice" value="${product.originalPrice}" placeholder="가격을 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editProductLink">제품 링크</label>
                                <input type="url" id="editProductLink" value="${product.link}" placeholder="https://example.com">
                            </div>
                            <div class="form-group">
                                <label for="editProductStore">쇼핑몰</label>
                                <input type="text" id="editProductStore" value="${product.store}" placeholder="미선택">
                            </div>
                            <div class="form-group">
                                <label for="editProductCategory">카테고리</label>
                                <select id="editProductCategory">
                                    <option value="">카테고리를 선택하세요</option>
                                    <option value="전자제품" ${product.category === '전자제품' ? 'selected' : ''}>전자제품</option>
                                    <option value="의류" ${product.category === '의류' ? 'selected' : ''}>의류</option>
                                    <option value="식품" ${product.category === '식품' ? 'selected' : ''}>식품</option>
                                    <option value="생활용품" ${product.category === '생활용품' ? 'selected' : ''}>생활용품</option>
                                    <option value="도서" ${product.category === '도서' ? 'selected' : ''}>도서</option>
                                    <option value="스포츠" ${product.category === '스포츠' ? 'selected' : ''}>스포츠</option>
                                    <option value="뷰티" ${product.category === '뷰티' ? 'selected' : ''}>뷰티</option>
                                    <option value="기타" ${product.category === '기타' ? 'selected' : ''}>기타</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editProductStatus">상태</label>
                                <select id="editProductStatus">
                                    <option value="pending" ${product.status === 'pending' ? 'selected' : ''}>대기중</option>
                                    <option value="approved" ${product.status === 'approved' ? 'selected' : ''}>승인됨</option>
                                    <option value="rejected" ${product.status === 'rejected' ? 'selected' : ''}>거부됨</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-btn" onclick="closeEditPopup()">취소</button>
                                <button type="submit" class="submit-btn">수정 완료</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // 팝업을 body에 추가
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // 팝업 열기 애니메이션
        setTimeout(() => {
            const popup = document.getElementById('editPopup');
            if (popup) {
                popup.classList.add('open');
            }
        }, 10);

        // 폼 제출 이벤트 리스너 추가
        document.getElementById('productEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProduct(product.id);
        });
    }

    // 제품 업데이트
    async updateProduct(productId) {
        try {
            const formData = {
                name: document.getElementById('editProductName').value.trim() || '제품명 미입력',
                originalPrice: parseInt(document.getElementById('editProductPrice').value) || 0,
                link: document.getElementById('editProductLink').value.trim() || '링크 미입력',
                store: document.getElementById('editProductStore').value.trim() || '미선택',
                category: document.getElementById('editProductCategory').value || '기타',
                status: document.getElementById('editProductStatus').value
            };

            // Firebase 업데이트
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, formData);

            console.log('제품 수정 완료:', productId);
            alert('제품이 수정되었습니다.');

            // 팝업 닫기
            closeEditPopup();

            // 목록 새로고침
            this.loadAllProducts();

        } catch (error) {
            console.error('제품 수정 실패:', error);
            alert('제품 수정에 실패했습니다.');
        }
    }

    // 가격 변경 신고 수정 기능
    editPriceReport(reportId) {
        if (!adminAuth.requireAuth()) {
            return;
        }

        // 신고 정보 찾기
        const report = this.priceReports.find(r => r.id === reportId);
        if (!report) {
            alert('신고를 찾을 수 없습니다.');
            return;
        }

        // 가격 수정 폼 표시
        this.showPriceEditForm(report);
    }

    // 가격 수정 폼 표시 (팝업창)
    showPriceEditForm(report) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('editPopup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const product = this.products.find(p => p.id === report.productId);
        const productName = product ? product.name : '알 수 없는 제품';

        // 가격 수정 팝업 HTML 생성
        const popupHTML = `
            <div id="editPopup" class="edit-popup-overlay">
                <div class="edit-popup-container">
                    <div class="edit-popup-header">
                        <h3>가격 변경 신고 수정</h3>
                        <button class="edit-popup-close" onclick="closeEditPopup()">×</button>
                    </div>
                    <div class="edit-popup-content">
                        <form id="priceEditForm" class="product-form">
                            <div class="form-group">
                                <label>제품명</label>
                                <input type="text" value="${productName}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="editOldPrice">기존 가격 (원)</label>
                                <input type="number" id="editOldPrice" value="${report.oldPrice}" placeholder="기존 가격을 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editNewPrice">신고 가격 (원)</label>
                                <input type="number" id="editNewPrice" value="${report.newPrice}" placeholder="신고 가격을 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editReporter">신고자</label>
                                <input type="text" id="editReporter" value="${report.reporter}" placeholder="신고자를 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editReportStatus">상태</label>
                                <select id="editReportStatus">
                                    <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>대기중</option>
                                    <option value="approved" ${report.status === 'approved' ? 'selected' : ''}>승인됨</option>
                                    <option value="rejected" ${report.status === 'rejected' ? 'selected' : ''}>거부됨</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-btn" onclick="closeEditPopup()">취소</button>
                                <button type="submit" class="submit-btn">수정 완료</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // 팝업을 body에 추가
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // 팝업 열기 애니메이션
        setTimeout(() => {
            const popup = document.getElementById('editPopup');
            if (popup) {
                popup.classList.add('open');
            }
        }, 10);

        // 폼 제출 이벤트 리스너 추가
        document.getElementById('priceEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePriceReport(report.id);
        });
    }

    // 가격 변경 신고 업데이트
    async updatePriceReport(reportId) {
        try {
            const formData = {
                oldPrice: parseInt(document.getElementById('editOldPrice').value) || 0,
                newPrice: parseInt(document.getElementById('editNewPrice').value) || 0,
                reporter: document.getElementById('editReporter').value.trim() || '신고자 미입력',
                status: document.getElementById('editReportStatus').value
            };

            // Firebase 업데이트
            const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
            await window.firebaseUpdateDoc(reportRef, formData);

            console.log('가격 변경 신고 수정 완료:', reportId);
            alert('가격 변경 신고가 수정되었습니다.');

            // 팝업 닫기
            closeEditPopup();

            // 목록 새로고침
            this.loadPriceReports();

        } catch (error) {
            console.error('가격 변경 신고 수정 실패:', error);
            alert('가격 변경 신고 수정에 실패했습니다.');
        }
    }

    async approveProduct(productId) {
        try {
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, {
                status: 'approved'
            });
            
            alert('제품이 승인되었습니다.');
            this.loadPendingProducts();
            
        } catch (error) {
            console.error('제품 승인 실패:', error);
            alert('제품 승인에 실패했습니다.');
        }
    }

    async loadPriceReports() {
        try {
            console.log('가격 변경 신고 불러오기 시작');
            
            // Firebase에서 최신 데이터 불러오기
            await this.loadPriceReportsFromFirebase();
            
            // 대기 중인 신고만 필터링
            const reports = this.priceReports ? this.priceReports.filter(r => r.status === 'pending') : [];
            
            console.log('로컬에서 필터링된 신고 수:', reports.length);
            console.log('가격 변경 신고 목록:', reports.map(r => ({ id: r.id, status: r.status })));
            
            this.displayPriceReports(reports);
            this.setupWheelNavigation(reports, 'reports');
        } catch (error) {
            console.error('가격 변경 신고 불러오기 실패:', error);
        }
    }

    displayPriceReports(reports) {
        const adminContent = document.getElementById('pendingProductsList');
        
        if (reports.length === 0) {
            adminContent.innerHTML = `
                <h3>가격 변경 신고 (0개)</h3>
                <div class="no-reports">
                    <p>대기 중인 가격 변경 신고가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        adminContent.innerHTML = `
            <h3>가격 변경 신고 (${reports.length}개)</h3>
            <div class="price-reports">
                ${reports.map(report => this.createPriceReportElement(report)).join('')}
            </div>
        `;
    }

    // 마우스 휠 네비게이션 설정
    setupWheelNavigation(items, type) {
        const adminPanel = document.querySelector('.admin-panel');
        if (!adminPanel) return;

        // 기존 휠 이벤트 제거
        adminPanel.removeEventListener('wheel', this.handleWheelNavigation);

        // 현재 아이템 인덱스
        this.currentItemIndex = 0;
        this.currentItems = items;
        this.currentType = type;

        // 휠 이벤트 핸들러 바인딩
        this.handleWheelNavigation = this.handleWheelNavigation.bind(this);
        adminPanel.addEventListener('wheel', this.handleWheelNavigation);
        
        console.log(`${type} 아이템 ${items.length}개에 휠 네비게이션 설정됨`);
    }

    // 마우스 휠 이벤트 처리
    handleWheelNavigation(event) {
        // 스크롤이 맨 위에 있을 때만 네비게이션 작동
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel.scrollTop > 10) {
            return; // 스크롤이 있으면 일반 스크롤 허용
        }

        event.preventDefault();
        
        if (event.deltaY > 0) {
            // 아래로 스크롤 - 다음 아이템
            this.navigateToNextItem();
        } else if (event.deltaY < 0) {
            // 위로 스크롤 - 이전 아이템
            this.navigateToPreviousItem();
        }
    }

    // 다음 아이템으로 이동
    navigateToNextItem() {
        if (this.currentItemIndex < this.currentItems.length - 1) {
            this.currentItemIndex++;
            this.highlightCurrentItem();
            console.log(`${this.currentType} 아이템 ${this.currentItemIndex + 1}/${this.currentItems.length}로 이동`);
        }
    }

    // 이전 아이템으로 이동
    navigateToPreviousItem() {
        if (this.currentItemIndex > 0) {
            this.currentItemIndex--;
            this.highlightCurrentItem();
            console.log(`${this.currentType} 아이템 ${this.currentItemIndex + 1}/${this.currentItems.length}로 이동`);
        }
    }

    // 현재 아이템 하이라이트
    highlightCurrentItem() {
        // 기존 하이라이트 제거
        const existingHighlights = document.querySelectorAll('.item-highlighted');
        existingHighlights.forEach(item => item.classList.remove('item-highlighted'));

        // 현재 아이템 하이라이트
        const items = document.querySelectorAll('.admin-product-item, .admin-report-item, .all-product-item');
        if (items[this.currentItemIndex]) {
            items[this.currentItemIndex].classList.add('item-highlighted');
            
            // 스크롤하여 현재 아이템이 보이도록
            items[this.currentItemIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    // 삭제 확인 팝업 표시
    showDeleteConfirmation(itemType, itemId, itemName) {
        const popup = document.getElementById('deleteConfirmationPopup');
        const messageElement = document.getElementById('deleteConfirmationMessage');
        
        // 메시지 설정
        let message = '';
        if (itemType === 'product') {
            message = `"${itemName}" 제품을 정말로 삭제하시겠습니까?`;
        } else if (itemType === 'report') {
            message = `"${itemName}" 가격 변경 신고를 정말로 삭제하시겠습니까?`;
        } else {
            message = `"${itemName}" 항목을 정말로 삭제하시겠습니까?`;
        }
        
        messageElement.textContent = message;
        
        // 팝업 표시
        popup.classList.add('open');
        
        // 이벤트 리스너 설정
        this.setupDeleteConfirmationEvents(itemType, itemId);
    }

    // 삭제 확인 팝업 이벤트 설정
    setupDeleteConfirmationEvents(itemType, itemId) {
        const yesBtn = document.getElementById('deleteConfirmYes');
        const noBtn = document.getElementById('deleteConfirmNo');
        
        // 기존 이벤트 리스너 제거
        yesBtn.replaceWith(yesBtn.cloneNode(true));
        noBtn.replaceWith(noBtn.cloneNode(true));
        
        // 새로운 이벤트 리스너 추가
        document.getElementById('deleteConfirmYes').addEventListener('click', () => {
            this.confirmDelete(itemType, itemId);
        });
        
        document.getElementById('deleteConfirmNo').addEventListener('click', () => {
            this.cancelDelete();
        });
    }

    // 삭제 확인
    async confirmDelete(itemType, itemId) {
        this.hideDeleteConfirmation();
        
        try {
            if (itemType === 'product') {
                await this.deleteProduct(itemId);
            } else if (itemType === 'report') {
                await this.deletePriceReport(itemId);
            }
            
            // 삭제 성공 후 추가 확인
            console.log('삭제 작업 완료, UI 업데이트 확인 중...');
            
            // 잠시 후 목록이 실제로 업데이트되었는지 확인
            setTimeout(() => {
                const remainingItems = document.querySelectorAll(`[data-product-id="${itemId}"], [data-report-id="${itemId}"]`);
                if (remainingItems.length > 0) {
                    console.warn('삭제 후에도 요소가 남아있음, 강제 제거 시도');
                    remainingItems.forEach(item => item.remove());
                    
                    // UI 강제 업데이트
                    this.forceUIUpdate();
                    
                    // 메인 화면도 즉시 업데이트
                    this.updateMainProductList();
                }
                
                // 로컬 데이터와 DOM 동기화 확인
                const productInData = this.products.find(p => p.id === itemId);
                const productInDOM = document.querySelector(`[data-product-id="${itemId}"]`);
                
                if (!productInData && productInDOM) {
                    console.warn('데이터는 삭제되었지만 DOM에 남아있음, 강제 제거');
                    productInDOM.remove();
                    this.forceUIUpdate();
                }
            }, 1000);
            
        } catch (error) {
            console.error('삭제 확인 처리 중 오류:', error);
            alert('삭제 처리 중 오류가 발생했습니다.');
        }
    }

    // 삭제 취소
    cancelDelete() {
        this.hideDeleteConfirmation();
    }

    // 삭제 확인 팝업 숨기기
    hideDeleteConfirmation() {
        const popup = document.getElementById('deleteConfirmationPopup');
        popup.classList.remove('open');
    }

    // 제품 삭제 함수
    async deleteProduct(productId) {
        try {
            console.log('제품 삭제 시작:', productId);
            
            // Firebase에서 제품 삭제 - 여러 방법 시도
            let firebaseDeleteSuccess = false;
            
            // 방법 1: 직접 Firebase API 사용
            if (window.firebase && window.firebase.firestore) {
                try {
                    const db = window.firebase.firestore();
                    const productRef = db.collection('products').doc(productId);
                    await productRef.delete();
                    console.log('Firebase에서 제품 삭제 완료 (방법 1):', productId);
                    firebaseDeleteSuccess = true;
                } catch (firebaseError) {
                    console.error('Firebase 삭제 방법 1 실패:', firebaseError);
                }
            }
            
            // 방법 2: 전역 Firebase 함수 사용
            if (!firebaseDeleteSuccess && window.firebaseDeleteDoc && window.firebaseDoc && window.firebaseDb) {
                try {
                    const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
                    await window.firebaseDeleteDoc(productRef);
                    console.log('Firebase에서 제품 삭제 완료 (방법 2):', productId);
                    firebaseDeleteSuccess = true;
                } catch (firebaseError) {
                    console.error('Firebase 삭제 방법 2 실패:', firebaseError);
                }
            }
            
            // 방법 3: fetch API로 직접 삭제
            if (!firebaseDeleteSuccess) {
                try {
                    const response = await fetch(`https://firestore.googleapis.com/v1/projects/price-match-1f952/databases/(default)/documents/products/${productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        console.log('Firebase에서 제품 삭제 완료 (방법 3):', productId);
                        firebaseDeleteSuccess = true;
                    } else {
                        console.error('Firebase 삭제 방법 3 실패:', response.status, response.statusText);
                    }
                } catch (fetchError) {
                    console.error('Firebase 삭제 방법 3 실패:', fetchError);
                }
            }
            
            // 방법 4: 강제 삭제 (실시간 리스너를 통한 삭제)
            if (!firebaseDeleteSuccess) {
                try {
                    console.log('방법 4: 실시간 리스너를 통한 강제 삭제 시도');
                    // 실시간 리스너가 삭제를 감지하도록 강제로 트리거
                    if (window.firebase && window.firebase.firestore) {
                        const db = window.firebase.firestore();
                        const productRef = db.collection('products').doc(productId);
                        
                        // 문서 존재 여부 확인 후 삭제
                        const docSnapshot = await productRef.get();
                        if (docSnapshot.exists) {
                            await productRef.delete();
                            console.log('Firebase에서 제품 삭제 완료 (방법 4):', productId);
                            firebaseDeleteSuccess = true;
                        } else {
                            console.log('문서가 이미 존재하지 않음:', productId);
                            firebaseDeleteSuccess = true; // 이미 삭제된 것으로 간주
                        }
                    }
                } catch (error) {
                    console.error('방법 4 실패:', error);
                }
            }
            
            if (!firebaseDeleteSuccess) {
                console.error('모든 Firebase 삭제 방법이 실패했습니다!');
                alert('Firebase에서 제품 삭제에 실패했습니다. 관리자에게 문의하세요.');
                return;
            }
            
            // 로컬 데이터에서 제품 제거
            const originalLength = this.products.length;
            this.products = this.products.filter(p => p.id !== productId);
            console.log(`로컬 데이터에서 제품 제거 완료: ${originalLength} → ${this.products.length}`);
            
            // DOM에서도 제거
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (productElement) {
                productElement.remove();
                console.log('DOM에서 제품 요소 제거 완료');
            }
            
            alert('제품이 성공적으로 삭제되었습니다.');
            
            // 즉시 UI 강제 업데이트
            this.forceUIUpdate();
            
            // 목록 새로고침
            await this.loadPendingProducts();
            await this.loadAllProducts();
            
            // 추가로 메인 화면도 새로고침
            this.updateMainProductList();
            
        } catch (error) {
            console.error('제품 삭제 실패:', error);
            console.error('에러 상세:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            alert(`제품 삭제에 실패했습니다: ${error.message}`);
        }
    }

    // 가격 변경 신고 삭제 함수
    async deletePriceReport(reportId) {
        try {
            console.log('가격 변경 신고 삭제 시작:', reportId);
            
            // Firebase에서 신고 삭제 - 여러 방법 시도
            let firebaseDeleteSuccess = false;
            
            // 방법 1: 직접 Firebase API 사용
            if (window.firebase && window.firebase.firestore) {
                try {
                    const db = window.firebase.firestore();
                    const reportRef = db.collection('priceReports').doc(reportId);
                    await reportRef.delete();
                    console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 1):', reportId);
                    firebaseDeleteSuccess = true;
                } catch (firebaseError) {
                    console.error('Firebase 삭제 방법 1 실패:', firebaseError);
                }
            }
            
            // 방법 2: 전역 Firebase 함수 사용
            if (!firebaseDeleteSuccess && window.firebaseDeleteDoc && window.firebaseDoc && window.firebaseDb) {
                try {
                    const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
                    await window.firebaseDeleteDoc(reportRef);
                    console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 2):', reportId);
                    firebaseDeleteSuccess = true;
                } catch (firebaseError) {
                    console.error('Firebase 삭제 방법 2 실패:', firebaseError);
                }
            }
            
            // 방법 3: 실제 프로젝트 ID로 fetch API 사용
            if (!firebaseDeleteSuccess) {
                try {
                    // 실제 Firebase 프로젝트 ID 사용
                    const projectId = 'price-match-1f952';
                    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/priceReports/${reportId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 3):', reportId);
                        firebaseDeleteSuccess = true;
                    } else {
                        console.error('Firebase 삭제 방법 3 실패:', response.status, response.statusText);
                    }
                } catch (fetchError) {
                    console.error('Firebase 삭제 방법 3 실패:', fetchError);
                }
            }
            
            // 방법 4: 강제 삭제 (실시간 리스너를 통한 삭제)
            if (!firebaseDeleteSuccess) {
                try {
                    console.log('방법 4: 실시간 리스너를 통한 강제 삭제 시도');
                    // 실시간 리스너가 삭제를 감지하도록 강제로 트리거
                    if (window.firebase && window.firebase.firestore) {
                        const db = window.firebase.firestore();
                        const reportRef = db.collection('priceReports').doc(reportId);
                        
                        // 문서 존재 여부 확인 후 삭제
                        const docSnapshot = await reportRef.get();
                        if (docSnapshot.exists) {
                            await reportRef.delete();
                            console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 4):', reportId);
                            firebaseDeleteSuccess = true;
                        } else {
                            console.log('문서가 이미 존재하지 않음:', reportId);
                            firebaseDeleteSuccess = true; // 이미 삭제된 것으로 간주
                        }
                    }
                } catch (error) {
                    console.error('방법 4 실패:', error);
                }
            }
            
            if (!firebaseDeleteSuccess) {
                console.error('모든 Firebase 삭제 방법이 실패했습니다!');
                alert('Firebase에서 가격 변경 신고 삭제에 실패했습니다. 관리자에게 문의하세요.');
                return;
            }
            
            // 로컬 데이터에서 신고 제거
            if (this.priceReports) {
                const originalLength = this.priceReports.length;
                this.priceReports = this.priceReports.filter(r => r.id !== reportId);
                console.log(`로컬 데이터에서 신고 제거 완료: ${originalLength} → ${this.priceReports.length}`);
            }
            
            // DOM에서도 제거
            const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
            if (reportElement) {
                reportElement.remove();
                console.log('DOM에서 신고 요소 제거 완료');
            }
            
            alert('가격 변경 신고가 성공적으로 삭제되었습니다.');
            
            // 목록 새로고침
            await this.loadPriceReports();
            
        } catch (error) {
            console.error('가격 변경 신고 삭제 실패:', error);
            console.error('에러 상세:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            alert(`가격 변경 신고 삭제에 실패했습니다: ${error.message}`);
        }
    }

    createPriceReportElement(report) {
        console.log('가격 신고 요소 생성:', report);
        
        const product = this.products.find(p => p.id === report.productId);
        const productName = product ? product.name : '알 수 없는 제품';
        const priceChange = report.newPrice - report.oldPrice;
        const changeText = priceChange > 0 ? `+${priceChange.toLocaleString()}원` : `${priceChange.toLocaleString()}원`;
        const changeClass = priceChange > 0 ? 'price-increase' : 'price-decrease';
        
        // productId가 없거나 유효하지 않은 경우 처리
        if (!report.productId) {
            console.error('productId가 없습니다:', report);
            return `
                <div class="price-report-item">
                    <div class="report-info">
                        <h4>오류: 제품 ID 없음</h4>
                        <p><strong>신고 ID:</strong> ${report.id}</p>
                        <p><strong>상태:</strong> ${report.status}</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="price-report-item" data-report-id="${report.id}" draggable="true">
                <div class="report-info">
                    <h4>${productName}</h4>
                    <p><strong>제품 ID:</strong> ${report.productId}</p>
                    <p><strong>기존 가격:</strong> ${report.oldPrice.toLocaleString()}원</p>
                    <p><strong>신고 가격:</strong> ${report.newPrice.toLocaleString()}원</p>
                    <p><strong>변동:</strong> <span class="${changeClass}">${changeText}</span></p>
                    <p><strong>신고자:</strong> ${report.reporter}</p>
                    <p><strong>신고 시간:</strong> ${this.formatUpdateTime(report.reportedAt)}</p>
                    <p><strong>상태:</strong> ${report.status === 'pending' ? '대기중' : report.status === 'approved' ? '승인됨' : '거부됨'}</p>
                </div>
                <div class="admin-controls">
                    ${report.status === 'pending' ? `
                        <button class="approve-btn" onclick="approvePriceChange('${report.id}', '${report.productId}', '${report.newPrice}')">승인</button>
                        <button class="edit-btn" onclick="editPriceReport('${report.id}')">수정</button>
                        <button class="reject-btn" onclick="showDeleteConfirmation('report', '${report.id}', '${productName}')">삭제</button>
                        <a href="${product ? product.link || '#' : '#'}" target="_blank" class="link-btn">연결</a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async approvePriceChange(reportId, productId, newPrice) {
        try {
            console.log('가격 변경 승인 시작:', { reportId, productId, newPrice });
            
            // 먼저 제품이 존재하는지 확인 (로컬 데이터에서 확인)
            const localProduct = this.products.find(p => p.id === productId);
            if (!localProduct) {
                console.error('로컬에서 제품을 찾을 수 없습니다:', productId);
                alert('제품을 찾을 수 없습니다. 제품이 삭제되었을 수 있습니다.');
                return;
            }
            
            // Firebase에서도 제품 존재 여부 확인 (더 안전한 방법)
            try {
                const productsQuery = window.firebaseQuery(
                    window.firebaseCollection(window.firebaseDb, 'products'),
                    window.firebaseWhere('__name__', '==', productId)
                );
                const productsSnapshot = await window.firebaseGetDocs(productsQuery);
                
                if (productsSnapshot.empty) {
                    console.error('Firebase에서 제품을 찾을 수 없습니다:', productId);
                    alert('제품을 찾을 수 없습니다. 제품이 삭제되었을 수 있습니다.');
                    return;
                }
                
                console.log('Firebase 제품 확인 완료');
            } catch (firebaseError) {
                console.warn('Firebase 제품 확인 실패, 로컬 데이터로 진행:', firebaseError);
                // Firebase 확인 실패해도 로컬 데이터가 있으면 진행
            }
            
            // 제품 가격 업데이트
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, {
                originalPrice: parseInt(newPrice),
                lastUpdated: new Date().toISOString()
            });
            
            console.log('제품 가격 업데이트 완료');
            
            // 신고 상태 업데이트
            const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
            await window.firebaseUpdateDoc(reportRef, {
                status: 'approved'
            });
            
            console.log('신고 상태 업데이트 완료');
            
            alert('가격 변경이 승인되었습니다.');
            
            // 로컬 제품 데이터도 업데이트 (이미 위에서 찾았으므로 재사용)
            localProduct.originalPrice = parseInt(newPrice);
            localProduct.lastUpdated = new Date().toISOString();
            
            // UI 새로고침
            this.loadPriceReports();
            this.displayAllProducts();
            
        } catch (error) {
            console.error('가격 변경 승인 실패:', error);
            console.error('오류 상세:', {
                message: error.message,
                code: error.code,
                reportId,
                productId,
                newPrice
            });
            
            let errorMessage = '가격 변경 승인에 실패했습니다.';
            if (error.code === 'permission-denied') {
                errorMessage = '권한이 없습니다. 관리자 권한을 확인해주세요.';
            } else if (error.code === 'not-found') {
                errorMessage = '제품 또는 신고를 찾을 수 없습니다.';
            } else if (error.message.includes('network')) {
                errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            }
            
            alert(errorMessage);
        }
    }

    async rejectPriceChange(reportId) {
        try {
            console.log('가격 변경 거부 시작:', { reportId });
            
            const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
            await window.firebaseUpdateDoc(reportRef, {
                status: 'rejected'
            });
            
            console.log('신고 상태 업데이트 완료 (거부)');
            
            alert('가격 변경 신고가 거부되었습니다.');
            
            // UI 새로고침
            this.loadPriceReports();
            
        } catch (error) {
            console.error('가격 변경 거부 실패:', error);
            console.error('오류 상세:', {
                message: error.message,
                code: error.code,
                reportId
            });
            
            let errorMessage = '가격 변경 거부에 실패했습니다.';
            if (error.code === 'permission-denied') {
                errorMessage = '권한이 없습니다. 관리자 권한을 확인해주세요.';
            } else if (error.code === 'not-found') {
                errorMessage = '신고를 찾을 수 없습니다.';
            } else if (error.message.includes('network')) {
                errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            }
            
            alert(errorMessage);
        }
    }

    // 카테고리 관련 메서드들
    updateCategoryCounts() {
        const approvedProducts = this.products.filter(p => p.status === 'approved');
        
        console.log('카테고리 카운트 업데이트 시작');
        console.log('전체 제품 수:', this.products.length);
        console.log('승인된 제품 수:', approvedProducts.length);
        console.log('승인된 제품 목록:', approvedProducts.map(p => ({ name: p.name, category: p.category })));
        
        // 전체 제품 수
        document.getElementById('totalCount').textContent = approvedProducts.length;
        
        // 카테고리별 제품 수
        document.getElementById('soyMilkCount').textContent = 
            approvedProducts.filter(p => p.category === '두유').length;
        document.getElementById('laptopCount').textContent = 
            approvedProducts.filter(p => p.category === '노트북').length;
        document.getElementById('mouseCount').textContent = 
            approvedProducts.filter(p => p.category === '마우스').length;
        document.getElementById('earphoneCount').textContent = 
            approvedProducts.filter(p => p.category === '이어폰').length;
        document.getElementById('milkCount').textContent = 
            approvedProducts.filter(p => p.category === '우유').length;
        document.getElementById('ramenCount').textContent = 
            approvedProducts.filter(p => p.category === '라면').length;
        document.getElementById('waterCount').textContent = 
            approvedProducts.filter(p => p.category === '생수').length;
        document.getElementById('tissueCount').textContent = 
            approvedProducts.filter(p => p.category === '화장지').length;
        document.getElementById('detergentCount').textContent = 
            approvedProducts.filter(p => p.category === '세제').length;
        document.getElementById('shampooCount').textContent = 
            approvedProducts.filter(p => p.category === '샴푸').length;
        document.getElementById('diaperCount').textContent = 
            approvedProducts.filter(p => p.category === '기저귀').length;
        document.getElementById('formulaCount').textContent = 
            approvedProducts.filter(p => p.category === '분유').length;
        document.getElementById('wipesCount').textContent = 
            approvedProducts.filter(p => p.category === '물티슈').length;
        document.getElementById('babyFoodCount').textContent = 
            approvedProducts.filter(p => p.category === '이유식').length;
        document.getElementById('etcCount').textContent = 
            approvedProducts.filter(p => p.category === '기타').length;
    }

    filterByCategory(category) {
        console.log('=== filterByCategory 시작 ===');
        console.log('선택된 카테고리:', category);
        console.log('현재 제품 목록:', this.products);
        console.log('카테고리 필터링 시작:', category);
        
        this.currentCategory = category;
        this.updateCategoryActiveState();
        
        if (category === '전체') {
            console.log('전체 카테고리 선택 - displayAllProducts 호출');
            this.displayAllProducts();
        } else {
            console.log('특정 카테고리 선택 - displayCategoryResults 호출');
            this.displayCategoryResults(category);
        }
        
        console.log('=== filterByCategory 완료 ===');
    }

    updateCategoryActiveState() {
        // 모든 카테고리에서 active 클래스 제거
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 현재 카테고리에 active 클래스 추가
        const currentCategoryItem = Array.from(document.querySelectorAll('.category-item'))
            .find(item => item.querySelector('.category-name').textContent === this.currentCategory);
        
        if (currentCategoryItem) {
            currentCategoryItem.classList.add('active');
        }
    }
}

// 전역 함수들
function toggleSection(sectionId) {
    // 관리자 패널 접근 시 인증 확인
    if (sectionId === 'adminPanel') {
        if (!adminAuth.requireAuth()) {
            return; // 인증 실패 시 패널 열지 않음
        }
    }
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
        
        // 폼이 열릴 때 이벤트 리스너 재설정
        if (sectionId === 'productFormDropdown' && !section.classList.contains('collapsed')) {
            if (window.priceComparisonSite) {
                window.priceComparisonSite.setupFormSubmitListener();
            }
        }
        
        // 관리자 패널이 열릴 때 승인 대기 제품 자동 로드
        if (sectionId === 'adminPanel' && !section.classList.contains('collapsed')) {
            if (window.priceComparisonSite) {
                console.log('관리자 패널 열림 - 승인 대기 제품 로드');
                window.priceComparisonSite.loadPendingProducts();
            }
        }
    }
}

function filterByCategory(category) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.filterByCategory(category);
    }
}

function approveProduct(productId) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        window.priceComparisonSite.approveProduct(productId);
    }
}

function rejectProduct(productId) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        // 제품 이름 찾기
        const product = window.priceComparisonSite.products.find(p => p.id === productId);
        const productName = product ? product.name : '알 수 없는 제품';
        
        // 삭제 확인 팝업 표시
        window.priceComparisonSite.showDeleteConfirmation('product', productId, productName);
    }
}

function approvePriceChange(reportId, productId, newPrice) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        window.priceComparisonSite.approvePriceChange(reportId, productId, newPrice);
    }
}

function rejectPriceChange(reportId) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        // 신고 정보 찾기
        const report = window.priceComparisonSite.priceReports ? 
            window.priceComparisonSite.priceReports.find(r => r.id === reportId) : null;
        const reportName = report ? 
            (window.priceComparisonSite.products.find(p => p.id === report.productId)?.name || '알 수 없는 제품') : 
            '알 수 없는 신고';
        
        // 삭제 확인 팝업 표시
        window.priceComparisonSite.showDeleteConfirmation('report', reportId, reportName);
    }
}

// 삭제 확인 팝업 표시 함수 (전역)
function showDeleteConfirmation(itemType, itemId, itemName) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.showDeleteConfirmation(itemType, itemId, itemName);
    }
}

// 수정 팝업 닫기 함수
function closeEditPopup() {
    const popup = document.getElementById('editPopup');
    if (popup) {
        popup.classList.remove('open');
        
        // 애니메이션 완료 후 제거
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// 수정 사이드 패널 닫기 함수 (기존 함수 유지 - 호환성)
function closeEditSidebar() {
    closeEditPopup();
}

// 수정 폼 닫기 함수 (기존 함수 유지 - 호환성)
function closeEditForm() {
    closeEditSidebar();
}

// 제품 수정 함수
function editProduct(productId) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.editProduct(productId);
    }
}

// 가격 변경 신고 수정 함수
function editPriceReport(reportId) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.editPriceReport(reportId);
    }
}

function reportPriceChange(productId, currentPrice) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.reportPriceChange(productId, currentPrice);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.priceComparisonSite = new PriceComparisonSite();
});