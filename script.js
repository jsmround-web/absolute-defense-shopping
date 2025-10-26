// 절대방어 쇼핑 - 가격비교 사이트

// 관리자 인증 시스템
class AdminAuth {
    constructor() {
        this.adminPassword = 'jsmwta5556'; // 관리자 비밀번호
        this.authenticated = false;
        this.sessionTimeout = 2 * 60 * 60 * 1000; // 2시간 세션 타임아웃
        this.sessionStartTime = null;
        this.lastActivityTime = null;
        this.sessionCheckInterval = null;
        this.init();
    }

    // 초기화 - 세션 체크 시작
    init() {
        // 세션 자동 체크 (1분마다)
        this.sessionCheckInterval = setInterval(() => {
            this.checkSession();
        }, 60000); // 1분마다 체크
        
        // 마지막 활동 시간 업데이트 (이벤트 리스너)
        this.setupActivityTracking();
    }

    // 마지막 활동 시간 추적
    setupActivityTracking() {
        // 클릭, 키보드, 스크롤 등의 활동 감지
        const activities = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
        
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                if (this.authenticated) {
                    this.updateLastActivityTime();
                }
            }, { passive: true });
        });
        
        // 관리자 패널 열기/닫기도 활동으로 간주
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            const observer = new MutationObserver(() => {
                if (this.authenticated) {
                    this.updateLastActivityTime();
                }
            });
            observer.observe(adminPanel, { attributes: true, attributeFilter: ['class'] });
        }
    }

    // 마지막 활동 시간 업데이트
    updateLastActivityTime() {
        const now = Date.now();
        this.lastActivityTime = now;
        localStorage.setItem('admin_last_activity', now.toString());
        console.log('활동 시간 업데이트:', new Date(now).toLocaleString());
    }

    // 관리자 인증
    authenticate() {
        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password === this.adminPassword) {
            this.authenticated = true;
            const now = Date.now();
            this.sessionStartTime = now;
            this.lastActivityTime = now;
            
            localStorage.setItem('admin_session', 'true');
            localStorage.setItem('admin_time', now.toString());
            localStorage.setItem('admin_last_activity', now.toString());
            
            console.log('관리자 인증 성공 - 2시간 세션 시작');
            
            // 필독 패널 수정 버튼 표시
            if (window.priceComparisonSite) {
                window.priceComparisonSite.updateNoticeEditButton();
            }
            
            return true;
        } else {
            alert('잘못된 비밀번호입니다.');
            console.log('관리자 인증 실패');
            return false;
        }
    }

    // 세션 확인 (마지막 활동 시간 기준)
    checkSession() {
        const session = localStorage.getItem('admin_session');
        const lastActivity = localStorage.getItem('admin_last_activity');
        
        if (session === 'true' && lastActivity) {
            const lastActivityTime = parseInt(lastActivity);
            const elapsed = Date.now() - lastActivityTime;
            
            if (elapsed < this.sessionTimeout) {
                // 세션 유효
                this.authenticated = true;
                this.lastActivityTime = lastActivityTime;
                
                // 남은 시간 표시 (선택사항)
                const remainingTime = Math.floor((this.sessionTimeout - elapsed) / 60000); // 분 단위
                if (remainingTime < 5 && remainingTime > 0) {
                    console.log(`관리자 세션: ${remainingTime}분 남음`);
                }
                
                // 필독 패널 수정 버튼 표시
                if (window.priceComparisonSite) {
                    window.priceComparisonSite.updateNoticeEditButton();
                }
                
                return true;
            } else {
                // 세션 만료 (마지막 활동으로부터 2시간 경과)
                console.log('관리자 세션이 만료되었습니다. (마지막 활동으로부터 2시간 경과)');
                this.logout();
                return false;
            }
        }
        return false;
    }

    // 로그아웃
    logout() {
        this.authenticated = false;
        this.sessionStartTime = null;
        this.lastActivityTime = null;
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_time');
        localStorage.removeItem('admin_last_activity');
        
        // 관리자 패널 닫기
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.classList.add('collapsed');
        }
        
        console.log('관리자 세션 종료');
    }

    // 관리자 권한 확인
    requireAuth() {
        if (this.checkSession()) {
            // 활동 시간 업데이트
            this.updateLastActivityTime();
            return true;
        } else {
            return this.authenticate();
        }
    }

    // 인증 상태 확인 메서드
    isAuthenticated() {
        return this.authenticated;
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
        this.isSubmittingComment = false; // 댓글 중복 제출 방지 플래그
        this.noticeListenersSetup = false; // 필독 패널 이벤트 리스너 중복 방지 플래그
        this.previousTotalPending = -1; // 이전 대기 신고 개수 (알림 소리용, 초기값 -1)
        this.localModifications = new Set(); // 로컬에서 수정된 제품 ID 추적
        this.init();
    }

    async init() {
        console.log('PriceComparisonSite 초기화 시작');
        console.log('현재 화면 크기:', window.innerWidth, 'x', window.innerHeight);
        console.log('User Agent:', navigator.userAgent);
        
        // 페이지뷰 추적
        gaTracker.trackPageView('절대방어 쇼핑 - 메인 페이지');
        
        // 모바일에서 헤더를 최상단으로 강제 이동
        this.forceHeaderToTop();
        
        // 모든 드롭다운 패널을 강제로 닫기
        this.closeAllDropdowns();
        
            // PC에서 버튼 바 상태 확인 및 강제 표시
            if (window.innerWidth > 768) {
                const pcButtonGroup = document.querySelector('.pc-button-group');
                const mobileButtonBar = document.querySelector('.top-button-bar.mobile-only');
                
                if (pcButtonGroup) {
                    console.log('PC 버튼 그룹 상태:', pcButtonGroup.style.display, pcButtonGroup.classList);
                    // PC용 버튼 그룹 강제 표시
                    pcButtonGroup.style.display = 'flex !important';
                    pcButtonGroup.style.visibility = 'visible !important';
                    pcButtonGroup.style.opacity = '1 !important';
                    pcButtonGroup.style.gap = '4px';
                    pcButtonGroup.style.alignItems = 'center';
                    pcButtonGroup.style.marginLeft = 'auto'; // 오른쪽 끝으로 밀기
                    console.log('PC 버튼 그룹 강제 표시 설정 완료');
                } else {
                    console.log('PC 버튼 그룹을 찾을 수 없습니다.');
                }
                
                // 모바일 버튼 바 완전히 숨김
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'none !important';
                    mobileButtonBar.style.visibility = 'hidden !important';
                    mobileButtonBar.style.opacity = '0 !important';
                    console.log('모바일용 버튼 바 완전 숨김 처리 완료');
                }
                
                // PC용 로고 스타일 강제 적용 - 로컬에서는 왼쪽 정렬
                const logo = document.querySelector('.logo');
                if (logo) {
                    // 로컬 환경 감지
                    const isLocal = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname === '';
                    
                    if (isLocal) {
                        // 로컬에서는 왼쪽 정렬
                        logo.style.textAlign = 'left';
                        logo.style.justifySelf = 'start';
                        logo.style.width = 'auto';
                        logo.style.fontSize = '1.32rem';
                        logo.style.color = '#1e40af'; /* 원래 파란색으로 복원 */
                        console.log('로컬 환경: 로고 왼쪽 정렬 적용');
                    } else {
                        // 배포에서는 가운데 정렬
                        logo.style.fontSize = '1.98rem';
                        logo.style.fontWeight = '600';
                        logo.style.color = '#1e40af'; /* 원래 파란색으로 복원 */
                        logo.style.textAlign = 'center';
                        logo.style.width = '100%';
                        console.log('배포 환경: 로고 가운데 정렬 적용');
                    }
                }
                
                // PC용 헤더 레이아웃 강제 적용 - 로컬에서는 flex 레이아웃
                const header = document.querySelector('.header');
                if (header) {
                    const isLocal = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname === '';
                    
                    if (isLocal) {
                        // 로컬에서는 flex 레이아웃
                        header.style.display = 'flex';
                        header.style.gridTemplateColumns = 'none';
                        header.style.alignItems = 'center';
                        console.log('로컬 환경: 헤더 flex 레이아웃 적용');
                    } else {
                        // 배포에서는 grid 레이아웃
                        header.style.display = 'grid';
                        header.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
                        header.style.alignItems = 'center';
                        console.log('배포 환경: 헤더 grid 레이아웃 적용');
                    }
                }
                
                // PC용 헤더 섹션 레이아웃 강제 적용
                const headerLeft = document.querySelector('.header-left');
                const headerCenter = document.querySelector('.header-center');
                const headerRight = document.querySelector('.header-right');
                
                const isLocal = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';
                
                if (isLocal) {
                    // 로컬에서는 flex 레이아웃
                    if (headerLeft) {
                        headerLeft.style.gridColumn = 'unset';
                        headerLeft.style.flex = '1';
                        console.log('로컬 환경: header-left flex 설정');
                    }
                    
                    if (headerCenter) {
                        headerCenter.style.gridColumn = 'unset';
                        headerCenter.style.justifyContent = 'flex-start';
                        console.log('로컬 환경: header-center 왼쪽 정렬');
                    }
                    
                    if (headerRight) {
                        headerRight.style.gridColumn = 'unset';
                        headerRight.style.flex = '0 0 auto';
                        console.log('로컬 환경: header-right 고정 크기');
                    }
                } else {
                    // 배포에서는 grid 레이아웃
                    if (headerLeft) {
                        headerLeft.style.gridColumn = '1 / 3';
                        console.log('배포 환경: header-left grid 위치 설정');
                    }
                    
                    if (headerCenter) {
                        headerCenter.style.gridColumn = '3';
                        console.log('배포 환경: header-center grid 위치 설정');
                    }
                    
                    if (headerRight) {
                        headerRight.style.gridColumn = '4 / 6';
                        console.log('배포 환경: header-right grid 위치 설정');
                    }
                }
            } else {
                // 모바일에서는 모바일용 버튼 바 표시
                const mobileButtonBar = document.querySelector('.top-button-bar.mobile-only');
                const pcButtonGroup = document.querySelector('.pc-button-group');
                
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'flex !important';
                    mobileButtonBar.style.visibility = 'visible !important';
                    mobileButtonBar.style.opacity = '1 !important';
                    mobileButtonBar.style.position = 'fixed';
                    mobileButtonBar.style.top = '0px';
                    mobileButtonBar.style.right = '0px';
                    mobileButtonBar.style.zIndex = '9999';
                    console.log('모바일용 버튼 바 표시 설정 완료');
                }
                
                // PC 버튼 그룹 완전히 숨김
                if (pcButtonGroup) {
                    pcButtonGroup.style.display = 'none !important';
                    pcButtonGroup.style.visibility = 'hidden !important';
                    pcButtonGroup.style.opacity = '0 !important';
                    console.log('PC용 버튼 그룹 완전 숨김 처리 완료');
                }
                
                // 모바일용 로고 스타일 강제 적용 - 좌측 정렬
                const logo = document.querySelector('.logo');
                if (logo) {
                    logo.style.textAlign = 'left';
                    logo.style.justifySelf = 'start';
                    console.log('모바일 로고 좌측 정렬 강제 적용 완료');
                }
            }
        
        // 추가로 관리 패널만 완전히 숨기기
        setTimeout(() => {
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.style.display = 'none';
                adminPanel.style.visibility = 'hidden';
                adminPanel.style.maxHeight = '0';
                adminPanel.style.padding = '0';
                adminPanel.style.overflow = 'hidden';
                adminPanel.classList.add('collapsed');
                console.log('관리 패널만 완전히 숨겼습니다.');
            }
        }, 100);
        
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
        
        // Firebase 초기화 후 관리 패널만 다시 숨기기 (혹시 모를 경우 대비)
        setTimeout(() => {
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.style.display = 'none';
                adminPanel.style.visibility = 'hidden';
                adminPanel.style.maxHeight = '0';
                adminPanel.style.padding = '0';
                adminPanel.style.overflow = 'hidden';
                adminPanel.classList.add('collapsed');
                console.log('Firebase 후 관리 패널만 다시 숨겼습니다.');
            }
        }, 1000);
        
        // Firebase 로드 완료 후 알림 업데이트 시작
        setTimeout(() => {
            console.log('=== 알림 시스템 시작 ===');
            console.log('현재 제품 개수:', this.products.length);
            console.log('현재 신고 개수:', this.priceReports ? this.priceReports.length : 0);
            this.startNotificationCheck();
        }, 5000);
        
        // 10초마다 리스너 상태 확인
        setInterval(() => {
            console.log('=== 리스너 상태 확인 ===');
            console.log('제품 개수:', this.products.length);
            console.log('신고 개수:', this.priceReports ? this.priceReports.length : 0);
            console.log('대기 제품:', this.products.filter(p => p.status === 'pending').length);
            console.log('대기 신고:', this.priceReports ? this.priceReports.filter(r => r.status === 'pending').length : 0);
            this.updateAdminNotification();
        }, 10000);
    }
    
    // 알림 확인 함수
    startNotificationCheck() {
        console.log('알림 체크 시스템 시작');
        
        // 초기 대기 신고 개수 저장
        const initializeNotification = () => {
            const pendingProducts = this.products.filter(p => p.status === 'pending').length;
            const pendingReports = this.priceReports ? this.priceReports.filter(r => r.status === 'pending').length : 0;
            const totalPending = pendingProducts + pendingReports;
            
            console.log('초기 알림 상태:', {
                previousTotalPending: this.previousTotalPending,
                totalPending: totalPending,
                pendingProducts: pendingProducts,
                pendingReports: pendingReports
            });
            
            // 초기 상태는 소리 없이 저장만
            if (this.previousTotalPending === -1) {
                this.previousTotalPending = totalPending;
                console.log('초기 대기 신고 개수 저장:', totalPending);
            }
            
            // 초기 알림 상태 확인
            this.updateAdminNotification();
        };
        
        // 3초 후 초기화 (Firebase 로딩 대기)
        setTimeout(initializeNotification, 3000);
        
        // 2초마다 주기적으로 알림 확인 (빠른 반응)
        setInterval(() => {
            console.log('주기적 알림 체크 실행');
            this.updateAdminNotification();
        }, 2000);
    }
    
    // 관리자 알림 업데이트
    updateAdminNotification() {
        console.log('=== 알림 업데이트 시작 ===');
        console.log('this.products:', this.products);
        console.log('this.priceReports:', this.priceReports);
        
        const notificationEl = document.getElementById('adminNotification');
        if (!notificationEl) {
            console.log('알림 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 대기 중인 신고 개수 계산
        const pendingProducts = this.products.filter(p => p.status === 'pending').length;
        const pendingReports = this.priceReports ? this.priceReports.filter(r => r.status === 'pending').length : 0;
        const totalPending = pendingProducts + pendingReports;
        
        console.log('현재 데이터 상태:', {
            productsCount: this.products.length,
            priceReportsCount: this.priceReports ? this.priceReports.length : 0,
            pendingProducts,
            pendingReports,
            totalPending,
            allProducts: this.products.map(p => ({ name: p.name, status: p.status })),
            allReports: this.priceReports ? this.priceReports.map(r => ({ id: r.id, status: r.status })) : []
        });
        
        console.log('알림 업데이트:', {
            pendingProducts: pendingProducts,
            pendingReports: pendingReports,
            totalPending: totalPending,
            previousTotalPending: this.previousTotalPending
        });
        
        // 이전 개수 확인 및 저장
        const wasDifferent = totalPending !== this.previousTotalPending;
        const wasIncrease = totalPending > this.previousTotalPending;
        
        // 새로운 신고가 들어왔는지 확인 (개수가 증가한 경우)
        if (wasIncrease && wasDifferent) {
            // 알림 소리 재생
            this.playNotificationSound();
            console.log('새로운 신고 감지! 알림 소리 재생', {
                previous: this.previousTotalPending,
                current: totalPending,
                increase: totalPending - this.previousTotalPending
            });
        }
        
        // 이전 개수 업데이트
        this.previousTotalPending = totalPending;
        
        // 알림 표시/숨김
        if (totalPending > 0) {
            notificationEl.classList.remove('hidden');
            notificationEl.textContent = totalPending;
            console.log('알림 표시:', totalPending);
        } else {
            notificationEl.classList.add('hidden');
            console.log('알림 숨김');
        }
        
        // 개별 버튼 배지 업데이트
        this.updateAdminBadges(pendingProducts, pendingReports);
        
        console.log(`관리자 알림 업데이트 완료: 제품 ${pendingProducts}개, 신고 ${pendingReports}개`);
    }
    
    // 개별 버튼 배지 업데이트
    updateAdminBadges(pendingProducts, pendingReports) {
        console.log('=== 배지 업데이트 시작 ===');
        console.log('대기 제품:', pendingProducts, '대기 신고:', pendingReports);
        
        const pendingProductsBadge = document.getElementById('pendingProductsBadge');
        const priceReportsBadge = document.getElementById('priceReportsBadge');
        
        console.log('배지 요소 찾기:', {
            pendingProductsBadge: !!pendingProductsBadge,
            priceReportsBadge: !!priceReportsBadge
        });
        
        // 승인 대기 제품 배지
        if (pendingProductsBadge) {
            if (pendingProducts > 0) {
                pendingProductsBadge.classList.remove('hidden');
                pendingProductsBadge.textContent = pendingProducts;
                console.log('승인 대기 배지 업데이트:', pendingProducts);
            } else {
                pendingProductsBadge.classList.add('hidden');
                console.log('승인 대기 배지 숨김');
            }
        } else {
            console.warn('승인 대기 배지 요소를 찾을 수 없습니다.');
        }
        
        // 가격 변경 신고 배지
        if (priceReportsBadge) {
            if (pendingReports > 0) {
                priceReportsBadge.classList.remove('hidden');
                priceReportsBadge.textContent = pendingReports;
                console.log('가격 변경 신고 배지 업데이트:', pendingReports);
            } else {
                priceReportsBadge.classList.add('hidden');
                console.log('가격 변경 신고 배지 숨김');
            }
        } else {
            console.warn('가격 변경 신고 배지 요소를 찾을 수 없습니다.');
        }
        
        console.log('=== 배지 업데이트 완료 ===');
    }
    
    // 알림 소리 재생
    playNotificationSound() {
        try {
            // Web Audio API로 알림 소리 생성 (더 큰 소리, 더 긴 시간)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // 주파수
            oscillator.type = 'sine'; // 사인파
            
            // 더 크고 긴 소리 (화면 꺼짐 방지)
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // 볼륨 증가
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // 시간 증가
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            console.log('알림 소리 재생 성공 (Web Audio API)');
        } catch (error) {
            console.log('알림 소리 재생 실패 (일부 브라우저에서 지원 안 함):', error);
            // 대체 방법: HTML5 Audio 사용
            this.playFallbackSound();
        }
    }
    
    // 대체 알림 소리 (HTML5 Audio)
    playFallbackSound() {
        try {
            // 간단한 beep 사운드를 data URL로 생성
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OXTw0PSKHg8sJrJQUwfMry2Yw9CRliuO/qnVgTCkii4vTEayYFLIHM8tiINggZaLzt66BPEAxPp+LwtmMcBjiQ1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OXTw0PSKHg8sJrJQUwfMry2Yw9CRliuO/qnVgTCkii4vTEayYFLIHM8tiINggZaLzt66BPEAxPp+LwtmMcBjiQ1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OXTw0PSKHg8sJrJQUwfMry2Yw9CRliuO/qnVgTCkii4vTEayYFLIHM8tiINggZaLzt66BPEAxPp+LwtmMcBjiQ1/LMeSwFJHfH8N2QQAo=');
            audio.volume = 0.5; // 볼륨 증가
            
            // 화면 꺼짐 방지를 위한 Promise 체인
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('알림 소리 재생 성공 (HTML5 Audio)');
                    })
                    .catch(error => {
                        console.log('알림 소리 재생 실패 (사용자 상호작용 필요):', error);
                        // 최후의 수단: 여러 번 반복 재생 시도
                        this.retryPlaySound();
                    });
            }
        } catch (error) {
            console.log('대체 알림 소리 재생 실패:', error);
            this.retryPlaySound();
        }
    }
    
    // 알림 소리 재생 재시도 (여러 번 반복)
    retryPlaySound() {
        let retryCount = 0;
        const maxRetries = 3;
        
        const tryPlay = () => {
            retryCount++;
            console.log(`알림 소리 재생 재시도 ${retryCount}/${maxRetries}`);
            
            // 브라우저 API로 직접 소리 생성
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.6, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
                
                console.log('알림 소리 재생 성공 (재시도)');
            } catch (err) {
                console.log('알림 소리 재시도 실패:', err);
                if (retryCount < maxRetries) {
                    setTimeout(tryPlay, 500);
                }
            }
        };
        
        tryPlay();
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
        console.log('제품 상태별 분류:', this.products.map(p => ({ name: p.name, status: p.status, id: p.id })));
        
        // 모든 제품의 상태 상세 로그
        this.products.forEach(p => {
            console.log(`제품 "${p.name}": status = "${p.status}", id = "${p.id}"`);
        });
        
        // 승인된 제품만 표시
        let approvedProducts = this.products.filter(p => {
            const isApproved = p.status === 'approved';
            console.log(`제품 "${p.name}": status="${p.status}", isApproved=${isApproved}`);
            return isApproved;
        });
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
                                <span class="product-category">${this.getCategoryDisplayName(product.category) || '기타'}</span>
                                <span class="product-price">${finalPrice.toLocaleString()}원</span>
                                <a href="${product.link || '#'}" target="_blank" class="product-link-btn" onclick="event.stopPropagation(); trackPurchaseClick('${product.name}', '${product.category}')">구매</a>
                            </div>
                            <div class="row-bottom">
                                <div class="store-time-info">
                                    <span class="product-store">${product.store || '미선택'}</span>
                                    ${this.formatUpdateTime(product.lastUpdated || product.createdAt)}
                                </div>
                                <div class="product-buttons">
                                    <button class="refresh-product-btn" onclick="event.stopPropagation(); refreshProductData('${product.id}')">갱신</button>
                                    <button class="price-report-btn" onclick="event.stopPropagation(); reportPriceChange('${product.id}', '${product.originalPrice || 0}')">변경</button>
                                </div>
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
                                <span class="product-category">${this.getCategoryDisplayName(product.category) || '기타'}</span>
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
                cssClass = 'recent'; // 3시간 이내 - 연두 형광
            } else if (diffHours < 24) {
                timeText = `${diffHours}시간 전`;
                if (diffHours <= 3) {
                    cssClass = 'recent'; // 3시간 이내 - 연두 형광
                } else if (diffHours <= 10) {
                    cssClass = 'daily'; // 3~10시간 - 주황 형광
                } else {
                    cssClass = 'old'; // 10시간 이상 - 빨강 형광
                }
            } else if (diffDays < 7) {
                timeText = `${diffDays}일 전`;
                cssClass = 'old'; // 1일 이상 - 빨강 형광
            } else {
                timeText = updateTime.toLocaleDateString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                cssClass = 'old'; // 1주 이상 - 빨강 형광
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
            console.log('=== 가격 변경 신고 제출 시작 ===');
            await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), priceChange);
            alert('가격 변경 신고가 접수되었습니다. 검토 후 반영됩니다.');
            gaTracker.trackFormSubmit('price_report', true);
            
            // 수동으로 로컬 배열에 신고 추가 및 즉시 알림 업데이트
            const reportData = {
                ...priceChange,
                id: `temp_${Date.now()}` // 임시 ID
            };
            
            // 로컬 배열에 추가
            if (!this.priceReports) {
                this.priceReports = [];
            }
            this.priceReports.push(reportData);
            
            // 즉시 알림 업데이트 강제 실행
            console.log('신고 제출 후 즉시 알림 업데이트 실행');
            this.updateAdminNotification();
        } catch (error) {
            console.error('가격 변경 신고 실패:', error);
            alert('신고 접수에 실패했습니다. 다시 시도해주세요.');
            gaTracker.trackError('price_report_error', error.message);
        }
    }

    setupEventListeners() {
        // 폼 제출 - 폼이 열릴 때마다 이벤트 리스너 재설정
        this.setupFormSubmitListener();
        
        // 관리자 버튼들
        document.getElementById('loadPendingProducts').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
                this.loadPendingProducts();
                // 알림 업데이트
                this.updateAdminNotification();
            }
        });
        
        document.getElementById('loadAllProducts').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
                this.loadAllProducts();
                // 알림 업데이트
                this.updateAdminNotification();
            }
        });
        
        document.getElementById('loadPriceReports').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
                this.loadPriceReports();
                // 알림 업데이트
                this.updateAdminNotification();
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
            // 필독 패널 수정 버튼 숨기기
            this.updateNoticeEditButton();
        });
        
        // 필독 패널 이벤트 리스너
        this.setupNoticePanelListeners();
        
        // 윈도우 리사이즈 이벤트 리스너 추가
        window.addEventListener('resize', () => {
            this.updateCategoryCounts();
            this.forceHeaderToTop(); // 모바일에서 헤더 위치 재조정
            
            // PC/모바일 버튼 강제 표시
            if (window.innerWidth > 768) {
                const pcButtonGroup = document.querySelector('.pc-button-group');
                const mobileButtonBar = document.querySelector('.top-button-bar.mobile-only');
                
                if (pcButtonGroup) {
                    pcButtonGroup.style.display = 'flex !important';
                    pcButtonGroup.style.visibility = 'visible !important';
                    pcButtonGroup.style.opacity = '1 !important';
                    pcButtonGroup.style.gap = '4px';
                    pcButtonGroup.style.alignItems = 'center';
                    pcButtonGroup.style.marginLeft = 'auto'; // 오른쪽 끝으로 밀기
                }
                
                // 모바일 버튼 바 완전히 숨김
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'none !important';
                    mobileButtonBar.style.visibility = 'hidden !important';
                    mobileButtonBar.style.opacity = '0 !important';
                }
                
                // PC용 로고 스타일 강제 적용 - 로컬에서는 왼쪽 정렬
                const logo = document.querySelector('.logo');
                if (logo) {
                    const isLocal = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname === '';
                    
                    if (isLocal) {
                        logo.style.textAlign = 'left';
                        logo.style.justifySelf = 'start';
                        logo.style.width = 'auto';
                        logo.style.fontSize = '1.32rem';
                        logo.style.color = '#1e40af'; /* 원래 파란색으로 복원 */
                        console.log('리사이즈 후 로컬 환경: 로고 왼쪽 정렬 적용');
                    } else {
                        logo.style.fontSize = '1.98rem';
                        logo.style.fontWeight = '600';
                        logo.style.color = '#1e40af'; /* 원래 파란색으로 복원 */
                        logo.style.textAlign = 'center';
                        logo.style.width = '100%';
                        console.log('리사이즈 후 배포 환경: 로고 가운데 정렬 적용');
                    }
                }
                
                // 모바일 환경에서도 로컬 감지 적용
                if (window.innerWidth <= 768) {
                    const mobileLogo = document.querySelector('.logo');
                    if (mobileLogo) {
                        const isLocal = window.location.hostname === 'localhost' || 
                                       window.location.hostname === '127.0.0.1' ||
                                       window.location.hostname === '';
                        
                        if (isLocal) {
                            mobileLogo.style.textAlign = 'left !important';
                            mobileLogo.style.justifySelf = 'start !important';
                            mobileLogo.style.width = 'auto !important';
                            mobileLogo.style.marginLeft = '0 !important';
                            mobileLogo.style.paddingLeft = '0 !important';
                            mobileLogo.style.position = 'relative !important';
                            mobileLogo.style.left = '0 !important';
                            mobileLogo.style.transform = 'none !important';
                            mobileLogo.style.float = 'left !important';
                            mobileLogo.style.maxWidth = 'none !important';
                            mobileLogo.style.display = 'inline-block !important';
                            mobileLogo.style.verticalAlign = 'top !important';
                            mobileLogo.style.clear = 'both !important';
                            mobileLogo.style.marginRight = 'auto !important';
                            mobileLogo.style.marginTop = '0 !important';
                            mobileLogo.style.marginBottom = '0 !important';
                            mobileLogo.style.gridColumn = '1 !important';
                            mobileLogo.style.gridRow = '1 !important';
                            mobileLogo.style.alignSelf = 'start !important';
                            mobileLogo.style.justifyContent = 'flex-start !important';
                            console.log('리사이즈 후 모바일 로컬 환경: 로고 왼쪽 끝 정렬 강제 적용');
                        }
                    }
                }
                
                // 모바일 로컬 환경에서 헤더 레이아웃 강제 변경 (리사이즈 이벤트)
                if (window.innerWidth <= 768) {
                    const header = document.querySelector('.header');
                    const headerCenter = document.querySelector('.header-center');
                    const mobileLogo = document.querySelector('.logo');
                    
                    if (isLocal && header && headerCenter && mobileLogo) {
                        // 헤더를 flex 레이아웃으로 강제 변경
                        header.style.display = 'flex !important';
                        header.style.flexDirection = 'row !important';
                        header.style.alignItems = 'center !important';
                        header.style.justifyContent = 'space-between !important';
                        header.style.gridTemplateColumns = 'none !important';
                        header.style.gridTemplateRows = 'none !important';
                        
                        // 헤더 센터를 flex로 변경
                        headerCenter.style.display = 'flex !important';
                        headerCenter.style.justifyContent = 'flex-start !important';
                        headerCenter.style.alignItems = 'center !important';
                        headerCenter.style.width = 'auto !important';
                        headerCenter.style.gridColumn = 'unset !important';
                        headerCenter.style.gridRow = 'unset !important';
                        
                        console.log('리사이즈 후 모바일 로컬 환경: 헤더 레이아웃을 flex로 강제 변경');
                    }
                }
                
                // PC용 헤더 레이아웃 강제 적용 - 로컬에서는 flex 레이아웃
                const header = document.querySelector('.header');
                if (header) {
                    const isLocal = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname === '';
                    
                    if (isLocal) {
                        header.style.display = 'flex';
                        header.style.gridTemplateColumns = 'none';
                        header.style.alignItems = 'center';
                        console.log('리사이즈 후 로컬 환경: 헤더 flex 레이아웃 적용');
                    } else {
                        header.style.display = 'grid';
                        header.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
                        header.style.alignItems = 'center';
                        console.log('리사이즈 후 배포 환경: 헤더 grid 레이아웃 적용');
                    }
                }
                
                // PC용 헤더 섹션 레이아웃 강제 적용
                const headerLeft = document.querySelector('.header-left');
                const headerCenter = document.querySelector('.header-center');
                const headerRight = document.querySelector('.header-right');
                
                const isLocal = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';
                
                if (isLocal) {
                    // 로컬에서는 flex 레이아웃
                    if (headerLeft) {
                        headerLeft.style.gridColumn = 'unset';
                        headerLeft.style.flex = '1';
                    }
                    
                    if (headerCenter) {
                        headerCenter.style.gridColumn = 'unset';
                        headerCenter.style.justifyContent = 'flex-start';
                    }
                    
                    if (headerRight) {
                        headerRight.style.gridColumn = 'unset';
                        headerRight.style.flex = '0 0 auto';
                    }
                } else {
                    // 배포에서는 grid 레이아웃
                    if (headerLeft) {
                        headerLeft.style.gridColumn = '1 / 3';
                    }
                    
                    if (headerCenter) {
                        headerCenter.style.gridColumn = '3';
                    }
                    
                    if (headerRight) {
                        headerRight.style.gridColumn = '4 / 6';
                    }
                }
            } else {
                const mobileButtonBar = document.querySelector('.top-button-bar.mobile-only');
                const pcButtonGroup = document.querySelector('.pc-button-group');
                
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'flex !important';
                    mobileButtonBar.style.visibility = 'visible !important';
                    mobileButtonBar.style.opacity = '1 !important';
                    mobileButtonBar.style.position = 'fixed';
                    mobileButtonBar.style.top = '0px';
                    mobileButtonBar.style.right = '0px';
                    mobileButtonBar.style.zIndex = '9999';
                }
                
                // PC 버튼 그룹 완전히 숨김
                if (pcButtonGroup) {
                    pcButtonGroup.style.display = 'none !important';
                    pcButtonGroup.style.visibility = 'hidden !important';
                    pcButtonGroup.style.opacity = '0 !important';
                }
                
                // 모바일용 로고 스타일 강제 적용 - 좌측 정렬
                const logo = document.querySelector('.logo');
                if (logo) {
                    logo.style.textAlign = 'left';
                    logo.style.justifySelf = 'start';
                }
            }
        });
    }

    // 필독 패널 이벤트 리스너 설정
    setupNoticePanelListeners() {
        // 중복 실행 방지
        if (this.noticeListenersSetup) {
            return;
        }
        this.noticeListenersSetup = true;
        
        // 수정 버튼 (관리자만 표시)
        const editBtn = document.getElementById('editNotice');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (adminAuth.requireAuth()) {
                    this.toggleNoticeEdit(true);
                }
            });
        }

        // 추가 버튼 (관리자만 표시)
        const addBtn = document.getElementById('addNotice');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (adminAuth.requireAuth()) {
                    this.addNewNotice();
                }
            });
        }

        // 삭제 버튼 (관리자만 표시)
        const deleteBtn = document.getElementById('deleteNotice');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (adminAuth.requireAuth()) {
                    this.deleteNotice();
                }
            });
        }

        // 저장 버튼
        const saveBtn = document.getElementById('saveNotice');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (adminAuth.requireAuth()) {
                    this.saveNotice();
                }
            });
        }

        // 취소 버튼
        const cancelBtn = document.getElementById('cancelNotice');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.toggleNoticeEdit(false);
            });
        }

        // 공지1~3 클릭 이벤트 (편집 모드로 전환)
        this.setupNoticeItemClickListeners();

        // 초기 공지사항 로드
        this.loadNotice();
        
        // 관리자 권한에 따른 수정 버튼 표시/숨김
        this.updateNoticeEditButton();
        
        // 숫자별 댓글 시스템 이벤트 리스너
        this.setupNumberCommentListeners();
    }

    // 공지1~5 클릭 이벤트 설정
    setupNoticeItemClickListeners() {
        const noticeItems = ['notice1Content', 'notice2Content', 'notice3Content', 'notice4Content', 'notice5Content'];
        noticeItems.forEach((itemId, index) => {
            const element = document.getElementById(itemId);
            if (element) {
                element.addEventListener('click', () => {
                    this.showNoticeDetail(index + 1);
                });
            }
        });
        
        // 모달 닫기 이벤트
        const closeBtn = document.getElementById('closeNoticeDetail');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeNoticeDetail();
            });
        }
        
        // 모달 배경 클릭 시 닫기
        const modal = document.getElementById('noticeDetailModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeNoticeDetail();
                }
            });
        }
    }

    // 새로운 공지 추가
    addNewNotice() {
        const noticeData = this.getNoticeData();
        const existingNotices = Object.keys(noticeData).filter(key => key.startsWith('notice'));
        const nextNoticeNumber = existingNotices.length + 1;
        
        const content = prompt(`공지${nextNoticeNumber}의 내용을 입력하세요:`, '');
        
        if (content !== null && content.trim() !== '') {
            noticeData[`notice${nextNoticeNumber}`] = content.trim();
            this.saveNoticeData(noticeData);
            this.loadNotice();
            
            // HTML에 새로운 공지 항목 동적 추가
            this.addNoticeToHTML(nextNoticeNumber, content.trim());
            
            alert(`공지${nextNoticeNumber}이 추가되었습니다.`);
        }
    }

    // HTML에 새로운 공지 항목 동적 추가
    addNoticeToHTML(noticeNumber, content) {
        const noticeDisplay = document.getElementById('noticeDisplay');
        const subNotices = noticeDisplay.querySelector('.sub-notices');
        
        if (subNotices) {
            const newNoticeItem = document.createElement('div');
            newNoticeItem.className = 'notice-item';
            newNoticeItem.innerHTML = `
                <span class="notice-label">공지${noticeNumber}:</span>
                <span id="notice${noticeNumber}Content" class="notice-content-item">${content.replace(/\n/g, ' ').substring(0, 100)}${content.length > 100 ? '...' : ''}</span>
            `;
            
            subNotices.appendChild(newNoticeItem);
            
            // 클릭 이벤트 추가
            const contentElement = document.getElementById(`notice${noticeNumber}Content`);
            if (contentElement) {
                contentElement.addEventListener('click', () => {
                    this.showNoticeDetail(noticeNumber);
                });
            }
        }
        
        // 편집 폼에도 새로운 textarea 추가
        this.addNoticeToEditForm(noticeNumber);
    }

    // 편집 폼에 새로운 textarea 추가
    addNoticeToEditForm(noticeNumber) {
        const noticeEdit = document.getElementById('noticeEdit');
        const form = noticeEdit.querySelector('.notice-edit-form');
        
        if (form) {
            const newFormGroup = document.createElement('div');
            newFormGroup.className = 'form-group';
            newFormGroup.innerHTML = `
                <label for="notice${noticeNumber}Textarea">공지${noticeNumber}</label>
                <textarea id="notice${noticeNumber}Textarea" rows="1" placeholder="공지${noticeNumber}을 입력하세요..."></textarea>
            `;
            
            // 저장/취소 버튼 앞에 삽입
            const actions = form.querySelector('.notice-actions');
            if (actions) {
                form.insertBefore(newFormGroup, actions);
            }
        }
    }

    // 공지 삭제
    deleteNotice() {
        const noticeData = this.getNoticeData();
        const existingNotices = Object.keys(noticeData).filter(key => key.startsWith('notice'));
        
        if (existingNotices.length === 0) {
            alert('삭제할 공지가 없습니다.');
            return;
        }
        
        // 공지 목록 생성
        const noticeList = existingNotices.map(key => {
            const number = key.replace('notice', '');
            const content = noticeData[key] || '';
            return `${number}. ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
        }).join('\n');
        
        const noticeNumber = prompt(`삭제할 공지 번호를 입력하세요:\n\n${noticeList}`, '');
        
        if (noticeNumber !== null && noticeNumber.trim() !== '') {
            const num = parseInt(noticeNumber.trim());
            if (isNaN(num) || num < 1) {
                alert('올바른 공지 번호를 입력해주세요.');
                return;
            }
            
            const noticeKey = `notice${num}`;
            if (!noticeData[noticeKey]) {
                alert(`공지${num}이 존재하지 않습니다.`);
                return;
            }
            
            if (confirm(`정말로 공지${num}을 삭제하시겠습니까?\n\n내용: ${noticeData[noticeKey].substring(0, 100)}${noticeData[noticeKey].length > 100 ? '...' : ''}`)) {
                delete noticeData[noticeKey];
                this.saveNoticeData(noticeData);
                this.loadNotice();
                
                // HTML에서 해당 공지 항목 제거
                this.removeNoticeFromHTML(num);
                
                alert(`공지${num}이 삭제되었습니다.`);
            }
        }
    }

    // HTML에서 공지 항목 제거
    removeNoticeFromHTML(noticeNumber) {
        const noticeElement = document.getElementById(`notice${noticeNumber}Content`);
        if (noticeElement) {
            const noticeItem = noticeElement.closest('.notice-item');
            if (noticeItem) {
                noticeItem.remove();
            }
        }
        
        // 편집 폼에서도 제거
        const textarea = document.getElementById(`notice${noticeNumber}Textarea`);
        if (textarea) {
            const formGroup = textarea.closest('.form-group');
            if (formGroup) {
                formGroup.remove();
            }
        }
    }

    // 공지사항 상세보기 모달 열기
    showNoticeDetail(noticeNumber) {
        const noticeData = this.getNoticeData();
        const content = noticeData[`notice${noticeNumber}`] || '';
        
        // 모달 제목 설정
        const title = document.getElementById('noticeDetailTitle');
        if (title) {
            title.textContent = `공지${noticeNumber} 상세보기`;
        }
        
        // 모달 내용 설정
        const contentElement = document.getElementById('noticeDetailContent');
        if (contentElement) {
            contentElement.textContent = content || '내용이 없습니다.';
        }
        
        // 모달 표시
        const modal = document.getElementById('noticeDetailModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        // 현재 공지사항 번호 저장
        this.currentNoticeNumber = noticeNumber;
        
        // 공지사항별 댓글 로드
        this.loadNoticeComments();
        
        // 공지사항별 댓글 이벤트 리스너 설정
        this.setupNoticeCommentListeners();
    }

    // 공지사항 상세보기 모달 닫기
    closeNoticeDetail() {
        const modal = document.getElementById('noticeDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 공지사항별 댓글 이벤트 리스너 설정
    setupNoticeCommentListeners() {
        // 기존 이벤트 리스너 제거
        const submitBtn = document.getElementById('submitNoticeComment');
        const commentInput = document.getElementById('noticeCommentInput');
        
        if (submitBtn) {
            submitBtn.replaceWith(submitBtn.cloneNode(true));
        }
        
        if (commentInput) {
            commentInput.replaceWith(commentInput.cloneNode(true));
        }
        
        // 새로운 이벤트 리스너 등록
        const newSubmitBtn = document.getElementById('submitNoticeComment');
        const newCommentInput = document.getElementById('noticeCommentInput');
        
        if (newSubmitBtn) {
            newSubmitBtn.addEventListener('click', () => {
                this.submitNoticeComment();
            });
        }

        // 엔터키로 댓글 작성 (Ctrl+Enter)
        if (newCommentInput) {
            newCommentInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.submitNoticeComment();
                }
            });
        }
    }

    // 공지사항별 댓글 작성
    submitNoticeComment() {
        if (this.isSubmittingComment) {
            return;
        }
        
        this.isSubmittingComment = true;
        
        const commentInput = document.getElementById('noticeCommentInput');
        
        if (!commentInput) {
            this.isSubmittingComment = false;
            return;
        }
        
        const content = commentInput.value.trim();
        
        if (!content) {
            alert('댓글 내용을 입력해주세요.');
            this.isSubmittingComment = false;
            return;
        }

        const comment = {
            id: Date.now().toString(),
            content: content,
            author: '익명',
            timestamp: new Date().toISOString(),
            noticeNumber: this.currentNoticeNumber,
            parentId: null,
            replies: []
        };

        this.saveNoticeComment(comment);
        commentInput.value = '';
        this.loadNoticeComments();
        
        setTimeout(() => {
            this.isSubmittingComment = false;
        }, 100);
    }

    // 공지사항별 댓글 저장
    saveNoticeComment(comment) {
        const comments = this.getNoticeComments();
        comments.push(comment);
        localStorage.setItem('noticeComments', JSON.stringify(comments));
    }

    // 공지사항별 댓글 가져오기
    getNoticeComments() {
        const data = localStorage.getItem('noticeComments');
        return data ? JSON.parse(data) : [];
    }

    // 공지사항별 댓글 로드
    loadNoticeComments() {
        const comments = this.getNoticeComments();
        const commentsList = document.getElementById('noticeCommentsList');
        const commentCount = document.getElementById('noticeCommentCount');

        // 현재 공지사항의 댓글만 필터링
        const noticeComments = comments.filter(c => c.noticeNumber === this.currentNoticeNumber);

        // 댓글 개수 업데이트
        if (commentCount) {
            commentCount.textContent = `${noticeComments.length}개`;
        }

        if (noticeComments.length === 0) {
            if (commentsList) {
                commentsList.innerHTML = '<p style="text-align: center; color: #6b7280; font-size: 0.8rem;">아직 댓글이 없습니다.</p>';
            }
            return;
        }

        // 시간순으로 정렬 (오래된 것이 위로)
        noticeComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        let html = '';
        noticeComments.forEach(comment => {
            if (!comment.parentId) { // 대댓글이 아닌 경우만 표시
                html += this.createNoticeCommentHTML(comment, noticeComments);
            }
        });

        if (commentsList) {
            commentsList.innerHTML = html;
        }
    }

    // 공지사항별 댓글 HTML 생성 (중첩 댓글 지원)
    createNoticeCommentHTML(comment, allComments, depth = 0) {
        const isAdmin = adminAuth.isAuthenticated();
        const timeStr = new Date(comment.timestamp).toLocaleString();
        
        // 중첩 깊이에 따른 스타일 클래스
        const depthClass = depth > 0 ? `reply depth-${depth}` : '';
        const marginLeft = depth * 20; // 깊이에 따른 들여쓰기
        
        let html = `
            <div class="comment-item ${depthClass}" data-id="${comment.id}" style="margin-left: ${marginLeft}px;">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${timeStr}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-actions">
                    <button class="comment-action-btn reply-btn" onclick="priceComparisonSite.submitNoticeReply('${comment.id}')">답글</button>
        `;

        // 관리자만 수정/삭제 가능
        if (isAdmin) {
            html += `
                <button class="comment-action-btn edit-btn-comment" onclick="priceComparisonSite.editNoticeComment('${comment.id}')">수정</button>
                <button class="comment-action-btn delete-btn-comment" onclick="priceComparisonSite.deleteNoticeComment('${comment.id}')">삭제</button>
            `;
        }

        html += `
                </div>
            </div>
        `;

        // 하위 댓글들 재귀적으로 추가
        const replies = allComments.filter(c => c.parentId === comment.id);
        replies.forEach(reply => {
            html += this.createNoticeCommentHTML(reply, allComments, depth + 1);
        });

        return html;
    }

    // 숫자별 댓글 시스템 이벤트 리스너 설정
    setupNumberCommentListeners() {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const submitBtn = document.getElementById('submitComment');
        const commentInput = document.getElementById('commentInput');
        
        if (submitBtn) {
            submitBtn.replaceWith(submitBtn.cloneNode(true));
        }
        
        if (commentInput) {
            commentInput.replaceWith(commentInput.cloneNode(true));
        }
        
        // 숫자 선택기 생성
        this.createNumberSelector();
        
        // 새로운 이벤트 리스너 등록
        const newSubmitBtn = document.getElementById('submitComment');
        const newCommentInput = document.getElementById('commentInput');
        
        if (newSubmitBtn) {
            newSubmitBtn.addEventListener('click', () => {
                this.submitNumberComment();
            });
        }

        // 엔터키로 댓글 작성 (Ctrl+Enter)
        if (newCommentInput) {
            newCommentInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.submitNumberComment();
                }
            });
        }

        // 초기 댓글 로드
        this.loadNumberComments();
    }

    // 숫자 선택기 생성
    createNumberSelector() {
        const numberSelector = document.getElementById('numberSelector');
        if (!numberSelector) return;

        // 최대 숫자 결정 (댓글이 있는 번호 + 여유분)
        const comments = this.getNumberComments();
        const maxNumber = Math.max(20, ...comments.map(c => parseInt(c.number) || 0)) + 5;

        let html = '';
        for (let i = 1; i <= maxNumber; i++) {
            html += `<button class="number-btn" data-number="${i}" onclick="priceComparisonSite.selectNumber(${i})">${i}</button>`;
        }

        numberSelector.innerHTML = html;

        // 기본값 1 선택
        this.selectNumber(1);
    }

    // 숫자 선택
    selectNumber(number) {
        // 모든 버튼에서 selected 클래스 제거
        const allButtons = document.querySelectorAll('.number-btn');
        allButtons.forEach(btn => btn.classList.remove('selected'));

        // 선택된 버튼에 selected 클래스 추가
        const selectedButton = document.querySelector(`[data-number="${number}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }

        // 현재 선택된 번호 저장
        this.selectedNumber = number;
        
        // 선택된 번호의 댓글만 표시
        this.loadNumberComments();
    }

    // 공지사항 데이터 가져오기
    getNoticeData() {
        const data = localStorage.getItem('noticeData');
        return data ? JSON.parse(data) : {
            mainNotice: '',
            notice1: '',
            notice2: '',
            notice3: ''
        };
    }

    // 공지사항 데이터 저장
    saveNoticeData(data) {
        localStorage.setItem('noticeData', JSON.stringify(data));
    }

    // 공지사항 로드
    loadNotice() {
        const data = this.getNoticeData();
        
        // 대문글 표시
        const mainNoticeContent = document.getElementById('mainNoticeContent');
        if (mainNoticeContent) {
            mainNoticeContent.textContent = data.mainNotice || '대문글이 없습니다.';
        }
        
        // 공지사항 동적 로드 (존재하는 공지만 표시)
        const noticeData = this.getNoticeData();
        const existingNotices = Object.keys(noticeData).filter(key => key.startsWith('notice'));
        
        // 기존 공지 항목들 제거
        const subNotices = document.querySelector('.sub-notices');
        if (subNotices) {
            subNotices.innerHTML = '';
        }
        
        // 존재하는 공지사항들을 순서대로 표시
        existingNotices.sort((a, b) => {
            const numA = parseInt(a.replace('notice', ''));
            const numB = parseInt(b.replace('notice', ''));
            return numA - numB;
        });
        
        existingNotices.forEach(noticeKey => {
            const noticeNumber = noticeKey.replace('notice', '');
            const content = noticeData[noticeKey] || '';
            
            if (subNotices) {
                const noticeItem = document.createElement('div');
                noticeItem.className = 'notice-item';
                noticeItem.innerHTML = `
                    <span class="notice-label">공지${noticeNumber}:</span>
                    <span id="notice${noticeNumber}Content" class="notice-content-item">${content.replace(/\n/g, ' ').substring(0, 100)}${content.length > 100 ? '...' : ''}</span>
                `;
                
                subNotices.appendChild(noticeItem);
                
                // 클릭 이벤트 추가
                const contentElement = document.getElementById(`notice${noticeNumber}Content`);
                if (contentElement) {
                    contentElement.addEventListener('click', () => {
                        this.showNoticeDetail(parseInt(noticeNumber));
                    });
                }
            }
        });
    }

    // 공지사항 저장
    saveNotice() {
        if (!adminAuth.requireAuth()) {
            return;
        }

        const mainNoticeTextarea = document.getElementById('mainNoticeTextarea');
        const data = {
            mainNotice: mainNoticeTextarea ? mainNoticeTextarea.value.trim() : ''
        };

        // 모든 공지사항 textarea 찾기
        const noticeData = this.getNoticeData();
        const existingNotices = Object.keys(noticeData).filter(key => key.startsWith('notice'));
        
        existingNotices.forEach(noticeKey => {
            const textarea = document.getElementById(`${noticeKey}Textarea`);
            if (textarea) {
                data[noticeKey] = textarea.value.trim();
            }
        });

        this.saveNoticeData(data);
        this.toggleNoticeEdit(false);
        this.loadNotice();
    }

    // 숫자별 댓글 작성 (선택된 번호에만 작성)
    submitNumberComment() {
        // 중복 실행 방지
        if (this.isSubmittingComment) {
            return;
        }
        
        this.isSubmittingComment = true;
        
        const commentInput = document.getElementById('commentInput');
        
        if (!commentInput) {
            this.isSubmittingComment = false;
            return;
        }
        
        const content = commentInput.value.trim();
        const number = this.selectedNumber || 1;
        
        if (!content) {
            alert('댓글 내용을 입력해주세요.');
            this.isSubmittingComment = false;
            return;
        }

        const comment = {
            id: Date.now().toString(),
            content: content,
            author: '익명',
            timestamp: new Date().toISOString(),
            number: number.toString(),
            parentId: null,
            replies: []
        };

        this.saveNumberComment(comment);
        commentInput.value = '';
        this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
        
        // 실행 완료 후 플래그 해제
        setTimeout(() => {
            this.isSubmittingComment = false;
        }, 100);
    }

    // 숫자별 댓글 저장
    saveNumberComment(comment) {
        const comments = this.getNumberComments();
        comments.push(comment);
        localStorage.setItem('numberComments', JSON.stringify(comments));
    }

    // 숫자별 댓글 가져오기
    getNumberComments() {
        const data = localStorage.getItem('numberComments');
        return data ? JSON.parse(data) : [];
    }

    // 숫자별 댓글 로드 (선택된 번호만 표시)
    loadNumberComments() {
        const comments = this.getNumberComments();
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');

        // 현재 선택된 번호의 댓글만 필터링
        const selectedNumber = this.selectedNumber || 1;
        const filteredComments = comments.filter(comment => comment.number === selectedNumber.toString());

        // 댓글 개수 업데이트 (선택된 번호의 댓글만)
        if (commentCount) {
            commentCount.textContent = `${filteredComments.length}개`;
        }

        if (filteredComments.length === 0) {
            if (commentsList) {
                commentsList.innerHTML = `
                    <div class="number-comment-group">
                        <div class="number-comment-header">
                            <span>번호 ${selectedNumber}</span>
                            <span>0개</span>
                        </div>
                        <div class="number-comment-content">
                            <p style="text-align: center; color: #6b7280; font-size: 0.8rem;">아직 댓글이 없습니다.</p>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // 시간순으로 정렬 (오래된 것이 위로)
        filteredComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        let html = `
            <div class="number-comment-group">
                <div class="number-comment-header">
                    <span>번호 ${selectedNumber}</span>
                    <span>${filteredComments.length}개</span>
                </div>
                <div class="number-comment-content">
        `;
        
        // 최상위 댓글만 표시 (대댓글이 아닌 경우)
        filteredComments.forEach(comment => {
            if (!comment.parentId) { // 대댓글이 아닌 경우만 표시
                html += this.createNumberCommentHTML(comment, filteredComments);
            }
        });
        
        html += `
                </div>
            </div>
        `;

        if (commentsList) {
            commentsList.innerHTML = html;
        }
    }

    // 숫자별 댓글 HTML 생성 (중첩 댓글 지원)
    createNumberCommentHTML(comment, allComments, depth = 0) {
        const isAdmin = adminAuth.isAuthenticated();
        const timeStr = new Date(comment.timestamp).toLocaleString();
        
        // 중첩 깊이에 따른 스타일 클래스
        const depthClass = depth > 0 ? `reply depth-${depth}` : '';
        const marginLeft = depth * 20; // 깊이에 따른 들여쓰기
        
        let html = `
            <div class="comment-item ${depthClass}" data-id="${comment.id}" style="margin-left: ${marginLeft}px;">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${timeStr}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-actions">
                    <button class="comment-action-btn reply-btn" onclick="priceComparisonSite.submitReply('${comment.id}')">답글</button>
        `;

        // 관리자만 수정/삭제 가능
        if (isAdmin) {
            html += `
                <button class="comment-action-btn edit-btn-comment" onclick="priceComparisonSite.editComment('${comment.id}')">수정</button>
                <button class="comment-action-btn delete-btn-comment" onclick="priceComparisonSite.deleteComment('${comment.id}')">삭제</button>
            `;
        }

        html += `
                </div>
            </div>
        `;

        // 하위 댓글들 재귀적으로 추가
        const replies = allComments.filter(c => c.parentId === comment.id);
        replies.forEach(reply => {
            html += this.createNumberCommentHTML(reply, allComments, depth + 1);
        });

        return html;
    }

    // 공지사항 편집 모드 토글
    toggleNoticeEdit(isEdit) {
        const display = document.getElementById('noticeDisplay');
        const edit = document.getElementById('noticeEdit');

        if (isEdit) {
            display.classList.add('hidden');
            edit.classList.remove('hidden');
            
            // 기존 데이터를 폼에 로드
            const data = this.getNoticeData();
            const mainNoticeTextarea = document.getElementById('mainNoticeTextarea');
            
            if (mainNoticeTextarea) mainNoticeTextarea.value = data.mainNotice || '';
            
            // 동적으로 편집 폼 생성
            this.createEditForm(data);
        } else {
            display.classList.remove('hidden');
            edit.classList.add('hidden');
        }
    }

    // 편집 폼 동적 생성
    createEditForm(data) {
        const form = document.querySelector('.notice-edit-form');
        if (!form) return;
        
        // 기존 공지사항 폼 그룹들 제거 (대문글 제외)
        const existingGroups = form.querySelectorAll('.form-group:not(:first-child)');
        existingGroups.forEach(group => group.remove());
        
        // 존재하는 공지사항들을 순서대로 폼에 추가
        const existingNotices = Object.keys(data).filter(key => key.startsWith('notice'));
        existingNotices.sort((a, b) => {
            const numA = parseInt(a.replace('notice', ''));
            const numB = parseInt(b.replace('notice', ''));
            return numA - numB;
        });
        
        existingNotices.forEach(noticeKey => {
            const noticeNumber = noticeKey.replace('notice', '');
            const content = data[noticeKey] || '';
            
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            formGroup.innerHTML = `
                <label for="notice${noticeNumber}Textarea">공지${noticeNumber}</label>
                <textarea id="notice${noticeNumber}Textarea" rows="1" placeholder="공지${noticeNumber}을 입력하세요...">${content}</textarea>
            `;
            
            // 저장/취소 버튼 앞에 삽입
            const actions = form.querySelector('.notice-actions');
            if (actions) {
                form.insertBefore(formGroup, actions);
            }
        });
    }

    // 관리자 권한에 따른 버튼 표시/숨김 (배포 환경 고려)
    updateNoticeEditButton() {
        const editBtn = document.getElementById('editNotice');
        const addBtn = document.getElementById('addNotice');
        const deleteBtn = document.getElementById('deleteNotice');
        
        if (!editBtn || !addBtn || !deleteBtn) return;

        // 배포 환경에서는 강제로 버튼 표시 (개발/테스트용)
        const isProduction = window.location.hostname !== 'localhost' && 
                            window.location.hostname !== '127.0.0.1';
        
        console.log('현재 환경:', isProduction ? '배포' : '로컬');
        console.log('관리자 인증 상태:', adminAuth.isAuthenticated());
        
        if (adminAuth.isAuthenticated() || isProduction) {
            editBtn.classList.remove('hidden');
            addBtn.classList.remove('hidden');
            deleteBtn.classList.remove('hidden');
            console.log('공지사항 관리 버튼들 표시됨');
        } else {
            editBtn.classList.add('hidden');
            addBtn.classList.add('hidden');
            deleteBtn.classList.add('hidden');
            console.log('공지사항 관리 버튼들 숨김됨');
        }
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
            category: document.getElementById('productCategory').value.trim() || ''
        };

        console.log('폼 데이터:', formData);

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
        // 제품명 검증
        if (!data.name) {
            alert('제품명을 입력해주세요.');
            return false;
        }
        
        // 가격 검증
        if (!data.price || data.price <= 0) {
            alert('올바른 가격을 입력해주세요.');
            return false;
        }
        
        // 링크 검증
        if (!data.link) {
            alert('제품 링크를 입력해주세요.');
            return false;
        }
        
        // 쇼핑몰 검증
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
                category: productData.category || this.detectCategory(productData.name),
                status: 'pending',
                submittedBy: 'customer',
                link: productData.link,
                createdAt: new Date().toISOString()
            };

            console.log('저장할 제품 데이터:', product);
            console.log('사용자 타입:', productData.userType);
            console.log('설정된 상태:', product.status);

            const docRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'products'), product);
            console.log('제품 저장 성공, 문서 ID:', docRef.id);
            
            this.showThankYouMessage();
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
            
            // 승인 대기 제품 추가 시 즉시 알림 업데이트
            if (product.status === 'pending') {
                console.log('승인 대기 제품 추가됨, 즉시 알림 업데이트');
                // 로컬 배열에 추가
                const productData = {
                    ...product,
                    id: docRef.id
                };
                // 이미 추가되어 있을 수 있으므로 중복 체크
                const exists = this.products.find(p => p.id === productData.id);
                if (!exists) {
                    this.products.push(productData);
                }
                // 즉시 알림 업데이트
                this.updateAdminNotification();
            }
            
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

    showThankYouMessage() {
        const message = '신고해주셔서 감사합니다!\n관리자 검토 후 승인되면 사이트에 표시됩니다.\n\n관리자 승인 패널에서 승인 대기 제품을 확인할 수 있습니다.';
        alert(message);
    }

    clearForm() {
        document.getElementById('productForm').reset();
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
        
        // 초특가 키워드 우선 검사 (가장 먼저 체크)
        if (name.includes('초특가') || name.includes('쿠팡와우') || name.includes('클럽할인') ||
            name.includes('와우') || name.includes('특별') || name.includes('프리미엄')) {
            console.log('→ 초특가 카테고리로 분류');
            return '특가';
        }
        
        // 특가 카테고리 (명시적인 특가 키워드만) - 매우 엄격하게
        else if (name.includes('오늘특가') || name.includes('오늘할인') ||
                 name.includes('플래시세일') || name.includes('flash sale') || name.includes('번개세일') ||
                 name.includes('데일리딜') || name.includes('daily deal') || name.includes('일일특가') ||
                 name.includes('위클리딜') || name.includes('weekly deal') || name.includes('주간특가') ||
                 name.includes('월간특가') || name.includes('monthly deal') || name.includes('월간할인') ||
                 name.includes('단독특가') || name.includes('exclusive') ||
                 name.includes('신상품특가') || name.includes('new product sale') || name.includes('신제품할인') ||
                 name.includes('기간한정특가') || name.includes('한정특가') || name.includes('이벤트특가')) {
            console.log('→ 특가 카테고리로 분류');
            return '특가';
        }
        
        // 식품 카테고리
        if (name.includes('두유') || name.includes('soy milk') || name.includes('콩우유') || name.includes('두유음료') || 
                   name.includes('두유제품') || name.includes('콩음료') || name.includes('식물성우유') || name.includes('비건우유') ||
            name.includes('베지밀') || name.includes('vegemil') || name.includes('베지밀a') || name.includes('베지밀a') ||
            name.includes('우유') || name.includes('milk') ||
            name.includes('라면') || name.includes('ramen') || name.includes('면') ||
            name.includes('생수') || name.includes('물') || name.includes('water') ||
            name.includes('음료') || name.includes('drink') || name.includes('주스') || name.includes('juice') ||
            name.includes('과자') || name.includes('snack') || name.includes('쿠키') || name.includes('cookie') ||
            name.includes('빵') || name.includes('bread') || name.includes('떡') || name.includes('rice cake') ||
            name.includes('쌀') || name.includes('rice') || name.includes('곡물') || name.includes('grain') ||
            name.includes('육류') || name.includes('meat') || name.includes('닭') || name.includes('chicken') ||
            name.includes('생선') || name.includes('fish') || name.includes('해산물') || name.includes('seafood') ||
            name.includes('채소') || name.includes('vegetable') || name.includes('과일') || name.includes('fruit') ||
            name.includes('냉동') || name.includes('frozen') || name.includes('냉장') || name.includes('refrigerated') ||
            name.includes('조미료') || name.includes('seasoning') || name.includes('소스') || name.includes('sauce') ||
            name.includes('간식') || name.includes('dessert') || name.includes('아이스크림') || name.includes('ice cream') ||
            name.includes('햇반') || name.includes('삼다수') || name.includes('신라면') ||
            name.includes('너구리') || name.includes('안성') || name.includes('맥심') ||
            name.includes('모카골드') || name.includes('삼육') || name.includes('서울') ||
            name.includes('멸균') || name.includes('두유a') || name.includes('베지밀a')) {
            console.log('→ 식품 카테고리로 분류');
            return '식품';
        }
        
        // 생활 카테고리
        else if (name.includes('화장지') || name.includes('티슈') || name.includes('tissue') ||
                 name.includes('세제') || name.includes('detergent') || name.includes('유연제') ||
                 name.includes('샴푸') || name.includes('shampoo') || name.includes('린스') ||
                 name.includes('비누') || name.includes('soap') || name.includes('바디워시') || name.includes('body wash') ||
                 name.includes('치약') || name.includes('toothpaste') || name.includes('칫솔') || name.includes('toothbrush') ||
                 name.includes('수건') || name.includes('towel') || name.includes('타월') ||
                 name.includes('청소') || name.includes('cleaning') || name.includes('걸레') || name.includes('mop') ||
                 name.includes('휴지') || name.includes('toilet paper') || name.includes('화장실') ||
                 name.includes('세탁') || name.includes('laundry') || name.includes('세탁기') || name.includes('washing machine') ||
                 name.includes('건조') || name.includes('dryer') || name.includes('건조기') ||
                 name.includes('주방') || name.includes('kitchen') || name.includes('주방용품') ||
                 name.includes('욕실') || name.includes('bathroom') || name.includes('욕실용품') ||
                 name.includes('침구') || name.includes('bedding') || name.includes('이불') || name.includes('blanket') ||
                 name.includes('베개') || name.includes('pillow') || name.includes('매트리스') || name.includes('mattress') ||
                 name.includes('크리넥스') || name.includes('데코앤') || name.includes('퍼실') ||
                 name.includes('딥클린') || name.includes('라벤더젤') || name.includes('다우니') ||
                 name.includes('섬유유연제') || name.includes('려') || name.includes('자양') ||
                 name.includes('민감성') || name.includes('헤어케어') || name.includes('바디케어') ||
                 name.includes('세정제') || name.includes('개인용품') || name.includes('생활용품')) {
            console.log('→ 생활 카테고리로 분류');
            return '생활';
        }
        
        // 가전 카테고리
        else if (name.includes('노트북') || name.includes('laptop') || name.includes('맥북') || 
                 name.includes('lg그램') || name.includes('lg gram') || name.includes('그램') ||
                 name.includes('마우스') || name.includes('mouse') ||
                 name.includes('이어폰') || name.includes('헤드폰') || name.includes('earphone') ||
                 name.includes('키보드') || name.includes('keyboard') ||
                 name.includes('모니터') || name.includes('monitor') || name.includes('디스플레이') || name.includes('display') ||
                 name.includes('스피커') || name.includes('speaker') ||
                 name.includes('충전기') || name.includes('charger') || name.includes('케이블') || name.includes('cable') ||
                 name.includes('스마트폰') || name.includes('smartphone') || name.includes('핸드폰') || name.includes('phone') ||
                 name.includes('태블릿') || name.includes('tablet') || name.includes('아이패드') || name.includes('ipad') ||
                 name.includes('컴퓨터') || name.includes('computer') || name.includes('pc') ||
                 name.includes('프린터') || name.includes('printer') || name.includes('복사기') || name.includes('copier') ||
                 name.includes('tv') || name.includes('텔레비전') || name.includes('television') ||
                 name.includes('냉장고') || name.includes('refrigerator') || name.includes('냉동고') || name.includes('freezer') ||
                 name.includes('전자레인지') || name.includes('microwave') || name.includes('오븐') || name.includes('oven') ||
                 name.includes('청소기') || name.includes('vacuum') || name.includes('로봇청소기') || name.includes('robot vacuum') ||
                 name.includes('에어컨') || name.includes('air conditioner') || name.includes('공기청정기') || name.includes('air purifier') ||
                 name.includes('선풍기') || name.includes('fan') || name.includes('히터') || name.includes('heater') ||
                 name.includes('전기') || name.includes('electric') || name.includes('전자') || name.includes('electronic') ||
                 name.includes('가전') || name.includes('appliance') || name.includes('기기') || name.includes('device') ||
                 name.includes('로지텍') || name.includes('무선') || name.includes('블루투스') ||
                 name.includes('usb') || name.includes('hdmi') || name.includes('전자제품') ||
                 name.includes('디지털') || name.includes('스마트') || name.includes('전자기기') ||
                 name.includes('it') || name.includes('모니터') || name.includes('프린터') ||
                 name.includes('스캐너') || name.includes('카메라') || name.includes('휴대폰') ||
                 name.includes('태블릿') || name.includes('스마트폰')) {
            console.log('→ 가전 카테고리로 분류');
            return '가전';
        }
        
        // 유아 카테고리
        else if (name.includes('기저귀') || name.includes('diaper') ||
                 name.includes('분유') || name.includes('formula') ||
                 name.includes('물티슈') || name.includes('wet wipe') ||
                 name.includes('이유식') || name.includes('baby food') ||
                 name.includes('유아용') || name.includes('baby') || name.includes('아기') || name.includes('infant') ||
                 name.includes('아동') || name.includes('child') || name.includes('키즈') || name.includes('kids') ||
                 name.includes('유모차') || name.includes('stroller') || name.includes('카시트') || name.includes('car seat') ||
                 name.includes('유아복') || name.includes('baby clothes') || name.includes('아기옷') ||
                 name.includes('장난감') || name.includes('toy') || name.includes('완구') ||
                 name.includes('유아식품') || name.includes('baby food') || name.includes('아기음식') ||
                 name.includes('수유') || name.includes('feeding') || name.includes('젖병') || name.includes('bottle') ||
                 name.includes('유아용품') || name.includes('baby products') || name.includes('아기용품') ||
                 name.includes('육아') || name.includes('parenting') || name.includes('육아용품') ||
                 name.includes('아기침대') || name.includes('baby bed') || name.includes('유아침대') ||
                 name.includes('아기욕조') || name.includes('baby bathtub') || name.includes('유아욕조') ||
                 name.includes('트루맘') || name.includes('일동') || name.includes('프리미엄') ||
                 name.includes('베이비') || name.includes('신생아') || name.includes('영아') ||
                 name.includes('유아식품') || name.includes('아기용품') || name.includes('육아용품') ||
                 name.includes('임신') || name.includes('출산') || name.includes('수유') ||
                 name.includes('젖병') || name.includes('이유식') || name.includes('유아장난감') ||
                 name.includes('아기옷') || name.includes('유아의류') || name.includes('아기용품')) {
            console.log('→ 유아 카테고리로 분류');
            return '유아';
        }
        
        // 기타 카테고리 (위에 해당하지 않는 모든 상품)
        else {
            console.log('→ 기타 카테고리로 분류 (기본값)');
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
            
            // Firebase 초기화 후 PC/모바일 버튼 상태 재확인 및 강제 표시
            if (window.innerWidth > 768) {
                const pcButtonGroup = document.querySelector('.pc-button-group');
                const mobileButtonBar = document.querySelector('.top-button-bar.mobile-only');
                
                if (pcButtonGroup) {
                    console.log('Firebase 후 PC 버튼 그룹 상태:', pcButtonGroup.style.display, pcButtonGroup.classList);
                    // PC용 버튼 그룹 강제 표시
                    pcButtonGroup.style.display = 'flex !important';
                    pcButtonGroup.style.visibility = 'visible !important';
                    pcButtonGroup.style.opacity = '1 !important';
                    pcButtonGroup.style.gap = '4px';
                    pcButtonGroup.style.alignItems = 'center';
                    pcButtonGroup.style.marginLeft = 'auto'; // 오른쪽 끝으로 밀기
                    console.log('Firebase 후 PC 버튼 그룹 강제 표시 설정 완료');
                } else {
                    console.log('Firebase 후 PC 버튼 그룹을 찾을 수 없습니다.');
                }
                
                // 모바일 버튼 바 완전히 숨김
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'none !important';
                    mobileButtonBar.style.visibility = 'hidden !important';
                    mobileButtonBar.style.opacity = '0 !important';
                    console.log('Firebase 후 모바일용 버튼 바 완전 숨김 처리 완료');
                }
                
                // Firebase 후 PC용 로고 스타일 강제 적용 - 로컬에서는 왼쪽 정렬
                const logo = document.querySelector('.logo');
                if (logo) {
                    const isLocal = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname === '';
                    
                    if (isLocal) {
                        logo.style.textAlign = 'left';
                        logo.style.justifySelf = 'start';
                        logo.style.width = 'auto';
                        logo.style.fontSize = '1.32rem';
                        logo.style.color = '#1e40af'; /* 원래 파란색으로 복원 */
                        console.log('Firebase 후 로컬 환경: 로고 왼쪽 정렬 적용');
                    } else {
                        logo.style.fontSize = '1.98rem';
                        logo.style.fontWeight = '600';
                        logo.style.color = '#1e40af'; /* 원래 파란색으로 복원 */
                        logo.style.textAlign = 'center';
                        logo.style.width = '100%';
                        console.log('Firebase 후 배포 환경: 로고 가운데 정렬 적용');
                    }
                }
                
                // 모바일 환경에서도 로컬 감지 적용
                if (window.innerWidth <= 768) {
                    const mobileLogo = document.querySelector('.logo');
                    if (mobileLogo) {
                        const isLocal = window.location.hostname === 'localhost' || 
                                       window.location.hostname === '127.0.0.1' ||
                                       window.location.hostname === '';
                        
                        if (isLocal) {
                            mobileLogo.style.textAlign = 'left !important';
                            mobileLogo.style.justifySelf = 'start !important';
                            mobileLogo.style.width = 'auto !important';
                            mobileLogo.style.marginLeft = '0 !important';
                            mobileLogo.style.paddingLeft = '0 !important';
                            mobileLogo.style.position = 'relative !important';
                            mobileLogo.style.left = '0 !important';
                            mobileLogo.style.transform = 'none !important';
                            mobileLogo.style.float = 'left !important';
                            mobileLogo.style.maxWidth = 'none !important';
                            mobileLogo.style.display = 'inline-block !important';
                            mobileLogo.style.verticalAlign = 'top !important';
                            mobileLogo.style.clear = 'both !important';
                            mobileLogo.style.marginRight = 'auto !important';
                            mobileLogo.style.marginTop = '0 !important';
                            mobileLogo.style.marginBottom = '0 !important';
                            mobileLogo.style.gridColumn = '1 !important';
                            mobileLogo.style.gridRow = '1 !important';
                            mobileLogo.style.alignSelf = 'start !important';
                            mobileLogo.style.justifyContent = 'flex-start !important';
                            console.log('Firebase 후 모바일 로컬 환경: 로고 왼쪽 끝 정렬 강제 적용');
                        }
                    }
                }
                
                // 모바일 로컬 환경에서 헤더 레이아웃 강제 변경
                if (window.innerWidth <= 768) {
                    const header = document.querySelector('.header');
                    const headerCenter = document.querySelector('.header-center');
                    const mobileLogo = document.querySelector('.logo');
                    
                    if (isLocal && header && headerCenter && mobileLogo) {
                        // 헤더를 flex 레이아웃으로 강제 변경
                        header.style.display = 'flex !important';
                        header.style.flexDirection = 'row !important';
                        header.style.alignItems = 'center !important';
                        header.style.justifyContent = 'space-between !important';
                        header.style.gridTemplateColumns = 'none !important';
                        header.style.gridTemplateRows = 'none !important';
                        
                        // 헤더 센터를 flex로 변경
                        headerCenter.style.display = 'flex !important';
                        headerCenter.style.justifyContent = 'flex-start !important';
                        headerCenter.style.alignItems = 'center !important';
                        headerCenter.style.width = 'auto !important';
                        headerCenter.style.gridColumn = 'unset !important';
                        headerCenter.style.gridRow = 'unset !important';
                        
                        console.log('모바일 로컬 환경: 헤더 레이아웃을 flex로 강제 변경');
                    }
                }
                
                // Firebase 후 PC용 헤더 그리드 레이아웃 강제 적용
                const header = document.querySelector('.header');
                if (header) {
                    header.style.display = 'grid';
                    header.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
                    header.style.alignItems = 'center';
                    console.log('Firebase 후 PC 헤더 그리드 레이아웃 강제 적용 완료');
                }
                
                // Firebase 후 PC용 헤더 섹션 그리드 위치 강제 적용
                const headerLeft = document.querySelector('.header-left');
                const headerCenter = document.querySelector('.header-center');
                const headerRight = document.querySelector('.header-right');
                
                if (headerLeft) {
                    headerLeft.style.gridColumn = '1 / 3';
                    console.log('Firebase 후 PC header-left 그리드 위치 설정 완료');
                }
                
                if (headerCenter) {
                    headerCenter.style.gridColumn = '3';
                    console.log('Firebase 후 PC header-center 그리드 위치 설정 완료');
                }
                
                if (headerRight) {
                    headerRight.style.gridColumn = '4 / 6';
                    console.log('Firebase 후 PC header-right 그리드 위치 설정 완료');
                }
                
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'none';
                    console.log('Firebase 후 모바일용 버튼 바 숨김 처리 완료');
                }
            } else {
                // 모바일에서는 모바일용 버튼 바 표시
                const mobileButtonBar = document.querySelector('.top-button-bar.mobile-only');
                const pcButtonGroup = document.querySelector('.pc-button-group');
                
                if (mobileButtonBar) {
                    mobileButtonBar.style.display = 'flex';
                    mobileButtonBar.style.position = 'fixed';
                    mobileButtonBar.style.top = '0px';
                    mobileButtonBar.style.right = '0px';
                    mobileButtonBar.style.zIndex = '9999';
                    console.log('Firebase 후 모바일용 버튼 바 표시 설정 완료');
                }
                
                if (pcButtonGroup) {
                    pcButtonGroup.style.display = 'none';
                    console.log('Firebase 후 PC용 버튼 그룹 숨김 처리 완료');
                }
            }
        
        // 상품 로딩 상태 확인
        console.log('현재 로드된 상품 개수:', this.products.length);
        if (this.products.length === 0) {
            console.log('상품이 로드되지 않았습니다. Firebase 연결을 확인하세요.');
        }
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
            
            // forEach 대신 for...of 루프 사용 (비동기 처리)
            for (const doc of querySnapshot.docs) {
                const product = { id: doc.id, ...doc.data() };
                
                // createdAt 필드 안전하게 처리
                if (!product.createdAt) {
                    product.createdAt = new Date().toISOString();
                } else if (product.createdAt instanceof Date) {
                    product.createdAt = product.createdAt.toISOString();
                }
                
                // 카테고리 재감지 비활성화 (로컬 수정사항 보존을 위해)
                // const detectedCategory = this.detectCategory(product.name);
                // console.log(`카테고리 재감지 결과: "${product.name}" - 기존: ${product.category}, 감지: ${detectedCategory}`);
                
                // 로컬에서 수정하지 않은 제품만 카테고리 재감지 적용
                // if (!this.localModifications.has(product.id) && detectedCategory !== product.category) {
                //     console.log(`카테고리 수정: "${product.name}" ${product.category} → ${detectedCategory}`);
                //     product.category = detectedCategory;
                //     
                //     // Firebase에도 업데이트
                //     try {
                //         const productRef = window.firebaseDoc(window.firebaseDb, 'products', product.id);
                //         await window.firebaseUpdateDoc(productRef, { category: detectedCategory });
                //         console.log(`Firebase 카테고리 업데이트 완료: ${product.id} → ${detectedCategory}`);
                //     } catch (error) {
                //         console.error('Firebase 카테고리 업데이트 실패:', error);
                //     }
                // } else if (this.localModifications.has(product.id)) {
                //     console.log(`로컬 수정된 제품으로 카테고리 재감지 건너뜀: ${product.id} (${product.name})`);
                // } else {
                //     console.log(`카테고리 변경 없음: ${product.id} (${product.name}) - ${product.category}`);
                // }
                
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
            }
            
            // 테스트 데이터와 Firebase 데이터 병합 (중복 제거)
            const existingIds = new Set(this.products.map(p => p.id));
            const newFirebaseProducts = firebaseProducts.filter(p => !existingIds.has(p.id));
            this.products = [...this.products, ...newFirebaseProducts];
            
            console.log('Firebase에서 제품 데이터 불러오기 완료:', firebaseProducts.length, '개');
            console.log('새로 추가된 Firebase 제품:', newFirebaseProducts.length, '개');
            console.log('전체 제품 목록:', this.products.map(p => ({ name: p.name, category: p.category, status: p.status })));
            
            // 페이지 로드 시 로컬 수정 플래그 초기화
            this.localModifications.clear();
            console.log('페이지 로드 시 로컬 수정 플래그 초기화 완료');
            
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
            
            // 전체 교체 (중복 제거 대신 Firebase 데이터를 신뢰)
            this.priceReports = firebaseReports;
            
            console.log('Firebase에서 가격 변경 신고 불러오기 완료:', firebaseReports.length, '개');
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
                
                // Firebase 실시간 리스너 비활성화 (F5 문제 해결을 위해)
                console.log('Firebase 실시간 리스너 비활성화됨 (F5 문제 해결)');
                
                // 대신 수동 새로고침 버튼 추가
                this.addManualRefreshButton();
                
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
                                // 중복 체크
                                const exists = this.priceReports.find(r => r.id === reportData.id);
                                if (!exists) {
                                    this.priceReports.push(reportData);
                                    console.log('=== 새 가격 변경 신고 추가됨 ===');
                                    console.log('신고 데이터:', reportData);
                                    console.log('현재 신고 개수:', this.priceReports.length);
                                    console.log('대기 중인 신고:', this.priceReports.filter(r => r.status === 'pending').length);
                                    
                                    // 강제로 알림 업데이트 즉시 실행 (3번 시도)
                                    let retryCount = 0;
                                    const updateNotificationWithRetry = () => {
                                        retryCount++;
                                        console.log(`알림 업데이트 시도 ${retryCount}/3`);
                                        this.updateAdminNotification();
                                        
                                        if (retryCount < 3) {
                                            setTimeout(updateNotificationWithRetry, 100);
                                        }
                                    };
                                    setTimeout(updateNotificationWithRetry, 100);
                                } else {
                                    console.log('이미 존재하는 신고:', reportData.id);
                                }
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
            
            // 현재 화면 상태 저장
            sessionStorage.setItem('currentAdminView', 'pending');
        } catch (error) {
            console.error('대기 중인 제품 불러오기 실패:', error);
        }
    }

    async loadAllProducts() {
        try {
            console.log('전체 제품 불러오기 시작 - 로컬 데이터 사용');
            
            // 로컬 데이터 사용 (실시간 동기화된 데이터)
            // rejected와 pending 상태를 제외 (승인된 제품만 표시)
            const products = this.products.filter(p => p.status === 'approved');
            
            console.log('로컬에서 필터링된 제품 수:', products.length);
            console.log('전체 제품 목록:', products.map(p => ({ name: p.name, status: p.status })));
            
            this.displayAllProductsAdmin(products);
            this.setupWheelNavigation(products, 'all');
            
            // 현재 화면 상태 저장
            sessionStorage.setItem('currentAdminView', 'all');
        } catch (error) {
            console.error('전체 제품 불러오기 실패:', error);
        }
    }

    displayPendingProducts(products) {
        // 최신순으로 정렬 (먼저 신고한 게 위로)
        console.log('정렬 전 products:', products.map(p => ({ 
            name: p.name, 
            createdAt: p.createdAt,
            status: p.status 
        })));
        
        const sortedProducts = [...products].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            
            // 디버깅: 날짜 비교 결과 로그
            console.log('날짜 비교:', {
                nameA: a.name,
                dateA: dateA.getTime(),
                nameB: b.name,
                dateB: dateB.getTime(),
                result: dateA - dateB
            });
            
            return dateA - dateB; // 최신순 (나중에 신고한 게 위에)
        });
        
        console.log('정렬 후 products:', sortedProducts.map(p => ({ 
            name: p.name, 
            createdAt: p.createdAt 
        })));
        
        const adminContent = document.getElementById('pendingProductsList');
        adminContent.innerHTML = `
            <h3>승인 대기 중인 제품 (${sortedProducts.length}개)</h3>
            <div class="pending-products">
                ${sortedProducts.map(product => this.createPendingProductElement(product)).join('')}
            </div>
        `;
        
        // 드래그 스크롤 설정
        this.setupDragScroll();
    }

    displayAllProductsAdmin(products) {
        // 가격순으로 정렬 (낮은 가격이 위로)
        const sortedProducts = [...products].sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB; // 낮은 가격이 위에
        });
        
        const adminContent = document.getElementById('pendingProductsList');
        adminContent.innerHTML = `
            <h3>전체 제품 관리 (${sortedProducts.length}개)</h3>
            <div class="all-products">
                ${sortedProducts.map(product => this.createAllProductElement(product)).join('')}
            </div>
        `;
        
        // 마우스 휠 네비게이션 설정
        this.setupWheelNavigation(sortedProducts, 'all');
        
        // 드래그 스크롤 설정
        this.setupDragScroll();
    }

    createPendingProductElement(product) {
        const finalPrice = this.calculateFinalPrice(product);
        
        return `
            <div class="pending-product-item" data-product-id="${product.id}" draggable="true">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p><strong>쇼핑몰:</strong> ${product.store}</p>
                    <p><strong class="price-label">가격:</strong> <span class="price-value">${product.originalPrice.toLocaleString()}원</span></p>
                    <p><strong>최종가격:</strong> <span class="final-price-value">${finalPrice.toLocaleString()}원</span></p>
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
        
        // 제품 정보 시간 표시 (Firebase에서 가져온 시간 또는 현재 시간)
        const lastUpdated = product.lastUpdated ? this.formatUpdateTime(product.lastUpdated) : '미확인';
        
        return `
            <div class="admin-product-item all-product-item" data-product-id="${product.id}" draggable="true">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p><strong>쇼핑몰:</strong> ${product.store}</p>
                    <p><strong class="price-label">가격:</strong> <span class="price-value">${product.originalPrice.toLocaleString()}원</span></p>
                    <p><strong>최종가격:</strong> <span class="final-price-value">${finalPrice.toLocaleString()}원</span></p>
                    <p><strong>카테고리:</strong> ${product.category}</p>
                    <p><strong>상태:</strong> <span class="${statusClass}">${statusText}</span></p>
                    <p><strong>등록자:</strong> ${product.submittedBy}</p>
                    <p><strong>마지막 확인:</strong> <span id="lastUpdated-${product.id}" class="last-updated-time">${lastUpdated}</span></p>
                </div>
                <div class="admin-controls">
                    ${product.status !== 'approved' ? `<button class="approve-btn" onclick="approveProduct('${product.id}')">승인</button>` : ''}
                    <button class="edit-btn" onclick="editProduct('${product.id}')">수정</button>
                    <button class="refresh-btn" onclick="refreshProductTime('${product.id}')">🔄 갱신</button>
                    ${product.status !== 'rejected' ? `<button class="reject-btn" onclick="showDeleteConfirmation('product', '${product.id}', '${product.name}')">삭제</button>` : ''}
                    <a href="${product.link || '#'}" target="_blank" class="link-btn">연결</a>
                </div>
            </div>
        `;
    }


    // UI 강제 업데이트 함수
    forceUIUpdate() {
        console.log('UI 강제 업데이트 시작');
        
        // 카테고리 카운트 업데이트
        this.updateCategoryCounts();
        
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

        // 승인된 제품만 표시
        let filteredProducts = this.products.filter(p => p.status === 'approved');
        console.log('updateMainProductList: 승인된 제품만 필터링:', filteredProducts.length, '개');
        
        // 현재 선택된 카테고리 필터 적용
        const activeCategory = document.querySelector('.category-item.active');
        if (activeCategory) {
            const categoryName = activeCategory.querySelector('.category-name').textContent;
            if (categoryName !== '전체') {
                filteredProducts = filteredProducts.filter(product => {
                    // 제품의 실제 카테고리 속성 사용
                    const productCategory = product.category || this.detectCategory(product.name);
                    console.log(`제품 "${product.name}" 카테고리: ${productCategory}, 선택된 카테고리: ${categoryName}`);
                    return productCategory === categoryName;
                });
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
                                    <option value="특가" ${product.category === '특가' ? 'selected' : ''}>초특가</option>
                                    <option value="식품" ${product.category === '식품' ? 'selected' : ''}>식품</option>
                                    <option value="생활" ${product.category === '생활' ? 'selected' : ''}>생활</option>
                                    <option value="가전" ${product.category === '가전' ? 'selected' : ''}>가전</option>
                                    <option value="유아" ${product.category === '유아' ? 'selected' : ''}>유아</option>
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

    // 제품 데이터 갱신 함수
    async refreshProductData(productId) {
        try {
            console.log('제품 데이터 갱신 시작:', productId);
            
            // 현재 시간으로 업데이트 시간 초기화
            const currentTime = new Date().toISOString();
            
            // 로컬 데이터에서 제품 찾기
            const localProductIndex = this.products.findIndex(p => p.id === productId);
            if (localProductIndex !== -1) {
                // 로컬 데이터 업데이트 (업데이트 시간 초기화)
                this.products[localProductIndex].lastUpdated = currentTime;
                console.log('로컬 제품 업데이트 시간 초기화:', this.products[localProductIndex].name, '→', currentTime);
                
                // Firebase에도 업데이트 시간 반영
                const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
                await window.firebaseUpdateDoc(productRef, { lastUpdated: currentTime });
                console.log('Firebase 제품 업데이트 시간 초기화 완료:', productId);
                
                // UI 업데이트
                this.forceUIUpdate();
                alert('제품 업데이트 시간이 초기화되었습니다.');
            } else {
                console.warn('로컬 데이터에서 제품을 찾을 수 없음:', productId);
                alert('제품을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('제품 업데이트 시간 초기화 실패:', error);
            alert('업데이트 시간 초기화에 실패했습니다.');
        }
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

            console.log('제품 수정 데이터:', formData);
            console.log('수정할 제품 ID:', productId);

            // Firebase 업데이트
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, formData);

            console.log('Firebase 제품 수정 완료:', productId);

            // 로컬 데이터도 업데이트
            const localProductIndex = this.products.findIndex(p => p.id === productId);
            if (localProductIndex !== -1) {
                const oldProduct = { ...this.products[localProductIndex] };
                this.products[localProductIndex] = {
                    ...this.products[localProductIndex],
                    ...formData
                };
                console.log('로컬 제품 데이터 업데이트 완료:');
                console.log('이전 데이터:', oldProduct);
                console.log('새 데이터:', this.products[localProductIndex]);
                
                // 카테고리 변경 확인
                if (oldProduct.category !== formData.category) {
                    console.log(`카테고리 변경됨: ${oldProduct.category} → ${formData.category}`);
                }
                
                // 로컬 수정 플래그 설정
                this.localModifications.add(productId);
                console.log('로컬 수정 플래그 설정:', productId);
            } else {
                console.warn('로컬 데이터에서 제품을 찾을 수 없음:', productId);
            }

            // UI 강제 업데이트
            this.forceUIUpdate();

            alert('제품이 수정되었습니다.');

            // 팝업 닫기
            closeEditPopup();

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
            
            // 알림 업데이트
            this.updateAdminNotification();
            
        } catch (error) {
            console.error('제품 승인 실패:', error);
            alert('제품 승인에 실패했습니다.');
        }
    }

    async refreshProductTime(productId) {
        try {
            console.log('제품 시간 갱신 시작:', productId);
            
            const now = new Date();
            const nowISO = now.toISOString();
            
            // Firebase에서 제품 업데이트
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, {
                lastUpdated: nowISO
            });
            
            // 로컬 데이터도 업데이트
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                this.products[productIndex].lastUpdated = nowISO;
            }
            
            // UI 업데이트
            const lastUpdatedElement = document.getElementById(`lastUpdated-${productId}`);
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = this.formatUpdateTime(nowISO);
            }
            
            console.log('제품 시간 갱신 완료:', nowISO);
            alert('확인 시간이 업데이트되었습니다.');
            
        } catch (error) {
            console.error('제품 시간 갱신 실패:', error);
            alert('시간 업데이트에 실패했습니다.');
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
            
            // 현재 화면 상태 저장
            sessionStorage.setItem('currentAdminView', 'reports');
        } catch (error) {
            console.error('가격 변경 신고 불러오기 실패:', error);
        }
    }

    displayPriceReports(reports) {
        // 최신순으로 정렬 (먼저 신고한 게 위로)
        console.log('정렬 전 reports:', reports.map(r => ({ 
            id: r.id,
            reportedAt: r.reportedAt,
            status: r.status 
        })));
        
        const sortedReports = [...reports].sort((a, b) => {
            const dateA = a.reportedAt ? new Date(a.reportedAt) : new Date(0);
            const dateB = b.reportedAt ? new Date(b.reportedAt) : new Date(0);
            
            // 디버깅: 날짜 비교 결과 로그
            console.log('날짜 비교:', {
                idA: a.id,
                dateA: dateA.getTime(),
                idB: b.id,
                dateB: dateB.getTime(),
                result: dateA - dateB
            });
            
            return dateA - dateB; // 최신순 (나중에 신고한 게 위에)
        });
        
        console.log('정렬 후 reports:', sortedReports.map(r => ({ 
            id: r.id,
            reportedAt: r.reportedAt 
        })));
        
        const adminContent = document.getElementById('pendingProductsList');
        
        if (sortedReports.length === 0) {
            adminContent.innerHTML = `
                <h3>가격 변경 신고 (0개)</h3>
                <div class="no-reports">
                    <p>대기 중인 가격 변경 신고가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        adminContent.innerHTML = `
            <h3>가격 변경 신고 (${sortedReports.length}개)</h3>
            <div class="price-reports">
                ${sortedReports.map(report => this.createPriceReportElement(report)).join('')}
            </div>
        `;
        
        // 드래그 스크롤 설정
        this.setupDragScroll();
    }

    // 드래그 스크롤 설정
    setupDragScroll() {
        const adminPanel = document.querySelector('.admin-panel');
        if (!adminPanel) return;

        let isDragging = false;
        let startY = 0;
        let scrollStart = 0;

        adminPanel.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            scrollStart = adminPanel.scrollTop;
            adminPanel.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.clientY;
            adminPanel.scrollTop = scrollStart + deltaY;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                adminPanel.style.cursor = 'default';
            }
        });

        // 터치 이벤트 (모바일)
        let touchStartY = 0;
        let touchScrollStart = 0;

        adminPanel.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchScrollStart = adminPanel.scrollTop;
        });

        adminPanel.addEventListener('touchmove', (e) => {
            const deltaY = touchStartY - e.touches[0].clientY;
            adminPanel.scrollTop = touchScrollStart + deltaY;
        });
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

    // 모바일에서 최상단 버튼 바만 우측 최상단에 고정
    forceHeaderToTop() {
        if (window.innerWidth <= 768) {
            const topButtonBar = document.querySelector('.top-button-bar');
            const header = document.querySelector('.header');
            const container = document.querySelector('.container');
            
            if (topButtonBar) {
                topButtonBar.style.position = 'fixed';
                topButtonBar.style.top = '0';
                topButtonBar.style.right = '0';
                topButtonBar.style.left = 'auto';
                topButtonBar.style.width = 'auto';
                topButtonBar.style.zIndex = '9999';
                topButtonBar.style.display = 'flex';
            }
            
            if (header) {
                header.style.position = 'relative';
                header.style.marginTop = '4px';
            }
            
            if (container) {
                container.style.marginTop = '0px';
                container.style.paddingTop = '0px';
            }
        }
    }
    
    // 모든 드롭다운 패널을 강제로 닫기 (관리 패널만 완전 숨김)
    closeAllDropdowns() {
        // 관리 패널만 완전히 숨기기
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.classList.add('collapsed');
            adminPanel.style.display = 'none';
            adminPanel.style.visibility = 'hidden';
            adminPanel.style.maxHeight = '0';
            adminPanel.style.padding = '0';
            adminPanel.style.overflow = 'hidden';
            console.log('관리 패널을 완전히 숨겼습니다.');
        }
        
        // 최저가신고와 필독칸은 정상적으로 닫기만 (숨기지 않음)
        const productFormDropdown = document.getElementById('productFormDropdown');
        const noticePanel = document.getElementById('noticePanel');
        
        if (productFormDropdown) {
            productFormDropdown.classList.add('collapsed');
            console.log('최저가신고 패널을 닫았습니다.');
        }
        
        if (noticePanel) {
            noticePanel.classList.add('collapsed');
            console.log('필독 패널을 닫았습니다.');
        }
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
            
            // 현재 관리자 패널 상태를 세션 스토리지로 확인
            const currentView = sessionStorage.getItem('currentAdminView') || 'all';
            
            console.log('현재 관리자 뷰:', currentView);
            
            if (currentView === 'pending') {
                // 승인대기 화면이면 승인대기 목록만 새로고침
                await this.loadPendingProducts();
            } else if (currentView === 'all') {
                // 전체 제품 화면이면 전체 제품 목록만 새로고침
                await this.loadAllProducts();
            } else if (currentView === 'reports') {
                // 가격 변경 신고 화면이면 신고 목록만 새로고침
                await this.loadPriceReports();
            }
            
            // 메인 화면도 새로고침
            this.updateMainProductList();
            
            // 알림 업데이트
            this.updateAdminNotification();
            
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
                    <p><strong class="old-price-label">기존 가격:</strong> <span class="old-price-value">${report.oldPrice.toLocaleString()}원</span></p>
                    <p><strong>신고 가격:</strong> <span class="reported-price">${report.newPrice.toLocaleString()}원</span></p>
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
            
            // 알림 업데이트
            this.updateAdminNotification();
            
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
            
            // 알림 업데이트
            this.updateAdminNotification();
            
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
    
    // 기존 제품들의 카테고리를 새로운 대분류로 마이그레이션
    async migrateProductCategories() {
        console.log('제품 카테고리 마이그레이션 시작...');
        
        try {
            // Firebase에서 모든 제품 가져오기
            const productsRef = window.firebaseCollection(window.firebaseDb, 'products');
            const snapshot = await window.firebaseGetDocs(productsRef);
            
            const migrationPromises = [];
            
            snapshot.forEach((doc) => {
                const productData = doc.data();
                const oldCategory = productData.category;
                
                // 새로운 카테고리로 변환
                const newCategory = this.convertOldCategoryToNew(oldCategory);
                
                if (oldCategory !== newCategory) {
                    console.log(`제품 "${productData.name}" 카테고리 변경: ${oldCategory} → ${newCategory}`);
                    
                    // Firebase 문서 업데이트
                    const productRef = window.firebaseDoc(window.firebaseDb, 'products', doc.id);
                    const updatePromise = window.firebaseUpdateDoc(productRef, {
                        category: newCategory
                    });
                    
                    migrationPromises.push(updatePromise);
                }
            });
            
            if (migrationPromises.length > 0) {
                await Promise.all(migrationPromises);
                console.log(`${migrationPromises.length}개 제품의 카테고리가 성공적으로 마이그레이션되었습니다.`);
                
                // 로컬 제품 목록도 업데이트
                this.products.forEach(product => {
                    product.category = this.convertOldCategoryToNew(product.category);
                });
                
                // 카테고리 카운트 업데이트
                this.updateCategoryCounts();
                
                alert('제품 카테고리가 새로운 분류 체계로 성공적으로 업데이트되었습니다!');
            } else {
                console.log('마이그레이션이 필요한 제품이 없습니다.');
            }
            
        } catch (error) {
            console.error('카테고리 마이그레이션 실패:', error);
            alert('카테고리 마이그레이션 중 오류가 발생했습니다.');
        }
    }
    
    // 기존 소분류를 새로운 대분류로 변환하는 함수
    convertOldCategoryToNew(oldCategory) {
        const categoryMap = {
            // 식품 카테고리
            '두유': '식품',
            '우유': '식품',
            '라면': '식품',
            '생수': '식품',
            '음료': '식품',
            '과자': '식품',
            '빵': '식품',
            '쌀': '식품',
            '육류': '식품',
            '생선': '식품',
            '채소': '식품',
            '냉동': '식품',
            '조미료': '식품',
            '간식': '식품',
            
            // 생활 카테고리
            '화장지': '생활',
            '세제': '생활',
            '샴푸': '생활',
            '비누': '생활',
            '치약': '생활',
            '수건': '생활',
            '청소': '생활',
            '휴지': '생활',
            '세탁': '생활',
            '건조': '생활',
            '주방': '생활',
            '욕실': '생활',
            '침구': '생활',
            '베개': '생활',
            
            // 가전 카테고리
            '노트북': '가전',
            '마우스': '가전',
            '이어폰': '가전',
            '키보드': '가전',
            '모니터': '가전',
            '스피커': '가전',
            '충전기': '가전',
            '스마트폰': '가전',
            '태블릿': '가전',
            '컴퓨터': '가전',
            '프린터': '가전',
            'TV': '가전',
            '냉장고': '가전',
            '전자레인지': '가전',
            '청소기': '가전',
            '에어컨': '가전',
            '선풍기': '가전',
            '전자제품': '가전',
            '가전제품': '가전',
            
            // 유아 카테고리
            '기저귀': '유아',
            '분유': '유아',
            '물티슈': '유아',
            '이유식': '유아',
            '유아용': '유아',
            '아동': '유아',
            '유모차': '유아',
            '유아복': '유아',
            '장난감': '유아',
            '유아식품': '유아',
            '수유': '유아',
            '유아용품': '유아',
            '육아': '유아',
            '아기침대': '유아',
            '아기욕조': '유아',
            '아동용품': '유아',
            '육아용품': '유아',
            
            // 특가 카테고리 (초특가는 그대로 유지)
            // '초특가': '특가' // 제거됨 - 이제 초특가는 별도 카테고리로 유지
        };
        
        return categoryMap[oldCategory] || '기타';
    }
    
    updateCategoryCounts() {
        const approvedProducts = this.products.filter(p => p.status === 'approved');
        
        console.log('=== 카테고리 카운트 업데이트 시작 ===');
        console.log('전체 제품 수:', this.products.length);
        console.log('승인된 제품 수:', approvedProducts.length);
        console.log('승인된 제품 목록:', approvedProducts.map(p => ({ 
            name: p.name, 
            category: p.category,
            id: p.id 
        })));
        
        // 각 카테고리별 제품 수 계산 (HTML 순서와 동일하게)
        const categoryCounts = {
            '특가': approvedProducts.filter(p => p.category === '특가').length,
            '식품': approvedProducts.filter(p => p.category === '식품').length,
            '생활': approvedProducts.filter(p => p.category === '생활').length,
            '가전': approvedProducts.filter(p => p.category === '가전').length,
            '유아': approvedProducts.filter(p => p.category === '유아').length,
            '기타': approvedProducts.filter(p => p.category === '기타').length
        };
        
        console.log('카테고리별 제품 수:', categoryCounts);
        
        // 전체 제품 수
        document.getElementById('totalCount').textContent = approvedProducts.length;
        
        // 새로운 대분류별 제품 수 (HTML 순서와 동일하게)
        document.getElementById('specialCount').textContent = categoryCounts['특가'];
        document.getElementById('foodCount').textContent = categoryCounts['식품'];
        document.getElementById('dailyCount').textContent = categoryCounts['생활'];
        document.getElementById('electronicsCount').textContent = categoryCounts['가전'];
        document.getElementById('babyCount').textContent = categoryCounts['유아'];
        document.getElementById('etcCount').textContent = categoryCounts['기타'];
        
        console.log('=== 카테고리 카운트 업데이트 완료 ===');
    }

    // 카테고리 표시명 변환 함수
    getCategoryDisplayName(category) {
        const displayNames = {
            '특가': '초특가',
            '식품': '식품',
            '생활': '생활',
            '가전': '가전',
            '유아': '유아',
            '기타': '기타'
        };
        return displayNames[category] || category;
    }

    // 수동 새로고침 버튼 및 카테고리 일괄 수정 버튼 추가
    addManualRefreshButton() {
        // 관리자 패널에 버튼들 추가
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            const adminControls = adminPanel.querySelector('.admin-controls');
            if (adminControls) {
                // 카테고리 일괄 수정 버튼
                const fixCategoriesButton = document.createElement('button');
                fixCategoriesButton.textContent = '🔧 카테고리 일괄 수정';
                fixCategoriesButton.className = 'admin-btn fix-categories-btn';
                fixCategoriesButton.onclick = () => this.fixAllCategories();
                fixCategoriesButton.style.marginBottom = '10px';
                fixCategoriesButton.style.backgroundColor = '#f59e0b';
                fixCategoriesButton.style.color = 'white';
                fixCategoriesButton.style.border = 'none';
                fixCategoriesButton.style.padding = '8px 12px';
                fixCategoriesButton.style.borderRadius = '4px';
                fixCategoriesButton.style.cursor = 'pointer';
                fixCategoriesButton.style.fontSize = '0.9rem';
                fixCategoriesButton.style.fontWeight = '500';
                fixCategoriesButton.style.width = '100%';
                
                // 데이터 새로고침 버튼
                const refreshButton = document.createElement('button');
                refreshButton.textContent = '🔄 데이터 새로고침';
                refreshButton.className = 'refresh-data-btn';
                refreshButton.onclick = () => this.manualRefreshData();
                refreshButton.style.marginBottom = '10px';
                refreshButton.style.backgroundColor = '#10b981';
                refreshButton.style.color = 'white';
                refreshButton.style.border = 'none';
                refreshButton.style.padding = '8px 12px';
                refreshButton.style.borderRadius = '4px';
                refreshButton.style.cursor = 'pointer';
                refreshButton.style.fontSize = '0.9rem';
                refreshButton.style.fontWeight = '500';
                refreshButton.style.width = '100%';
                
                // 버튼들을 관리자 패널 상단에 추가
                adminControls.insertBefore(fixCategoriesButton, adminControls.firstChild);
                adminControls.insertBefore(refreshButton, adminControls.firstChild);
                
                console.log('관리자 버튼들 추가 완료: 카테고리 일괄 수정, 데이터 새로고침');
            }
        }
    }

    // 카테고리 일괄 수정 기능
    async fixAllCategories() {
        if (!adminAuth.requireAuth()) {
            return;
        }
        
        const confirmed = confirm('모든 제품의 카테고리를 재감지하여 수정하시겠습니까?\n\n주의: 로컬에서 수동으로 수정한 제품은 제외됩니다.');
        if (!confirmed) return;
        
        try {
            let fixedCount = 0;
            let skippedCount = 0;
            
            console.log('=== 카테고리 일괄 수정 시작 ===');
            
            for (const product of this.products) {
                const detectedCategory = this.detectCategory(product.name);
                
                if (detectedCategory !== product.category) {
                    console.log(`카테고리 수정: "${product.name}" ${product.category} → ${detectedCategory}`);
                    
                    // 로컬 데이터 업데이트
                    product.category = detectedCategory;
                    
                    // Firebase 업데이트
                    const productRef = window.firebaseDoc(window.firebaseDb, 'products', product.id);
                    await window.firebaseUpdateDoc(productRef, { category: detectedCategory });
                    
                    fixedCount++;
                } else {
                    skippedCount++;
                }
            }
            
            console.log(`=== 카테고리 일괄 수정 완료 ===`);
            console.log(`수정된 제품: ${fixedCount}개`);
            console.log(`변경 없음: ${skippedCount}개`);
            
            this.forceUIUpdate();
            alert(`카테고리 일괄 수정이 완료되었습니다!\n\n수정된 제품: ${fixedCount}개\n변경 없음: ${skippedCount}개`);
        } catch (error) {
            console.error('카테고리 일괄 수정 실패:', error);
            alert('카테고리 수정에 실패했습니다. 콘솔을 확인해주세요.');
        }
    }

    // 수동 데이터 새로고침
    async manualRefreshData() {
        try {
            console.log('수동 데이터 새로고침 시작');
            await this.loadProductsFromFirebase();
            this.forceUIUpdate();
            alert('데이터가 새로고침되었습니다.');
        } catch (error) {
            console.error('수동 새로고침 실패:', error);
            alert('데이터 새로고침에 실패했습니다.');
        }
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
        const isCollapsed = section.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 패널을 열기
            section.classList.remove('collapsed');
            if (sectionId === 'adminPanel') {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.maxHeight = '70vh';
                section.style.padding = '20px';
                section.style.overflow = 'auto';
            } else if (sectionId === 'noticePanel') {
                // 필독 패널 열기 - PC와 모바일 모두 지원
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.maxHeight = window.innerWidth <= 768 ? '70vh' : '600px';
                section.style.padding = '20px';
                section.style.overflow = 'auto';
                console.log('필독 패널을 열었습니다. 화면 크기:', window.innerWidth);
            }
        } else {
            // 패널을 닫기
            section.classList.add('collapsed');
            if (sectionId === 'adminPanel') {
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.style.maxHeight = '0';
                section.style.padding = '0';
                section.style.overflow = 'hidden';
            } else if (sectionId === 'noticePanel') {
                // 필독 패널 닫기
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.style.maxHeight = '0';
                section.style.padding = '0';
                section.style.overflow = 'hidden';
                console.log('필독 패널을 닫았습니다.');
            }
        }
        
        // 폼이 열릴 때 이벤트 리스너 재설정
        if (sectionId === 'productFormDropdown' && !section.classList.contains('collapsed')) {
            if (window.priceComparisonSite) {
                window.priceComparisonSite.setupFormSubmitListener();
            }
        }
        
        // 관리자 패널이 열릴 때 승인 대기 제품 자동 로드 제거
        // if (sectionId === 'adminPanel' && !section.classList.contains('collapsed')) {
        //     if (window.priceComparisonSite) {
        //         console.log('관리자 패널 열림 - 승인 대기 제품 로드');
        //         window.priceComparisonSite.loadPendingProducts();
        //     }
        // }
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

function refreshProductTime(productId) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.refreshProductTime(productId);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.priceComparisonSite = new PriceComparisonSite();
});

// 숫자별 댓글 시스템의 추가 함수들
PriceComparisonSite.prototype.editComment = function(commentId) {
    if (!adminAuth.requireAuth()) {
        return;
    }

    const comments = this.getNumberComments();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    // 기존 댓글 요소 찾기
    const commentElement = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentElement) return;

    // 수정 폼 HTML 생성
    const editForm = `
        <div class="comment-edit-form" data-comment-id="${commentId}">
            <textarea class="comment-edit-textarea" rows="3" placeholder="댓글을 수정하세요...">${comment.content}</textarea>
            <div class="comment-edit-actions">
                <button class="comment-action-btn save-edit-btn" onclick="priceComparisonSite.saveCommentEdit('${commentId}')">저장</button>
                <button class="comment-action-btn cancel-edit-btn" onclick="priceComparisonSite.cancelCommentEdit('${commentId}')">취소</button>
            </div>
        </div>
    `;

    // 댓글 내용을 수정 폼으로 교체
    const contentElement = commentElement.querySelector('.comment-content');
    if (contentElement) {
        contentElement.innerHTML = editForm;
        
        // 텍스트에어리어에 포커스
        const textarea = commentElement.querySelector('.comment-edit-textarea');
        if (textarea) {
            textarea.focus();
            textarea.select();
            
            // 키보드 단축키 이벤트 리스너 추가
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    // Ctrl+Enter로 저장
                    e.preventDefault();
                    this.saveCommentEdit(commentId);
                } else if (e.key === 'Escape') {
                    // Escape로 취소
                    e.preventDefault();
                    this.cancelCommentEdit(commentId);
                }
            });
        }
    }
};

PriceComparisonSite.prototype.saveCommentEdit = function(commentId) {
    const commentElement = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentElement) return;

    const textarea = commentElement.querySelector('.comment-edit-textarea');
    if (!textarea) return;

    const newContent = textarea.value.trim();
    if (!newContent) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    const comments = this.getNumberComments();
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.content = newContent;
        localStorage.setItem('numberComments', JSON.stringify(comments));
        this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
    }
};

PriceComparisonSite.prototype.cancelCommentEdit = function(commentId) {
    // 댓글 목록을 다시 로드하여 원래 상태로 복원
    this.loadNumberComments();
};

PriceComparisonSite.prototype.deleteComment = function(commentId) {
    if (!adminAuth.requireAuth()) {
        return;
    }

    if (!confirm('정말로 이 댓글을 삭제하시겠습니까? 하위 댓글도 함께 삭제됩니다.')) {
        return;
    }

    const comments = this.getNumberComments();
    
    // 삭제할 댓글과 모든 하위 댓글들을 찾는 함수
    const getCommentsToDelete = (parentId) => {
        const toDelete = [parentId];
        const findChildren = (id) => {
            const children = comments.filter(c => c.parentId === id);
            children.forEach(child => {
                toDelete.push(child.id);
                findChildren(child.id); // 재귀적으로 하위 댓글 찾기
            });
        };
        findChildren(parentId);
        return toDelete;
    };

    const commentsToDelete = getCommentsToDelete(commentId);
    const filteredComments = comments.filter(c => !commentsToDelete.includes(c.id));
    
    localStorage.setItem('numberComments', JSON.stringify(filteredComments));
    this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
};

PriceComparisonSite.prototype.submitReply = function(parentId) {
    const replyContent = prompt('댓글을 입력하세요:');
    if (!replyContent || !replyContent.trim()) {
        return;
    }

    const reply = {
        id: Date.now().toString(),
        content: replyContent.trim(),
        author: '익명',
        timestamp: new Date().toISOString(),
        parentId: parentId,
        number: this.selectedNumber ? this.selectedNumber.toString() : '1' // 현재 선택된 번호로 설정
    };

    this.saveNumberComment(reply);
    this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
};

// 공지사항별 댓글 시스템의 추가 함수들
PriceComparisonSite.prototype.submitNoticeReply = function(parentId) {
    const replyContent = prompt('댓글을 입력하세요:');
    if (!replyContent || !replyContent.trim()) {
        return;
    }

    const reply = {
        id: Date.now().toString(),
        content: replyContent.trim(),
        author: '익명',
        timestamp: new Date().toISOString(),
        parentId: parentId,
        noticeNumber: this.currentNoticeNumber
    };

    this.saveNoticeComment(reply);
    this.loadNoticeComments();
};

PriceComparisonSite.prototype.editNoticeComment = function(commentId) {
    if (!adminAuth.requireAuth()) {
        return;
    }

    const comments = this.getNoticeComments();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    // 기존 댓글 요소 찾기
    const commentElement = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentElement) return;

    // 수정 폼 HTML 생성
    const editForm = `
        <div class="comment-edit-form" data-comment-id="${commentId}">
            <textarea class="comment-edit-textarea" rows="3" placeholder="댓글을 수정하세요...">${comment.content}</textarea>
            <div class="comment-edit-actions">
                <button class="comment-action-btn save-edit-btn" onclick="priceComparisonSite.saveNoticeCommentEdit('${commentId}')">저장</button>
                <button class="comment-action-btn cancel-edit-btn" onclick="priceComparisonSite.cancelNoticeCommentEdit('${commentId}')">취소</button>
            </div>
        </div>
    `;

    // 댓글 내용을 수정 폼으로 교체
    const contentElement = commentElement.querySelector('.comment-content');
    if (contentElement) {
        contentElement.innerHTML = editForm;
        
        // 텍스트에어리어에 포커스
        const textarea = commentElement.querySelector('.comment-edit-textarea');
        if (textarea) {
            textarea.focus();
            textarea.select();
            
            // 키보드 단축키 이벤트 리스너 추가
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    // Ctrl+Enter로 저장
                    e.preventDefault();
                    this.saveNoticeCommentEdit(commentId);
                } else if (e.key === 'Escape') {
                    // Escape로 취소
                    e.preventDefault();
                    this.cancelNoticeCommentEdit(commentId);
                }
            });
        }
    }
};

PriceComparisonSite.prototype.saveNoticeCommentEdit = function(commentId) {
    const commentElement = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentElement) return;

    const textarea = commentElement.querySelector('.comment-edit-textarea');
    if (!textarea) return;

    const newContent = textarea.value.trim();
    if (!newContent) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    const comments = this.getNoticeComments();
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.content = newContent;
        localStorage.setItem('noticeComments', JSON.stringify(comments));
        this.loadNoticeComments();
    }
};

PriceComparisonSite.prototype.cancelNoticeCommentEdit = function(commentId) {
    // 댓글 목록을 다시 로드하여 원래 상태로 복원
    this.loadNoticeComments();
};

PriceComparisonSite.prototype.deleteNoticeComment = function(commentId) {
    if (!adminAuth.requireAuth()) {
        return;
    }

    if (!confirm('정말로 이 댓글을 삭제하시겠습니까? 하위 댓글도 함께 삭제됩니다.')) {
        return;
    }

    const comments = this.getNoticeComments();
    
    // 삭제할 댓글과 모든 하위 댓글들을 찾는 함수
    const getCommentsToDelete = (parentId) => {
        const toDelete = [parentId];
        const findChildren = (id) => {
            const children = comments.filter(c => c.parentId === id);
            children.forEach(child => {
                toDelete.push(child.id);
                findChildren(child.id); // 재귀적으로 하위 댓글 찾기
            });
        };
        findChildren(parentId);
        return toDelete;
    };

    const commentsToDelete = getCommentsToDelete(commentId);
    const filteredComments = comments.filter(c => !commentsToDelete.includes(c.id));
    
    localStorage.setItem('noticeComments', JSON.stringify(filteredComments));
    this.loadNoticeComments();
};

// 전역 함수로 등록 (누구나 접근 가능)
window.refreshProductData = function(productId) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.refreshProductData(productId);
    } else {
        console.error('PriceComparisonSite 인스턴스를 찾을 수 없습니다.');
        alert('시스템을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.');
    }
};