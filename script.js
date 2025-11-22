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
        
        // 취소 버튼을 누른 경우 (null 반환) 또는 빈 문자열
        if (password === null || password === '') {
            console.log('관리자 인증 취소');
            return false;
        }
        
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
window.adminAuth = adminAuth; // 전역 접근을 위해 window에 할당

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

// 방문자 통계 관리 클래스
class VisitorCounter {
    constructor() {
        this.db = null;
        this.statsDocId = 'visitor_stats';
        this.init();
    }

    async init() {
        // Firebase가 준비될 때까지 대기
        const checkFirebase = setInterval(() => {
            if (window.firestoreDB) {
                clearInterval(checkFirebase);
                this.db = window.firestoreDB;
                
                // 방문 기록 저장 후 통계 업데이트 (순서 보장)
                this.recordVisit().then(() => {
                    // 방문 기록 저장 완료 후 통계 업데이트
                    this.updateStats();
                }).catch(() => {
                    // 방문 기록 저장 실패해도 통계 업데이트 (로컬 스토리지 데이터 사용)
                    this.updateStats();
                });
                
                // 주기적으로 통계 업데이트 (30초마다)
                setInterval(() => this.updateStats(), 30000);
                
                console.log('방문자 카운터 초기화 완료');
            }
        }, 100);
    }

    // 방문 기록 (일일 방문자는 중복 카운트)
    async recordVisit() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // 오늘 날짜 키 (YYYY-MM-DD)
            const todayKey = today.toISOString().split('T')[0];
            
            // 이번 달 키 (YYYY-MM)
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // 고유 방문 ID 생성 (타임스탬프 + 랜덤)
            const visitId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            
            // 방문 기록 데이터
            const visitData = {
                id: visitId,
                timestamp: new Date().toISOString(),
                date: todayKey,
                month: monthKey,
                userAgent: navigator.userAgent.substring(0, 100),
                referrer: (document.referrer || '').substring(0, 200),
                savedToFirestore: false // Firestore 저장 여부
            };
            
            // Firestore에 먼저 저장 시도
            if (this.db) {
                try {
                    const visitsRef = window.firebaseCollection(this.db, 'visits');
                    
                    // 방문 기록 문서 추가 (같은 사람이 여러 번 방문하면 여러 번 카운트)
                    await window.firebaseAddDoc(visitsRef, {
                        timestamp: window.firebaseServerTimestamp ? window.firebaseServerTimestamp() : new Date(),
                        date: todayKey,
                        month: monthKey,
                        userAgent: navigator.userAgent.substring(0, 100),
                        referrer: (document.referrer || '').substring(0, 200),
                        visitId: visitId
                    });
                    
                    // Firestore 저장 성공
                    visitData.savedToFirestore = true;
                    console.log('방문 기록 Firestore 저장 완료');
                    
                    // Firestore 저장 성공 시 로컬 스토리지에서 제거 (중복 방지)
                    try {
                        const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
                        const updatedLocalVisits = localVisits.filter(v => v.id !== visitId);
                        localStorage.setItem('visitor_visits', JSON.stringify(updatedLocalVisits));
                    } catch (e) {
                        console.warn('로컬 스토리지 정리 중 오류 (무시 가능):', e);
                    }
                    
                } catch (firestoreError) {
                    // Firestore 저장 실패 시 로컬 스토리지에 임시 저장
                    const isPermissionError = firestoreError.code === 'permission-denied' || 
                                             firestoreError.code === 'PERMISSION_DENIED' ||
                                             firestoreError.message.includes('Missing or insufficient permissions');
                    
                    if (isPermissionError) {
                        // 권한 오류: 로컬 스토리지에 임시 저장
                        const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
                        localVisits.push(visitData);
                        // 최근 1000개만 저장 (용량 제한 방지)
                        if (localVisits.length > 1000) {
                            localVisits.splice(0, localVisits.length - 1000);
                        }
                        localStorage.setItem('visitor_visits', JSON.stringify(localVisits));
                        console.log('방문 기록 로컬 스토리지 임시 저장 (Firestore 권한 오류)');
                        return;
                    }
                    
                    // 다른 오류는 로그 출력
                    console.error('방문 기록 Firestore 저장 실패:', firestoreError);
                    
                    // 다른 오류도 로컬 스토리지에 임시 저장
                    const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
                    localVisits.push(visitData);
                    if (localVisits.length > 1000) {
                        localVisits.splice(0, localVisits.length - 1000);
                    }
                    localStorage.setItem('visitor_visits', JSON.stringify(localVisits));
                    return;
                }
            } else {
                // Firestore가 없는 경우 로컬 스토리지에 임시 저장
                const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
                localVisits.push(visitData);
                if (localVisits.length > 1000) {
                    localVisits.splice(0, localVisits.length - 1000);
                }
                localStorage.setItem('visitor_visits', JSON.stringify(localVisits));
                console.log('방문 기록 로컬 스토리지 임시 저장 (Firestore 미준비)');
            }
            
        } catch (error) {
            console.error('방문 기록 저장 실패:', error);
        }
    }

    // 통계 업데이트 및 표시
    async updateStats() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayKey = today.toISOString().split('T')[0];
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // Firestore에서 전체 방문 기록 가져오기 (모든 사용자의 공유 데이터)
            let firestoreDailyCount = 0;
            let firestoreMonthlyCount = 0;
            let firestoreTotalCount = 0;
            
            if (this.db) {
                try {
                    const visitsRef = window.firebaseCollection(this.db, 'visits');
                    
                    // 오늘 방문자수 계산 (일일은 중복 카운트)
                    const todayQuery = window.firebaseQuery(
                        visitsRef,
                        window.firebaseWhere('date', '==', todayKey)
                    );
                    const todaySnapshot = await window.firebaseGetDocs(todayQuery);
                    firestoreDailyCount = todaySnapshot.size;
                    
                    // 이번 달 누적 방문자수 계산
                    const monthQuery = window.firebaseQuery(
                        visitsRef,
                        window.firebaseWhere('month', '==', monthKey)
                    );
                    const monthSnapshot = await window.firebaseGetDocs(monthQuery);
                    firestoreMonthlyCount = monthSnapshot.size;
                    
                    // 총 누적 방문자수 계산
                    const allSnapshot = await window.firebaseGetDocs(visitsRef);
                    firestoreTotalCount = allSnapshot.size;
                    
                } catch (firestoreError) {
                    // Firestore 오류는 무시하고 계속 진행
                    const isPermissionError = firestoreError.code === 'permission-denied' || 
                                             firestoreError.code === 'PERMISSION_DENIED' ||
                                             firestoreError.message.includes('Missing or insufficient permissions');
                    
                    if (!isPermissionError) {
                        console.error('Firestore 통계 조회 실패:', firestoreError);
                    }
                }
            }
            
            // Firestore 데이터만 사용 (모든 사용자의 공유 데이터)
            // 로컬 스토리지는 Firestore 저장 실패 시에만 임시 저장용으로 사용
            // 통계는 Firestore 데이터만 사용하여 모든 기기에서 동일하게 표시
            
            // Firestore 데이터를 우선 사용 (모든 기기에서 동일한 데이터)
            if (this.db && (firestoreDailyCount > 0 || firestoreMonthlyCount > 0 || firestoreTotalCount > 0)) {
                // Firestore 데이터가 있으면 그것만 사용
                this.updateUI(firestoreDailyCount, firestoreMonthlyCount, firestoreTotalCount);
                await this.saveStatsToFirestore(firestoreDailyCount, firestoreMonthlyCount, firestoreTotalCount);
                
                // 로컬 스토리지의 저장된 방문 기록 정리 (Firestore에 이미 저장된 것들)
                try {
                    const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
                    // savedToFirestore가 true인 항목들 제거
                    const cleanedLocalVisits = localVisits.filter(v => v.savedToFirestore !== true);
                    localStorage.setItem('visitor_visits', JSON.stringify(cleanedLocalVisits));
                } catch (e) {
                    console.warn('로컬 스토리지 정리 중 오류 (무시 가능):', e);
                }
                
                return;
            }
            
            // Firestore 데이터가 없거나 권한 오류인 경우에만 로컬 스토리지 확인
            // (이 경우는 임시로만 사용, Firestore가 복구되면 자동으로 Firestore 데이터 사용)
            const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
            const unsavedVisits = localVisits.filter(v => v.savedToFirestore !== true);
            
            const localDailyCount = unsavedVisits.filter(v => v.date === todayKey).length;
            const localMonthlyCount = unsavedVisits.filter(v => v.month === monthKey).length;
            const localTotalCount = unsavedVisits.length;
            
            // Firestore 데이터가 없을 때만 로컬 스토리지 데이터 사용
            this.updateUI(localDailyCount, localMonthlyCount, localTotalCount);
            
        } catch (error) {
            console.error('통계 업데이트 실패:', error);
            
            // 오류 발생 시에도 로컬 스토리지 데이터로 표시
            try {
                const localVisits = JSON.parse(localStorage.getItem('visitor_visits') || '[]');
                const unsavedVisits = localVisits.filter(v => v.savedToFirestore !== true);
                const now = new Date();
                const todayKey = now.toISOString().split('T')[0];
                const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                
                const localDailyCount = unsavedVisits.filter(v => v.date === todayKey).length;
                const localMonthlyCount = unsavedVisits.filter(v => v.month === monthKey).length;
                const localTotalCount = unsavedVisits.length;
                
                this.updateUI(localDailyCount, localMonthlyCount, localTotalCount);
            } catch (fallbackError) {
                console.error('로컬 스토리지 통계 조회 실패:', fallbackError);
            }
        }
    }

    // Firestore에 통계 저장 (캐시용)
    async saveStatsToFirestore(daily, monthly, total) {
        try {
            if (!this.db) return;
            
            const statsRef = window.firebaseDoc(this.db, 'visitor_stats', this.statsDocId);
            
            await window.firebaseSetDoc(statsRef, {
                daily: daily,
                monthly: monthly,
                total: total,
                lastUpdated: window.firebaseServerTimestamp ? window.firebaseServerTimestamp() : new Date(),
                todayDate: new Date().toISOString().split('T')[0],
                currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            }, { merge: true });
            
        } catch (error) {
            // 권한 오류는 조용히 처리 (에러 로그 출력 안 함)
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.message.includes('Missing or insufficient permissions');
            
            if (isPermissionError) {
                // 통계 저장 권한 오류는 무시 (기능에 영향 없음)
                return;
            }
            
            // 다른 에러만 로그 출력
            console.error('통계 저장 실패:', error);
        }
    }

    // UI 업데이트
    updateUI(daily, monthly, total) {
        const dailyEl = document.getElementById('dailyVisitors');
        
        if (dailyEl) {
            dailyEl.textContent = daily.toLocaleString();
        }
        
        // 콘솔에 모든 통계 출력
        console.log('방문자 통계:', {
            일일: daily.toLocaleString(),
            월간: monthly.toLocaleString(),
            총누적: total.toLocaleString()
        });
    }
}

// 방문자 카운터 초기화 (DOMContentLoaded 후)
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연 후 초기화 (Firebase가 완전히 로드될 시간 확보)
    setTimeout(() => {
        window.visitorCounter = new VisitorCounter();
    }, 500);
});

// 전역 추적 함수들
// 이미지 로드 실패 처리 함수 (동기 함수로 변경 - onerror 핸들러에서 호출되므로)
function handleImageLoadError(imgElement, productId, imageUrl) {
    // 이미지 로드 실패를 조용히 처리 (사용자에게는 표시하지 않음)
    
    // 이미지 요소를 기본 이미지나 빈 상태로 대체
    if (imgElement) {
        // 이미지 요소에 에러 클래스 추가 (필요시 스타일 적용)
        imgElement.classList.add('image-load-failed');
        
        // 이미지 대체 또는 숨김 처리
        imgElement.style.display = 'none';
        
        // 부모 요소에 대체 콘텐츠 표시
        if (imgElement.parentElement) {
            // 이미 "no-image" 클래스가 없으면 추가
            const noImageDiv = imgElement.parentElement.querySelector('.no-image');
            if (!noImageDiv) {
                const placeholder = document.createElement('div');
                placeholder.className = 'no-image';
                placeholder.textContent = '이미지 없음';
                placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f3f4f6; color: #9ca3af; font-size: 0.85rem; min-height: 120px;';
                imgElement.parentElement.appendChild(placeholder);
            }
        }
    }
    
    // 관리자용 콘솔 로그만 출력 (최초 1회만, 사용자에게는 표시하지 않음)
    if (!window.imageLoadErrorShown) {
        // 콘솔에만 로그 출력 (팝업 없음)
        console.warn('⚠️ 일부 이미지 로드 실패 (Firebase Storage 접근 문제)');
        console.log('이미지 로드 실패 상세:', {
            productId: productId,
            imageUrl: imageUrl,
            error: 'Firebase Storage 접근 권한 또는 CORS 정책 문제'
        });
        
        // 관리자에게만 상세 정보 제공 (콘솔에만)
        const consoleUrl = 'https://console.firebase.google.com/project/price-match-1f952/storage/price-match-1f952.firebasestorage.app/rules';
        console.log('🔧 관리자용: Firebase Storage 규칙 확인 ->', consoleUrl);
        console.log('💡 Firebase Storage 보안 규칙에서 "allow read: if true;" 설정 필요');
        
        window.imageLoadErrorShown = true;
    }
}

function trackProductClick(productName, productCategory) {
    gaTracker.trackProductClick(productName, productCategory);
    
    // 클릭 카운트 증가
    if (window.priceComparisonSite) {
        const product = window.priceComparisonSite.products.find(p => 
            p.name === productName && (p.category === productCategory || (!p.category && productCategory === '기타'))
        );
        if (product && product.id) {
            window.priceComparisonSite.incrementClickCount(product.id);
        }
    }
}

function trackPurchaseClick(productName, productCategory) {
    gaTracker.trackEvent('purchase_click', 'conversion', `${productName} (${productCategory})`);
    
    // 구매 카운트 증가
    if (window.priceComparisonSite) {
        const product = window.priceComparisonSite.products.find(p => 
            p.name === productName && (p.category === productCategory || (!p.category && productCategory === '기타'))
        );
        if (product && product.id) {
            window.priceComparisonSite.incrementPurchaseCount(product.id);
        }
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
        
        if (!report) {
            alert('신고를 찾을 수 없습니다.');
            return;
        }
        
        window.priceComparisonSite.rejectPriceChange(reportId);
    }
}

// 품절 신고 승인(상품 숨김) 함수
function approveOutOfStockReport(reportId, productId) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        window.priceComparisonSite.approveOutOfStockReport(reportId, productId);
    }
}

// 숨김 상품 복원
function restoreProduct(productId) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        window.priceComparisonSite.restoreProduct(productId);
    }
}

// 모든 숨김 상품 일괄 복원
function restoreAllHiddenProducts() {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        window.priceComparisonSite.restoreAllHiddenProducts();
    }
}

// 숨김 상품 완전 삭제
function hardDeleteProduct(productId) {
    if (adminAuth.requireAuth() && window.priceComparisonSite) {
        window.priceComparisonSite.hardDeleteProduct(productId);
    }
}

// 페이지가 로드되면 앱 실행
document.addEventListener('DOMContentLoaded', function() {
    window.priceComparisonSite = new PriceComparisonSite();
});
class PriceComparisonSite {
    constructor() {
        this.products = [];
        this.priceReports = []; // 가격 변경 신고 배열 초기화
        this.currentCategory = '전체';
        this.currentSearchTerm = '';
        this.currentSortType = 'purchases'; // 기본값: 구매순
        this.isSubmitting = false; // 중복 제출 방지 플래그
        this.isSubmittingComment = false; // 댓글 중복 제출 방지 플래그
        this.noticeListenersSetup = false; // 필독 패널 이벤트 리스너 중복 방지 플래그
        this.previousTotalPending = -1; // 이전 대기 신고 개수 (알림 소리용, 초기값 -1)
        this.localModifications = new Set(); // 로컬에서 수정된 제품 ID 추적
        this.outOfStockStages = {
            stage1: 1,  // 초록색
            stage2: 5,  // 노란색
            stage3: 10   // 빨강색
        };
        this.outOfStockAutoReport = 5; // 관리자 설정: 품절신고 자동 생성 기준값
        this.currentProductDescription = ''; // 현재 상품 설명 (중복 체크용)
        this.init();
    }

    // 썸네일 생성 함수 (Canvas API 사용)
    async createThumbnail(imageFile, maxWidth = 120, maxHeight = 120, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // 이미 이미 작은 이미지인지 확인 (120x120 이하이고 50KB 이하면 썸네일 생성 건너뛰기)
                if (img.width <= maxWidth && img.height <= maxHeight && imageFile.size <= 50 * 1024) {
                    // 원본을 그대로 사용 (썸네일 생성 불필요)
                    resolve(null);
                    return;
                }
                
                // 비율 유지하며 리사이징
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 이미지 그리기 (고품질 리사이징)
                ctx.drawImage(img, 0, 0, width, height);
                
                // Blob으로 변환
                canvas.toBlob((blob) => {
                    if (blob) {
                        // File 객체로 변환 (원본 파일명 유지)
                        const thumbnailFile = new File([blob], `thumb_${imageFile.name}`, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(thumbnailFile);
                    } else {
                        reject(new Error('썸네일 생성 실패'));
                    }
                }, 'image/jpeg', quality);
            };
            
            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = URL.createObjectURL(imageFile);
        });
    }
    
    // 이미지 다운로드 및 파일 크기 확인 함수
    async downloadImageAsFile(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('이미지 다운로드 실패');
            const blob = await response.blob();
            const fileName = imageUrl.split('/').pop().split('?')[0] || 'image.jpg';
            return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        } catch (error) {
            console.error('이미지 다운로드 오류:', error);
            throw error;
        }
    }
    
    // 이미지 크기 확인 함수 (이미 작은 이미지인지 확인)
    async checkImageSize(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    isSmall: img.width <= 120 && img.height <= 120
                });
            };
            img.onerror = () => reject(new Error('이미지 크기 확인 실패'));
            img.src = imageUrl;
        });
    }

    async init() {
        console.log('PriceComparisonSite 초기화 시작');
        console.log('현재 화면 크기:', window.innerWidth, 'x', window.innerHeight);
        console.log('User Agent:', navigator.userAgent);
        
        // 페이지뷰 추적
        gaTracker.trackPageView('절대방어 쇼핑 - 메인 페이지');
        
        // 모바일에서 헤더를 최상단으로 강제 이동
        this.forceHeaderToTop();
        
        // 스크롤 이벤트 리스너 설정 - 위로 스크롤하면 헤더(로고) 바로 나타나게
        this.setupScrollListener();
        
        // 모든 드롭다운 패널을 강제로 닫기
        this.closeAllDropdowns();
        
        // 정렬 바 버튼 이벤트 리스너 설정 (모바일 호환성을 위해)
        // DOM이 완전히 로드된 후 실행되도록 약간의 지연
        setTimeout(() => {
            this.setupSortBarListeners();
        }, 100);
        
        // 브라우저 뒤로가기 버튼 처리 (상세보기 닫기)
        window.addEventListener('popstate', (event) => {
            const dropdown = document.getElementById('productDetailDropdown');
            if (dropdown && !dropdown.classList.contains('collapsed')) {
                // 상세보기가 열려있으면 닫기
                window.closeProductDetailModal();
                // 이벤트 기본 동작 방지 (뒤로가기 취소)
                event.preventDefault();
                history.pushState(null, '', window.location.href);
            }
        });
        
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
                
                // 로고 초기화 (PC 및 모바일 공통)
                this.setupLogo();
                
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
                
                // 로고 초기화 (모바일)
                this.setupLogo();
                console.log('모바일 환경 초기화 완료');
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
            
            // 로고 클릭 이벤트 최종 등록 (지연 후)
            this.setupLogo();
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
        
        await this.setupEventListeners();
        
        // Firebase 초기화 (에러 처리 강화)
        try {
        await this.initFirebase();
        } catch (initError) {
            console.error('initFirebase 초기 호출 실패:', initError);
            // 실패해도 재시도는 initFirebase 내부에서 처리됨
        }
        
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
        
        // Firebase가 준비될 때까지 기다린 후 제품 로드
        const waitForFirebaseAndLoad = async () => {
            let attempts = 0;
            const maxAttempts = 20; // 최대 10초 대기 (500ms * 20)
            
            while (attempts < maxAttempts) {
                if (window.firestoreDB) {
                    console.log('Firebase 준비 확인, 제품 로드 시작');
                    try {
                        await this.loadProductsFromFirebase(true); // 캐시 사용
                        
                        // 제품이 로드되었는지 확인
                        if (this.products.length > 0) {
                            console.log('초기 제품 로드 성공:', this.products.length, '개');
                            return;
                        }
                    } catch (error) {
                        console.error('초기 제품 로드 실패:', error);
                    }
                    break; // Firebase는 준비되었지만 로드 실패, 재시도 로직으로 넘어감
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            // Firebase가 준비되지 않았거나 제품 로드 실패 시 재시도
            console.log('Firebase 준비 대기 완료 또는 로드 실패, 재시도 로직 시작');
        };
        
        // Firebase 준비 대기 및 초기 로드
        waitForFirebaseAndLoad();
        
        // 상품 표시 보장 - 여러 단계로 확인 및 재시도
        const ensureProductsDisplayed = async () => {
            // 권한 오류가 발생했으면 재시도하지 않음
            if (window.firebasePermissionDenied) {
                return;
            }
            
            const productList = document.getElementById('productList');
            const hasProducts = this.products.length > 0;
            const isDisplayed = productList && productList.innerHTML && productList.innerHTML.trim() !== '' && 
                               !productList.innerHTML.includes('등록된 제품이 없습니다');
            
            console.log('상품 표시 확인:', {
                hasProducts,
                isDisplayed,
                productsCount: this.products.length,
                productListExists: !!productList,
                innerHTML: productList ? productList.innerHTML.substring(0, 100) : 'null'
            });
            
            if (!hasProducts) {
                console.log('제품이 없음, Firebase에서 로드 시도');
                try {
                    await this.loadProductsFromFirebase(false); // 캐시 없이 재시도
                } catch (error) {
                    // 권한 오류는 조용히 처리
                    const isPermissionError = error.code === 'permission-denied' || 
                                             error.code === 'PERMISSION_DENIED' ||
                                             error.message.includes('Missing or insufficient permissions');
                    if (!isPermissionError) {
                        console.error('강제 로드 실패:', error);
                    }
                }
            } else if (!isDisplayed) {
                // 상품은 있지만 화면에 표시되지 않은 경우
                console.log('제품은 있지만 표시되지 않음, displayAllProducts 호출');
                try {
                    await this.displayAllProducts();
                } catch (error) {
                    console.error('displayAllProducts 호출 실패:', error);
                }
            }
        };
        
        // 1초 후 첫 확인
        setTimeout(ensureProductsDisplayed, 1000);
        
        // 2초 후 두 번째 확인
        setTimeout(ensureProductsDisplayed, 2000);
        
        // 3초 후 세 번째 확인
        setTimeout(ensureProductsDisplayed, 3000);
        
        // 5초 후 네 번째 확인
        setTimeout(ensureProductsDisplayed, 5000);
        
        // 8초 후 다섯 번째 확인 (최종)
        setTimeout(ensureProductsDisplayed, 8000);
        
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
            // 알림 소리 제거됨
            console.log('새로운 신고 감지', {
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

    async displaySearchResults(searchTerm) {
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

        // 현재 정렬 타입에 따라 정렬
        this.applyCurrentSort(filteredProducts);

        console.log('가격순 정렬된 제품 목록:', filteredProducts);

        console.log('renderProducts 호출 전');
        await this.renderProducts(filteredProducts, searchTerm);
        console.log('renderProducts 호출 후');
        console.log('=== displaySearchResults 완료 ===');
    }

    async displayAllProducts() {
        try {
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
            
            // 현재 정렬 타입에 따라 정렬
            try {
                await this.applyCurrentSort(approvedProducts);
            } catch (sortError) {
                console.error('정렬 중 에러 발생:', sortError);
                // 정렬 실패해도 계속 진행
            }
            
            console.log('정렬된 제품 목록 (현재 정렬 적용):', approvedProducts.map(p => ({
                name: p.name,
                category: p.category,
                discountRate: this.calculateDiscountRate(p) + '%',
                price: this.calculateFinalPrice(p)
            })));
            
            // 제품이 없으면 빈 화면 표시
            if (approvedProducts.length === 0) {
                console.log('승인된 제품이 없습니다.');
            }
            
            console.log('renderProducts 호출 전');
            try {
                await this.renderProducts(approvedProducts);
            } catch (renderError) {
                console.error('renderProducts 중 에러 발생:', renderError);
                // 렌더링 실패 시 재시도
                setTimeout(async () => {
                    try {
                        console.log('renderProducts 재시도...');
                        await this.renderProducts(approvedProducts);
                    } catch (retryError) {
                        console.error('renderProducts 재시도 실패:', retryError);
                    }
                }, 1000);
            }
            console.log('renderProducts 호출 후');
            
            // 전체 탭 활성 상태 표시
            this.currentCategory = '전체';
            try {
                this.updateCategoryActiveState();
            } catch (updateError) {
                console.error('updateCategoryActiveState 중 에러 발생:', updateError);
            }
            
            console.log('=== displayAllProducts 완료 ===');
        } catch (error) {
            console.error('displayAllProducts 중 에러 발생:', error);
            console.error('에러 상세:', error.message, error.stack);
            
            // 에러 발생 시 재시도
            setTimeout(async () => {
                try {
                    console.log('displayAllProducts 재시도...');
                    await this.displayAllProducts();
                } catch (retryError) {
                    console.error('displayAllProducts 재시도 실패:', retryError);
                }
            }, 2000);
        }
    }

    async displayCategoryResults(category) {
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
        
        // 현재 정렬 타입에 따라 정렬
        this.applyCurrentSort(filteredProducts);

        console.log('가격순 정렬된 제품 목록:', filteredProducts);

        console.log('renderProducts 호출 전');
        await this.renderProducts(filteredProducts);
        console.log('renderProducts 호출 후');
        console.log('=== displayCategoryResults 완료 ===');
    }

    async renderProducts(products, searchTerm = '') {
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

        // 현재 정렬 타입에 따라 정렬
        console.log('정렬 전 제품 목록:', products.map(p => ({ 
            name: p.name,
            category: p.category,
            price: this.calculateFinalPrice(p),
            discountRate: this.calculateDiscountRate(p)
        })));

        await this.applyCurrentSort(products);

        console.log('정렬 후 제품 목록 (현재 정렬 적용):', products.map((p, index) => ({
            순위: index + 1,
            name: p.name,
            category: p.category,
            price: this.calculateFinalPrice(p),
            discountRate: this.calculateDiscountRate(p) + '%'
        })));

        console.log('HTML 생성 시작');
        
        // 먼저 모든 상품의 게시글 이미지를 일괄 조회 (최적화: 삭제되지 않은 게시글만)
        console.log('게시글 이미지 일괄 조회 시작...');
        const imageMap = {};
        const productIds = products.map(p => p.id).filter(id => id);
        
        // 게시글 이미지도 캐시에서 확인
        const postsCacheKey = 'firebase_posts_images_cache';
        const postsCacheData = localStorage.getItem(postsCacheKey);
        let postsCache = null;
        if (postsCacheData) {
            try {
                const { cache, timestamp } = JSON.parse(postsCacheData);
                const cacheAge = Date.now() - timestamp;
                const cacheMaxAge = 10 * 60 * 1000; // 10분 (게시글은 덜 자주 변경됨)
                if (cacheAge < cacheMaxAge) {
                    postsCache = cache;
                    console.log('게시글 이미지 캐시 사용:', Object.keys(postsCache).length, '개');
                }
            } catch (e) {
                console.error('게시글 캐시 파싱 오류:', e);
            }
        }
        
        if (productIds.length > 0) {
            // 캐시에서 찾지 못한 상품 ID만 조회
            const uncachedIds = postsCache 
                ? productIds.filter(id => !postsCache[id])
                : productIds;
            
            if (uncachedIds.length > 0) {
                console.log('캐시되지 않은 상품 이미지 조회:', uncachedIds.length, '개');
                const imagePromises = uncachedIds.map(async (productId) => {
                    try {
                        const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
                        const q = window.firebaseQuery(
                            postsRef, 
                            window.firebaseWhere('productId', '==', productId),
                            window.firebaseWhere('deleted', '==', false)
                        );
                        const querySnapshot = await window.firebaseGetDocs(q);
                        
                        for (const doc of querySnapshot.docs) {
                            const post = doc.data();
                            if (!post.deleted) {
                                if (post.imageUrls && post.imageUrls.length > 0) {
                                    return { productId, imageUrl: post.imageUrls[0] };
                                } else if (post.imageUrl) {
                                    return { productId, imageUrl: post.imageUrl };
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`게시글 조회 실패 (${productId}):`, error);
                    }
                    return null;
                });
                
                const imageResults = await Promise.all(imagePromises);
                imageResults.forEach(result => {
                    if (result && result.imageUrl) {
                        imageMap[result.productId] = result.imageUrl;
                    }
                });
            }
            
            // 캐시와 새로 조회한 결과 병합
            if (postsCache) {
                Object.assign(imageMap, postsCache);
            }
            
            // 게시글 이미지 캐시 업데이트
            if (Object.keys(imageMap).length > 0) {
                try {
                    const cacheData = {
                        cache: imageMap,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(postsCacheKey, JSON.stringify(cacheData));
                } catch (e) {
                    console.error('게시글 캐시 저장 오류:', e);
                }
            }
            
            console.log('[게시글 이미지 맵]', Object.keys(imageMap).length, '개 상품에 이미지 발견');
        }
        
        // 상품들 (이미지 맵 전달, 순위 인덱스 포함)
        const productPromises = products.map((product, index) => this.createProductElement(product, imageMap, index + 1));
        const productsHtmlArray = await Promise.all(productPromises);
        const productsHtml = productsHtmlArray.join('');
        
        const htmlContent = productsHtml;
        
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

    createInfoCard() {
        const infoCard = `
            <div class="product-item info-card">
                <div class="product-thumbnail">
                    <div class="info-image-placeholder">이미지</div>
                </div>
                <div class="product-info">
                    <div class="product-row-1">
                        <div class="product-title">상품명</div>
                    </div>
                    <div class="product-row-2">
                        <div class="row-top">
                            <span class="product-category">분류</span>
                            <span class="product-original-price">
                                <span class="info-discount-label">할인율</span>
                                시작가
                            </span>
                            <a href="#" class="product-link-btn" style="pointer-events: none;">구매하기</a>
                        </div>
                        <div class="row-bottom">
                            <div class="store-time-info">
                                <span class="product-store">쇼핑몰</span>
                                <span class="product-price">최종가</span>
                            </div>
                            <div class="product-buttons">
                                <button class="price-report-btn" style="pointer-events: none;">바뀜신고</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return infoCard;
    }

    async createProductElement(product, imageMap = {}, rank = null) {
        try {
        console.log(`제품 요소 생성 시작: ${product.name}`);
        
            const finalPrice = this.calculateFinalPrice(product) || 0;
        
        console.log(`제품 "${product.name}" 최종 가격:`, finalPrice);
        
        // 순위 표시 HTML 생성
        let rankHtml = '';
        if (rank !== null) {
            let rankClass = 'product-rank';
            if (rank === 1) {
                rankClass = 'product-rank first-rank';
            } else if (rank === 2) {
                rankClass = 'product-rank second-rank';
            } else if (rank === 3) {
                rankClass = 'product-rank third-rank';
            }
            rankHtml = `<span class="${rankClass}">${rank}위</span>`;
        }
        
        // 할인율 계산 (모든 카테고리)
        let discountRateHtml = '';
        if (product.originalPrice && finalPrice > 0) {
            const originalPrice = parseInt(product.originalPrice) || 0;
            if (originalPrice > 0 && originalPrice > finalPrice) {
                const discountRate = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                // 할인율 색상 규칙: 60% 이상 빨강, 30% 이상 파랑, 30% 이하는 검정
                let discountClass = '';
                if (discountRate >= 60) {
                    discountClass = 'discount-rate-high'; // 빨강
                } else if (discountRate >= 30) {
                    discountClass = 'discount-rate-medium'; // 파랑
                } else {
                    discountClass = 'discount-rate-low'; // 검정
                }
                discountRateHtml = `<span class="discount-rate ${discountClass}">-${discountRate}%</span>`;
            }
        }
        
        // 이미지 URL 가져오기 (리스트용 썸네일 우선, 없으면 원본 사용)
        let thumbnailUrl = '';
        
        // 1. 썸네일 URL 우선 사용 (데이터 절약)
        if (product.thumbnailUrls && Array.isArray(product.thumbnailUrls) && product.thumbnailUrls.length > 0) {
            thumbnailUrl = product.thumbnailUrls[0];
            console.log(`[썸네일 사용] ${product.name}:`, thumbnailUrl);
        }
        // 2. thumbnailUrl 필드에서 찾기 (하위 호환성)
        else if (product.thumbnailUrl && typeof product.thumbnailUrl === 'string' && product.thumbnailUrl.trim() !== '') {
            thumbnailUrl = product.thumbnailUrl.trim();
            console.log(`[썸네일 사용 - thumbnailUrl] ${product.name}:`, thumbnailUrl);
        }
        // 3. 썸네일이 없으면 원본 이미지 사용 (하위 호환성)
        else if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
            thumbnailUrl = product.imageUrls[0];
            console.log(`[원본 이미지 사용 - imageUrls] ${product.name}:`, thumbnailUrl);
        }
        // 4. imageUrl 필드에서 찾기
        else if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
            thumbnailUrl = product.imageUrl.trim();
            console.log(`[원본 이미지 사용 - imageUrl] ${product.name}:`, thumbnailUrl);
        }
        
        // 5. 이미지가 없으면 게시글 이미지 맵에서 찾기
        if (!thumbnailUrl && product.id && imageMap[product.id]) {
            thumbnailUrl = imageMap[product.id];
            console.log(`[게시글 이미지 사용] ${product.name}:`, thumbnailUrl);
        }
        
        // 이미지 URL 유효성 검증 (빈 문자열, null, undefined 체크)
        if (!thumbnailUrl || thumbnailUrl.trim() === '' || thumbnailUrl === 'null' || thumbnailUrl === 'undefined') {
            thumbnailUrl = '';
            console.log(`[이미지 없음] ${product.name}: product.imageUrls=${JSON.stringify(product.imageUrls)}, product.imageUrl=${product.imageUrl}`);
        }

        // 등록일 / 최근 구매일 포맷팅
        const formatDateForBadge = (date) => {
            try {
                if (!date) return '';
                let d;
                if (date.toDate) {
                    d = date.toDate();
                } else {
                    d = new Date(date);
                }
                if (isNaN(d.getTime())) return '';
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                return `${month}/${day}`;
            } catch (e) {
                console.error('날짜 포맷팅 오류:', e, date);
                return '';
            }
        };

        const createdDateText = formatDateForBadge(product.createdAt);
        const lastPurchaseDateText = formatDateForBadge(product.lastPurchaseAt || product.lastPurchaseDate);

        const createdBadge = createdDateText
            ? `<span class="product-created-date" style="font-size:0.65rem; color:#111827;">(${createdDateText} 업뎃)</span>`
            : '';
        // PC/모바일에 따라 최근 구매일 표시 형식을 다르게 적용
        const isMobileView = window.innerWidth <= 768;
        // 모바일: (최근 : MM/DD) / PC: (MM/DD)
        const lastPurchaseBadge = lastPurchaseDateText
            ? `<span class="product-last-purchase-date" style="font-size:0.65rem; color:#111827;">${isMobileView ? `(최근 : ${lastPurchaseDateText})` : `(${lastPurchaseDateText})`}</span>`
            : '';

        // 썸네일 이미지 HTML - 이미지 로드 실패 시 자동 처리 및 최적화
        // Firebase Storage URL이 만료되었거나 접근 권한이 없을 경우를 대비한 처리
        let thumbnailHtml = '';
        if (thumbnailUrl) {
            // URL을 안전하게 이스케이프 처리
            const safeImageUrl = thumbnailUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
            const safeProductId = (product.id || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
            
            // 이미지 최적화: 상위 3개만 높은 우선순위, 나머지는 낮은 우선순위
            const fetchPriority = rank && rank <= 3 ? 'high' : 'low';
            const decoding = 'async'; // 비동기 디코딩으로 메인 스레드 차단 방지
            
            // 이미지 크기 힌트 추가 (레이아웃 시프트 방지)
            // PC: 80x80, 모바일: 120x120 (CSS에서 확인 필요하지만 일반적인 크기)
            // CORS 문제를 방지하기 위해 crossorigin 속성 제거 (Firebase Storage 보안 규칙 수정 필요)
            // Firebase Storage 보안 규칙이 읽기를 허용하면 CORS 문제가 해결됩니다
            thumbnailHtml = `<img src="${thumbnailUrl}" alt="${product.name || ''}" loading="lazy" decoding="${decoding}" fetchpriority="${fetchPriority}" referrerpolicy="no-referrer" width="120" height="120" onerror="handleImageLoadError(this, '${safeProductId}', '${safeImageUrl}');" class="product-thumbnail-img">`;
        } else {
            thumbnailHtml = `<div class="no-image">이미지 없음</div>`;
        }

            const htmlElement = `
                <div class="product-item" data-category="${product.category || ''}" onclick="event.stopPropagation(); trackProductClick('${product.name}', '${product.category}'); showProductDetail('${product.id}')">
                    <div class="product-thumbnail">
                        ${thumbnailHtml}
                    </div>
                    <div class="product-info">
                        <div class="product-row-1">
                            ${rankHtml}
                            <div class="product-title">${product.name || '제품명 없음'}</div>
                        </div>
                        <div class="product-row-2">
                            <div class="row-top">
                                <span class="product-category">${this.getCategoryDisplayForProduct(product.category) || '일반딜'}</span>
                                <span class="product-original-price">
                                    <span class="click-count-text">${(product.clickCount || 0)}클릭</span>
                                    ${discountRateHtml}
                                    ${(product.originalPrice || 0).toLocaleString()}원
                                </span>
                                <a href="${product.link || '#'}" target="_blank" class="product-link-btn" onclick="event.stopPropagation(); trackPurchaseClick('${product.name}', '${product.category}')">구매하기</a>
                            </div>
                            <div class="row-bottom">
                                <div class="store-time-info">
                                    <span class="product-store">
                                        ${this.getStoreDisplayName(product.store) || '미선택'}${createdBadge}
                                        <span class="purchase-count-text">
                                            ${(product.purchaseCount || 0)}구매${lastPurchaseBadge}
                                        </span>
                                    </span>
                                    <span class="product-price">${finalPrice.toLocaleString()}원</span>
                                </div>
                                <div class="product-buttons">
                                    <button class="price-report-btn" onclick="event.stopPropagation(); showPriceChangeModal('${product.id}', ${finalPrice}, '${product.link || ''}')">바뀜신고</button>
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
            
            // 에러 핸들러에서도 순위 표시 HTML 생성
            let rankHtml = '';
            if (rank !== null) {
                let rankClass = 'product-rank';
                if (rank === 1) {
                    rankClass = 'product-rank first-rank';
                } else if (rank === 2) {
                    rankClass = 'product-rank second-rank';
                } else if (rank === 3) {
                    rankClass = 'product-rank third-rank';
                }
                rankHtml = `<span class="${rankClass}">${rank}위</span>`;
            }
            
            // 에러 핸들러에서도 할인율 계산
            const finalPrice = this.calculateFinalPrice(product) || 0;
            let discountRateHtml = '';
            if (product.originalPrice && finalPrice > 0) {
                const originalPrice = parseInt(product.originalPrice) || 0;
                if (originalPrice > 0 && originalPrice > finalPrice) {
                    const discountRate = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                    // 할인율 색상 규칙: 60% 이상 빨강, 30% 이상 파랑, 30% 이하는 검정
                    let discountClass = '';
                    if (discountRate >= 60) {
                        discountClass = 'discount-rate-high'; // 빨강
                    } else if (discountRate >= 30) {
                        discountClass = 'discount-rate-medium'; // 파랑
                    } else {
                        discountClass = 'discount-rate-low'; // 검정
                    }
                    discountRateHtml = `<span class="discount-rate ${discountClass}">-${discountRate}%</span>`;
                }
            }
            
            return `
                <div class="product-item" data-category="${product.category || ''}" onclick="event.stopPropagation(); trackProductClick('${product.name}', '${product.category}'); showProductDetail('${product.id}')">
                    <div class="product-thumbnail">
                        <div class="no-image">이미지 없음</div>
                    </div>
                    <div class="product-info">
                        <div class="product-row-1">
                            ${rankHtml}
                            <div class="product-title">${product.name || '제품명 없음'}</div>
                        </div>
                        <div class="product-row-2">
                            <div class="row-top">
                                <span class="product-category">${this.getCategoryDisplayForProduct(product.category) || '일반딜'}</span>
                                <span class="product-original-price">
                                    <span class="click-count-text">${(product.clickCount || 0)}클릭</span>
                                    ${discountRateHtml}
                                    가격 정보 없음
                                </span>
                                <a href="${product.link || '#'}" target="_blank" class="product-link-btn" onclick="event.stopPropagation(); trackPurchaseClick('${product.name}', '${product.category}')">구매하기</a>
                            </div>
                            <div class="row-bottom">
                                <div class="store-time-info">
                                    <span class="product-store">
                                        ${this.getStoreDisplayName(product.store) || '미선택'}
                                        <span class="purchase-count-text">
                                            ${(product.purchaseCount || 0)}구매
                                            <span class="product-last-purchase-date" style="font-size:0.65rem; color:#111827; margin-left:4px;">(최근 : 11/16)</span>
                                        </span>
                                    </span>
                                </div>
                                <div class="product-buttons">
                                    <button class="price-report-btn" onclick="event.stopPropagation(); showPriceChangeModal('${product.id}', ${finalPrice}, '${product.link || ''}')">바뀜신고</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    getStoreDisplayName(store) {
        // "네이버쇼핑"을 "네이버"로 표시
        if (store === '네이버쇼핑') {
            return '네이버';
        }
        return store;
    }


    calculateFinalPrice(product) {
        try {
        console.log(`가격 계산 시작 - 제품: ${product.name}`, {
            originalPrice: product.originalPrice,
            finalPrice: product.finalPrice,
            deliveryFee: product.deliveryFee
        });
        
        // finalPrice가 직접 저장되어 있으면 그것을 사용
        if (product.finalPrice !== undefined && product.finalPrice !== null) {
            console.log(`직접 저장된 finalPrice 사용 - 제품: ${product.name}, 최종가격: ${product.finalPrice}`);
            return parseInt(product.finalPrice) || 0;
        }
        
        // 기존 방식: originalPrice + deliveryFee
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

    // 공통 정렬: 할인율 높은 순, 같은 할인율이면 낮은 가격 순
    sortProductsByDiscountThenPrice(productsArray) {
        if (!Array.isArray(productsArray)) return;
        productsArray.sort((a, b) => {
            const drA = this.calculateDiscountRate(a) || 0;
            const drB = this.calculateDiscountRate(b) || 0;
            if (drA !== drB) return drB - drA; // 할인율 높은 순
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB; // 낮은 가격 순
        });
    }

    sortProductsByPurchases(productsArray) {
        if (!Array.isArray(productsArray)) return;
        productsArray.sort((a, b) => {
            const purchasesA = a.purchaseCount || 0;
            const purchasesB = b.purchaseCount || 0;
            return purchasesB - purchasesA; // 구매수 높은 순
        });
    }

    sortProductsByRevenue(productsArray) {
        if (!Array.isArray(productsArray)) return;
        productsArray.sort((a, b) => {
            const revenueA = (a.purchaseCount || 0) * (this.calculateFinalPrice(a) || 0);
            const revenueB = (b.purchaseCount || 0) * (this.calculateFinalPrice(b) || 0);
            return revenueB - revenueA; // 매출 높은 순
        });
    }

    calculateDiscountRate(product) {
        try {
            const finalPrice = this.calculateFinalPrice(product);
            const originalPrice = parseInt(product.originalPrice) || 0;
            
            // 할인율이 계산 가능한 경우만 반환
            if (originalPrice > 0 && originalPrice > finalPrice && finalPrice > 0) {
                const discountRate = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                return discountRate;
            }
            return 0; // 할인율이 없거나 계산 불가능하면 0
        } catch (error) {
            console.error(`할인율 계산 오류 - 제품: ${product.name}`, error);
            return 0;
        }
    }

    // 현재 정렬 타입에 따라 정렬 적용
    applyCurrentSort(productsArray) {
        if (!Array.isArray(productsArray)) return;
        
        switch(this.currentSortType) {
            case 'discount':
                this.sortProductsByDiscountThenPrice(productsArray);
                break;
            case 'newest':
                productsArray.sort((a, b) => {
                    let dateA, dateB;
                    if (a.createdAt?.toDate) {
                        dateA = a.createdAt.toDate();
                    } else if (a.createdAt) {
                        dateA = new Date(a.createdAt);
                    } else {
                        dateA = new Date(0);
                    }
                    
                    if (b.createdAt?.toDate) {
                        dateB = b.createdAt.toDate();
                    } else if (b.createdAt) {
                        dateB = new Date(b.createdAt);
                    } else {
                        dateB = new Date(0);
                    }
                    return dateB - dateA; // 최신순
                });
                break;
            case 'clicks':
                productsArray.sort((a, b) => {
                    const clicksA = a.clickCount || 0;
                    const clicksB = b.clickCount || 0;
                    return clicksB - clicksA; // 클릭수 높은순
                });
                break;
            case 'purchases':
                this.sortProductsByPurchases(productsArray);
                break;
            case 'revenue':
                this.sortProductsByRevenue(productsArray);
                break;
            case 'price-low':
                productsArray.sort((a, b) => {
                    const priceA = this.calculateFinalPrice(a) || 0;
                    const priceB = this.calculateFinalPrice(b) || 0;
                    return priceA - priceB; // 낮은 가격순
                });
                break;
            case 'price-high':
                productsArray.sort((a, b) => {
                    const priceA = this.calculateFinalPrice(a) || 0;
                    const priceB = this.calculateFinalPrice(b) || 0;
                    return priceB - priceA; // 높은 가격순
                });
                break;
            default:
                this.sortProductsByPurchases(productsArray);
        }
    }

    // 정렬 메서드
    async sortProducts(sortType) {
        console.log('정렬 메서드 실행:', sortType, '현재 카테고리:', this.currentCategory);
        
        // 최상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.currentSortType = sortType;
        
        // 정렬 바 UI 업데이트
        const sortItems = document.querySelectorAll('.sort-item');
        console.log('정렬 바 버튼 개수:', sortItems.length);
        sortItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.sort === sortType) {
                item.classList.add('active');
            }
        });
        
        // 현재 필터링된 상품 가져오기
        let productsToSort = [];
        if (this.currentCategory === '전체') {
            productsToSort = this.products.filter(p => p.status === 'approved');
        } else {
            productsToSort = this.products.filter(p => 
                p.status === 'approved' && p.category === this.currentCategory
            );
        }
        
        // 검색어가 있으면 추가 필터링
        if (this.currentSearchTerm) {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            productsToSort = productsToSort.filter(product => {
                const name = (product.name || '').toLowerCase();
                return name.includes(searchTerm);
            });
        }
        
        // 정렬 타입에 따라 정렬
        switch(sortType) {
            case 'discount':
                this.sortProductsByDiscountThenPrice(productsToSort);
                break;
            case 'newest':
                productsToSort.sort((a, b) => {
                    let dateA, dateB;
                    if (a.createdAt?.toDate) {
                        dateA = a.createdAt.toDate();
                    } else if (a.createdAt) {
                        dateA = new Date(a.createdAt);
                    } else {
                        dateA = new Date(0);
                    }
                    
                    if (b.createdAt?.toDate) {
                        dateB = b.createdAt.toDate();
                    } else if (b.createdAt) {
                        dateB = new Date(b.createdAt);
                    } else {
                        dateB = new Date(0);
                    }
                    return dateB - dateA; // 최신순
                });
                break;
            case 'clicks':
                productsToSort.sort((a, b) => {
                    const clicksA = a.clickCount || 0;
                    const clicksB = b.clickCount || 0;
                    return clicksB - clicksA; // 클릭수 높은순
                });
                break;
            case 'purchases':
                this.sortProductsByPurchases(productsToSort);
                break;
            case 'revenue':
                this.sortProductsByRevenue(productsToSort);
                break;
            case 'price-low':
                productsToSort.sort((a, b) => {
                    const priceA = this.calculateFinalPrice(a) || 0;
                    const priceB = this.calculateFinalPrice(b) || 0;
                    return priceA - priceB; // 낮은 가격순
                });
                break;
            case 'price-high':
                productsToSort.sort((a, b) => {
                    const priceA = this.calculateFinalPrice(a) || 0;
                    const priceB = this.calculateFinalPrice(b) || 0;
                    return priceB - priceA; // 높은 가격순
                });
                break;
        }
        
        // 정렬된 상품 다시 표시
        await this.renderProducts(productsToSort, this.currentSearchTerm);
    }

    // 클릭 카운트 증가
    async incrementClickCount(productId) {
        try {
            const productRef = window.firebaseDoc(window.firestoreDB, 'products', productId);
            const productSnap = await window.firebaseGetDoc(productRef);
            
            if (productSnap.exists()) {
                const currentCount = productSnap.data().clickCount || 0;
                await window.firebaseUpdateDoc(productRef, {
                    clickCount: currentCount + 1
                });
                
                // 로컬 products 배열도 업데이트
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    product.clickCount = currentCount + 1;
                }
            }
        } catch (error) {
            console.error('클릭 카운트 증가 오류:', error);
        }
    }

    // 구매 카운트 증가 + 최근 구매일 기록
    async incrementPurchaseCount(productId) {
        try {
            const productRef = window.firebaseDoc(window.firestoreDB, 'products', productId);
            const productSnap = await window.firebaseGetDoc(productRef);
            
            if (productSnap.exists()) {
                const data = productSnap.data();
                const currentCount = data.purchaseCount || 0;
                const now = new Date();

                await window.firebaseUpdateDoc(productRef, {
                    purchaseCount: currentCount + 1,
                    lastPurchaseAt: now.toISOString()
                });
                
                // 로컬 products 배열도 업데이트
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    product.purchaseCount = currentCount + 1;
                    product.lastPurchaseAt = now.toISOString();
                }
            }
        } catch (error) {
            console.error('구매 카운트 증가/최근 구매일 기록 오류:', error);
        }
    }

    truncateUrl(url) {
        if (!url) return '';
        // URL이 40자 이하이면 그대로 반환
        if (url.length <= 40) return url;
        // 40자까지만 표시하고 ... 추가
        return url.substring(0, 40) + '...';
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
            
            if (diffMinutes < 24 * 60) {
                // 24시간 이내: 01시35분 전 형식
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                timeText = `${hours.toString().padStart(2, '0')}시${minutes.toString().padStart(2, '0')}분 전`;
                
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
                    day: '2-digit'
                }) + ' 전';
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

    async setupEventListeners() {
        // 폼 제출 - 폼이 열릴 때마다 이벤트 리스너 재설정
        this.setupFormSubmitListener();
        
        // 관리자 버튼들 - 펼치기만 가능
        document.getElementById('loadPendingProducts').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
                const allList = document.getElementById('allProductsList');
                const reportsList = document.getElementById('priceReportsList');
                const thumbnailStatus = document.getElementById('thumbnailGenerationStatus');
                
                // 다른 리스트는 접기
                if (allList) allList.innerHTML = '';
                if (reportsList) reportsList.innerHTML = '';
                if (thumbnailStatus) thumbnailStatus.style.display = 'none';
                
                // 리스트 로드
                this.loadPendingProducts();
                
                // 알림 업데이트
                this.updateAdminNotification();
            }
        });
        
        document.getElementById('loadAllProducts').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
                const allList = document.getElementById('allProductsList');
                const pendingList = document.getElementById('pendingProductsList');
                const reportsList = document.getElementById('priceReportsList');
                const thumbnailStatus = document.getElementById('thumbnailGenerationStatus');
                
                // 다른 리스트는 접기
                if (pendingList) pendingList.innerHTML = '';
                if (reportsList) reportsList.innerHTML = '';
                if (thumbnailStatus) thumbnailStatus.style.display = 'none';
                
                // 리스트 로드
                this.loadAllProducts();
                
                // 알림 업데이트
                this.updateAdminNotification();
            }
        });
        
        const generateThumbnailsButton = document.getElementById('generateThumbnailsForAll');
        if (generateThumbnailsButton) {
            generateThumbnailsButton.addEventListener('click', () => {
                if (adminAuth.requireAuth()) {
                    if (confirm('모든 기존 상품에 대해 썸네일을 생성하시겠습니까?\n\n이 작업은 시간이 걸릴 수 있습니다.')) {
                        this.generateThumbnailsForAllProducts();
                    }
                }
            });
        }
        
        document.getElementById('cancelThumbnailGeneration')?.addEventListener('click', () => {
            if (this.thumbnailGenerationCancelled !== undefined) {
                this.thumbnailGenerationCancelled = true;
                this.updateThumbnailStatus('취소 중...', 0, 0);
            }
        });
        
        document.getElementById('loadPriceReports').addEventListener('click', () => {
            if (adminAuth.requireAuth()) {
                const reportsList = document.getElementById('priceReportsList');
                const pendingList = document.getElementById('pendingProductsList');
                const allList = document.getElementById('allProductsList');
                const settingsDiv = document.getElementById('outOfStockSettings');
                const thumbnailStatus = document.getElementById('thumbnailGenerationStatus');
                
                // 다른 리스트는 접기
                if (pendingList) pendingList.innerHTML = '';
                if (allList) allList.innerHTML = '';
                if (settingsDiv) settingsDiv.style.display = 'none';
                if (thumbnailStatus) thumbnailStatus.style.display = 'none';
                
                // 리스트 로드
                this.loadPriceReports();
                
                // 알림 업데이트
                this.updateAdminNotification();
            }
        });
        
        document.getElementById('loadOutOfStockSettings').addEventListener('click', () => {
            const thumbnailStatus = document.getElementById('thumbnailGenerationStatus');
            if (thumbnailStatus) thumbnailStatus.style.display = 'none';
            if (adminAuth.requireAuth()) {
                const pendingList = document.getElementById('pendingProductsList');
                const allList = document.getElementById('allProductsList');
                const reportsList = document.getElementById('priceReportsList');
                const settingsDiv = document.getElementById('outOfStockSettings');
                
                // 다른 리스트는 접기
                if (pendingList) pendingList.innerHTML = '';
                if (allList) allList.innerHTML = '';
                if (reportsList) reportsList.innerHTML = '';
                
                // 숨김 상품 리스트 표시
                if (settingsDiv) settingsDiv.style.display = 'block';
                
                // 숨김 상품 로드
                this.loadHiddenProducts();
            }
        });

        
        // 기존 품절 설정 저장 버튼은 더 이상 사용하지 않으므로 안전하게 무시
        const saveOutOfStockSettingsBtn = document.getElementById('saveOutOfStockSettings');
        if (saveOutOfStockSettingsBtn) {
            saveOutOfStockSettingsBtn.addEventListener('click', () => {});
        }
        
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
        await this.setupNoticePanelListeners();
        
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
    setupLogo() {
        const logo = document.querySelector('.logo');
        if (!logo) {
            console.log('로고를 찾을 수 없습니다.');
            return;
        }
        
        // 로고 클릭 이벤트 (한 번만 등록)
        if (logo.getAttribute('data-click-handler') !== 'true') {
            logo.setAttribute('data-click-handler', 'true');
            console.log('로고 클릭 이벤트 등록됨');
            
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('로고 클릭됨!');
                
                // 모든 패널 닫기
                const sections = ['productFormDropdown', 'noticePanel', 'adminPanel'];
                sections.forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.classList.add('collapsed');
                        section.classList.add('hidden');
                        section.style.display = 'none';
                        section.style.visibility = 'hidden';
                        console.log(`${sectionId} 패널 닫음`);
                    }
                });
                
                // 전체 카테고리로 필터 (상품리스트)
                this.filterByCategory('전체');
                
                // 상단으로 스크롤
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                console.log('메인 화면으로 이동 완료');
            });
        } else {
            console.log('로고 클릭 이벤트는 이미 등록되어 있습니다.');
        }
    }

    async setupNoticePanelListeners() {
        // 중복 실행 방지
        if (this.noticeListenersSetup) {
            return;
        }
        this.noticeListenersSetup = true;
        
        // 수정 버튼 (관리자만 표시) - 중복 리스너 방지
        const editBtn = document.getElementById('editNotice');
        if (editBtn && !editBtn.hasAttribute('data-edit-listener-added')) {
            editBtn.setAttribute('data-edit-listener-added', 'true');
            editBtn.addEventListener('click', () => {
                if (adminAuth.requireAuth()) {
                    this.toggleNoticeEdit(true);
                }
            });
        }

        // 추가 버튼 (관리자만 표시) - 중복 리스너 방지
        const addBtn = document.getElementById('addNotice');
        if (addBtn && !addBtn.hasAttribute('data-listener-added')) {
            addBtn.setAttribute('data-listener-added', 'true');
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
        await this.setupNumberCommentListeners();
    }

    // 공지1~5 클릭 이벤트 설정
    setupNoticeItemClickListeners() {
        // 이벤트 위임(Event Delegation)을 사용하여 중복 방지
        const subNotices = document.querySelector('.sub-notices');
        if (subNotices) {
            // 기존 이벤트 리스너 제거를 위해 한 번만 등록
            if (!this.noticeItemClickHandler) {
                this.noticeItemClickHandler = (e) => {
                    const target = e.target;
                    // notice-content-item 클래스를 가진 요소인지 확인
                    if (target.classList.contains('notice-content-item')) {
                        // id에서 공지 번호 추출 (예: notice1Content -> 1)
                        const id = target.id;
                        if (id && id.startsWith('notice') && id.endsWith('Content')) {
                            const noticeNumber = parseInt(id.replace('notice', '').replace('Content', ''));
                            if (!isNaN(noticeNumber)) {
                                this.showNoticeDetail(noticeNumber);
                            }
                        }
                    }
                };
                subNotices.addEventListener('click', this.noticeItemClickHandler);
            }
        }
        
        // 모달 닫기 이벤트 (한 번만 등록)
        const closeBtn = document.getElementById('closeNoticeDetail');
        if (closeBtn && !this.noticeModalCloseHandler) {
            this.noticeModalCloseHandler = () => {
                this.closeNoticeDetail();
            };
            closeBtn.addEventListener('click', this.noticeModalCloseHandler);
        }
        
        // 모달 배경 클릭 시 닫기 (한 번만 등록)
        const modal = document.getElementById('noticeDetailModal');
        if (modal && !this.noticeModalBackgroundHandler) {
            this.noticeModalBackgroundHandler = (e) => {
                if (e.target === modal) {
                    this.closeNoticeDetail();
                }
            };
            modal.addEventListener('click', this.noticeModalBackgroundHandler);
        }
    }

    // 새로운 공지 추가
    async addNewNotice() {
        // 중복 실행 방지
        if (this.isAddingNotice) {
            console.log('이미 공지 추가 중...');
            return;
        }
        this.isAddingNotice = true;
        
        const noticeData = await this.getNoticeData();
        
        // 비어있지 않은 공지 찾기
        const existingNotices = [];
        for (let i = 1; i <= 10; i++) {
            const key = `notice${i}`;
            const value = noticeData[key];
            if (value && value.trim() !== '' && value !== `공지${i}가 없습니다.`) {
                existingNotices.push(i);
            }
        }
        
        const nextNoticeNumber = existingNotices.length === 0 ? 1 : Math.max(...existingNotices) + 1;
        
        const content = prompt(`공지${nextNoticeNumber}의 내용을 입력하세요:`, '');
        
        if (content !== null && content.trim() !== '') {
            noticeData[`notice${nextNoticeNumber}`] = content.trim();
            await this.saveNoticeData(noticeData);
            await this.loadNotice();
            
            // 중복 알림 방지 - 플래그 해제 후 알림
        setTimeout(() => {
            this.isAddingNotice = false;
                // loadNotice가 완료된 후 알림 표시
                setTimeout(() => {
                    alert(`공지${nextNoticeNumber}이 추가되었습니다.`);
                }, 100);
        }, 500);
        } else {
            // 취소한 경우 플래그만 해제
            setTimeout(() => {
                this.isAddingNotice = false;
            }, 100);
        }
    }

    // HTML에 새로운 공지 항목 동적 추가 (사용 안 함 - loadNotice에서 처리)
    addNoticeToHTML(noticeNumber, content) {
        // 이 함수는 더 이상 사용되지 않습니다. loadNotice()가 모든 공지 항목을 처리합니다.
        console.log('addNoticeToHTML 함수가 호출되었지만, loadNotice()에서 처리합니다.');
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
    async deleteNotice() {
        // 중복 실행 방지
        if (this.isDeletingNotice) {
            console.log('공지 삭제 중복 실행 방지');
            return;
        }
        this.isDeletingNotice = true;
        
        const noticeData = await this.getNoticeData();
        
        // 비어있지 않은 공지 찾기
        const existingNotices = [];
        for (let i = 1; i <= 10; i++) {
            const key = `notice${i}`;
            const value = noticeData[key];
            if (value && value.trim() !== '' && value !== `공지${i}가 없습니다.`) {
                existingNotices.push({ number: i, content: value });
            }
        }
        
        if (existingNotices.length === 0) {
            alert('삭제할 공지가 없습니다.');
            return;
        }
        
        // 공지 목록 생성
        const noticeList = existingNotices.map(notice => 
            `${notice.number}. ${notice.content.substring(0, 50)}${notice.content.length > 50 ? '...' : ''}`
        ).join('\n');
        
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
                await this.saveNoticeData(noticeData);
                await this.loadNotice();
                
                // HTML에서 해당 공지 항목 제거
                this.removeNoticeFromHTML(num);
                
                alert(`공지${num}이 삭제되었습니다.`);
            }
        }
        
        // 플래그 해제
        setTimeout(() => {
            this.isDeletingNotice = false;
        }, 500);
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
    async showNoticeDetail(noticeNumber) {
        // 중복 실행 방지
        if (this.isOpeningNoticeModal) {
            return;
        }
        this.isOpeningNoticeModal = true;
        
        // 최신 데이터 가져오기
        const noticeData = await this.getNoticeData();
        const content = noticeData[`notice${noticeNumber}`] || '';
        
        // 모달 제목 설정
        const title = document.getElementById('noticeDetailTitle');
        if (title) {
            title.textContent = `공지${noticeNumber} 상세보기`;
        }
        
        // 모달 내용 설정
        const contentElement = document.getElementById('noticeDetailContent');
        if (contentElement) {
            if (content && content.trim() !== '') {
                contentElement.textContent = content;
            } else {
                contentElement.textContent = '내용이 없습니다.';
            }
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
        
        // 플래그 해제
        setTimeout(() => {
            this.isOpeningNoticeModal = false;
        }, 300);
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

    // 사용자 고유 ID 가져오기 (없으면 생성)
    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    // 공지사항별 댓글 작성 (새 시스템)
    async submitNoticeComment() {
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
            this.isSubmittingComment = false;
            return;
        }

        if (!this.currentNoticeNumber) {
            alert('공지사항 정보가 없습니다.');
            this.isSubmittingComment = false;
            return;
        }

        try {
        const comment = {
            noticeNumber: this.currentNoticeNumber,
                content: content,
                userId: this.getUserId(),
                createdAt: new Date().toISOString(),
                deleted: false,
            replies: []
        };

            const postsRef = window.firebaseCollection(window.firebaseDb, 'noticePosts');
            await window.firebaseAddDoc(postsRef, comment);
            
            console.log('공지사항 댓글 작성 완료:', comment);
        commentInput.value = '';
            
            await this.loadNoticeComments();
        } catch (error) {
            console.error('공지사항 댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
        }
        
        setTimeout(() => {
            this.isSubmittingComment = false;
        }, 100);
    }

    // 공지사항별 댓글 로드 (새 시스템)
    async loadNoticeComments() {
        if (!this.currentNoticeNumber) return;
        
        const commentsList = document.getElementById('noticeCommentsList');
        const commentCount = document.getElementById('noticeCommentCount');

        if (!commentsList) return;

        try {
            const postsRef = window.firebaseCollection(window.firebaseDb, 'noticePosts');
            const q = window.firebaseQuery(
                postsRef,
                window.firebaseWhere('noticeNumber', '==', this.currentNoticeNumber)
            );
            const querySnapshot = await window.firebaseGetDocs(q);
            
            const comments = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // 답글(parentId가 있는 것)은 제외
                if (!data.deleted && !data.parentId) {
                    comments.push({ id: doc.id, ...data });
                }
            });
            
            // 시간순 정렬 (최신순)
            comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 댓글 개수 업데이트
        if (commentCount) {
                commentCount.textContent = `${comments.length}개`;
        }

            if (comments.length === 0) {
                commentsList.innerHTML = '<p style="text-align: center; color: #6b7280; font-size: 0.8rem;">아직 댓글이 없습니다.</p>';
            return;
        }

            // 댓글 표시
            commentsList.innerHTML = '';
            const currentUserId = this.getUserId();
            const isAdmin = (typeof adminAuth !== 'undefined' && adminAuth && typeof adminAuth.isAuthenticated === 'function')
                ? adminAuth.isAuthenticated()
                : (localStorage.getItem('admin_session') === 'true');
            
            comments.forEach((comment) => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment-item product-post';
                commentElement.dataset.postId = comment.id;
                commentElement.style.cssText = 'margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;';
                
                const date = new Date(comment.createdAt);
                const year = (date.getFullYear() % 100).toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
                
                commentElement.innerHTML = `
                    <div class="post-header" style="margin-bottom: 8px;">
                        <div class="post-left">
                            <span class="post-author">익명</span>
                            <span class="post-date">${formattedDate}</span>
                        </div>
                        ${(isAdmin || comment.userId === currentUserId) ? `
                            <div class="post-actions">
                                <button class="post-edit-btn" onclick="editNoticePost('${comment.id}')" style="font-size: 0.85rem; padding: 4px 8px;">✏️ 수정</button>
                                <button class="post-delete-btn" onclick="deleteNoticePost('${comment.id}')" style="font-size: 0.85rem; padding: 4px 8px;">🗑️ 삭제</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="post-content" style="color: #000000;">${comment.content ? comment.content.replace(/\n/g, '<br>') : ''}</div>
                `;
                
                commentsList.appendChild(commentElement);
            });
        } catch (error) {
            console.error('공지사항 댓글 로드 실패:', error);
        if (commentsList) {
                commentsList.innerHTML = '<p style="text-align: center; color: #ef4444; font-size: 0.8rem;">댓글을 불러오는데 실패했습니다.</p>';
            }
        }
    }

    // 공지사항별 댓글 HTML 생성 (더 이상 사용 안 함 - 새로운 시스템 사용)
    createNoticeCommentHTML(comment, allComments, depth = 0) {
        // 관리자 인증 체크 - localStorage에서 관리자 세션 확인
        const adminSession = localStorage.getItem('admin_session');
        const isAdmin = adminSession === 'true' || adminAuth.isAuthenticated();
        const currentUserId = this.getUserId();
        const timeStr = new Date(comment.timestamp).toLocaleString();
        
        // 본인이 작성한 댓글인지 확인 (기존 댓글은 userId가 없을 수 있음)
        const isMyComment = comment.userId ? (comment.userId === currentUserId) : false;
        
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

        // 본인이 작성한 댓글이거나 관리자인 경우 수정/삭제 가능
        if (isMyComment || isAdmin) {
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
    async setupNumberCommentListeners() {
        // 번호 선택 기능이 제거되었으므로 함수 비활성화
        return;
        
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
        await this.createNumberSelector();
        
        // 새로운 이벤트 리스너 등록
        const newSubmitBtn = document.getElementById('submitComment');
        const newCommentInput = document.getElementById('commentInput');
        
        if (newSubmitBtn) {
            newSubmitBtn.addEventListener('click', async () => {
                await this.submitNumberComment();
            });
        }

        // 엔터키로 댓글 작성 (Ctrl+Enter)
        if (newCommentInput) {
            newCommentInput.addEventListener('keydown', async (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    await this.submitNumberComment();
                }
            });
        }

        // 초기 댓글 로드
        await this.loadNumberComments();
    }

    // 숫자 선택기 생성
    async createNumberSelector() {
        // 번호 선택 기능이 제거되었으므로 함수 비활성화
        return;
        
        const numberSelector = document.getElementById('numberSelector');
        if (!numberSelector) return;

        // 최대 숫자 결정 (댓글이 있는 번호 + 여유분)
        const comments = await this.getNumberComments();
        const maxNumber = Math.max(20, ...comments.map(c => parseInt(c.number) || 0)) + 5;

        let html = '';
        for (let i = 1; i <= maxNumber; i++) {
            html += `<button class="number-btn" data-number="${i}" onclick="priceComparisonSite.selectNumber(${i})">${i}</button>`;
        }

        numberSelector.innerHTML = html;

        // 기본값 1 선택
        await this.selectNumber(1);
    }

    // 숫자 선택
    async selectNumber(number) {
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
        await this.loadNumberComments();
    }

    // 공지사항 데이터 가져오기
    async getNoticeData() {
        try {
            // Firebase에서 먼저 시도
            const noticesRef = window.firebaseCollection(window.firebaseDb, 'notices');
            const doc = await window.firebaseGetDoc(window.firebaseDoc(noticesRef, 'main'));
            
            if (doc.exists()) {
                const data = doc.data();
                console.log('Firebase에서 필독 데이터 로드:', data);
                
                // localStorage 동기화 (최신 데이터로 업데이트)
                localStorage.setItem('noticeData', JSON.stringify(data));
                
                return data;
            } else {
                console.log('Firebase에 필독 데이터가 없습니다.');
            }
        } catch (error) {
            // 권한 오류는 조용히 처리 (팝업 없음)
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.message.includes('Missing or insufficient permissions');
            
            if (isPermissionError) {
                console.warn('필독 데이터 로드 권한 오류 (무시됨)');
                // localStorage에서 로드 시도
            } else {
                console.error('Firebase 필독 데이터 로드 실패:', error);
            }
        }
        
        // Firebase에 없으면 localStorage 사용 (하위 호환성)
        const data = localStorage.getItem('noticeData');
        if (data) {
            console.log('localStorage에서 필독 데이터 로드');
            return JSON.parse(data);
        }
        
        // 기본값 반환
        return {
            mainNotice: '',
            notice1: '',
            notice2: '',
            notice3: ''
        };
    }

    // 공지사항 데이터 저장
    async saveNoticeData(data) {
        try {
            // Firebase에 저장 - merge 옵션 추가하여 기존 데이터 유지
            const noticesRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'notices'), 'main');
            
            // 기존 데이터 먼저 가져오기
            const existingDoc = await window.firebaseGetDoc(noticesRef);
            let existingData = {};
            if (existingDoc.exists()) {
                existingData = existingDoc.data();
            }
            
            // 기존 데이터와 새 데이터 병합
            const mergedData = { ...existingData, ...data };
            
            await window.firebaseSetDoc(noticesRef, mergedData, { merge: true });
            console.log('Firebase에 필독 데이터 저장 완료:', mergedData);
            
            // 저장 후 즉시 확인
            const verifyDoc = await window.firebaseGetDoc(noticesRef);
            if (verifyDoc.exists()) {
                console.log('Firebase 저장 확인:', verifyDoc.data());
            }
        } catch (error) {
            console.error('Firebase 필독 데이터 저장 실패:', error);
            // 저장 실패 시에도 알림
            alert('공지사항 저장에 실패했습니다. 페이지를 새로고침해주세요.');
        }
        
        // localStorage에도 저장 (백업)
        localStorage.setItem('noticeData', JSON.stringify(data));
    }

    // 공지사항 로드
    async loadNotice() {
        const data = await this.getNoticeData();
        
        // 대문글 표시
        const mainNoticeContent = document.getElementById('mainNoticeContent');
        if (mainNoticeContent) {
            mainNoticeContent.textContent = data.mainNotice || '대문글이 없습니다.';
        }
        
        // 기존 공지 항목들 제거
        const subNotices = document.querySelector('.sub-notices');
        if (subNotices) {
            subNotices.innerHTML = '';
        }
        
        // 비어있지 않은 공지만 표시
        for (let i = 1; i <= 10; i++) {
            const key = `notice${i}`;
            const content = data[key];
            
            if (content && content.trim() !== '' && content !== `공지${i}가 없습니다.`) {
                if (subNotices) {
                    const noticeItem = document.createElement('div');
                    noticeItem.className = 'notice-item';
                    noticeItem.innerHTML = `
                        <span class="notice-label">공지${i}:</span>
                        <span id="notice${i}Content" class="notice-content-item">${content.replace(/\n/g, ' ').substring(0, 100)}${content.length > 100 ? '...' : ''}</span>
                    `;
                    
                    subNotices.appendChild(noticeItem);
                    
                    // 이벤트 위임을 사용하므로 개별 이벤트 리스너 추가 불필요
                }
            }
        }
    }

    // 공지사항 저장
    async saveNotice() {
        if (!adminAuth.requireAuth()) {
            return;
        }

        const mainNoticeTextarea = document.getElementById('mainNoticeTextarea');
        const data = {
            mainNotice: mainNoticeTextarea ? mainNoticeTextarea.value.trim() : ''
        };

        // 기존 공지사항 데이터 가져오기
        const noticeData = await this.getNoticeData();
        
        // 모든 공지사항 키를 가져와서 data에 추가
        Object.keys(noticeData).forEach(key => {
            if (key.startsWith('notice')) {
                data[key] = noticeData[key];
            }
        });
        
        // 모든 공지사항 textarea 찾기 (편집 폼에 있는 모든 textarea)
        const form = document.querySelector('.notice-edit-form');
        if (form) {
            const allTextareas = form.querySelectorAll('textarea');
            allTextareas.forEach(textarea => {
                const id = textarea.id;
                if (id && id.endsWith('Textarea') && !id.startsWith('mainNoticeTextarea')) {
                    const noticeKey = id.replace('Textarea', '');
                    if (noticeKey && data[noticeKey] !== undefined) {
                        data[noticeKey] = textarea.value.trim();
                    }
                }
            });
        }

        console.log('저장할 데이터:', data);
        await this.saveNoticeData(data);
        this.toggleNoticeEdit(false);
        await this.loadNotice();
    }

    // 숫자별 댓글 작성 (선택된 번호에만 작성)
    async submitNumberComment() {
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
            userId: this.getUserId(), // 댓글 작성자 고유 ID 저장
            timestamp: new Date().toISOString(),
            number: number.toString(),
            parentId: null,
            replies: []
        };

        await this.saveNumberComment(comment);
        commentInput.value = '';
        await this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
        
        // 실행 완료 후 플래그 해제
        setTimeout(() => {
            this.isSubmittingComment = false;
        }, 100);
    }

    // 숫자별 댓글 저장
    async saveNumberComment(comment) {
        // Firebase에만 저장 (localStorage는 리스너가 자동으로 업데이트함)
        try {
            const commentsRef = window.firebaseCollection(window.firebaseDb, 'numberComments');
            await window.firebaseAddDoc(commentsRef, comment);
            console.log('Firebase에 댓글 저장 완료:', comment);
        } catch (error) {
            console.error('Firebase 댓글 저장 실패:', error);
            // Firebase 저장 실패 시에만 localStorage에 백업
            const data = localStorage.getItem('numberComments');
            const comments = data ? JSON.parse(data) : [];
            comments.push(comment);
            localStorage.setItem('numberComments', JSON.stringify(comments));
        }
    }

    // 숫자별 댓글 가져오기
    async getNumberComments() {
        try {
            // Firebase에서 먼저 시도
            const commentsRef = window.firebaseCollection(window.firebaseDb, 'numberComments');
            const querySnapshot = await window.firebaseGetDocs(commentsRef);
            
            const comments = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // comment.id가 있으면 유지, 없으면 doc.id 사용
                comments.push({ id: data.id || doc.id, ...data });
            });
            
            console.log('Firebase에서 숫자별 댓글 로드:', comments.length, '개');
            
            // localStorage에도 저장 (백업)
            localStorage.setItem('numberComments', JSON.stringify(comments));
            
            return comments;
        } catch (error) {
            console.log('Firebase 숫자별 댓글 로드 실패, localStorage 사용:', error);
            
            // Firebase 실패 시 localStorage 사용 (하위 호환성)
            const data = localStorage.getItem('numberComments');
            return data ? JSON.parse(data) : [];
        }
    }

    // 숫자별 댓글 로드 (선택된 번호만 표시)
    async loadNumberComments() {
        const comments = await this.getNumberComments();
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
        // 관리자 인증 체크 - localStorage에서 관리자 세션 확인
        const adminSession = localStorage.getItem('admin_session');
        const isAdmin = adminSession === 'true' || adminAuth.isAuthenticated();
        const currentUserId = this.getUserId();
        const timeStr = new Date(comment.timestamp).toLocaleString();
        
        // 본인이 작성한 댓글인지 확인 (기존 댓글은 userId가 없을 수 있음)
        const isMyComment = comment.userId ? (comment.userId === currentUserId) : false;
        
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

        // 본인이 작성한 댓글이거나 관리자인 경우 수정/삭제 가능
        if (isMyComment || isAdmin) {
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
    async toggleNoticeEdit(isEdit) {
        const display = document.getElementById('noticeDisplay');
        const edit = document.getElementById('noticeEdit');

        if (isEdit) {
            display.classList.add('hidden');
            edit.classList.remove('hidden');
            
            // 기존 데이터를 폼에 로드
            const data = await this.getNoticeData();
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

    // 이미지 순서 저장
    selectedImageOrder = [];

    async handleFormSubmission() {
        // 중복 제출 방지
        if (this.isSubmitting) {
            console.log('이미 제출 중입니다. 중복 제출 방지');
            return;
        }
        
        console.log('폼 제출 시작');
        this.isSubmitting = true;
        
        // 이미지 업로드 처리 (여러 장 가능, 순서 변경 반영)
        let imageUrls = [];
        
        // 순서가 변경된 이미지가 있는 경우 해당 순서 사용, 아니면 원본 순서 사용
        const imageFilesToUpload = this.selectedImageOrder && this.selectedImageOrder.length > 0 
            ? this.selectedImageOrder 
            : (document.getElementById('productImage').files ? Array.from(document.getElementById('productImage').files) : []);
        
        if (imageFilesToUpload && imageFilesToUpload.length > 0) {
            try {
                console.log('이미지 업로드 시작:', imageFilesToUpload.length, '개');
                
                // Firebase 인증 상태 확인 (익명 인증)
                const auth = window.firebaseAuth;
                if (auth) {
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                        // 익명 인증이 이미 실패했는지 확인
                        if (window.firebaseAuthReady === false) {
                            console.warn('⚠️ Firebase 익명 인증이 실패했습니다. Storage 보안 규칙을 확인하세요.');
                            console.warn('익명 인증 없이 업로드를 시도합니다. Storage 보안 규칙이 "allow write: if true;"인지 확인하세요.');
                        } else {
                            console.log('Firebase 인증 대기 중...');
                            // 인증 완료 대기 (최대 3초)
                            try {
                                await new Promise((resolve, reject) => {
                                    const timeout = setTimeout(() => {
                                        console.warn('Firebase 인증 대기 시간 초과. 업로드를 시도합니다.');
                                        resolve(); // 실패해도 업로드 시도
                                    }, 3000);
                                    
                                    const unsubscribe = auth.onAuthStateChanged((user) => {
                                        if (user) {
                                            clearTimeout(timeout);
                                            unsubscribe();
                                            console.log('✅ Firebase 인증 완료:', user.uid);
                                            resolve();
                                        }
                                    });
                                });
                            } catch (authError) {
                                console.warn('Firebase 인증 실패, 업로드를 시도합니다:', authError);
                            }
                        }
                    } else {
                        console.log('✅ Firebase 인증 완료:', currentUser.uid);
                    }
                } else {
                    console.warn('Firebase Auth가 초기화되지 않았습니다. 익명 인증 없이 시도합니다.');
                }
                
                const thumbnailUrls = []; // 썸네일 URL 배열
                const storageRef = window.firebaseStorage();
                const timestamp = Date.now();
                
                // Firebase Storage 초기화 확인
                if (!storageRef) {
                    throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                }
                
                // 모든 이미지 업로드 (순서대로) - 원본 + 썸네일
                for (let i = 0; i < imageFilesToUpload.length; i++) {
                    const imageFile = imageFilesToUpload[i];
                    
                    // 파일 크기 검증 (5MB)
                    if (imageFile.size > 5 * 1024 * 1024) {
                        alert(`이미지 ${i + 1}번의 크기가 5MB를 초과합니다.`);
                        this.isSubmitting = false;
                        return;
                    }
                    
                    // 원본 이미지 업로드
                    try {
                        const imageRef = window.firebaseStorageRef(storageRef, `products/${timestamp}_${i}_${imageFile.name}`);
                        console.log(`이미지 ${i + 1}/${imageFilesToUpload.length} 업로드 시도:`, imageFile.name, `(${(imageFile.size / 1024).toFixed(1)}KB)`);
                        
                        const snapshot = await window.firebaseUploadBytes(imageRef, imageFile);
                        const imageUrl = await window.firebaseGetDownloadURL(snapshot.ref);
                        imageUrls.push(imageUrl);
                        console.log(`원본 이미지 ${i + 1}/${imageFilesToUpload.length} 업로드 완료:`, imageUrl);
                    } catch (uploadError) {
                        console.error(`이미지 ${i + 1} 업로드 실패:`, uploadError);
                        throw new Error(`이미지 ${i + 1} 업로드 실패: ${uploadError.message || uploadError.code || '알 수 없는 오류'}`);
                    }
                    
                    // 썸네일 생성 및 업로드
                    try {
                        const thumbnailFile = await this.createThumbnail(imageFile, 120, 120, 0.7);
                        if (thumbnailFile === null) {
                            // 이미 작은 이미지인 경우 원본 URL 사용
                            thumbnailUrls.push(imageUrl);
                            console.log(`썸네일 생성 건너뜀 (이미 작은 이미지): ${i + 1}/${imageFilesToUpload.length}`);
                        } else {
                            const thumbnailRef = window.firebaseStorageRef(storageRef, `products/thumbnails/${timestamp}_${i}_thumb_${imageFile.name}`);
                            const thumbnailSnapshot = await window.firebaseUploadBytes(thumbnailRef, thumbnailFile);
                            const thumbnailUrl = await window.firebaseGetDownloadURL(thumbnailSnapshot.ref);
                            thumbnailUrls.push(thumbnailUrl);
                            console.log(`썸네일 ${i + 1}/${imageFilesToUpload.length} 업로드 완료:`, thumbnailUrl, `(크기: ${(thumbnailFile.size / 1024).toFixed(1)}KB)`);
                        }
                    } catch (thumbnailError) {
                        console.error(`썸네일 생성/업로드 실패 (${i + 1}):`, thumbnailError);
                        // 썸네일 실패 시 원본 URL 사용 (하위 호환성)
                        thumbnailUrls.push(imageUrl);
                    }
                }
                
                console.log('모든 이미지 업로드 완료:', imageUrls.length, '개 원본,', thumbnailUrls.length, '개 썸네일');
                
                // thumbnailUrls를 formData에 추가하기 위해 변수에 저장
                this.currentThumbnailUrls = thumbnailUrls;
            } catch (error) {
                console.error('이미지 업로드 실패:', error);
                console.error('에러 상세 정보:', {
                    message: error.message,
                    code: error.code,
                    stack: error.stack,
                    name: error.name
                });
                
                // Firebase Storage 권한 오류인지 확인
                if (error.code === 'storage/unauthorized' || error.code === 'permission-denied') {
                    alert('⚠️ Firebase Storage 접근 권한 오류\n\nFirebase Console에서 Storage 보안 규칙을 확인하세요.\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.');
                } else if (error.code === 'storage/quota-exceeded') {
                    alert('⚠️ Firebase Storage 용량 초과\n\n저장 공간이 부족합니다. Firebase Console에서 확인하세요.');
                } else if (error.code === 'storage/canceled') {
                    alert('⚠️ 이미지 업로드가 취소되었습니다.');
                } else {
                    alert(`이미지 업로드에 실패했습니다.\n\n오류: ${error.message || '알 수 없는 오류'}\n\n텍스트만 저장합니다.\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`);
                }
                
                imageUrls = [];
                this.currentThumbnailUrls = [];
            }
        } else {
            this.currentThumbnailUrls = [];
        }
        
        // 제품명 가져오기 - 안전하게 처리
        const productNameInput = document.getElementById('productName');
        let productName = '';
        if (productNameInput) {
            productName = productNameInput.value || '';
            // trim() 전에 원본 값 확인
            console.log('제품명 원본 값 (길이):', productName.length, productName);
            productName = productName.trim();
            console.log('제품명 trim 후 (길이):', productName.length, productName);
        }
        
        const formData = {
            name: productName || '제품명 미입력',
            originalPrice: parseInt(document.getElementById('productOriginalPrice').value) || 0,
            price: parseInt(document.getElementById('productPrice').value) || 0, // 최종가
            link: document.getElementById('productLink').value.trim() || '링크 미입력',
            store: document.getElementById('productStore').value.trim() || '미선택',
            category: document.getElementById('productCategory').value.trim() || '',
            description: document.getElementById('productDescription').value.trim() || '',
            imageUrl: imageUrls.length > 0 ? imageUrls[0] : '', // 첫 번째 이미지만 호환성을 위해 유지
            imageUrls: imageUrls, // 여러 이미지 배열 (원본)
            thumbnailUrls: this.currentThumbnailUrls || [], // 썸네일 URL 배열
            thumbnailUrl: (this.currentThumbnailUrls && this.currentThumbnailUrls.length > 0) ? this.currentThumbnailUrls[0] : '', // 첫 번째 썸네일 (호환성)
            userId: this.getUserId()
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
        
        // 최종가 검증
        if (!data.price || data.price <= 0) {
            alert('올바른 최종가를 입력해주세요.');
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
                originalPrice: productData.originalPrice || 0, // 정가(시작가)
                deliveryFee: 0, // 기본값
                rating: 4.0, // 기본값
                category: productData.category || this.detectCategory(productData.name),
                status: 'pending',
                submittedBy: 'customer',
                link: productData.link,
                createdAt: new Date().toISOString(),
                description: productData.description || '',
                imageUrl: productData.imageUrl || '',
                imageUrls: productData.imageUrls || [],
                thumbnailUrl: productData.thumbnailUrl || '', // 첫 번째 썸네일 (호환성)
                thumbnailUrls: productData.thumbnailUrls || [], // 썸네일 URL 배열
                userId: productData.userId,
                clickCount: 0, // 클릭 횟수 초기화
                purchaseCount: 0 // 구매 횟수 초기화
            };
            
            // 최종가 설정: price 필드가 최종가, originalPrice가 있으면 그대로 사용, 없으면 price를 originalPrice로 설정
            if (productData.price && productData.price > 0) {
                product.finalPrice = productData.price;
                // originalPrice가 없으면 price를 originalPrice로 설정 (호환성)
                if (!product.originalPrice || product.originalPrice === 0) {
                    product.originalPrice = productData.price;
                }
            }

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
                await this.displayAllProducts();
            } else {
                await this.displayCategoryResults(this.currentCategory);
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
        // 폼 리셋
        document.getElementById('productForm').reset();
        
        // 이미지 관련 상태 초기화
        if (this.selectedImageOrder) {
            this.selectedImageOrder = [];
        }
        
        // 썸네일 URL 배열도 초기화
        if (this.currentThumbnailUrls) {
            this.currentThumbnailUrls = [];
        }
        
        // 이미지 미리보기 컨테이너 초기화
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        if (imagePreviewContainer) {
            imagePreviewContainer.innerHTML = '';
            imagePreviewContainer.style.display = 'none';
        }
        
        // 이미지 input 초기화
        const productImageInput = document.getElementById('productImage');
        if (productImageInput) {
            // input의 files를 빈 DataTransfer로 초기화
            const dataTransfer = new DataTransfer();
            productImageInput.files = dataTransfer.files;
        }
        
        // 이미지 미리보기 업데이트 (빈 상태로)
        if (typeof window.handleImageSelection === 'function') {
            window.handleImageSelection();
        }
        
        console.log('폼 초기화 완료 - 이미지 상태도 모두 초기화됨');
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
        
        // 의류 카테고리
        else if (name.includes('티셔츠') || name.includes('셔츠') || name.includes('t-shirt') ||
                 name.includes('맨투맨') || name.includes('후드티') || name.includes('후드') ||
                 name.includes('패딩') || name.includes('코트') || name.includes('자켓') || name.includes('재킷') ||
                 name.includes('점퍼') || name.includes('jumper') ||
                 name.includes('청바지') || name.includes('바지') || name.includes('팬츠') || name.includes('jeans') ||
                 name.includes('슬랙스') || name.includes('반바지') ||
                 name.includes('원피스') || name.includes('dress') ||
                 name.includes('스커트') || name.includes('치마') ||
                 name.includes('니트') || name.includes('가디건') ||
                 name.includes('트레이닝') || name.includes('조거') ||
                 name.includes('양말') || name.includes('삭스') || name.includes('socks') ||
                 name.includes('언더웨어') || name.includes('속옷') || name.includes('브라') || name.includes('팬티') ||
                 name.includes('잠옷') || name.includes('파자마') || name.includes('pajama') ||
                 name.includes('운동화') || name.includes('스니커즈') || name.includes('구두') || name.includes('shoes') ||
                 name.includes('샌들') || name.includes('슬리퍼') ||
                 name.includes('모자') || name.includes('캡') || name.includes('비니') ||
                 name.includes('목도리') || name.includes('머플러') ||
                 name.includes('아우터') || name.includes('outer') ||
                 name.includes('상의') || name.includes('하의') ||
                 name.includes('의류') || name.includes('clothes') || name.includes('패션')) {
            console.log('→ 의류 카테고리로 분류');
            return '의류';
        }
        
        // ETC 카테고리 (위에 해당하지 않는 모든 상품)
        else {
            console.log('→ ETC 카테고리로 분류 (기본값)');
            return 'ETC';
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
            await this.loadNotice(); // 필독 데이터 로드
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
        
        // 상품 로딩 상태 확인 및 재시도
        console.log('현재 로드된 상품 개수:', this.products.length);
        
        const checkAndRetryProducts = async () => {
            // 권한 오류가 발생했으면 재시도하지 않음
            if (window.firebasePermissionDenied) {
                return;
            }
            
            const productList = document.getElementById('productList');
            const hasProducts = this.products.length > 0;
            const isDisplayed = productList && productList.innerHTML && productList.innerHTML.trim() !== '';
            
            if (!hasProducts || !isDisplayed) {
                try {
                    await this.loadProductsFromFirebase(false); // 캐시 없이 재시도
                    
                    // 재시도 후에도 확인
                    const retryHasProducts = this.products.length > 0;
                    const retryProductList = document.getElementById('productList');
                    const retryIsDisplayed = retryProductList && retryProductList.innerHTML && retryProductList.innerHTML.trim() !== '';
                    
                    if (!retryHasProducts || !retryIsDisplayed) {
                        try {
                            await this.displayAllProducts();
                        } catch (displayError) {
                            // 권한 오류는 조용히 처리
                            const isPermissionError = displayError.code === 'permission-denied' || 
                                                     displayError.code === 'PERMISSION_DENIED' ||
                                                     displayError.message.includes('Missing or insufficient permissions');
                            if (!isPermissionError) {
                                console.error('displayAllProducts 강제 호출 실패:', displayError);
                            }
                        }
                    }
                } catch (retryError) {
                    // 권한 오류는 조용히 처리
                    const isPermissionError = retryError.code === 'permission-denied' || 
                                             retryError.code === 'PERMISSION_DENIED' ||
                                             retryError.message.includes('Missing or insufficient permissions');
                    if (!isPermissionError) {
                        console.error('재시도 실패:', retryError);
                    }
                }
            }
        };
        
        // 즉시 확인
        setTimeout(checkAndRetryProducts, 1000);
        
        // 3초 후 재확인
        setTimeout(checkAndRetryProducts, 3000);
        
        // 5초 후 최종 확인
        setTimeout(checkAndRetryProducts, 5000);
        } catch (error) {
            // 권한 오류 감지
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.message.includes('Missing or insufficient permissions');
            
            if (isPermissionError) {
                window.firebasePermissionDenied = true;
                // 권한 오류는 initFirebase에서 이미 처리되었으므로 재시도하지 않음
                return;
            }
            
            console.error('Firebase 초기화 실패:', error);
            gaTracker.trackError('firebase_init_error', error.message);
            
            // 에러 발생 시에도 재시도 (권한 오류가 아닌 경우만)
            console.log('Firebase 초기화 실패 후 5초 뒤 재시도합니다...');
            setTimeout(async () => {
                // 권한 오류가 발생했으면 재시도하지 않음
                if (window.firebasePermissionDenied) {
                    return;
                }
                try {
                    console.log('Firebase 초기화 재시도 시작...');
                    await this.initFirebase();
                } catch (retryError) {
                    console.error('Firebase 초기화 재시도 실패:', retryError);
                    // 두 번째 재시도 (10초 후)
                    setTimeout(async () => {
                        try {
                            console.log('Firebase 초기화 두 번째 재시도 시작...');
                            await this.initFirebase();
                        } catch (secondRetryError) {
                            console.error('Firebase 초기화 두 번째 재시도 실패:', secondRetryError);
                            alert('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                        }
                    }, 10000);
                }
            }, 5000);
        }
    }

    // Firebase 함수들 설정
    setupFirebaseFunctions() {
        try {
            // Firebase 함수들이 이미 정의되어 있는지 확인 (index.html에서 로드됨)
            if (window.firebaseDb && window.firebaseCollection && window.firebaseDoc) {
                console.log('Firebase 함수들이 이미 정의되어 있습니다.');
                return;
            }

            // index.html에서 Firebase가 로드되지 않은 경우
            console.warn('Firebase가 로드되지 않았습니다. index.html에서 로드되는 것을 기다립니다.');
        } catch (error) {
            console.error('Firebase 함수 설정 실패:', error);
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 150; // 15초 대기 (150 * 100ms) - 시간 증가
            
            const checkFirebase = () => {
                attempts++;
                
                // Firebase DB와 필수 함수들이 모두 준비되었는지 확인
                const isFirebaseReady = window.firebaseDb && 
                                      window.firebaseCollection && 
                                      window.firebaseGetDocs &&
                                      window.firebaseDoc;
                
                if (isFirebaseReady) {
                    console.log('Firebase 완전히 준비됨 (시도 횟수:', attempts, ')');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('Firebase 초기화 타임아웃 (시도 횟수:', attempts, ')');
                    console.log('Firebase 상태:', {
                        firebaseDb: !!window.firebaseDb,
                        firebaseCollection: !!window.firebaseCollection,
                        firebaseGetDocs: !!window.firebaseGetDocs,
                        firebaseDoc: !!window.firebaseDoc
                    });
                    // 타임아웃 시에도 계속 진행 (재시도는 상위에서 처리)
                    resolve();
                } else {
                    // 10회마다 로그 출력 (너무 많은 로그 방지)
                    if (attempts % 10 === 0) {
                        console.log(`Firebase 대기 중... (${attempts}/${maxAttempts})`);
                    }
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    async loadProductsFromFirebase(useCache = true) {
        try {
            // 로컬 캐싱 확인 (5분 이내 캐시가 있으면 사용)
            if (useCache) {
                const cacheKey = 'firebase_products_cache_v3';
                const cacheData = localStorage.getItem(cacheKey);
                if (cacheData) {
                    try {
                        const { products, timestamp } = JSON.parse(cacheData);
                        const cacheAge = Date.now() - timestamp;
                        const cacheMaxAge = 5 * 60 * 1000; // 5분
                        
                        if (cacheAge < cacheMaxAge && products && products.length > 0) {
                            console.log('로컬 캐시에서 상품 데이터 로드:', products.length, '개 (캐시 나이:', Math.round(cacheAge / 1000), '초)');
                            // 캐시 데이터로 기존 배열 업데이트 (같은 ID가 있으면 캐시 데이터로 덮어쓰기)
                            const existingProductsMap = new Map(this.products.map(p => [p.id, p]));
                            
                            // 캐시에서 가져온 데이터로 기존 항목 업데이트
                            products.forEach(cacheProduct => {
                                existingProductsMap.set(cacheProduct.id, cacheProduct);
                            });
                            
                            // Map을 배열로 변환
                            this.products = Array.from(existingProductsMap.values());
                            
                            this.updateCategoryCounts();
                            await this.displayAllProducts();
                            return; // 캐시 사용 시 Firebase 호출 건너뛰기
                        } else {
                            console.log('캐시가 만료되었습니다. Firebase에서 새로 로드합니다.');
                            localStorage.removeItem(cacheKey);
                        }
                    } catch (cacheError) {
                        console.error('캐시 파싱 오류:', cacheError);
                        localStorage.removeItem(cacheKey);
                    }
                }
            }
            
            // Firestore에서 모든 상품 데이터를 불러옵니다 (상태 포함)
            const productsRef = window.firebaseCollection(window.firebaseDb, 'products');
            const querySnapshot = await window.firebaseGetDocs(productsRef);
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
                
                // 제품 상태 확인 및 로그 (이미지 필드 포함)
                console.log(`Firebase에서 불러온 제품:`, {
                    name: product.name,
                    status: product.status,
                    category: product.category,
                    submittedBy: product.submittedBy,
                    store: product.store,
                    willShow: product.status === 'approved',
                    imageUrl: product.imageUrl,
                    imageUrls: product.imageUrls
                });
                
                firebaseProducts.push(product);
            }

            // 생성일 기준으로 최신순 정렬 (createdAt이 없으면 가장 오래된 값으로 처리)
            firebaseProducts.sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                const safeTimeA = isNaN(timeA) ? 0 : timeA;
                const safeTimeB = isNaN(timeB) ? 0 : timeB;
                return safeTimeB - safeTimeA;
            });
            
            // Firebase 데이터로 기존 배열 업데이트 (같은 ID가 있으면 Firebase 데이터로 덮어쓰기)
            const existingProductsMap = new Map(this.products.map(p => [p.id, p]));
            
            // Firebase에서 가져온 데이터로 기존 항목 업데이트
            firebaseProducts.forEach(firebaseProduct => {
                existingProductsMap.set(firebaseProduct.id, firebaseProduct);
            });
            
            // Map을 배열로 변환 (Firebase 데이터가 최신 상태이므로 우선 사용)
            this.products = Array.from(existingProductsMap.values());
            
            // 로컬 캐시에 저장 (5분간 유효)
            if (useCache && firebaseProducts.length > 0) {
                try {
                    const cacheKey = 'firebase_products_cache_v3';
                    const cacheData = {
                        products: firebaseProducts,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                    console.log('상품 데이터를 로컬 캐시에 저장했습니다.');
                    } catch (cacheError) {
                    console.error('캐시 저장 오류:', cacheError);
                    // localStorage 용량 초과 시 오래된 캐시 삭제 시도
                    try {
                        localStorage.removeItem('firebase_products_cache_v3');
                        const cacheData = {
                            products: firebaseProducts,
                            timestamp: Date.now()
                        };
                        localStorage.setItem('firebase_products_cache_v3', JSON.stringify(cacheData));
                    } catch (retryError) {
                        console.error('캐시 재저장 실패:', retryError);
                    }
                }
            }
            
            console.log('Firebase에서 제품 데이터 불러오기 완료:', firebaseProducts.length, '개');
            console.log('전체 제품 목록:', this.products.length, '개');
            console.log('제품 상태별 분류:', {
                approved: this.products.filter(p => p.status === 'approved').length,
                pending: this.products.filter(p => p.status === 'pending').length,
                rejected: this.products.filter(p => p.status === 'rejected').length
            });
            
            // 페이지 로드 시 로컬 수정 플래그 초기화
            this.localModifications.clear();
            console.log('페이지 로드 시 로컬 수정 플래그 초기화 완료');
            
            console.log('updateCategoryCounts 호출 전');
            this.updateCategoryCounts();
            console.log('updateCategoryCounts 호출 후');
            
            console.log('displayAllProducts 호출 전');
            await this.displayAllProducts();
            console.log('displayAllProducts 호출 후');
            
            // 상품 표시 확인 및 재시도
            const productList = document.getElementById('productList');
            const hasProducts = this.products.length > 0;
            const isDisplayed = productList && productList.innerHTML && productList.innerHTML.trim() !== '';
            
            console.log('상품 로드 상태 확인:', {
                productsCount: this.products.length,
                hasProducts: hasProducts,
                isDisplayed: isDisplayed,
                productListExists: !!productList
            });
            
            // 상품이 로드되지 않았거나 표시되지 않은 경우 재시도
            if (!hasProducts || !isDisplayed) {
                console.warn('상품이 로드되지 않았거나 표시되지 않았습니다. 재시도합니다...');
                
                // 즉시 재시도 (캐시 없이)
                setTimeout(async () => {
                    try {
                        console.log('상품 로드 재시도 시작 (1차)...');
                        await this.loadProductsFromFirebase(false);
                        
                        // 재시도 후에도 확인
                        const retryProductList = document.getElementById('productList');
                        const retryIsDisplayed = retryProductList && retryProductList.innerHTML && retryProductList.innerHTML.trim() !== '';
                        
                        if (this.products.length === 0 || !retryIsDisplayed) {
                            console.warn('1차 재시도 후에도 실패. 2차 재시도합니다...');
                            setTimeout(async () => {
                                try {
                                    console.log('상품 로드 재시도 시작 (2차)...');
                                    await this.loadProductsFromFirebase(false);
                                    await this.displayAllProducts(); // 강제로 표시 시도
                                } catch (error) {
                                    console.error('2차 재시도 실패:', error);
                                }
                }, 2000);
                        }
                    } catch (error) {
                        console.error('1차 재시도 실패:', error);
                    }
                }, 1000);
            }
            
        } catch (error) {
            // 권한 오류 감지
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.message.includes('Missing or insufficient permissions') ||
                                     error.message.includes('permission-denied');
            
            if (isPermissionError) {
                // 권한 오류 전역 플래그 설정 (재시도 함수들에서 확인)
                window.firebasePermissionDenied = true;
                
                // 권한 오류 알림 (최초 1회만, 지연 처리로 중복 방지)
                if (!window.firebasePermissionErrorShown) {
                    window.firebasePermissionErrorShown = true;
                    
                    // 약간의 지연을 두고 한 번만 표시 (여러 함수에서 동시 호출 방지)
                    setTimeout(() => {
                        // 다시 확인 (다른 함수에서 이미 표시했을 수 있음)
                        if (!window.firebasePermissionAlertShown) {
                            window.firebasePermissionAlertShown = true;
                            
                            const consoleUrl = 'https://console.firebase.google.com/project/price-match-1f952/firestore/rules';
                            
                            // 콘솔에 간단한 안내만 출력
                            console.error('⚠️ Firebase 권한 오류 발생!');
                            console.log('🔗 Firebase Console Firestore Rules:', consoleUrl);
                            console.log('💡 보안 규칙에서 "allow read: if true;" 설정 필요');
                            
                            // 사용자에게 한 번만 알림
                            setTimeout(() => {
                                if (window.firebasePermissionAlertShown) {
                                    if (confirm('Firebase 권한 오류가 발생했습니다.\n\nFirebase Console을 열어 보안 규칙을 수정하시겠습니까?')) {
                                        window.open(consoleUrl, '_blank');
                                    }
                                }
                            }, 500);
                        }
                    }, 200);
                }
                
                // 권한 오류는 재시도하지 않음 (로그 출력 최소화)
                return;
            }
            
            // 권한 오류가 아닌 경우에만 상세 로그 출력
            console.error('Firebase에서 제품 데이터 불러오기 실패:', error);
            console.error('에러 상세:', error.message, error.stack);
            
            // 권한 오류가 아닌 경우에만 재시도 (재시도 횟수 제한)
            const retryCount = (window.firebaseLoadRetryCount || 0) + 1;
            window.firebaseLoadRetryCount = retryCount;
            
            if (retryCount > 3) {
                console.error('재시도 횟수 초과 (3회). 재시도를 중단합니다.');
                window.firebaseLoadRetryCount = 0; // 리셋
                alert('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return;
            }
            
            // 권한 오류가 아닌 경우에만 재시도
            // 권한 오류 발생 시 재시도하지 않음
            if (window.firebasePermissionDenied) {
                return;
            }
            
            // 에러 발생 시 3초 후 재시도
            console.log(`3초 후 상품 로드 재시도합니다... (${retryCount}/3)`);
            setTimeout(async () => {
                // 권한 오류가 발생했으면 재시도하지 않음
                if (window.firebasePermissionDenied) {
                    window.firebaseLoadRetryCount = 0;
                    return;
                }
                
                try {
                    await this.loadProductsFromFirebase(false); // 캐시 없이 재시도
                    // 성공 시 리셋
                    window.firebaseLoadRetryCount = 0;
                } catch (retryError) {
                    // 권한 오류는 조용히 처리
                    const isPermissionError = retryError.code === 'permission-denied' || 
                                             retryError.code === 'PERMISSION_DENIED' ||
                                             retryError.message.includes('Missing or insufficient permissions');
                    
                    if (isPermissionError) {
                        window.firebasePermissionDenied = true;
                        window.firebaseLoadRetryCount = 0;
                        return;
                    }
                    
                    // 재시도 횟수가 초과되지 않았으면 한 번 더 시도
                    if (window.firebaseLoadRetryCount < 3) {
                        setTimeout(async () => {
                            // 권한 오류가 발생했으면 재시도하지 않음
                            if (window.firebasePermissionDenied) {
                                window.firebaseLoadRetryCount = 0;
                                return;
                            }
                            
                            try {
                                await this.loadProductsFromFirebase(false);
                                window.firebaseLoadRetryCount = 0;
                            } catch (secondRetryError) {
                                // 권한 오류는 조용히 처리
                                const isSecondPermissionError = secondRetryError.code === 'permission-denied' || 
                                                               secondRetryError.code === 'PERMISSION_DENIED' ||
                                                               secondRetryError.message.includes('Missing or insufficient permissions');
                                if (!isSecondPermissionError) {
                                    console.error('두 번째 재시도도 실패:', secondRetryError);
                                } else {
                                    window.firebasePermissionDenied = true;
                                    window.firebaseLoadRetryCount = 0;
                                }
                            }
                        }, 5000);
                    }
                }
            }, 3000);
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
            // 권한 오류는 조용히 처리 (팝업 없음)
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.message.includes('Missing or insufficient permissions');
            
            if (isPermissionError) {
                console.warn('가격 변경 신고 로드 권한 오류 (무시됨)');
                return;
            }
            
            console.error('Firebase에서 가격 변경 신고 불러오기 실패:', error);
        }
    }

    setupRealtimeListener() {
        try {
            // 제품 컬렉션 실시간 리스너
            if (window.firestoreDB && window.firebaseCollection && window.firebaseOnSnapshot) {
                const db = window.firestoreDB;
                const productsRef = window.firebaseCollection(db, 'products');
                
                // Firebase 실시간 리스너 비활성화 (F5 문제 해결을 위해)
                console.log('Firebase 실시간 리스너 비활성화됨 (F5 문제 해결)');
                
                // 가격 변경 신고 컬렉션 실시간 리스너
                const reportsRef = window.firebaseCollection(db, 'priceReports');
                window.firebaseOnSnapshot(reportsRef, (snapshot) => {
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
                            
                            // 신고 목록 새로고침 - 리스트가 펼쳐져 있을 때만
                            const reportsList = document.getElementById('priceReportsList');
                            if (reportsList && reportsList.innerHTML.trim() !== '') {
                                this.loadPriceReports();
                            }
                        }
                    });
                });
                
                // 필독 데이터 실시간 리스너
                const noticeDocRef = window.firebaseDoc(db, 'notices', 'main');
                window.firebaseOnSnapshot(noticeDocRef, (doc) => {
                    console.log('필독 데이터 변경 감지');
                    if (doc.exists()) {
                        const data = doc.data();
                        console.log('새 필독 데이터:', data);
                        // 필독 데이터 UI 업데이트
                        this.loadNotice();
                    }
                });
                
                // 숫자별 댓글 실시간 리스너
                const numberCommentsRef = window.firebaseCollection(db, 'numberComments');
                window.firebaseOnSnapshot(numberCommentsRef, (snapshot) => {
                    console.log('숫자별 댓글 변경 감지:', snapshot.docChanges().length, '개 변경');
                    const allComments = [];
                    snapshot.forEach((doc) => {
                        allComments.push({ id: doc.id, ...doc.data() });
                    });
                    
                    // localStorage 업데이트
                    localStorage.setItem('numberComments', JSON.stringify(allComments));
                    
                    // UI 업데이트
                    if (this.loadNumberComments) {
                        this.loadNumberComments();
                    }
                });
                
                // 공지사항별 댓글 실시간 리스너 (새 시스템: noticePosts)
                const noticePostsRef = window.firebaseCollection(db, 'noticePosts');
                window.firebaseOnSnapshot(noticePostsRef, (snapshot) => {
                    console.log('공지사항 댓글 변경 감지:', snapshot.docChanges().length, '개 변경');
                    
                    // 현재 열려있는 공지사항이면 UI 업데이트
                    if (this.currentNoticeNumber !== undefined && this.loadNoticeComments) {
                        this.loadNoticeComments();
                    }
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
            console.log('=== loadPendingProducts 시작 ===');
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

    // 썸네일 일괄 생성 함수
    async generateThumbnailsForAllProducts() {
        try {
            // 진행 상황 표시
            const thumbnailStatus = document.getElementById('thumbnailGenerationStatus');
            const pendingList = document.getElementById('pendingProductsList');
            const allList = document.getElementById('allProductsList');
            const reportsList = document.getElementById('priceReportsList');
            const settingsDiv = document.getElementById('outOfStockSettings');
            
            // 다른 리스트 숨기기
            if (pendingList) pendingList.innerHTML = '';
            if (allList) allList.innerHTML = '';
            if (reportsList) reportsList.innerHTML = '';
            if (settingsDiv) settingsDiv.style.display = 'none';
            if (thumbnailStatus) thumbnailStatus.style.display = 'block';
            
            this.thumbnailGenerationCancelled = false;
            this.updateThumbnailStatus('상품 조회 중...', 0, 0);
            
            // 모든 승인된 상품 조회
            const productsRef = window.firebaseCollection(window.firebaseDb, 'products');
            const approvedQuery = window.firebaseQuery(
                productsRef,
                window.firebaseWhere('status', '==', 'approved')
            );
            const querySnapshot = await window.firebaseGetDocs(approvedQuery);
            const products = [];
            
            querySnapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                // 썸네일이 없는 상품만 처리
                if (!product.thumbnailUrls || product.thumbnailUrls.length === 0) {
                    products.push(product);
                }
            });
            
            const total = products.length;
            if (total === 0) {
                this.updateThumbnailStatus('처리할 상품이 없습니다. (이미 썸네일이 있는 상품만 제외)', 0, 0);
                return;
            }
            
            this.updateThumbnailStatus(`총 ${total}개 상품 처리 시작...`, 0, total);
            
            let processed = 0;
            let skipped = 0;
            let failed = 0;
            
            // 각 상품 처리
            for (let i = 0; i < products.length; i++) {
                if (this.thumbnailGenerationCancelled) {
                    this.updateThumbnailStatus('취소되었습니다.', processed, total);
                    return;
                }
                
                const product = products[i];
                const imageUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
                
                if (imageUrls.length === 0) {
                    skipped++;
                    processed++;
                    this.updateThumbnailStatus(`${product.name}: 이미지 없음`, processed, total);
                    continue;
                }
                
                try {
                    const thumbnailUrls = [];
                    
                    // 각 이미지 처리
                    for (let j = 0; j < imageUrls.length; j++) {
                        const imageUrl = imageUrls[j];
                        
                        try {
                            // 이미지 크기 확인
                            const sizeInfo = await this.checkImageSize(imageUrl);
                            
                            // 이미 작은 이미지인지 확인 (120x120 이하)
                            if (sizeInfo.isSmall) {
                                // 이미지 다운로드하여 파일 크기 확인
                                const imageFile = await this.downloadImageAsFile(imageUrl);
                                if (imageFile.size <= 50 * 1024) {
                                    // 이미 작은 이미지: 원본 URL 사용
                                    thumbnailUrls.push(imageUrl);
                                    console.log(`${product.name} 이미지 ${j + 1}: 이미 작은 이미지 (${sizeInfo.width}x${sizeInfo.height}, ${(imageFile.size / 1024).toFixed(1)}KB)`);
                                } else {
                                    // 크기는 작지만 파일 크기가 큰 경우: 썸네일 생성
                                    const thumbnailFile = await this.createThumbnail(imageFile, 120, 120, 0.7);
                                    if (thumbnailFile) {
                                        const storageRef = window.firebaseStorage();
                                        const timestamp = Date.now();
                                        const fileName = imageUrl.split('/').pop().split('?')[0] || 'image.jpg';
                                        const thumbnailRef = window.firebaseStorageRef(storageRef, `products/thumbnails/${timestamp}_${j}_thumb_${fileName}`);
                                        const thumbnailSnapshot = await window.firebaseUploadBytes(thumbnailRef, thumbnailFile);
                                        const thumbnailUrl = await window.firebaseGetDownloadURL(thumbnailSnapshot.ref);
                                        thumbnailUrls.push(thumbnailUrl);
                                    } else {
                                        thumbnailUrls.push(imageUrl);
                                    }
                                }
                            } else {
                                // 큰 이미지: 썸네일 생성
                                const imageFile = await this.downloadImageAsFile(imageUrl);
                                const thumbnailFile = await this.createThumbnail(imageFile, 120, 120, 0.7);
                                
                                if (thumbnailFile === null) {
                                    // 이미 작은 이미지
                                    thumbnailUrls.push(imageUrl);
                                } else {
                                    const storageRef = window.firebaseStorage();
                                    const timestamp = Date.now();
                                    const fileName = imageUrl.split('/').pop().split('?')[0] || 'image.jpg';
                                    const thumbnailRef = window.firebaseStorageRef(storageRef, `products/thumbnails/${timestamp}_${j}_thumb_${fileName}`);
                                    const thumbnailSnapshot = await window.firebaseUploadBytes(thumbnailRef, thumbnailFile);
                                    const thumbnailUrl = await window.firebaseGetDownloadURL(thumbnailSnapshot.ref);
                                    thumbnailUrls.push(thumbnailUrl);
                                }
                            }
                        } catch (imageError) {
                            console.error(`${product.name} 이미지 ${j + 1} 처리 실패:`, imageError);
                            // 실패 시 원본 URL 사용
                            thumbnailUrls.push(imageUrl);
                        }
                    }
                    
                    // Firebase에 썸네일 URL 저장
                    if (thumbnailUrls.length > 0) {
                        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), product.id);
                        await window.firebaseUpdateDoc(productRef, {
                            thumbnailUrls: thumbnailUrls,
                            thumbnailUrl: thumbnailUrls[0]
                        });
                        processed++;
                        this.updateThumbnailStatus(`${product.name}: 썸네일 생성 완료 (${thumbnailUrls.length}개)`, processed, total);
                        console.log(`${product.name}: 썸네일 생성 완료`);
                    } else {
                        skipped++;
                        processed++;
                        this.updateThumbnailStatus(`${product.name}: 처리 불가`, processed, total);
                    }
                } catch (error) {
                    failed++;
                    processed++;
                    console.error(`${product.name} 처리 실패:`, error);
                    this.updateThumbnailStatus(`${product.name}: 오류 발생`, processed, total);
                }
                
                // 너무 빠르게 처리하지 않도록 약간의 지연
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 완료 메시지
            const summary = `완료! 처리: ${processed - skipped - failed}개, 건너뜀: ${skipped}개, 실패: ${failed}개`;
            this.updateThumbnailStatus(summary, processed, total);
            alert(`썸네일 생성 완료!\n\n${summary}`);
            
        } catch (error) {
            console.error('썸네일 일괄 생성 실패:', error);
            this.updateThumbnailStatus(`오류 발생: ${error.message}`, 0, 0);
            alert('썸네일 생성 중 오류가 발생했습니다.');
        }
    }
    
    // 썸네일 생성 진행 상황 업데이트
    updateThumbnailStatus(statusText, processed, total) {
        const progressText = document.getElementById('thumbnailProgressText');
        const progressBar = document.getElementById('thumbnailProgressBar');
        const statusTextEl = document.getElementById('thumbnailStatusText');
        
        if (progressText) {
            progressText.textContent = `${processed} / ${total}`;
        }
        
        if (progressBar && total > 0) {
            const percentage = Math.round((processed / total) * 100);
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
        }
        
        if (statusTextEl) {
            statusTextEl.textContent = statusText;
        }
    }

    async loadAllProducts() {
        try {
            console.log('=== loadAllProducts 시작 ===');
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
        console.log('=== displayPendingProducts 출력 대상:', adminContent);
        console.log('출력할 내용:', sortedProducts.length, '개 제품');
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
        // 숨김(soft delete) 처리된 상품은 제외
        const visibleProducts = (products || []).filter(p => p.status !== 'hidden' && !p.hidden);
        
        // 가격순으로 정렬 (낮은 가격이 위로)
        const sortedProducts = [...visibleProducts].sort((a, b) => {
            const priceA = this.calculateFinalPrice(a) || 0;
            const priceB = this.calculateFinalPrice(b) || 0;
            return priceA - priceB; // 낮은 가격이 위에
        });
        
        const adminContent = document.getElementById('allProductsList');
        console.log('=== displayAllProductsAdmin 출력 대상:', adminContent);
        console.log('출력할 내용:', sortedProducts.length, '개 제품 (hidden 제외)');
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

    // 숨김 상품 리스트 표시
    displayHiddenProducts(products) {
        const settingsDiv = document.getElementById('outOfStockSettings');
        const hiddenList = document.getElementById('hiddenProductsList');
        if (!settingsDiv || !hiddenList) {
            console.warn('숨김 상품 리스트 요소를 찾을 수 없습니다.');
            return;
        }

        // 이미 필터링된 제품들을 받았으므로 중복 필터링 제거
        const hiddenProducts = products || [];
        console.log('표시할 숨김 상품 개수:', hiddenProducts.length);

        if (hiddenProducts.length === 0) {
            hiddenList.innerHTML = `
                <div class="no-products">
                    현재 숨김 처리된 상품이 없습니다.
                </div>
            `;
            return;
        }

        hiddenList.innerHTML = `
            <h3>숨김 상품 (${hiddenProducts.length}개)</h3>
            <div class="all-products">
                ${hiddenProducts.map(product => `
                    <div class="admin-product-item hidden-product-item" data-product-id="${product.id}" draggable="true">
                        <div class="product-info">
                            <h4>${product.name}</h4>
                            <p><strong>쇼핑몰:</strong> ${this.getStoreDisplayName(product.store)}</p>
                            <p><strong>정가:</strong> ${product.originalPrice ? product.originalPrice.toLocaleString() + '원' : '미입력'}</p>
                            <p><strong>최종가:</strong> ${this.calculateFinalPrice(product).toLocaleString()}원</p>
                            <p><strong>카테고리:</strong> ${product.category || '기타'}</p>
                            <p><strong>상태:</strong> 숨김</p>
                        </div>
                        <div class="admin-controls">
                            <button class="edit-btn" onclick="editProduct('${product.id}')">수정</button>
                            <button class="approve-btn" onclick="restoreProduct('${product.id}')">복원</button>
                            <button class="reject-btn" onclick="hardDeleteProduct('${product.id}')">삭제</button>
                            <a href="${product.link || '#'}" target="_blank" class="link-btn">연결</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // 휠 네비게이션 & 드래그 스크롤 재사용
        this.setupWheelNavigation(hiddenProducts, 'hidden');
        this.setupDragScroll();
    }

    // 숨김 상품 로드
    async loadHiddenProducts() {
        try {
            console.log('숨김 상품 로드 시작');
            
            // Firebase에서 최신 제품 데이터 로드 (캐시 사용 안 함)
            await this.loadProductsFromFirebase(false);

            console.log('전체 제품 개수:', this.products.length);
            console.log('제품 상태 분류:', {
                approved: this.products.filter(p => p.status === 'approved').length,
                pending: this.products.filter(p => p.status === 'pending').length,
                rejected: this.products.filter(p => p.status === 'rejected').length,
                hidden: this.products.filter(p => p.status === 'hidden').length,
                hasHiddenFlag: this.products.filter(p => p.hidden === true).length,
                noStatus: this.products.filter(p => !p.status || (p.status !== 'approved' && p.status !== 'pending' && p.status !== 'rejected')).length
            });

            // 숨김 상품 필터링 (여러 조건 확인)
            let hiddenProducts = (this.products || []).filter(p => {
                const isHidden = p.status === 'hidden' || 
                                p.hidden === true || 
                                p.hidden === 'true' ||
                                (p.status && p.status !== 'approved' && p.status !== 'pending' && p.status !== 'rejected' && p.status.includes('hidden'));
                return isHidden;
            });
            
            // 최근 숨김 순으로 정렬 (lastUpdated 기준 내림차순)
            hiddenProducts.sort((a, b) => {
                const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                return timeB - timeA; // 최근 것이 먼저
            });
            
            console.log('필터링된 숨김 상품 개수:', hiddenProducts.length);
            console.log('숨김 상품 목록 (최근 순):', hiddenProducts.map(p => ({ 
                id: p.id, 
                name: p.name,
                status: p.status,
                hidden: p.hidden,
                lastUpdated: p.lastUpdated
            })));

            // 만약 필터링 결과가 없고 전체 제품이 있다면, 모든 제품의 상태를 확인
            if (hiddenProducts.length === 0 && this.products.length > 0) {
                console.warn('숨김 상품이 필터링되지 않았습니다. 전체 제품 상태 확인:');
                this.products.slice(0, 10).forEach(p => {
                    console.log(`제품: ${p.name}, status: ${p.status}, hidden: ${p.hidden}`);
                });
                
                // status가 없거나 'approved'가 아닌 모든 제품을 숨김으로 간주
                const allNonApproved = this.products.filter(p => !p.status || (p.status !== 'approved' && p.status !== 'pending' && p.status !== 'rejected'));
                if (allNonApproved.length > 0) {
                    // 최근 순으로 정렬
                    allNonApproved.sort((a, b) => {
                        const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                        const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                        return timeB - timeA;
                    });
                    console.log('승인되지 않은 제품을 숨김 상품으로 표시:', allNonApproved.length, '개');
                    this.displayHiddenProducts(allNonApproved);
                    return;
                }
            }

            this.displayHiddenProducts(hiddenProducts);

            // 현재 관리자 뷰 상태 저장
            sessionStorage.setItem('currentAdminView', 'hidden');
        } catch (error) {
            console.error('숨김 상품 로드 실패:', error);
            alert('숨김 상품 목록을 불러오는데 실패했습니다: ' + error.message);
        }
    }

    createPendingProductElement(product) {
        const finalPrice = this.calculateFinalPrice(product);
        
        return `
            <div class="pending-product-item" data-product-id="${product.id}" draggable="true">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p><strong>쇼핑몰:</strong> ${this.getStoreDisplayName(product.store)}</p>
                    <p><strong class="price-label">기존가격:</strong> <span class="price-value">${product.originalPrice.toLocaleString()}원</span></p>
                    <p><strong>신고가격:</strong> <span class="final-price-value">${finalPrice.toLocaleString()}원</span></p>
                    <p><strong>카테고리:</strong> ${product.category}</p>
                    <p><strong>신고자:</strong> ${product.submittedBy}</p>
                    <p><strong>링크:</strong> <a href="${product.link}" target="_blank">제품 보기</a></p>
                </div>
                <div class="admin-controls">
                    <button class="approve-btn" onclick="approveProduct('${product.id}')">승인</button>
                    <button class="edit-btn" onclick="editProduct('${product.id}')">수정</button>
                    <button class="reject-btn" onclick="showDeleteConfirmation('product', '${product.id}', '${product.name}')">숨김</button>
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
                    <p><strong>쇼핑몰:</strong> ${this.getStoreDisplayName(product.store)}</p>
                    <p><strong class="price-label">기존가격:</strong> <span class="price-value">${product.originalPrice.toLocaleString()}원</span></p>
                    <p><strong>신고가격:</strong> <span class="final-price-value">${finalPrice.toLocaleString()}원</span></p>
                    <p><strong>카테고리:</strong> ${product.category}</p>
                    <p><strong>상태:</strong> <span class="${statusClass}">${statusText}</span></p>
                    <p><strong>등록자:</strong> ${product.submittedBy}</p>
                    <p><strong>마지막 확인:</strong> <span id="lastUpdated-${product.id}" class="last-updated-time">${lastUpdated}</span></p>
                </div>
                <div class="admin-controls">
                    ${product.status !== 'approved' ? `<button class="approve-btn" onclick="approveProduct('${product.id}')">승인</button>` : ''}
                    <button class="edit-btn" onclick="editProduct('${product.id}')">수정</button>
                    <button class="refresh-btn" onclick="refreshProductTime('${product.id}')">🔄 갱신</button>
                    ${product.status !== 'rejected' ? `<button class="reject-btn" onclick="showDeleteConfirmation('product', '${product.id}', '${product.name}')">숨김</button>` : ''}
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
            const currentAdminView = sessionStorage.getItem('currentAdminView');
            console.log('현재 관리자 뷰:', currentAdminView);
            
            if (currentAdminView === 'pending') {
                console.log('승인 대기 뷰 감지 - 로드 중');
                this.loadPendingProducts();
            } else if (currentAdminView === 'all') {
                console.log('전체 제품 관리 뷰 감지 - 로드 중');
                this.loadAllProducts();
            } else if (currentAdminView === 'reports') {
                console.log('가격 변경 신고 뷰 감지 - 로드 중');
                this.loadPriceReports();
            } else if (currentAdminView === 'hidden') {
                console.log('숨김 상품 뷰 감지 - 로드 중');
                this.loadHiddenProducts();
            }
        }
        
        console.log('UI 강제 업데이트 완료');
    }

    // 메인 제품 목록 업데이트 함수
    async updateMainProductList() {
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

        // 할인율 높은 순, 같은 할인율이면 낮은 가격 순
        this.sortProductsByDiscountThenPrice(filteredProducts);

        // 제품 목록 렌더링
        if (filteredProducts.length === 0) {
            productList.innerHTML = '<div class="no-products">등록된 제품이 없습니다.</div>';
        } else {
            const productHtmlArray = await Promise.all(filteredProducts.map(product => this.createProductElement(product)));
            productList.innerHTML = productHtmlArray.join('');
        }

        // 카테고리 카운트 업데이트
        this.updateCategoryCounts();
        
        console.log(`메인 제품 목록 업데이트 완료: ${filteredProducts.length}개 제품 표시 (할인율 높은 순, 동률 시 낮은 가격 순)`);
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
                                <label for="editProductPrice">기존등록가격 <span style="color: #2563eb;">(파랑)</span></label>
                                <input type="number" id="editProductPrice" value="${product.originalPrice}" placeholder="기존 가격을 입력하세요">
                                <small style="display: block; margin-top: 5px; color: #2563eb;">
                                    파란색 가격에 직접 반영됩니다
                                </small>
                            </div>
                            <div class="form-group">
                                <label for="editProductFinalPrice">최종가격 <span style="color: #dc2626;">(빨강)</span></label>
                                <input type="number" id="editProductFinalPrice" value="${product.finalPrice || this.calculateFinalPrice(product)}" placeholder="최종 가격을 입력하세요">
                                <small style="display: block; margin-top: 5px; color: #dc2626;">
                                    빨간색 가격에 직접 반영됩니다
                                </small>
                            </div>
                            <div class="form-group">
                                <label for="editProductDeliveryFee">배송비 (참고용)</label>
                                <input type="number" id="editProductDeliveryFee" value="${product.deliveryFee || 0}" placeholder="배송비를 입력하세요">
                                <small style="display: block; margin-top: 5px; color: #6b7280;">
                                    참고용으로만 표시됩니다 (계산에 사용되지 않음)
                                </small>
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
                                    <option value="식품" ${product.category === '식품' ? 'selected' : ''}>식품</option>
                                    <option value="의류" ${product.category === '의류' ? 'selected' : ''}>의류</option>
                                    <option value="생활" ${product.category === '생활' ? 'selected' : ''}>생활</option>
                                    <option value="가전" ${product.category === '가전' ? 'selected' : ''}>가전</option>
                                    <option value="ETC" ${product.category === 'ETC' ? 'selected' : ''}>ETC</option>
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
                            <div class="form-group">
                                <label for="editProductImages">이미지 관리</label>
                                <input type="file" id="editProductImages" accept="image/*" multiple>
                                <div id="editImagePreviewContainer" style="margin-top: 12px;"></div>
                                ${this.renderEditImagePreview(product)}
                            </div>
                            <div class="form-group">
                                <label for="editProductDescription">게시글</label>
                                <textarea id="editProductDescription" rows="8" placeholder="게시글 내용을 입력하세요... (인터넷 주소를 입력하면 클릭 가능한 링크로 변환됩니다)">${product.description || ''}</textarea>
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

        // 이미지 업로드 이벤트 리스너
        const editImageInput = document.getElementById('editProductImages');
        if (editImageInput) {
            editImageInput.addEventListener('change', () => {
                this.handleEditImageSelection(product.id);
            });
        }

        // 기존 이미지 표시
        this.renderEditExistingImages(product);
    }

    // 수정 폼용 이미지 미리보기 렌더링
    renderEditImagePreview(product) {
        const existingImages = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
        if (existingImages.length === 0) {
            return '<div style="color: #6b7280; font-size: 0.9rem;">등록된 이미지가 없습니다.</div>';
        }
        return '<div id="editExistingImages" style="margin-top: 8px;"></div>';
    }

    // 기존 이미지 표시 및 삭제 기능
    renderEditExistingImages(product) {
        const container = document.getElementById('editExistingImages');
        if (!container) return;

        const existingImages = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
        if (existingImages.length === 0) {
            container.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">등록된 이미지가 없습니다.</div>';
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong>기존 이미지 (클릭하여 삭제):</strong>
            </div>
            <div id="editExistingImageList" style="display: flex; gap: 12px; flex-wrap: wrap;"></div>
        `;

        const imageList = document.getElementById('editExistingImageList');
        existingImages.forEach((imageUrl, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.style.cssText = `
                position: relative;
                width: 100px;
                height: 100px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
            `;

            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

            const deleteOverlay = document.createElement('div');
            deleteOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(220, 38, 38, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.2rem;
            `;
            deleteOverlay.textContent = '삭제';

            imageDiv.appendChild(img);
            imageDiv.appendChild(deleteOverlay);

            imageDiv.onmouseenter = () => {
                deleteOverlay.style.display = 'flex';
            };
            imageDiv.onmouseleave = () => {
                deleteOverlay.style.display = 'none';
            };

            imageDiv.onclick = () => {
                if (confirm('이 이미지를 삭제하시겠습니까?')) {
                    // 이미지 삭제
                    imageDiv.setAttribute('data-deleted', 'true');
                    imageDiv.style.opacity = '0.5';
                    imageDiv.style.borderColor = '#dc2626';
                    deleteOverlay.style.display = 'flex';
                    deleteOverlay.textContent = '삭제됨';
                }
            };

            imageList.appendChild(imageDiv);
        });
    }

    // 수정 폼에서 새 이미지 선택 처리
    handleEditImageSelection(productId) {
        const input = document.getElementById('editProductImages');
        const files = input.files;
        const container = document.getElementById('editImagePreviewContainer');

        if (!files || files.length === 0) {
            return;
        }

        if (!this.editProductImageOrder) {
            this.editProductImageOrder = [];
        }

        // 새로 선택한 파일 추가
        Array.from(files).forEach(newFile => {
            const isDuplicate = this.editProductImageOrder.some(existingFile =>
                existingFile.name === newFile.name && existingFile.size === newFile.size
            );
            if (!isDuplicate) {
                this.editProductImageOrder.push(newFile);
            }
        });

        // 미리보기 표시
        container.innerHTML = '<div style="margin-bottom: 8px;"><strong>새로 추가할 이미지:</strong></div>';
        const previewDiv = document.createElement('div');
        previewDiv.style.cssText = 'display: flex; gap: 12px; flex-wrap: wrap;';

        this.editProductImageOrder.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDiv = document.createElement('div');
                imageDiv.style.cssText = `
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border: 2px solid #3b82f6;
                    border-radius: 8px;
                    overflow: hidden;
                `;

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '×';
                deleteBtn.style.cssText = `
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(220, 38, 38, 0.9);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 18px;
                    cursor: pointer;
                `;
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.editProductImageOrder.splice(index, 1);
                    this.handleEditImageSelection(productId);
                };

                imageDiv.appendChild(img);
                imageDiv.appendChild(deleteBtn);
                previewDiv.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        });

        container.appendChild(previewDiv);
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
            const originalPrice = parseInt(document.getElementById('editProductPrice').value) || 0;
            const finalPrice = parseInt(document.getElementById('editProductFinalPrice').value) || 0;
            const deliveryFee = parseInt(document.getElementById('editProductDeliveryFee').value) || 0;
            
            // 사용자의 요구사항:
            // 1. 기존가(originalPrice)를 수정하면 파란색 가격에 반영 - 그대로 저장
            // 2. 최종가(finalPrice)를 수정하면 빨간색 가격에 반영 - 그대로 저장
            // 3. 배송비는 참고용으로만 저장 (계산에 사용하지 않음)
            
            // 이미지 처리
            const product = this.products.find(p => p.id === productId);
            let imageUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
            
            // 삭제된 이미지 제거
            const existingImageList = document.getElementById('editExistingImageList');
            if (existingImageList) {
                // 현재 화면에 남아있는 이미지 URL 수집
                const remainingImageUrls = [];
                existingImageList.querySelectorAll('img').forEach(img => {
                    if (img.src && !img.closest('[data-deleted="true"]')) {
                        remainingImageUrls.push(img.src);
                    }
                });
                // 남아있는 이미지만 유지
                imageUrls = imageUrls.filter(url => remainingImageUrls.includes(url));
            }
            
            // 새 이미지 업로드
            if (this.editProductImageOrder && this.editProductImageOrder.length > 0) {
                try {
                    const storageRef = window.firebaseStorage();
                    if (!storageRef) {
                        throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                    }
                    
                    for (let i = 0; i < this.editProductImageOrder.length; i++) {
                        const imageFile = this.editProductImageOrder[i];
                        if (imageFile.size > 5 * 1024 * 1024) {
                            alert(`이미지 ${i + 1}번의 크기가 5MB를 초과합니다.`);
                            continue;
                        }
                        
                        try {
                            const imageRef = window.firebaseStorageRef(storageRef, `products/${Date.now()}_${i}_${imageFile.name}`);
                            console.log(`이미지 ${i + 1}/${this.editProductImageOrder.length} 업로드 시도:`, imageFile.name, `(${(imageFile.size / 1024).toFixed(1)}KB)`);
                            
                            const snapshot = await window.firebaseUploadBytes(imageRef, imageFile);
                            const imageUrl = await window.firebaseGetDownloadURL(snapshot.ref);
                            imageUrls.push(imageUrl);
                            console.log(`이미지 ${i + 1}/${this.editProductImageOrder.length} 업로드 완료:`, imageUrl);
                        } catch (uploadError) {
                            console.error(`이미지 ${i + 1} 업로드 실패:`, uploadError);
                            throw new Error(`이미지 ${i + 1} 업로드 실패: ${uploadError.message || uploadError.code || '알 수 없는 오류'}`);
                        }
                    }
                } catch (error) {
                    console.error('이미지 업로드 실패:', error);
                    console.error('에러 상세 정보:', {
                        message: error.message,
                        code: error.code,
                        stack: error.stack,
                        name: error.name
                    });
                    
                    // Firebase Storage 권한 오류인지 확인
                    if (error.code === 'storage/unauthorized' || error.code === 'permission-denied') {
                        alert('⚠️ Firebase Storage 접근 권한 오류\n\nFirebase Console에서 Storage 보안 규칙을 확인하세요.\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.');
                    } else if (error.code === 'storage/quota-exceeded') {
                        alert('⚠️ Firebase Storage 용량 초과\n\n저장 공간이 부족합니다. Firebase Console에서 확인하세요.');
                    } else {
                        alert(`이미지 업로드에 실패했습니다.\n\n오류: ${error.message || error.code || '알 수 없는 오류'}\n\n다른 정보는 저장됩니다.\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`);
                    }
                }
            }
            
            // 게시글 처리
            const description = document.getElementById('editProductDescription')?.value.trim() || '';
            
            const formData = {
                name: document.getElementById('editProductName').value.trim() || '제품명 미입력',
                originalPrice: originalPrice,
                finalPrice: finalPrice,
                deliveryFee: deliveryFee,
                link: document.getElementById('editProductLink').value.trim() || '링크 미입력',
                store: document.getElementById('editProductStore').value.trim() || '미선택',
                category: document.getElementById('editProductCategory').value || '기타',
                status: document.getElementById('editProductStatus').value,
                lastUpdated: new Date().toISOString(),
                imageUrls: imageUrls,
                imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
                description: description
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
                // originalPrice, finalPrice, deliveryFee 모두 업데이트
                this.products[localProductIndex].name = formData.name;
                this.products[localProductIndex].originalPrice = formData.originalPrice;
                this.products[localProductIndex].finalPrice = formData.finalPrice;
                this.products[localProductIndex].deliveryFee = formData.deliveryFee;
                this.products[localProductIndex].link = formData.link;
                this.products[localProductIndex].store = formData.store;
                this.products[localProductIndex].category = formData.category;
                this.products[localProductIndex].status = formData.status;
                this.products[localProductIndex].lastUpdated = formData.lastUpdated;
                this.products[localProductIndex].imageUrls = formData.imageUrls;
                this.products[localProductIndex].imageUrl = formData.imageUrl;
                this.products[localProductIndex].description = formData.description;
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

            // 제품 캐시 무효화 (다른 기기에서도 최신 카테고리를 보이게 하기 위함)
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('제품 수정 후 캐시 무효화 완료');
            } catch (e) {
                console.warn('제품 수정 캐시 무효화 중 오류 (무시 가능):', e);
            }

            // 게시글이 있으면 productPosts에도 저장
            if (description) {
                try {
                    const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
                    // 기존 게시글 확인
                    const existingPostsQuery = window.firebaseQuery(
                        postsRef,
                        window.firebaseWhere('productId', '==', productId),
                        window.firebaseWhere('userId', '==', product.submittedBy || 'admin')
                    );
                    const existingPostsSnapshot = await window.firebaseGetDocs(existingPostsQuery);
                    
                    if (!existingPostsSnapshot.empty) {
                        // 기존 게시글 업데이트
                        const postDoc = existingPostsSnapshot.docs[0];
                        await window.firebaseUpdateDoc(postDoc.ref, {
                            content: description,
                            imageUrls: imageUrls,
                            updatedAt: new Date().toISOString()
                        });
                    } else {
                        // 새 게시글 생성
                        await window.firebaseAddDoc(postsRef, {
                            productId: productId,
                            userId: product.submittedBy || 'admin',
                            content: description,
                            imageUrls: imageUrls,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error('게시글 저장 실패:', error);
                }
            }

            // 이미지 순서 초기화
            this.editProductImageOrder = [];

            // UI 강제 업데이트
            this.forceUIUpdate();

            alert('제품이 수정되었습니다.');

            // 팝업 닫기
            closeEditPopup();

        } catch (error) {
            console.error('제품 수정 실패:', error);
            console.error('에러 상세:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
                name: error.name
            });
            
            // 권한 오류 확인 (더 정확한 체크)
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.code === 'permissions/denied' ||
                                     error.message?.includes('Missing or insufficient permissions') ||
                                     error.message?.includes('permission-denied') ||
                                     error.message?.includes('PERMISSION_DENIED');
            
            if (isPermissionError) {
                const consoleUrl = 'https://console.firebase.google.com/project/price-match-1f952/firestore/rules';
                const errorMessage = `⚠️ Firebase 권한 오류\n\n제품 수정에 필요한 권한이 없습니다.\n\n오류 코드: ${error.code || '알 수 없음'}\n오류 메시지: ${error.message || '알 수 없음'}\n\nFirebase Console에서 Firestore 보안 규칙을 수정하시겠습니까?\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)`;
                
                if (confirm(errorMessage)) {
                    window.open(consoleUrl, '_blank');
                }
            } else {
                alert(`제품 수정에 실패했습니다.\n\n오류 코드: ${error.code || '알 수 없음'}\n오류 메시지: ${error.message || '알 수 없음'}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`);
            }
        }
    }

    // 숨김 상품 복원 (상품 리스트에 재노출)
    async restoreProduct(productId) {
        try {
            console.log('숨김 상품 복원 시작:', productId);

            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, {
                status: 'approved',
                hidden: false,
                lastUpdated: new Date().toISOString()
            });

            // 로컬 데이터 갱신
            const idx = this.products.findIndex(p => p.id === productId);
            if (idx !== -1) {
                this.products[idx].status = 'approved';
                this.products[idx].hidden = false;
                this.products[idx].lastUpdated = new Date().toISOString();
                console.log('로컬 데이터에서 숨김 복원 반영 완료:', this.products[idx]);
            }

            // 제품 캐시 무효화
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('숨김 복원 후 캐시 무효화 완료');
            } catch (e) {
                console.warn('숨김 복원 캐시 무효화 중 오류 (무시 가능):', e);
            }

            // Firebase에서 최신 데이터 재로드
            await this.loadProductsFromFirebase(false);

            // UI 갱신
            this.forceUIUpdate();
            this.loadHiddenProducts();

            alert('상품이 복원되어 리스트에 다시 노출됩니다.');
        } catch (error) {
            console.error('숨김 상품 복원 실패:', error);
            alert('숨김 상품 복원에 실패했습니다.');
        }
    }

    // 모든 숨김 상품 일괄 복원
    async restoreAllHiddenProducts() {
        if (!adminAuth.isAuthenticated()) {
            alert('관리자 권한이 필요합니다.');
            return;
        }

        // Firebase에서 최신 데이터 로드
        await this.loadProductsFromFirebase(false);

        // 숨김 상품 필터링 (여러 조건 확인)
        const hiddenProducts = (this.products || []).filter(p => {
            const isHidden = p.status === 'hidden' || 
                            p.hidden === true || 
                            p.hidden === 'true' ||
                            (p.status && p.status !== 'approved' && p.status !== 'pending' && p.status !== 'rejected' && p.status.includes('hidden'));
            return isHidden;
        });

        console.log('복원 대상 숨김 상품:', hiddenProducts.length, '개');
        console.log('숨김 상품 상세:', hiddenProducts.map(p => ({ id: p.id, name: p.name, status: p.status, hidden: p.hidden })));

        if (hiddenProducts.length === 0) {
            // status가 없는 제품도 확인
            const noStatusProducts = this.products.filter(p => !p.status || (p.status !== 'approved' && p.status !== 'pending' && p.status !== 'rejected'));
            if (noStatusProducts.length > 0) {
                console.log('상태가 없는 제품을 복원 대상으로 추가:', noStatusProducts.length, '개');
                const confirmMsg = `상태가 불명확한 제품 ${noStatusProducts.length}개를 모두 승인 상태로 복원하시겠습니까?`;
                if (confirm(confirmMsg)) {
                    await this.restoreProductsInBatches(noStatusProducts);
                    return;
                }
            }
            alert('복원할 숨김 상품이 없습니다.');
            return;
        }

        const confirmMessage = `모든 숨김 상품 ${hiddenProducts.length}개를 복원하시겠습니까?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            console.log(`일괄 복원 시작: ${hiddenProducts.length}개 상품`);
            
            const restoreButton = document.getElementById('restoreAllHiddenProducts');
            if (restoreButton) {
                restoreButton.disabled = true;
                restoreButton.textContent = `복원 중... (0/${hiddenProducts.length})`;
            }

            let successCount = 0;
            let failCount = 0;

            // 배치 처리 (한 번에 너무 많이 처리하지 않도록)
            const batchSize = 10;
            for (let i = 0; i < hiddenProducts.length; i += batchSize) {
                const batch = hiddenProducts.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (product) => {
                    try {
                        const productRef = window.firebaseDoc(window.firebaseDb, 'products', product.id);
                        await window.firebaseUpdateDoc(productRef, {
                            status: 'approved',
                            hidden: false,
                            lastUpdated: new Date().toISOString()
                        });
                        
                        // 로컬 데이터 갱신
                        const idx = this.products.findIndex(p => p.id === product.id);
                        if (idx !== -1) {
                            this.products[idx].status = 'approved';
                            this.products[idx].hidden = false;
                            this.products[idx].lastUpdated = new Date().toISOString();
                        }
                        
                        successCount++;
                        if (restoreButton) {
                            restoreButton.textContent = `복원 중... (${successCount}/${hiddenProducts.length})`;
                        }
                        return true;
                    } catch (error) {
                        console.error(`상품 ${product.id} 복원 실패:`, error);
                        failCount++;
                        return false;
                    }
                });

                await Promise.all(batchPromises);
                
                // 배치 간 짧은 지연 (Firebase 부하 방지)
                if (i + batchSize < hiddenProducts.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // 제품 캐시 무효화
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('일괄 복원 후 캐시 무효화 완료');
            } catch (e) {
                console.warn('캐시 무효화 중 오류 (무시 가능):', e);
            }

            // Firebase에서 최신 데이터 재로드
            await this.loadProductsFromFirebase(false);

            // UI 갱신
            this.forceUIUpdate();
            this.loadHiddenProducts();
            this.updateCategoryCounts();
            await this.displayAllProducts();

            if (restoreButton) {
                restoreButton.disabled = false;
                restoreButton.textContent = '🔄 모든 숨김 상품 일괄 복원';
            }

            alert(`복원 완료!\n성공: ${successCount}개\n실패: ${failCount}개`);
            console.log(`일괄 복원 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
        } catch (error) {
            console.error('일괄 복원 실패:', error);
            alert('일괄 복원 중 오류가 발생했습니다: ' + error.message);
            
            const restoreButton = document.getElementById('restoreAllHiddenProducts');
            if (restoreButton) {
                restoreButton.disabled = false;
                restoreButton.textContent = '🔄 모든 숨김 상품 일괄 복원';
            }
        }
    }

    // 제품 배치 복원 (내부 함수)
    async restoreProductsInBatches(products) {
        const confirmMessage = `모든 제품 ${products.length}개를 복원하시겠습니까?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            console.log(`배치 복원 시작: ${products.length}개 상품`);
            
            const restoreButton = document.getElementById('restoreAllHiddenProducts');
            if (restoreButton) {
                restoreButton.disabled = true;
                restoreButton.textContent = `복원 중... (0/${products.length})`;
            }

            let successCount = 0;
            let failCount = 0;

            // 배치 처리 (한 번에 너무 많이 처리하지 않도록)
            const batchSize = 10;
            for (let i = 0; i < products.length; i += batchSize) {
                const batch = products.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (product) => {
                    try {
                        const productRef = window.firebaseDoc(window.firebaseDb, 'products', product.id);
                        await window.firebaseUpdateDoc(productRef, {
                            status: 'approved',
                            hidden: false,
                            lastUpdated: new Date().toISOString()
                        });
                        
                        // 로컬 데이터 갱신
                        const idx = this.products.findIndex(p => p.id === product.id);
                        if (idx !== -1) {
                            this.products[idx].status = 'approved';
                            this.products[idx].hidden = false;
                            this.products[idx].lastUpdated = new Date().toISOString();
                        }
                        
                        successCount++;
                        if (restoreButton) {
                            restoreButton.textContent = `복원 중... (${successCount}/${products.length})`;
                        }
                        return true;
                    } catch (error) {
                        console.error(`상품 ${product.id} 복원 실패:`, error);
                        failCount++;
                        return false;
                    }
                });

                await Promise.all(batchPromises);
                
                // 배치 간 짧은 지연 (Firebase 부하 방지)
                if (i + batchSize < products.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // 제품 캐시 무효화
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('배치 복원 후 캐시 무효화 완료');
            } catch (e) {
                console.warn('캐시 무효화 중 오류 (무시 가능):', e);
            }

            // Firebase에서 최신 데이터 재로드
            await this.loadProductsFromFirebase(false);

            // UI 갱신
            this.forceUIUpdate();
            this.loadHiddenProducts();
            this.updateCategoryCounts();
            await this.displayAllProducts();

            if (restoreButton) {
                restoreButton.disabled = false;
                restoreButton.textContent = '🔄 모든 숨김 상품 일괄 복원';
            }

            alert(`복원 완료!\n성공: ${successCount}개\n실패: ${failCount}개`);
            console.log(`배치 복원 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
        } catch (error) {
            console.error('배치 복원 실패:', error);
            alert('배치 복원 중 오류가 발생했습니다: ' + error.message);
            
            const restoreButton = document.getElementById('restoreAllHiddenProducts');
            if (restoreButton) {
                restoreButton.disabled = false;
                restoreButton.textContent = '🔄 모든 숨김 상품 일괄 복원';
            }
        }
    }

    // 완전 삭제 (Firebase에서 실제 삭제)
    async hardDeleteProduct(productId) {
        try {
            console.log('상품 완전 삭제 시작:', productId);

            let firebaseDeleteSuccess = false;

            // 방법 1: 전역 Firebase 함수 사용
            if (window.firebaseDeleteDoc && window.firebaseDoc && window.firebaseDb) {
                try {
                    const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
                    await window.firebaseDeleteDoc(productRef);
                    console.log('Firebase에서 제품 삭제 완료 (방법 1):', productId);
                    firebaseDeleteSuccess = true;
                } catch (firebaseError) {
                    console.error('Firebase 삭제 방법 1 실패:', firebaseError);
                }
            }

            // 방법 2: REST API 사용
            if (!firebaseDeleteSuccess) {
                try {
                    const response = await fetch(`https://firestore.googleapis.com/v1/projects/price-match-1f952/databases/(default)/documents/products/${productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (response.ok) {
                        console.log('Firebase에서 제품 삭제 완료 (방법 2):', productId);
                        firebaseDeleteSuccess = true;
                    } else {
                        console.error('Firebase 삭제 방법 2 실패:', response.status, response.statusText);
                    }
                } catch (fetchError) {
                    console.error('Firebase 삭제 방법 2 실패:', fetchError);
                }
            }

            // 방법 3: 존재 확인 후 삭제
            if (!firebaseDeleteSuccess && window.firebaseGetDoc && window.firebaseDoc && window.firebaseDb && window.firebaseDeleteDoc) {
                try {
                    console.log('방법 3: 문서 존재 확인 후 삭제 시도');
                    const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
                    const docSnapshot = await window.firebaseGetDoc(productRef);
                    if (docSnapshot.exists()) {
                        await window.firebaseDeleteDoc(productRef);
                        console.log('Firebase에서 제품 삭제 완료 (방법 3):', productId);
                        firebaseDeleteSuccess = true;
                    } else {
                        console.log('문서가 이미 존재하지 않음:', productId);
                        firebaseDeleteSuccess = true;
                    }
                } catch (error) {
                    console.error('Firebase 삭제 방법 3 실패:', error);
                }
            }

            if (!firebaseDeleteSuccess) {
                console.error('모든 Firebase 삭제 방법이 실패했습니다!');
                alert('Firebase에서 제품 삭제에 실패했습니다. 관리자에게 문의하세요.');
                return;
            }

            // 로컬 데이터에서 제거
            const originalLength = this.products.length;
            this.products = this.products.filter(p => p.id !== productId);
            console.log(`로컬 데이터에서 제품 제거 완료 (완전 삭제): ${originalLength} → ${this.products.length}`);

            // DOM에서도 제거
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (productElement) {
                productElement.remove();
            }

            // 제품 캐시 무효화
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('상품 완전 삭제 후 캐시 무효화 완료');
            } catch (e) {
                console.warn('완전 삭제 캐시 무효화 중 오류 (무시 가능):', e);
            }

            // Firebase에서 최신 데이터 재로드 및 UI 갱신
            await this.loadProductsFromFirebase(false);
            this.forceUIUpdate();
            this.loadHiddenProducts();

            alert('상품이 Firebase에서 완전히 삭제되었습니다.');
        } catch (error) {
            console.error('상품 완전 삭제 실패:', error);
            alert('상품 완전 삭제에 실패했습니다.');
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

        const productId = report.productId;
        const product = this.products.find(p => p.id === productId);
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
                                <label for="editProductName">제품명</label>
                                <input type="text" id="editProductName" value="${product ? (product.name || '') : productName}" placeholder="제품명을 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editOriginalPrice" style="color: #60a5fa;">정가(시작가)</label>
                                <input type="number" id="editOriginalPrice" value="${report.oldPrice || (product ? (product.originalPrice || 0) : 0)}" placeholder="정가(시작가)를 입력하세요 (원)">
                            </div>
                            <div class="form-group">
                                <label for="editNewPrice" style="color: #dc2626;">최종가</label>
                                <input type="number" id="editNewPrice" value="${report.newPrice}" placeholder="최종가를 입력하세요 (원)">
                            </div>
                            <div class="form-group">
                                <label for="editNewLink">링크</label>
                                <input type="url" id="editNewLink" value="${report.newLink || (product ? (product.link || '') : '')}" placeholder="상품 링크를 입력하세요">
                            </div>
                            <div class="form-group">
                                <label for="editStore">쇼핑몰</label>
                                <select id="editStore">
                                    <option value="쿠팡" ${product && product.store === '쿠팡' ? 'selected' : ''}>쿠팡</option>
                                    <option value="네이버쇼핑" ${product && product.store === '네이버쇼핑' ? 'selected' : ''}>네이버쇼핑</option>
                                    <option value="11번가" ${product && product.store === '11번가' ? 'selected' : ''}>11번가</option>
                                    <option value="G마켓" ${product && product.store === 'G마켓' ? 'selected' : ''}>G마켓</option>
                                    <option value="옥션" ${product && product.store === '옥션' ? 'selected' : ''}>옥션</option>
                                    <option value="기타" ${product && product.store === '기타' ? 'selected' : (!product ? 'selected' : '')}>기타</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editCategory">카테고리</label>
                                <select id="editCategory">
                                    <option value="식품" ${product && product.category === '식품' ? 'selected' : ''}>식품</option>
                                    <option value="의류" ${product && product.category === '의류' ? 'selected' : ''}>의류</option>
                                    <option value="생활" ${product && product.category === '생활' ? 'selected' : ''}>생활</option>
                                    <option value="가전" ${product && product.category === '가전' ? 'selected' : ''}>가전</option>
                                    <option value="ETC" ${product && product.category === 'ETC' ? 'selected' : (!product ? 'selected' : '')}>ETC</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editPriceReportImages">이미지 관리</label>
                                <input type="file" id="editPriceReportImages" accept="image/*" multiple>
                                <div id="editPriceReportImagePreviewContainer" style="margin-top: 12px;"></div>
                                ${this.renderPriceReportEditImagePreview(product)}
                            </div>
                            <div class="form-group">
                                <label for="editPriceReportDescription">게시글</label>
                                <textarea id="editPriceReportDescription" rows="8" placeholder="게시글 내용을 입력하세요... (인터넷 주소를 입력하면 클릭 가능한 링크로 변환됩니다)">${product && product.description ? product.description : ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="editImageUrl">이미지 URL (대체 입력)</label>
                                <input type="url" id="editImageUrl" value="${product && product.imageUrl ? product.imageUrl : ''}" placeholder="이미지 URL을 직접 입력하세요">
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
                            <div class="form-group">
                                <label for="editProductHidden" style="font-weight:600;">숨김</label>
                                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                                    <input type="checkbox" id="editProductHidden" ${product && (product.status === 'hidden' || product.hidden) ? 'checked' : ''}>
                                    <span style="font-size:0.85rem; color:#4b5563;">
                                        체크하면 이 상품이 <strong>숨김 처리</strong>되어 메인/전체 리스트에서 사라지고, 관리 ➜ 숨김 탭에서만 보입니다.
                                    </span>
                                </div>
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

        // 이미지 업로드 이벤트 리스너
        const editPriceReportImageInput = document.getElementById('editPriceReportImages');
        if (editPriceReportImageInput) {
            editPriceReportImageInput.addEventListener('change', () => {
                this.handlePriceReportEditImageSelection(productId);
            });
        }

        // 기존 이미지 표시
        if (product) {
            this.renderPriceReportEditExistingImages(product);
        }

        // 이미지 순서 초기화
        this.editPriceReportImageOrder = [];
    }

    // 가격 변경 신고 수정 폼용 이미지 미리보기 렌더링
    renderPriceReportEditImagePreview(product) {
        if (!product) {
            return '<div style="color: #6b7280; font-size: 0.9rem;">제품 정보가 없습니다.</div>';
        }
        const existingImages = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
        if (existingImages.length === 0) {
            return '<div style="color: #6b7280; font-size: 0.9rem;">등록된 이미지가 없습니다.</div>';
        }
        return '<div id="editPriceReportExistingImages" style="margin-top: 8px;"></div>';
    }

    // 가격 변경 신고 수정 폼용 기존 이미지 표시 및 삭제 기능
    renderPriceReportEditExistingImages(product) {
        const container = document.getElementById('editPriceReportExistingImages');
        if (!container) return;

        const existingImages = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
        if (existingImages.length === 0) {
            container.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">등록된 이미지가 없습니다.</div>';
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong>기존 이미지 (클릭하여 삭제):</strong>
            </div>
            <div id="editPriceReportExistingImageList" style="display: flex; gap: 12px; flex-wrap: wrap;"></div>
        `;

        const imageList = document.getElementById('editPriceReportExistingImageList');
        existingImages.forEach((imageUrl, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.style.cssText = `
                position: relative;
                width: 100px;
                height: 100px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
            `;

            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

            const deleteOverlay = document.createElement('div');
            deleteOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(220, 38, 38, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.2rem;
            `;
            deleteOverlay.textContent = '삭제';

            imageDiv.appendChild(img);
            imageDiv.appendChild(deleteOverlay);

            imageDiv.onmouseenter = () => {
                deleteOverlay.style.display = 'flex';
            };
            imageDiv.onmouseleave = () => {
                deleteOverlay.style.display = 'none';
            };

            imageDiv.onclick = () => {
                if (confirm('이 이미지를 삭제하시겠습니까?')) {
                    imageDiv.setAttribute('data-deleted', 'true');
                    imageDiv.style.opacity = '0.5';
                    imageDiv.style.borderColor = '#dc2626';
                }
            };

            imageList.appendChild(imageDiv);
        });
    }

    // 가격 변경 신고 수정 폼에서 새 이미지 선택 처리
    handlePriceReportEditImageSelection(productId) {
        const input = document.getElementById('editPriceReportImages');
        const files = input.files;
        const container = document.getElementById('editPriceReportImagePreviewContainer');

        if (!files || files.length === 0) {
            return;
        }

        if (!this.editPriceReportImageOrder) {
            this.editPriceReportImageOrder = [];
        }

        // 새로 선택한 파일 추가
        Array.from(files).forEach(newFile => {
            const isDuplicate = this.editPriceReportImageOrder.some(existingFile =>
                existingFile.name === newFile.name && existingFile.size === newFile.size
            );
            if (!isDuplicate) {
                this.editPriceReportImageOrder.push(newFile);
            }
        });

        // 미리보기 표시
        container.innerHTML = '<div style="margin-bottom: 8px;"><strong>새로 추가할 이미지:</strong></div>';
        const previewDiv = document.createElement('div');
        previewDiv.style.cssText = 'display: flex; gap: 12px; flex-wrap: wrap;';

        this.editPriceReportImageOrder.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDiv = document.createElement('div');
                imageDiv.style.cssText = `
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border: 2px solid #3b82f6;
                    border-radius: 8px;
                    overflow: hidden;
                `;

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '×';
                deleteBtn.style.cssText = `
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(220, 38, 38, 0.9);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 18px;
                    cursor: pointer;
                `;
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.editPriceReportImageOrder.splice(index, 1);
                    this.handlePriceReportEditImageSelection(productId);
                };

                imageDiv.appendChild(img);
                imageDiv.appendChild(deleteBtn);
                previewDiv.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        });

        container.appendChild(previewDiv);
    }

    // 가격 변경 신고 업데이트
    async updatePriceReport(reportId) {
        try {
            const report = this.priceReports.find(r => r.id === reportId);
            if (!report) {
                alert('신고를 찾을 수 없습니다.');
                return;
            }

            const productId = report.productId;
            const product = this.products.find(p => p.id === productId);

            // 신고 데이터 업데이트
            const reportFormData = {
                oldPrice: parseInt(document.getElementById('editOriginalPrice').value) || 0,
                newPrice: parseInt(document.getElementById('editNewPrice').value) || 0,
                newLink: document.getElementById('editNewLink').value.trim() || '',
                reporter: document.getElementById('editReporter').value.trim() || '신고자 미입력',
                status: document.getElementById('editReportStatus').value
            };
            const hiddenChecked = document.getElementById('editProductHidden')?.checked || false;

            // 이미지 처리
            let imageUrls = product ? (product.imageUrls || (product.imageUrl ? [product.imageUrl] : [])) : [];
            
            // 삭제된 이미지 제거
            const existingImageList = document.getElementById('editPriceReportExistingImageList');
            if (existingImageList && imageUrls.length > 0) {
                const remainingImageUrls = [];
                existingImageList.querySelectorAll('img').forEach(img => {
                    if (img.src && !img.closest('[data-deleted="true"]')) {
                        remainingImageUrls.push(img.src);
                    }
                });
                imageUrls = imageUrls.filter(url => remainingImageUrls.includes(url));
            }
            
            // 새 이미지 업로드
            if (this.editPriceReportImageOrder && this.editPriceReportImageOrder.length > 0) {
                try {
                    const storageRef = window.firebaseStorage();
                    if (!storageRef) {
                        throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                    }
                    
                    for (let i = 0; i < this.editPriceReportImageOrder.length; i++) {
                        const imageFile = this.editPriceReportImageOrder[i];
                        if (imageFile.size > 5 * 1024 * 1024) {
                            alert(`이미지 ${i + 1}번의 크기가 5MB를 초과합니다.`);
                            continue;
                        }
                        
                        try {
                            const imageRef = window.firebaseStorageRef(storageRef, `products/${Date.now()}_${i}_${imageFile.name}`);
                            console.log(`이미지 ${i + 1}/${this.editPriceReportImageOrder.length} 업로드 시도:`, imageFile.name, `(${(imageFile.size / 1024).toFixed(1)}KB)`);
                            
                            const snapshot = await window.firebaseUploadBytes(imageRef, imageFile);
                            const imageUrl = await window.firebaseGetDownloadURL(snapshot.ref);
                            imageUrls.push(imageUrl);
                            console.log(`이미지 ${i + 1}/${this.editPriceReportImageOrder.length} 업로드 완료:`, imageUrl);
                        } catch (uploadError) {
                            console.error(`이미지 ${i + 1} 업로드 실패:`, uploadError);
                            throw new Error(`이미지 ${i + 1} 업로드 실패: ${uploadError.message || uploadError.code || '알 수 없는 오류'}`);
                        }
                    }
                } catch (error) {
                    console.error('이미지 업로드 실패:', error);
                    console.error('에러 상세 정보:', {
                        message: error.message,
                        code: error.code,
                        stack: error.stack,
                        name: error.name
                    });
                    
                    // Firebase Storage 권한 오류인지 확인
                    if (error.code === 'storage/unauthorized' || error.code === 'permission-denied') {
                        alert('⚠️ Firebase Storage 접근 권한 오류\n\nFirebase Console에서 Storage 보안 규칙을 확인하세요.\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.');
                    } else if (error.code === 'storage/quota-exceeded') {
                        alert('⚠️ Firebase Storage 용량 초과\n\n저장 공간이 부족합니다. Firebase Console에서 확인하세요.');
                    } else {
                        alert(`이미지 업로드에 실패했습니다.\n\n오류: ${error.message || error.code || '알 수 없는 오류'}\n\n다른 정보는 저장됩니다.\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`);
                    }
                }
            }

            // 이미지 URL 직접 입력 처리
            const directImageUrl = document.getElementById('editImageUrl').value.trim();
            if (directImageUrl && !imageUrls.includes(directImageUrl)) {
                // URL 입력이 있고 이미지 목록에 없으면 추가
                imageUrls.push(directImageUrl);
            }

            // 게시글 처리
            const description = document.getElementById('editPriceReportDescription')?.value.trim() || '';

            // 제품 데이터 업데이트
            const productFormData = {
                name: document.getElementById('editProductName').value.trim() || '',
                store: document.getElementById('editStore').value,
                category: document.getElementById('editCategory').value,
                imageUrls: imageUrls,
                imageUrl: imageUrls.length > 0 ? imageUrls[0] : (directImageUrl || ''),
                description: description,
                lastUpdated: new Date().toISOString(),
                // 숨김 여부는 여기서만 컨트롤 (상품 상태)
                status: hiddenChecked ? 'hidden' : (product ? (product.status || 'approved') : 'approved'),
                hidden: hiddenChecked
            };

            // Firebase 신고 업데이트
            const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
            await window.firebaseUpdateDoc(reportRef, reportFormData);

            // Firebase 제품 업데이트 (제품이 있는 경우)
            if (productId && product) {
                const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
                await window.firebaseUpdateDoc(productRef, productFormData);
                
                // 로컬 데이터도 업데이트
                const localProductIndex = this.products.findIndex(p => p.id === productId);
                if (localProductIndex !== -1) {
                    this.products[localProductIndex] = { ...this.products[localProductIndex], ...productFormData };
                }
            }

            // 로컬 신고 데이터 업데이트
            const localReportIndex = this.priceReports.findIndex(r => r.id === reportId);
            if (localReportIndex !== -1) {
                this.priceReports[localReportIndex] = { ...this.priceReports[localReportIndex], ...reportFormData };
            }

            console.log('가격 변경 신고 수정 완료:', reportId);
            alert('가격 변경 신고가 수정되었습니다.');

            // 팝업 닫기
            closeEditPopup();

            // 목록 새로고침 - 현재 활성화된 모든 뷰 새로고침
            const currentView = sessionStorage.getItem('currentAdminView');
            if (currentView === 'reports') {
                this.loadPriceReports();
            } else if (currentView === 'pending') {
                this.loadPendingProducts();
            } else if (currentView === 'all') {
                this.loadAllProducts();
            }

            // 메인 화면도 업데이트
            this.updateMainProductList();

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
            
            // 로컬 데이터 업데이트
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                this.products[productIndex].status = 'approved';
            }
            
            // 캐시 무효화 (승인 후 최신 데이터를 가져오기 위해)
            const cacheKey = 'firebase_products_cache_v3';
            localStorage.removeItem(cacheKey);
            console.log('제품 승인 후 캐시 무효화 완료');
            
            // Firebase에서 최신 데이터 다시 로드 (캐시 없이)
            // loadProductsFromFirebase는 이미 updateCategoryCounts()와 displayAllProducts()를 호출함
            await this.loadProductsFromFirebase(false);
            
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
            
        } catch (error) {
            console.error('제품 시간 갱신 실패:', error);
            console.error('에러 상세:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
                name: error.name
            });
            
            // 권한 오류 확인 (더 정확한 체크)
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.code === 'permissions/denied' ||
                                     error.message?.includes('Missing or insufficient permissions') ||
                                     error.message?.includes('permission-denied') ||
                                     error.message?.includes('PERMISSION_DENIED');
            
            if (isPermissionError) {
                const consoleUrl = 'https://console.firebase.google.com/project/price-match-1f952/firestore/rules';
                const errorMessage = `⚠️ Firebase 권한 오류\n\n시간 갱신에 필요한 권한이 없습니다.\n\n오류 코드: ${error.code || '알 수 없음'}\n오류 메시지: ${error.message || '알 수 없음'}\n\nFirebase Console에서 Firestore 보안 규칙을 수정하시겠습니까?\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)`;
                
                if (confirm(errorMessage)) {
                    window.open(consoleUrl, '_blank');
                }
            } else {
                alert(`시간 업데이트에 실패했습니다.\n\n오류 코드: ${error.code || '알 수 없음'}\n오류 메시지: ${error.message || '알 수 없음'}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`);
            }
        }
    }

    async loadPriceReports() {
        try {
            console.log('=== loadPriceReports 시작 ===');
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

    loadOutOfStockSettings() {
        try {
            // localStorage에서 설정 불러오기
            const savedSettings = localStorage.getItem('outOfStockStages');
            if (savedSettings) {
                this.outOfStockStages = JSON.parse(savedSettings);
            }
            
            // 관리자 설정 불러오기
            const savedAutoReport = localStorage.getItem('outOfStockAutoReport');
            if (savedAutoReport) {
                this.outOfStockAutoReport = parseInt(savedAutoReport) || 5;
            }
            
            // UI에 설정값 반영
            document.getElementById('outOfStockStage1').value = this.outOfStockStages.stage1;
            document.getElementById('outOfStockStage2').value = this.outOfStockStages.stage2;
            document.getElementById('outOfStockStage3').value = this.outOfStockStages.stage3;
            document.getElementById('outOfStockAutoReport').value = this.outOfStockAutoReport;
            
            // 관리자 설정 텍스트 업데이트
            this.updateAutoReportText();
            
            console.log('품절 설정 로드:', this.outOfStockStages);
            console.log('품절 자동신고 설정:', this.outOfStockAutoReport);
        } catch (error) {
            console.error('품절 설정 로드 실패:', error);
        }
    }

    saveOutOfStockSettings() {
        try {
            const stage1 = parseInt(document.getElementById('outOfStockStage1').value);
            const stage2 = parseInt(document.getElementById('outOfStockStage2').value);
            const stage3 = parseInt(document.getElementById('outOfStockStage3').value);
            const autoReport = parseInt(document.getElementById('outOfStockAutoReport').value);
            
            // 유효성 검사
            if (stage1 < 1 || stage2 <= stage1 || stage3 <= stage2) {
                alert('설정값이 잘못되었습니다. 단계별로 증가하는 값이어야 합니다.');
                return;
            }
            
            if (autoReport < 1) {
                alert('관리자 설정값은 1 이상이어야 합니다.');
                return;
            }
            
            this.outOfStockStages = {
                stage1: stage1,
                stage2: stage2,
                stage3: stage3
            };
            this.outOfStockAutoReport = autoReport;
            
            // localStorage에 저장
            localStorage.setItem('outOfStockStages', JSON.stringify(this.outOfStockStages));
            localStorage.setItem('outOfStockAutoReport', autoReport.toString());
            
            // 관리자 설정 텍스트 업데이트
            this.updateAutoReportText();
            
            // 모든 상품의 X선 업데이트
            this.updateOutOfStockCrosses();
            
            alert('품절 설정이 저장되었습니다.');
            console.log('품절 설정 저장:', this.outOfStockStages);
            console.log('품절 자동신고 설정 저장:', this.outOfStockAutoReport);
        } catch (error) {
            console.error('품절 설정 저장 실패:', error);
            alert('설정 저장에 실패했습니다.');
        }
    }

    updateAutoReportText() {
        const autoReportInput = document.getElementById('outOfStockAutoReport');
        const autoReportText = document.getElementById('autoReportText');
        if (autoReportInput && autoReportText) {
            const value = autoReportInput.value || '5';
            autoReportText.textContent = `📢 품절 ${value}회 도달 시 자동으로 변경신고에 품절신고 생성`;
        }
    }

    updateOutOfStockCrosses() {
        // localStorage에서 설정 로드
        const savedSettings = localStorage.getItem('outOfStockStages');
        if (savedSettings) {
            this.outOfStockStages = JSON.parse(savedSettings);
        }
        
        // 모든 상품 아이템에 대해 X선 적용
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach(item => {
            const productId = item.getAttribute('data-product-id');
            if (!productId) return;
            
            const outOfStockCount = parseInt(item.getAttribute('data-out-of-stock-count') || 0);
            const category = item.getAttribute('data-category') || '기타';
            
            // 기존 X선 클래스 제거
            item.classList.remove('out-of-stock-stage1', 'out-of-stock-stage2', 'out-of-stock-stage3');
            
            // 품절 카운트에 따라 X선 적용
            if (outOfStockCount >= this.outOfStockStages.stage3) {
                item.classList.add('out-of-stock-stage3'); // 빨강
            } else if (outOfStockCount >= this.outOfStockStages.stage2) {
                item.classList.add('out-of-stock-stage2'); // 노랑
            } else if (outOfStockCount >= this.outOfStockStages.stage1) {
                item.classList.add('out-of-stock-stage1'); // 초록
            }
            
            // 카테고리에도 X선 적용
            const categoryItem = document.querySelector(`.category-item[onclick*="${category}"]`);
            if (categoryItem) {
                categoryItem.classList.remove('category-out-of-stock-stage1', 'category-out-of-stock-stage2', 'category-out-of-stock-stage3');
                
                if (outOfStockCount >= this.outOfStockStages.stage3) {
                    categoryItem.classList.add('category-out-of-stock-stage3');
                } else if (outOfStockCount >= this.outOfStockStages.stage2) {
                    categoryItem.classList.add('category-out-of-stock-stage2');
                } else if (outOfStockCount >= this.outOfStockStages.stage1) {
                    categoryItem.classList.add('category-out-of-stock-stage1');
                }
            }
        });
        
        // 카테고리 전체 계산
        this.updateCategoryOutOfStockStatus();
    }

    updateCategoryOutOfStockStatus() {
        const categories = ['특가', '식품', '생활', '가전', '유아', '기타'];
        
        categories.forEach(category => {
            const categoryItems = document.querySelectorAll(`.product-item[data-category="${category}"]`);
            const categoryElement = document.querySelector(`.category-item[data-category="${category}"]`);
            if (!categoryElement) return;
            
            let totalCount = 0;
            let totalStage = 0;
            
            categoryItems.forEach(item => {
                const count = parseInt(item.getAttribute('data-out-of-stock-count') || 0);
                if (count > 0) {
                    totalCount += count;
                    totalStage = Math.max(totalStage, count);
                }
            });
            
            // 기존 클래스 제거
            categoryElement.classList.remove('category-out-of-stock-stage1', 'category-out-of-stock-stage2', 'category-out-of-stock-stage3');
            
            // 평균값으로 단계 결정
            if (categoryItems.length > 0) {
                const avgCount = totalCount / categoryItems.length;
                if (avgCount >= this.outOfStockStages.stage3) {
                    categoryElement.classList.add('category-out-of-stock-stage3');
                } else if (avgCount >= this.outOfStockStages.stage2) {
                    categoryElement.classList.add('category-out-of-stock-stage2');
                } else if (avgCount >= this.outOfStockStages.stage1) {
                    categoryElement.classList.add('category-out-of-stock-stage1');
                }
            }
        });
    }

    async handleOutOfStock(productId) {
        try {
            console.log('품절 신고 처리:', productId);
            
            // 관리자 설정 불러오기
            const savedAutoReport = localStorage.getItem('outOfStockAutoReport');
            const autoReportThreshold = savedAutoReport ? parseInt(savedAutoReport) : (this.outOfStockAutoReport || 5);
            
            const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), productId);
            const productDoc = await window.firebaseGetDoc(productRef);
            
            if (productDoc.exists()) {
                const product = productDoc.data();
                const currentCount = product.outOfStockCount || 0;
                const newCount = currentCount + 1;
                
                await window.firebaseUpdateDoc(productRef, {
                    outOfStockCount: newCount,
                    lastUpdated: new Date().toISOString()
                });
                
                console.log('품절 카운트 업데이트:', newCount);
                
                // 관리자 설정값에 도달하면 자동으로 품절신고 생성
                if (newCount === autoReportThreshold) {
                    console.log(`품절 카운트가 관리자 설정값(${autoReportThreshold})에 도달 - 자동 품절신고 생성`);
                    
                    const outOfStockReport = {
                        productId: productId,
                        reportType: 'outOfStock',
                        reporter: 'system',
                        reportedAt: new Date().toISOString(),
                        status: 'pending',
                        productName: product.name || '알 수 없는 제품',
                        productLink: product.link || '',
                        autoGenerated: true,
                        outOfStockCount: newCount
                    };
                    
                    try {
                        await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), outOfStockReport);
                        console.log('자동 품절신고 생성 완료');
                        
                        // 알림 업데이트
                        if (window.priceComparisonSite) {
                            window.priceComparisonSite.updateAdminNotification();
                        }
                    } catch (error) {
                        console.error('자동 품절신고 생성 실패:', error);
                    }
                }
                
                return newCount;
            }
        } catch (error) {
            console.error('품절 신고 실패:', error);
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
        
        const adminContent = document.getElementById('priceReportsList');
        console.log('=== displayPriceReports 출력 대상:', adminContent);
        console.log('출력할 내용:', sortedReports.length, '개 신고');
        
        // 품절신고와 가격가격 바뀜 개수 계산
        const outOfStockCount = sortedReports.filter(r => r.reportType === 'outOfStock').length;
        const priceChangeCount = sortedReports.filter(r => !r.reportType || r.reportType !== 'outOfStock').length;
        
        if (sortedReports.length === 0) {
            adminContent.innerHTML = `
                <h3>변경신고 (0개)</h3>
                <div class="no-reports">
                    <p>대기 중인 변경신고가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        adminContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>변경신고 (${sortedReports.length}개) - 가격변동: ${priceChangeCount}개, 품절: ${outOfStockCount}개</h3>
                <button class="edit-btn" onclick="priceComparisonSite.editPriceReport('${sortedReports[0]?.id || ''}')" style="padding: 8px 16px; font-size: 14px;">전체 수정</button>
            </div>
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
        const scrollSpeed = 1.5; // 스크롤 속도 배수 (1.5배로 증가)

        adminPanel.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            scrollStart = adminPanel.scrollTop;
            adminPanel.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = (startY - e.clientY) * scrollSpeed;
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
            const deltaY = (touchStartY - e.touches[0].clientY) * scrollSpeed;
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

    // 스크롤 이벤트 리스너 설정 - 위로 스크롤하면 헤더(로고) 바로 나타나게
    setupScrollListener() {
        let lastScrollTop = 0;
        let ticking = false;
        
        // 스크롤 방향 감지 및 헤더 표시
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const header = document.querySelector('.header');
                    
                    if (header) {
                        // 위로 스크롤 (현재 위치가 이전 위치보다 위)
                        if (currentScrollTop < lastScrollTop) {
                            // 헤더를 바로 보이게
                            header.style.display = 'flex';
                            header.style.opacity = '1';
                            header.style.visibility = 'visible';
                            header.style.transform = 'translateY(0)';
                            header.style.transition = 'opacity 0.2s ease-in, transform 0.2s ease-in';
                        }
                        // 아래로 스크롤할 때는 기본 동작 유지 (필요시 숨김 처리 가능)
                    }
                    
                    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // 스크롤 이벤트 리스너 등록
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 초기 상태 설정
        const header = document.querySelector('.header');
        if (header) {
            header.style.display = 'flex';
            header.style.opacity = '1';
            header.style.visibility = 'visible';
        }
        
        console.log('스크롤 리스너 설정 완료 - 위로 스크롤 시 헤더 표시');
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
        // 관리자 권한 체크
        if (!adminAuth.isAuthenticated()) {
            console.warn('제품 삭제 시도: 관리자 권한 없음');
            alert('관리자 권한이 필요합니다.');
            return;
        }

        try {
            console.log('제품 삭제 시작:', productId);
            
            // 실제 삭제 대신 "숨김(soft delete)" 처리
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, {
                status: 'hidden',
                hidden: true,
                lastUpdated: new Date().toISOString()
            });
            console.log('Firebase에서 제품을 hidden 상태로 소프트 삭제 처리 완료:', productId);
            
            // 로컬 데이터에서도 상태를 hidden 으로 변경 (배열에서는 제거하지 않고 숨김 플래그만 변경)
            const localIndex = this.products.findIndex(p => p.id === productId);
            if (localIndex !== -1) {
                this.products[localIndex].status = 'hidden';
                this.products[localIndex].hidden = true;
                console.log('로컬 데이터에서 제품 hidden 상태 반영 완료:', this.products[localIndex]);
            }

            // 제품 캐시 무효화
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('제품 숨김 후 캐시 무효화 완료');
            } catch (e) {
                console.warn('제품 숨김 캐시 무효화 중 오류 (무시 가능):', e);
            }
            
            // DOM에서도 제거
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (productElement) {
                productElement.remove();
                console.log('DOM에서 제품 요소 제거 완료');
            }
            
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
                stack: error.stack,
                name: error.name
            });
            
            // 권한 오류 확인 (더 정확한 체크)
            const isPermissionError = error.code === 'permission-denied' || 
                                     error.code === 'PERMISSION_DENIED' ||
                                     error.code === 'permissions/denied' ||
                                     error.message?.includes('Missing or insufficient permissions') ||
                                     error.message?.includes('permission-denied') ||
                                     error.message?.includes('PERMISSION_DENIED');
            
            if (isPermissionError) {
                const consoleUrl = 'https://console.firebase.google.com/project/price-match-1f952/firestore/rules';
                const errorMessage = `⚠️ Firebase 권한 오류\n\n제품 숨김 처리에 필요한 권한이 없습니다.\n\n오류 코드: ${error.code || '알 수 없음'}\n오류 메시지: ${error.message || '알 수 없음'}\n\nFirebase Console에서 Firestore 보안 규칙을 수정하시겠습니까?\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)`;
                
                if (confirm(errorMessage)) {
                    window.open(consoleUrl, '_blank');
                }
            } else {
                // 권한 오류가 아닌 경우
                const errorMessage = `제품 숨김 처리에 실패했습니다.\n\n오류 코드: ${error.code || '알 수 없음'}\n오류 메시지: ${error.message || '알 수 없음'}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`;
                alert(errorMessage);
            }
        }
    }

    // 가격 변경 신고 삭제 함수
    async deletePriceReport(reportId) {
        try {
            console.log('가격 변경 신고 삭제 시작:', reportId);
            
            // Firebase에서 신고 삭제 - 여러 방법 시도
            let firebaseDeleteSuccess = false;
            
            // 방법 1: 전역 Firebase 함수 사용 (모듈식 SDK)
            if (window.firebaseDeleteDoc && window.firebaseDoc && window.firebaseDb) {
                try {
                    const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
                    await window.firebaseDeleteDoc(reportRef);
                    console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 1):', reportId);
                    firebaseDeleteSuccess = true;
                } catch (firebaseError) {
                    console.error('Firebase 삭제 방법 1 실패:', firebaseError);
                }
            }
            
            // 방법 2: 실제 프로젝트 ID로 fetch API 사용
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
                        console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 2):', reportId);
                        firebaseDeleteSuccess = true;
                    } else {
                        console.error('Firebase 삭제 방법 2 실패:', response.status, response.statusText);
                    }
                } catch (fetchError) {
                    console.error('Firebase 삭제 방법 2 실패:', fetchError);
                }
            }
            
            // 방법 3: 문서 존재 확인 후 삭제 시도
            if (!firebaseDeleteSuccess && window.firebaseGetDoc && window.firebaseDoc && window.firebaseDb && window.firebaseDeleteDoc) {
                try {
                    console.log('방법 3: 문서 존재 확인 후 삭제 시도');
                    const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
                    const docSnapshot = await window.firebaseGetDoc(reportRef);
                    if (docSnapshot.exists()) {
                        await window.firebaseDeleteDoc(reportRef);
                        console.log('Firebase에서 가격 변경 신고 삭제 완료 (방법 3):', reportId);
                        firebaseDeleteSuccess = true;
                    } else {
                        console.log('문서가 이미 존재하지 않음:', reportId);
                        firebaseDeleteSuccess = true; // 이미 삭제된 것으로 간주
                    }
                } catch (error) {
                    console.error('Firebase 삭제 방법 3 실패:', error);
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
            
            // 목록 새로고침 - 리스트가 펼쳐져 있을 때만
            const reportsList = document.getElementById('priceReportsList');
            if (reportsList && reportsList.innerHTML.trim() !== '') {
                await this.loadPriceReports();
            }
            
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
        
        // 품절신고인지 확인
        const isOutOfStockReport = report.reportType === 'outOfStock';
        
        const product = this.products.find(p => p.id === report.productId);
        const productName = report.productName || (product ? product.name : '알 수 없는 제품');
        
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
        
        // 품절신고인 경우
        if (isOutOfStockReport) {
            return `
                <div class="price-report-item" data-report-id="${report.id}" draggable="true" style="border-left: 4px solid #ef4444;">
                    <div class="report-info">
                        <h4>${productName} <span style="color: #ef4444; font-size: 0.9em;">[품절신고]</span></h4>
                        <p><strong>제품 ID:</strong> ${report.productId}</p>
                        <p><strong>신고 유형:</strong> 품절신고</p>
                        <p><strong>신고자:</strong> ${report.reporter}</p>
                        <p><strong>신고 시간:</strong> ${this.formatUpdateTime(report.reportedAt)}</p>
                        ${report.productLink ? `<p><strong>제품 링크:</strong> <a href="${report.productLink}" target="_blank" class="report-link">${this.truncateUrl(report.productLink)}</a></p>` : ''}
                        <p><strong>상태:</strong> ${report.status === 'pending' ? '대기중' : report.status === 'approved' ? '승인됨' : '거부됨'}</p>
                    </div>
                    <div class="admin-controls">
                        ${report.status === 'pending' ? `
                            <button class="approve-btn" onclick="approveOutOfStockReport('${report.id}', '${report.productId}')">품절 승인(상품 삭제)</button>
                            <button class="reject-btn" onclick="showDeleteConfirmation('report', '${report.id}', '${productName}')">신고 삭제</button>
                            ${report.productLink ? `<a href="${report.productLink}" target="_blank" class="link-btn">연결</a>` : ''}
                        ` : report.status === 'approved' && report.productLink ? `
                            <a href="${report.productLink}" target="_blank" class="link-btn">확인</a>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // 가격 변경 신고인 경우 (기존 로직)
        const priceChange = report.newPrice - report.oldPrice;
        const changeText = priceChange > 0 ? `+${priceChange.toLocaleString()}원` : `${priceChange.toLocaleString()}원`;
        const changeClass = priceChange > 0 ? 'price-increase' : 'price-decrease';
        
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
                    ${report.newLink ? `<p><strong>신고 링크:</strong> <a href="${report.newLink}" target="_blank" class="report-link">${this.truncateUrl(report.newLink)}</a></p>` : ''}
                    <p><strong>상태:</strong> ${report.status === 'pending' ? '대기중' : report.status === 'approved' ? '승인됨' : '거부됨'}</p>
                </div>
                <div class="admin-controls">
                    ${report.status === 'pending' ? `
                        <button class="approve-btn" onclick="approvePriceChange('${report.id}', '${report.productId}', '${report.newPrice}')">승인</button>
                        <button class="edit-btn" onclick="editPriceReport('${report.id}')">수정</button>
                        <button class="reject-btn" onclick="showDeleteConfirmation('report', '${report.id}', '${productName}')">삭제</button>
                        <a href="${report.newLink || (product ? product.link : '#')}" target="_blank" class="link-btn">연결</a>
                    ` : report.status === 'approved' && report.newLink ? `
                        <a href="${report.newLink}" target="_blank" class="link-btn">승인된 링크</a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async approveOutOfStockReport(reportId, productId) {
        try {
            console.log('품절 신고 승인 시작 (소프트 삭제 처리):', { reportId, productId });
            
            // 1) Firebase에서 해당 제품을 "숨김" 상태로 업데이트 (실제 삭제 X)
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            await window.firebaseUpdateDoc(productRef, {
                status: 'hidden',
                hidden: true,
                lastUpdated: new Date().toISOString()
            });
            console.log('Firebase 제품 상태를 hidden 으로 변경 완료:', productId);

            // 2) 로컬 products 배열에서도 상태 변경
            const localProductIndex = this.products.findIndex(p => p.id === productId);
            if (localProductIndex !== -1) {
                this.products[localProductIndex].status = 'hidden';
                this.products[localProductIndex].hidden = true;
                console.log('로컬 제품 상태 hidden 반영 완료:', this.products[localProductIndex]);
            }

            // 3) 신고 상태를 approved 로 변경
            const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
            await window.firebaseUpdateDoc(reportRef, { status: 'approved' });

            if (this.priceReports) {
                const idx = this.priceReports.findIndex(r => r.id === reportId);
                if (idx !== -1) {
                    this.priceReports[idx].status = 'approved';
                    console.log('로컬 품절 신고 상태 업데이트 완료:', this.priceReports[idx]);
                }
            }

            // 제품 캐시 무효화
            try {
                localStorage.removeItem('firebase_products_cache_v3');
                console.log('품절 신고 승인 후 제품 캐시 무효화 완료');
            } catch (e) {
                console.warn('품절 승인 캐시 무효화 중 오류 (무시 가능):', e);
            }

            alert('품절 신고가 승인되어 해당 상품이 숨김 처리되었습니다.');

            // 4) Firebase에서 최신 데이터 재로드 후 메인 / 관리자 UI 새로고침
            await this.loadProductsFromFirebase(false);
            this.forceUIUpdate();

            // 5) 신고 목록이 열려 있으면 새로고침
            const reportsList = document.getElementById('priceReportsList');
            if (reportsList && reportsList.innerHTML.trim() !== '') {
                this.loadPriceReports();
            }

            // 6) 알림 업데이트
            this.updateAdminNotification();
        } catch (error) {
            console.error('품절 신고 승인 실패:', error);
            alert('품절 신고 승인에 실패했습니다. 다시 시도해주세요.');
        }
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
            
            // 신고 정보 가져오기 (newLink를 가져오기 위해)
            const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
            const reportDoc = await window.firebaseGetDoc(reportRef);
            const reportData = reportDoc.data();
            const newLink = reportData.newLink;
            
            console.log('신고 정보:', { newLink, reportData });
            
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
            
            // finalPrice를 직접 업데이트
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            const updateData = {
                finalPrice: parseInt(newPrice),
                lastUpdated: new Date().toISOString()
            };
            
            // 신고 링크가 있으면 링크도 업데이트
            if (newLink) {
                updateData.link = newLink;
                console.log('상품 링크 업데이트:', newLink);
            }
            
            await window.firebaseUpdateDoc(productRef, updateData);
            
            console.log('제품 가격 업데이트 완료 - finalPrice:', newPrice);
            
            // 신고 상태 업데이트
            await window.firebaseUpdateDoc(reportRef, {
                status: 'approved'
            });
            
            console.log('신고 상태 업데이트 완료');
            
            alert('가격 변경이 승인되었습니다.');
            
            // 로컬 제품 데이터도 업데이트
            localProduct.finalPrice = parseInt(newPrice);
            localProduct.lastUpdated = new Date().toISOString();
            if (newLink) {
                localProduct.link = newLink;
            }
            
            // 3) 캐시 무효화 후 Firebase에서 최신 제품 데이터 다시 로드
            const cacheKey = 'firebase_products_cache_v2';
            try {
                localStorage.removeItem(cacheKey);
                console.log('가격 변경 승인 후 제품 캐시 무효화 완료');
            } catch (e) {
                console.warn('제품 캐시 무효화 중 오류 (무시 가능):', e);
            }

            await this.loadProductsFromFirebase(false); // 캐시 사용하지 않고 강제 재로드
            console.log('가격 변경 승인 후 Firebase에서 최신 제품 데이터 재로드 완료');

            // 4) 메인 / 관리자 UI 강제 업데이트
            this.forceUIUpdate();

            // 5) 신고 목록이 열려 있으면 새로고침
            const reportsList = document.getElementById('priceReportsList');
            if (reportsList && reportsList.innerHTML.trim() !== '') {
                this.loadPriceReports();
            }
            
            // 6) 알림 업데이트
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
            
            // UI 새로고침 - 리스트가 펼쳐져 있을 때만
            const reportsList = document.getElementById('priceReportsList');
            if (reportsList && reportsList.innerHTML.trim() !== '') {
                this.loadPriceReports();
            }
            
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
            '의류': approvedProducts.filter(p => p.category === '의류').length,
            '생활': approvedProducts.filter(p => p.category === '생활').length,
            '가전': approvedProducts.filter(p => p.category === '가전').length,
            'ETC': approvedProducts.filter(p => p.category === 'ETC').length
        };
        
        console.log('카테고리별 제품 수:', categoryCounts);
        
        // 전체 제품 수
        const totalEl = document.getElementById('totalCount');
        if (totalEl) totalEl.textContent = approvedProducts.length;

        // 새로운 대분류별 제품 수 (HTML 존재 여부 확인 후 적용)
        const specialEl = document.getElementById('specialCount');
        if (specialEl) specialEl.textContent = categoryCounts['특가'];
        const foodEl = document.getElementById('foodCount');
        if (foodEl) foodEl.textContent = categoryCounts['식품'];
        const clothesEl = document.getElementById('clothesCount');
        if (clothesEl) clothesEl.textContent = categoryCounts['의류'];
        const dailyEl = document.getElementById('dailyCount');
        if (dailyEl) dailyEl.textContent = categoryCounts['생활'];
        const elecEl = document.getElementById('electronicsCount');
        if (elecEl) elecEl.textContent = categoryCounts['가전'];
        const etcEl = document.getElementById('etcCount');
        if (etcEl) etcEl.textContent = categoryCounts['ETC'];
        
        console.log('=== 카테고리 카운트 업데이트 완료 ===');
    }

    // 카테고리 표시명 변환 함수
    // 카테고리 이모티콘 가져오기 (작은 크기 - 카테고리 바용)
    getCategoryIcon(category) {
        const icons = {
            '특가': '',
            '식품': '🍚',
            '의류': '👕',
            '생활': '🏠',
            '가전': '🌀',
            'ETC': '🎸'
        };
        return icons[category] || '';
    }

    // 카테고리 표시명 변환 함수 (카테고리 바용 - 작은 이모티콘)
    getCategoryDisplayName(category) {
        const icon = this.getCategoryIcon(category);
        const displayNames = {
            '특가': '초특가',
            '식품': '식품',
            '의류': '의류',
            '생활': '생활',
            '가전': '가전',
            'ETC': 'ETC'
        };
        const name = displayNames[category] || category;
        return icon ? `<span style="font-size: 0.7em; vertical-align: middle;">${icon}</span> ${name}` : name;
    }

    // 상품 리스트용 카테고리 표시 (조금 더 큰 이모티콘)
    getCategoryDisplayForProduct(category) {
        const displayNames = {
            '특가': '핫딜',
            '식품': '식품',
            '의류': '의류',
            '생활': '생활',
            '가전': '가전',
            'ETC': 'ETC'
        };
        const name = displayNames[category] || category;
        // 특가(핫딜)인 경우 노란색 번개 아이콘 추가 (세로로 길고 가로로 짧게)
        if (category === '특가') {
            return `<span class="hotdeal-icon" style="display: inline-block; width: 7px; height: 16px; margin-right: 3px; vertical-align: middle; position: relative;">
                        <svg width="7" height="16" viewBox="0 0 7 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 0L0 8H3.5V11L7 4H3.5V0Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5"/>
                        </svg>
                    </span><span class="discount-rate-high">핫딜</span>`;
        }
        // 식품/생활/가전/유아에도 좌측에 핫딜 로고+글자 추가
        const hotdealLabel = `<span class="hotdeal-icon" style="display: inline-block; width: 7px; height: 16px; margin-right: 3px; vertical-align: middle; position: relative;">
                        <svg width="7" height="16" viewBox="0 0 7 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 0L0 8H3.5V11L7 4H3.5V0Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5"/>
                        </svg>
                    </span><span class=\"discount-rate-high\">핫딜</span>`;
        const icon = this.getCategoryIcon(category);
        const categoryLabel = icon ? `<span style="font-size: 0.85em; vertical-align: middle;">${icon}</span> ${name}` : name;
        if (['식품','생활','가전','의류','ETC'].includes(category)) {
            return `${hotdealLabel} ${categoryLabel}`;
        }
        return categoryLabel;
    }

    // 수동 새로고침 버튼 및 카테고리 일괄 수정 버튼 추가
    addManualRefreshButton() {
        // 관리자 패널에 버튼들 추가
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            const adminControls = adminPanel.querySelector('.admin-controls');
            if (adminControls) {
                // 기존 버튼 제거 (중복 방지)
                const existingFixBtn = adminControls.querySelector('.fix-categories-btn');
                const existingRefreshBtn = adminControls.querySelector('.refresh-data-btn');
                if (existingFixBtn) {
                    existingFixBtn.remove();
                }
                if (existingRefreshBtn) {
                    existingRefreshBtn.remove();
                }
                
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

    async filterByCategory(category) {
        console.log('=== filterByCategory 시작 ===');
        console.log('선택된 카테고리:', category);
        console.log('현재 제품 목록:', this.products);
        console.log('카테고리 필터링 시작:', category);
        
        // 최상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.currentCategory = category;
        this.updateCategoryActiveState();
        
        if (category === '전체') {
            console.log('전체 카테고리 선택 - displayAllProducts 호출');
            await this.displayAllProducts();
        } else {
            console.log('특정 카테고리 선택 - displayCategoryResults 호출');
            await this.displayCategoryResults(category);
        }
        
        console.log('=== filterByCategory 완료 ===');
    }

    updateCategoryActiveState() {
        // 모든 카테고리에서 active 클래스 제거
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 현재 카테고리에 active 클래스 추가 (텍스트 내 이모지/공백 포함 케이스 대응)
        const items = Array.from(document.querySelectorAll('.category-item'));
        let currentCategoryItem = null;
        
        for (const item of items) {
            const dataCategory = item.getAttribute('data-category');
            const nameEl = item.querySelector('.category-name');
            const nameText = nameEl ? nameEl.textContent : '';
            
            // 1) data-category가 있으면 그것으로 매칭
            if (dataCategory && dataCategory === this.currentCategory) {
                currentCategoryItem = item;
                break;
            }
            
            // 2) 텍스트에 현재 카테고리명이 포함되어 있으면 매칭 (이모지/공백 포함 대비)
            if (nameText && nameText.indexOf(this.currentCategory) !== -1) {
                currentCategoryItem = item;
                break;
            }
        }
        
        if (currentCategoryItem) {
            currentCategoryItem.classList.add('active');
        }
    }

    // 정렬 바 버튼 이벤트 리스너 설정 (모바일 호환성)
    setupSortBarListeners() {
        console.log('정렬 바 이벤트 리스너 설정 시작');
        
        // 정렬 바 자체에 이벤트 위임 사용 (더 안정적)
        const sortBar = document.querySelector('.sort-bar');
        if (!sortBar) {
            console.error('정렬 바를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
        const newSortBar = sortBar.cloneNode(true);
        sortBar.parentNode.replaceChild(newSortBar, sortBar);
        
        // 이벤트 위임으로 정렬 바 전체에 리스너 추가 (capture 단계에서 처리하여 다른 이벤트보다 먼저 실행)
        newSortBar.addEventListener('click', function(e) {
            const button = e.target.closest('.sort-item');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                const sortType = button.getAttribute('data-sort');
                if (sortType) {
                    console.log('정렬 버튼 클릭됨 (이벤트 위임):', sortType);
                    sortProducts(sortType);
                    return false;
                }
            }
        }, { passive: false, capture: true });
        
        // 터치 이벤트도 추가 (모바일, capture 단계에서 처리)
        newSortBar.addEventListener('touchend', function(e) {
            const button = e.target.closest('.sort-item');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                const sortType = button.getAttribute('data-sort');
                if (sortType) {
                    console.log('정렬 버튼 터치됨 (이벤트 위임):', sortType);
                    sortProducts(sortType);
                    return false;
                }
            }
        }, { passive: false, capture: true });
        
        // touchstart도 이벤트 위임으로 추가
        newSortBar.addEventListener('touchstart', function(e) {
            const button = e.target.closest('.sort-item');
            if (button) {
                // 터치 시작 시 피드백
                button.style.opacity = '0.7';
            }
        }, { passive: true, capture: true });
        
        // 각 버튼에도 직접 이벤트 추가 (이중 보안)
        const sortItems = newSortBar.querySelectorAll('.sort-item');
        console.log('찾은 정렬 바 버튼 개수:', sortItems.length);
        
        sortItems.forEach(button => {
            const sortType = button.getAttribute('data-sort');
            if (sortType) {
                console.log('정렬 버튼 직접 이벤트 리스너 추가:', sortType);
                
                // 클릭 이벤트
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('정렬 버튼 직접 클릭됨:', sortType);
                    sortProducts(sortType);
                }, { passive: false });
                
                // 터치 이벤트 (touchstart와 touchend 함께 처리)
                let touchStarted = false;
                
                button.addEventListener('touchstart', function(e) {
                    touchStarted = true;
                    // 터치 시작 시 피드백
                    button.style.opacity = '0.7';
                }, { passive: true });
                
                button.addEventListener('touchend', function(e) {
                    if (touchStarted) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('정렬 버튼 직접 터치됨:', sortType);
                        sortProducts(sortType);
                        touchStarted = false;
                    }
                    // 터치 종료 시 원래대로
                    setTimeout(() => {
                        button.style.opacity = '1';
                    }, 100);
                }, { passive: false });
                
                button.addEventListener('touchcancel', function(e) {
                    touchStarted = false;
                    button.style.opacity = '1';
                }, { passive: true });
            }
        });
        
        console.log('정렬 바 이벤트 리스너 설정 완료');
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
            // 다른 모든 팝업들 닫기
            const otherSections = ['productFormDropdown', 'noticePanel', 'adminPanel'];
            otherSections.forEach(otherId => {
                if (otherId !== sectionId) {
                    const otherSection = document.getElementById(otherId);
                    if (otherSection && !otherSection.classList.contains('collapsed')) {
                        otherSection.classList.add('collapsed');
                        
                        // 다른 팝업 닫기 로직
                        if (otherId === 'adminPanel') {
                            otherSection.style.display = 'none';
                            otherSection.style.visibility = 'hidden';
                            otherSection.style.maxHeight = '0';
                            otherSection.style.padding = '0';
                            otherSection.style.overflow = 'hidden';
                        } else if (otherId === 'noticePanel') {
                            otherSection.style.display = 'none';
                            otherSection.style.visibility = 'hidden';
                            otherSection.style.maxHeight = '0';
                            otherSection.style.padding = '0';
                            otherSection.style.overflow = 'hidden';
                            console.log('필독 패널을 닫았습니다.');
                        } else if (otherId === 'productFormDropdown') {
                            otherSection.style.display = 'none';
                            otherSection.style.visibility = 'hidden';
                            otherSection.style.maxHeight = '0';
                            otherSection.style.padding = '0';
                            otherSection.style.overflow = 'hidden';
                            console.log('최저가 신고 팝업을 닫았습니다.');
                        }
                    }
                }
            });
            
            // 패널을 열기
            section.classList.remove('collapsed');
            section.classList.remove('hidden'); // hidden 클래스 제거
            
            // 모바일 감지
            const isMobile = window.innerWidth <= 768;
            
            // z-index 설정 - 모바일에서는 최대값, PC에서는 상대적 값
            if (isMobile) {
                // 모바일: z-index만 최대값으로 설정 (display는 각 패널별 로직에서 처리)
                section.style.zIndex = '2147483647';
                section.style.position = 'fixed';
                section.style.top = '65px';
                section.style.left = '0';
                section.style.right = '0';
                section.style.width = '100vw';
                section.style.maxWidth = '100vw';
                section.style.pointerEvents = 'auto';
                // display는 각 패널별 if문에서 별도 처리
                console.log(`모바일 z-index 강제 설정: ${sectionId} = 2147483647`);
            } else {
                // PC: 상대적 z-index 설정
                let maxZIndex = 10000;
                document.querySelectorAll('[id="productFormDropdown"], [id="noticePanel"], [id="adminPanel"]').forEach(p => {
                    const z = parseInt(p.style.zIndex) || parseInt(window.getComputedStyle(p).zIndex) || 0;
                    if (z > maxZIndex) maxZIndex = z;
                });
                section.style.zIndex = (maxZIndex + 10).toString();
                console.log(`PC z-index 설정: ${sectionId} = ${section.style.zIndex}`);
            }
            
            if (sectionId === 'adminPanel') {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.maxHeight = '70vh';
                section.style.padding = '20px';
                section.style.overflow = 'auto';
                
                // 관리 패널 내부 스크롤 위치 초기화
                const adminPanelContent = section.querySelector('.admin-panel');
                if (adminPanelContent) {
                    adminPanelContent.scrollTop = 0;
                }
                
                // 모든 리스트 초기화 (첫 화면으로)
                const allList = document.getElementById('allProductsList');
                const pendingList = document.getElementById('pendingProductsList');
                const reportsList = document.getElementById('priceReportsList');
                
                if (allList) allList.innerHTML = '';
                if (pendingList) pendingList.innerHTML = '';
                if (reportsList) reportsList.innerHTML = '';
                
                console.log('관리 패널 열림 - 모든 리스트 초기화');
            } else if (sectionId === 'noticePanel') {
                // 필독 패널 열기 - PC와 모바일 모두 지원
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.maxHeight = window.innerWidth <= 768 ? '70vh' : '600px';
                section.style.padding = '20px';
                section.style.overflow = 'auto';
                console.log('필독 패널을 열었습니다. 화면 크기:', window.innerWidth);
            } else if (sectionId === 'productFormDropdown') {
                // 최저가 신고 팝업 열기
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.maxHeight = window.innerWidth <= 768 ? '70vh' : '600px';
                section.style.padding = '20px';
                section.style.overflow = 'auto';
                console.log('최저가 신고 팝업을 열었습니다. 화면 크기:', window.innerWidth);
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
            } else if (sectionId === 'productFormDropdown') {
                // 최저가 신고 팝업 닫기
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.style.maxHeight = '0';
                section.style.padding = '0';
                section.style.overflow = 'hidden';
                console.log('최저가 신고 팝업을 닫았습니다.');
            }
        }
        
        // 폼이 열릴 때 이벤트 리스너 재설정
        if (sectionId === 'productFormDropdown' && !section.classList.contains('collapsed')) {
            if (window.priceComparisonSite) {
                window.priceComparisonSite.setupFormSubmitListener();
            }
        }
        
        // 관리자 패널이 열릴 때 승인 대기 제품 자동 로드
        if (sectionId === 'adminPanel' && !section.classList.contains('collapsed')) {
            if (window.priceComparisonSite) {
                console.log('관리자 패널 열림 - 승인 대기 제품 자동 로드');
                // 다른 리스트 초기화
                const allList = document.getElementById('allProductsList');
                const reportsList = document.getElementById('priceReportsList');
                const settingsDiv = document.getElementById('outOfStockSettings');
                
                if (allList) allList.innerHTML = '';
                if (reportsList) reportsList.innerHTML = '';
                if (settingsDiv) settingsDiv.style.display = 'none';
                
                // 승인 대기 제품 로드
                window.priceComparisonSite.loadPendingProducts();
            }
        }
    } else {
        console.error('섹션을 찾을 수 없습니다:', sectionId);
    }
}

function goToHome() {
    // 모든 패널 닫기
    if (window.priceComparisonSite) {
        // 모든 열려있는 패널 닫기
        const sections = ['productFormDropdown', 'noticePanel', 'adminPanel', 'productDetailDropdown'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('collapsed');
                // hidden 클래스는 제거 (CSS에서 제어하지 않도록)
                section.classList.remove('hidden');
                // display, visibility, maxHeight 등 스타일 초기화
                section.style.display = '';
                section.style.visibility = '';
                section.style.maxHeight = '';
                section.style.padding = '';
                section.style.overflow = '';
            }
        });
        
        // 상품리스트 화면으로 복귀 (전체 카테고리로 필터)
        window.priceComparisonSite.filterByCategory('전체');
        
        // 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function filterByCategory(category) {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.filterByCategory(category);
    }
}

function sortProducts(sortType) {
    console.log('정렬 함수 호출됨:', sortType);
    if (window.priceComparisonSite) {
        window.priceComparisonSite.sortProducts(sortType);
    } else {
        console.error('priceComparisonSite가 초기화되지 않았습니다.');
    }
}

function updateAutoReportText() {
    if (window.priceComparisonSite) {
        window.priceComparisonSite.updateAutoReportText();
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

// 중복된 DOMContentLoaded 리스너 제거됨 (위쪽에 이미 정의됨)

// 숫자별 댓글 시스템의 추가 함수들
PriceComparisonSite.prototype.editComment = async function(commentId) {
    const data = localStorage.getItem('numberComments');
    const comments = data ? JSON.parse(data) : [];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 본인이 작성한 댓글인지 또는 관리자인지 확인
    const currentUserId = this.getUserId();
    const isAdmin = adminAuth.isAuthenticated();
    const isMyComment = comment.userId === currentUserId;
    
    if (!isMyComment && !isAdmin) {
        alert('자신이 작성한 댓글만 수정할 수 있습니다.');
        return;
    }

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

PriceComparisonSite.prototype.saveCommentEdit = async function(commentId) {
    const commentElement = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentElement) return;

    const textarea = commentElement.querySelector('.comment-edit-textarea');
    if (!textarea) return;

    const newContent = textarea.value.trim();
    if (!newContent) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    try {
        // Firebase에서 댓글 찾기 및 업데이트
        if (window.firebaseDb && window.firebaseGetDocs && window.firebaseUpdateDoc && window.firebaseDoc && window.firebaseCollection) {
            const commentsRef = window.firebaseCollection(window.firebaseDb, 'numberComments');
            const querySnapshot = await window.firebaseGetDocs(commentsRef);
            
            querySnapshot.forEach(async (doc) => {
                if (doc.id === commentId || doc.data().id === commentId) {
                    const commentRef = window.firebaseDoc(commentsRef, doc.id);
                    await window.firebaseUpdateDoc(commentRef, { content: newContent });
                    console.log('Firebase 숫자별 댓글 수정 완료:', commentId);
                }
            });
        }
    } catch (error) {
        console.error('Firebase 숫자별 댓글 수정 실패:', error);
    }

    const data = localStorage.getItem('numberComments');
    const comments = data ? JSON.parse(data) : [];
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.content = newContent;
        localStorage.setItem('numberComments', JSON.stringify(comments));
        await this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
    }
};

PriceComparisonSite.prototype.cancelCommentEdit = async function(commentId) {
    // 댓글 목록을 다시 로드하여 원래 상태로 복원
    await this.loadNumberComments();
};

PriceComparisonSite.prototype.deleteComment = async function(commentId) {
    const data = localStorage.getItem('numberComments');
    const comments = data ? JSON.parse(data) : [];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 본인이 작성한 댓글인지 또는 관리자인지 확인
    const currentUserId = this.getUserId();
    const isAdmin = adminAuth.isAuthenticated();
    const isMyComment = comment.userId === currentUserId;
    
    console.log('삭제 체크:', { 
        currentUserId, 
        commentUserId: comment.userId, 
        isAdmin, 
        isMyComment,
        canDelete: isMyComment || isAdmin
    });
    
    if (!isMyComment && !isAdmin) {
        alert('자신이 작성한 댓글만 삭제할 수 있습니다.');
        return;
    }

    if (!confirm('정말로 이 댓글을 삭제하시겠습니까? 하위 댓글도 함께 삭제됩니다.')) {
        return;
    }
    
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
    
    console.log('댓글 삭제 시도:', { commentId, commentsToDelete, commentsCount: comments.length });
    
    // Firebase에서 삭제
    try {
        if (window.firebaseDb && window.firebaseCollection && window.firebaseGetDocs && window.firebaseDeleteDoc && window.firebaseDoc) {
            const commentsRef = window.firebaseCollection(window.firebaseDb, 'numberComments');
            const querySnapshot = await window.firebaseGetDocs(commentsRef);
            
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                const commentData = doc.data();
                // comment.id 필드와 doc.id 모두 확인 (문자열 비교)
                const commentId = (commentData.id || doc.id).toString();
                const docIdStr = doc.id.toString();
                const shouldDelete = commentsToDelete.some(id => {
                    const idStr = id.toString();
                    return idStr === commentId || idStr === docIdStr;
                });
                
                if (shouldDelete) {
                    const commentRef = window.firebaseDoc(commentsRef, doc.id);
                    deletePromises.push(window.firebaseDeleteDoc(commentRef));
                    console.log('Firebase 댓글 삭제 예정:', doc.id, 'commentId:', commentId, 'docId:', docIdStr, 'commentsToDelete:', commentsToDelete);
                }
            });
            
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log('Firebase에서 댓글 삭제 완료:', deletePromises.length, '개');
            } else {
                console.warn('삭제할 Firebase 댓글을 찾지 못했습니다. commentsToDelete:', commentsToDelete);
            }
        } else {
            console.warn('Firebase 함수를 사용할 수 없습니다.');
        }
    } catch (error) {
        console.error('Firebase 댓글 삭제 실패:', error);
        alert('Firebase 댓글 삭제에 실패했습니다: ' + error.message);
    }
    
    // localStorage 업데이트
    localStorage.setItem('numberComments', JSON.stringify(filteredComments));
    await this.loadNumberComments(); // 선택된 번호의 댓글만 다시 로드
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
        userId: this.getUserId(), // 답글 작성자 고유 ID 저장
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
        userId: this.getUserId(), // 답글 작성자 고유 ID 저장
        timestamp: new Date().toISOString(),
        parentId: parentId,
        noticeNumber: this.currentNoticeNumber
    };

    this.saveNoticeComment(reply);
    this.loadNoticeComments();
};

PriceComparisonSite.prototype.editNoticeComment = function(commentId) {
    const comments = this.getNoticeComments();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 본인이 작성한 댓글인지 또는 관리자인지 확인
    const currentUserId = this.getUserId();
    const isAdmin = adminAuth.isAuthenticated();
    const isMyComment = comment.userId === currentUserId;
    
    if (!isMyComment && !isAdmin) {
        alert('자신이 작성한 댓글만 수정할 수 있습니다.');
        return;
    }

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

PriceComparisonSite.prototype.saveNoticeCommentEdit = async function(commentId) {
    const commentElement = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentElement) return;

    const textarea = commentElement.querySelector('.comment-edit-textarea');
    if (!textarea) return;

    const newContent = textarea.value.trim();
    if (!newContent) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    try {
        // Firebase에서 댓글 찾기 및 업데이트
        if (window.firebaseDb && window.firebaseGetDocs && window.firebaseUpdateDoc && window.firebaseDoc && window.firebaseCollection) {
            const commentsRef = window.firebaseCollection(window.firebaseDb, 'noticeComments');
            const querySnapshot = await window.firebaseGetDocs(commentsRef);
            
            querySnapshot.forEach(async (doc) => {
                if (doc.id === commentId || doc.data().id === commentId) {
                    const commentRef = window.firebaseDoc(commentsRef, doc.id);
                    await window.firebaseUpdateDoc(commentRef, { content: newContent });
                    console.log('Firebase 댓글 수정 완료:', commentId);
                }
            });
        }
    } catch (error) {
        console.error('Firebase 댓글 수정 실패:', error);
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

PriceComparisonSite.prototype.deleteNoticeComment = async function(commentId) {
    const comments = this.getNoticeComments();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 본인이 작성한 댓글인지 또는 관리자인지 확인
    const currentUserId = this.getUserId();
    const isAdmin = adminAuth.isAuthenticated();
    const isMyComment = comment.userId === currentUserId;
    
    if (!isMyComment && !isAdmin) {
        alert('자신이 작성한 댓글만 삭제할 수 있습니다.');
        return;
    }

    if (!confirm('정말로 이 댓글을 삭제하시겠습니까? 하위 댓글도 함께 삭제됩니다.')) {
        return;
    }
    
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
    
    // Firebase에서 삭제
    try {
        if (window.firebaseDb && window.firebaseCollection && window.firebaseGetDocs && window.firebaseDeleteDoc && window.firebaseDoc) {
            const commentsRef = window.firebaseCollection(window.firebaseDb, 'noticeComments');
            const querySnapshot = await window.firebaseGetDocs(commentsRef);
            
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                const commentData = doc.data();
                // comment.id 필드와 doc.id 모두 확인 (문자열 비교)
                const commentId = (commentData.id || doc.id).toString();
                const shouldDelete = commentsToDelete.some(id => 
                    id.toString() === commentId || id.toString() === doc.id.toString()
                );
                
                if (shouldDelete) {
                    const commentRef = window.firebaseDoc(commentsRef, doc.id);
                    deletePromises.push(window.firebaseDeleteDoc(commentRef));
                    console.log('Firebase 공지사항 댓글 삭제 예정:', doc.id, 'commentId:', commentId, 'commentsToDelete:', commentsToDelete);
                }
            });
            
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log('Firebase에서 공지사항 댓글 삭제 완료:', deletePromises.length, '개');
            } else {
                console.warn('삭제할 Firebase 공지사항 댓글을 찾지 못했습니다. commentsToDelete:', commentsToDelete);
            }
        } else {
            console.warn('Firebase 함수를 사용할 수 없습니다.');
        }
    } catch (error) {
        console.error('Firebase 공지사항 댓글 삭제 실패:', error);
        alert('Firebase 공지사항 댓글 삭제에 실패했습니다: ' + error.message);
    }
    
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

// 가격 변동 모달 표시
window.showPriceChangeModal = function(productId, currentPrice, currentLink) {
    // 관리자 확인
    const isAdmin = localStorage.getItem('admin_session') === 'true';
    
    // 모달 HTML 생성
    const modalHTML = `
        <div id="priceChangeModal" class="modal-overlay" onclick="if(event.target.id === 'priceChangeModal') closePriceChangeModal()">
            <div class="modal-content-small" style="position: relative;">
                <div class="modal-header-small" style="position: relative;">
                    <h3>가격 변동 신고</h3>
                    <button onclick="closePriceChangeModal()" class="close-btn-small">&times;</button>
                </div>
                <div class="modal-body-small">
                    ${isAdmin ? `
                        <div style="display:flex; justify-content:flex-end; gap:4px; margin-bottom:8px;">
                            <button 
                                onclick="event.stopPropagation(); if(window.priceComparisonSite) { window.priceComparisonSite.editProduct('${productId}'); closePriceChangeModal(); } else { alert('관리자 수정 기능을 사용할 수 없습니다.'); }"
                                style="background:#3b82f6; color:white; border:none; border-radius:3px; padding:2px 6px; font-size:9px; cursor:pointer; font-weight:bold; opacity:0.9; line-height:1.4;">
                                관리자수정
                            </button>
                            <button 
                                onclick="event.stopPropagation(); if(window.priceComparisonSite) { window.priceComparisonSite.deleteProduct('${productId}'); closePriceChangeModal(); } else { alert('숨김 기능을 사용할 수 없습니다.'); }"
                                style="background:#6b7280; color:white; border:none; border-radius:3px; padding:2px 6px; font-size:9px; cursor:pointer; font-weight:bold; opacity:0.9; line-height:1.4;">
                                숨김
                            </button>
                            <button 
                                onclick="event.stopPropagation(); const linkInput = document.getElementById('priceChangeLink'); const url = (linkInput && linkInput.value) ? linkInput.value : '${currentLink || ''}'; if(url){ window.open(url, '_blank'); } else { alert('연결할 링크가 없습니다.'); }"
                                style="background:#10b981; color:white; border:none; border-radius:3px; padding:2px 6px; font-size:9px; cursor:pointer; font-weight:bold; opacity:0.9; line-height:1.4;">
                                연결
                            </button>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="priceChangeLink">상품 링크</label>
                        <input type="url" id="priceChangeLink" value="${currentLink || ''}" placeholder="https://example.com" style="width: 100%; padding: 8px;">
                    </div>
                    <div class="form-group">
                        <label for="priceChangePrice">변경된 가격 (원)</label>
                        <input type="number" id="priceChangePrice" value="${currentPrice}" placeholder="가격을 입력하세요" style="width: 100%; padding: 8px;">
                    </div>
                    <div class="modal-actions-small">
                        <button onclick="submitPriceChange('${productId}', ${currentPrice})" class="submit-btn-small">신고</button>
                        <button onclick="submitOutOfStockReport('${productId}')" class="submit-btn-small" style="background: #ef4444; margin-left: 8px;">품절</button>
                        <button onclick="closePriceChangeModal()" class="cancel-btn-small">취소</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거
    const existingModal = document.getElementById('priceChangeModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 입력 필드 포커스
    setTimeout(() => {
        const priceInput = document.getElementById('priceChangePrice');
        if (priceInput) {
            priceInput.select();
        }
    }, 100);
};

// 가격 변동 모달 닫기
window.closePriceChangeModal = function() {
    const modal = document.getElementById('priceChangeModal');
    if (modal) {
        modal.remove();
    }
};

// 가격 변동 신고 제출
window.submitPriceChange = async function(productId, oldPrice) {
    const newLink = document.getElementById('priceChangeLink')?.value || '';
    const newPrice = parseInt(document.getElementById('priceChangePrice')?.value || '0');
    
    if (!newPrice || newPrice <= 0) {
        alert('올바른 가격을 입력해주세요.');
        return;
    }
    
    if (!newLink) {
        alert('상품 링크를 입력해주세요.');
        return;
    }
    
    try {
        const priceChange = {
            productId: productId,
            oldPrice: oldPrice,
            newPrice: newPrice,
            newLink: newLink,
            reporter: 'anonymous',
            reportedAt: new Date().toISOString(),
            status: 'pending'
        };
        
        // Firebase에 가격 변경 신고 저장
        await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), priceChange);
        
        alert('가격 변동 신고가 접수되었습니다.');
        closePriceChangeModal();
        
        // GA 추적
        if (window.gtag) {
            window.gtag('event', 'price_report', {
                event_category: 'Price Report',
                event_label: `Product ID: ${productId}`
            });
        }
    } catch (error) {
        console.error('가격 변동 신고 실패:', error);
        alert('신고 제출에 실패했습니다.');
    }
};

// 품절신고 제출 함수
window.submitOutOfStockReport = async function(productId) {
    if (!confirm('품절신고를 하시겠습니까?')) {
        return;
    }
    
    try {
        // Firebase에서 제품 정보 가져오기
        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), productId);
        const productDoc = await window.firebaseGetDoc(productRef);
        
        if (!productDoc.exists()) {
            alert('제품을 찾을 수 없습니다.');
            return;
        }
        
        const product = productDoc.data();
        
        // 품절신고 객체 생성
        const outOfStockReport = {
            productId: productId,
            reportType: 'outOfStock', // 품절신고 구분자
            reporter: 'anonymous',
            reportedAt: new Date().toISOString(),
            status: 'pending',
            productName: product.name || '알 수 없는 제품',
            productLink: product.link || ''
        };
        
        // Firebase에 품절신고 저장 (priceReports 컬렉션에 저장)
        await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), outOfStockReport);
        
        alert('품절신고가 접수되었습니다.');
        closePriceChangeModal();
        
        // GA 추적
        if (window.gtag) {
            window.gtag('event', 'out_of_stock_report', {
                event_category: 'Out of Stock Report',
                event_label: `Product ID: ${productId}`
            });
        }
    } catch (error) {
        console.error('품절신고 실패:', error);
        alert('품절신고 제출에 실패했습니다.');
    }
};

// 품절 버튼 클릭 카운터 (더블클릭 감지용)
let outOfStockClickCounter = {};
let outOfStockClickTimer = {};

// 품절 버튼 클릭 핸들러 (더블클릭 감지)
window.handleOutOfStockClick = function(event, productId) {
    console.log('품절 버튼 클릭됨:', productId);
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // 더블클릭 감지 (500ms 내 두 번 클릭)
    if (!outOfStockClickCounter[productId]) {
        outOfStockClickCounter[productId] = 1;
        outOfStockClickTimer[productId] = setTimeout(() => {
            delete outOfStockClickCounter[productId];
        }, 500);
    } else {
        clearTimeout(outOfStockClickTimer[productId]);
        delete outOfStockClickCounter[productId];
        console.log('품절 더블클릭 감지됨!');
        if (window.priceComparisonSite) {
            window.priceComparisonSite.handleOutOfStock(productId).then(() => {
                // X선 업데이트
                window.priceComparisonSite.updateOutOfStockCrosses();
            });
        }
    }
};

// 상품 상세보기 모달 열기
window.showProductDetail = async function(productId) {
    console.log('상품 상세보기 열기:', productId);
    
    // ESC 키 이벤트 리스너 추가
    const escapeHandler = function(event) {
        if (event.key === 'Escape') {
            closeProductDetailModal();
            window.removeEventListener('keydown', escapeHandler);
        }
    };
    window.addEventListener('keydown', escapeHandler);
    
    try {
        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), productId);
        const productDoc = await window.firebaseGetDoc(productRef);
        
        if (productDoc.exists()) {
            const product = { id: productDoc.id, ...productDoc.data() };
            // 현재 상품 설명 저장 (중복 체크용)
            if (window.priceComparisonSite) {
                window.priceComparisonSite.currentProductDescription = product.description || '';
            }
            console.log('상품 데이터:', product);
            
            // 드롭다운 표시
            const dropdown = document.getElementById('productDetailDropdown');
            if (dropdown) {
                dropdown.classList.remove('collapsed');
                // ESC 핸들러 저장
                dropdown.escapeHandler = escapeHandler;
                // 브라우저 히스토리에 상태 추가 (뒤로가기 버튼 처리용)
                history.pushState({ productDetail: true }, '', window.location.href);
                // 배경 스크롤 방지
                document.body.style.overflow = 'hidden';
            }
            
            // 상품 정보 표시 (간소화)
            const infoSection = document.getElementById('productDetailInfo');
            if (infoSection) {
                // 상품명을 첫 줄에 표시
                const nameHtml = `<div class="product-detail-name" style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; color: #111827;">${product.name || '제품명 없음'}</div>`;
                
                // 구매하기 링크 주소 표시 (제목 바로 아래)
                let linkHtml = '';
                if (product.link) {
                    // 링크 주소를 한 줄로 제한하고 넘치는 부분은 ... 으로 표시
                    const maxLength = 60; // 표시할 최대 문자 수
                    const displayLink = product.link.length > maxLength 
                        ? product.link.substring(0, maxLength) + '...' 
                        : product.link;
                    linkHtml = `<div style="margin-bottom: 16px; font-size: 0.9rem; color: #3b82f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <a id="productDetailTopLink" href="${product.link}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${product.link}">${displayLink}</a>
                    </div>`;
                }
                
                // 모든 이미지 표시 (imageUrls 배열 또는 imageUrl) - 최적화 적용
                let imagesHtml = '';
                if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
                    imagesHtml = product.imageUrls.map((imgUrl, index) => {
                        const safeImageUrl = imgUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                        const safeProductId = (product.id || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
                        // 첫 번째 이미지는 높은 우선순위, 나머지는 낮은 우선순위
                        const fetchPriority = index === 0 ? 'high' : 'low';
                        // CORS 문제를 방지하기 위해 crossorigin 속성 제거 (Firebase Storage 보안 규칙 수정 필요)
                        return `<div class="product-detail-image" style="margin-bottom: 16px;"><img src="${imgUrl}" alt="${product.name || ''}" style="max-width: 100%; border-radius: 8px;" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${fetchPriority}" referrerpolicy="no-referrer" onerror="handleImageLoadError(this, '${safeProductId}', '${safeImageUrl}');"></div>`;
                    }).join('');
                } else if (product.imageUrl) {
                    const safeImageUrl = product.imageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                    const safeProductId = (product.id || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
                    // CORS 문제를 방지하기 위해 crossorigin 속성 제거 (Firebase Storage 보안 규칙 수정 필요)
                    imagesHtml = `<div class="product-detail-image" style="margin-bottom: 16px;"><img src="${product.imageUrl}" alt="${product.name || ''}" style="max-width: 100%; border-radius: 8px;" loading="eager" decoding="async" fetchpriority="high" referrerpolicy="no-referrer" onerror="handleImageLoadError(this, '${safeProductId}', '${safeImageUrl}');"></div>`;
                }
                
                let descHtml = '';
                if (product.description && product.description.trim()) {
                    // URL을 클릭 가능한 링크로 변환하는 함수
                    const convertUrlsToLinks = (text) => {
                        // URL 패턴 매칭 (http, https, www로 시작하는 URL)
                        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;
                        return text.replace(urlPattern, (url) => {
                            // www로 시작하는 경우 http:// 추가
                            let href = url;
                            if (url.startsWith('www.')) {
                                href = 'http://' + url;
                            }
                            return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">${url}</a>`;
                        });
                    };
                    
                    const descriptionWithLinks = convertUrlsToLinks(product.description);
                    descHtml = `<div class="product-description" style="margin-top: 16px;"><p style="white-space: pre-wrap; word-break: break-word;">${descriptionWithLinks.replace(/\n/g, '<br>')}</p></div>`;
                }
                infoSection.innerHTML = nameHtml + linkHtml + imagesHtml + descHtml;
            }
            
            // 추천/품절 카운트 표시
            updateDetailCounts(productId, product);
            
            // 상단 링크 클릭 이벤트 추가 (구매횟수 증가)
            const topLink = document.getElementById('productDetailTopLink');
            if (topLink) {
                topLink.addEventListener('click', function(e) {
                    // 구매 카운트 증가
                    if (window.priceComparisonSite && product.id) {
                        window.priceComparisonSite.incrementPurchaseCount(product.id);
                    }
                    // Google Analytics 추적
                    trackPurchaseClick(product.name, product.category || '기타');
                });
            }
            
            // 구매 버튼 링크 설정 및 클릭 이벤트 추가
            const purchaseBtn = document.getElementById('purchaseDetailBtn');
            if (purchaseBtn && product.link) {
                purchaseBtn.href = product.link;
                // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
                const newPurchaseBtn = purchaseBtn.cloneNode(true);
                purchaseBtn.parentNode.replaceChild(newPurchaseBtn, purchaseBtn);
                newPurchaseBtn.addEventListener('click', function(e) {
                    // 구매 카운트 증가
                    if (window.priceComparisonSite && product.id) {
                        window.priceComparisonSite.incrementPurchaseCount(product.id);
                    }
                    // Google Analytics 추적
                    trackPurchaseClick(product.name, product.category || '기타');
                });
            }
            
            // 현재 상품 ID 저장
            window.currentProductId = productId;
            
            // 버튼 표시 (게시글이 없어도)
            const commentActionsSection = document.getElementById('commentActionsSection');
            if (commentActionsSection) {
                commentActionsSection.style.display = 'block';
            }
            
            // 게시글 및 댓글 로드
            await loadProductDetailPosts(productId);
        } else {
            alert('상품 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('상품 상세보기 오류:', error);
        alert('상품 정보를 불러올 수 없습니다.');
    }
};

// 상품 상세보기 모달 닫기
window.closeProductDetailModal = function() {
    const dropdown = document.getElementById('productDetailDropdown');
    if (dropdown) {
        dropdown.classList.add('collapsed');
        // ESC 이벤트 리스너 제거
        if (dropdown.escapeHandler) {
            window.removeEventListener('keydown', dropdown.escapeHandler);
        }
    }
    window.currentProductId = null;
    
    // 배경 스크롤 복원
    document.body.style.overflow = '';
    
    // 히스토리 상태 관리
    if (history.state && history.state.productDetail) {
        history.back();
    }
    
    // 시작 화면으로 복귀
    if (window.priceComparisonSite) {
        window.priceComparisonSite.filterByCategory('전체');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// 추천/품절 카운트 업데이트
async function updateDetailCounts(productId, product) {
    try {
        const recommendCountEl = document.getElementById('recommendCount');
        const outOfStockCountEl = document.getElementById('outOfStockCount');
        
        if (recommendCountEl) {
            recommendCountEl.textContent = product.recommendCount || 0;
        }
        if (outOfStockCountEl) {
            outOfStockCountEl.textContent = product.outOfStockCount || 0;
        }
    } catch (error) {
        console.error('카운트 업데이트 실패:', error);
    }
}

// 추천 버튼 핸들러
window.handleRecommendClick = async function() {
    const productId = window.currentProductId;
    if (!productId) return;
    
    const btn = document.getElementById('recommendBtn');
    if (!btn) return;
    
    // 관리자 인증 확인
    const isAdmin = window.adminAuth && window.adminAuth.isAuthenticated();
    
    try {
        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), productId);
        const productDoc = await window.firebaseGetDoc(productRef);
        
        if (productDoc.exists()) {
            const currentCount = productDoc.data().recommendCount || 0;
            
            // 관리자는 직접 값 입력
            if (isAdmin) {
                const input = prompt('추천 카운트를 입력하세요:', currentCount);
                if (input === null) return;
                
                const newCount = Math.max(0, parseInt(input) || 0);
                await window.firebaseUpdateDoc(productRef, {
                    recommendCount: newCount,
                    lastUpdated: new Date().toISOString()
                });
                
                const countEl = document.getElementById('recommendCount');
                if (countEl) countEl.textContent = newCount;
            } else {
                // 일반 사용자는 기존 방식
                const newCount = Math.max(0, currentCount + (btn.classList.contains('active') ? -1 : 1));
                
                await window.firebaseUpdateDoc(productRef, {
                    recommendCount: newCount,
                    lastUpdated: new Date().toISOString()
                });
                
                const countEl = document.getElementById('recommendCount');
                if (countEl) countEl.textContent = newCount;
                
                btn.classList.toggle('active');
            }
        }
    } catch (error) {
        console.error('추천 업데이트 실패:', error);
    }
};

// 품절 버튼 핸들러
window.handleOutOfStockClick = async function() {
    const productId = window.currentProductId;
    if (!productId) return;
    
    const btn = document.getElementById('outOfStockDetailBtn');
    if (!btn) return;
    
    // 관리자 인증 확인
    const isAdmin = window.adminAuth && window.adminAuth.isAuthenticated();
    
    try {
        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), productId);
        const productDoc = await window.firebaseGetDoc(productRef);
        
        if (productDoc.exists()) {
            const currentCount = productDoc.data().outOfStockCount || 0;
            
            // 관리자는 직접 값 입력
            if (isAdmin) {
                const input = prompt('품절 카운트를 입력하세요:', currentCount);
                if (input === null) return;
                
                const newCount = Math.max(0, parseInt(input) || 0);
                await window.firebaseUpdateDoc(productRef, {
                    outOfStockCount: newCount,
                    lastUpdated: new Date().toISOString()
                });
                
                const countEl = document.getElementById('outOfStockCount');
                if (countEl) countEl.textContent = newCount;
                
                // X선 업데이트
                if (window.priceComparisonSite) {
                    window.priceComparisonSite.updateOutOfStockCrosses();
                }
            } else {
                // 일반 사용자는 품절 카운트 증가 및 관리자 설정값 체크
                const product = productDoc.data();
                const currentCount = product.outOfStockCount || 0;
                const newCount = currentCount + 1;
                
                // 품절 카운트 증가
                await window.firebaseUpdateDoc(productRef, {
                    outOfStockCount: newCount,
                    lastUpdated: new Date().toISOString()
                });
                
                // 관리자 설정 불러오기
                const savedAutoReport = localStorage.getItem('outOfStockAutoReport');
                const autoReportThreshold = savedAutoReport ? parseInt(savedAutoReport) : 5;
                
                // 관리자 설정값에 도달하면 자동으로 품절신고 생성
                if (newCount === autoReportThreshold) {
                    console.log(`품절 카운트가 관리자 설정값(${autoReportThreshold})에 도달 - 자동 품절신고 생성`);
                    
                    const outOfStockReport = {
                        productId: productId,
                        reportType: 'outOfStock',
                        reporter: 'system',
                        reportedAt: new Date().toISOString(),
                        status: 'pending',
                        productName: product.name || '알 수 없는 제품',
                        productLink: product.link || '',
                        autoGenerated: true,
                        outOfStockCount: newCount
                    };
                    
                    try {
                        await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), outOfStockReport);
                        console.log('자동 품절신고 생성 완료');
                        
                        // 알림 업데이트
                        if (window.priceComparisonSite) {
                            window.priceComparisonSite.updateAdminNotification();
                        }
                    } catch (error) {
                        console.error('자동 품절신고 생성 실패:', error);
                    }
                    
                    alert(`품절 카운트가 ${autoReportThreshold}회에 도달하여 관리자에게 품절신고가 자동으로 전송되었습니다.`);
                } else {
                    alert('품절 신고가 접수되었습니다.');
                }
                
                // UI 업데이트
                const countEl = document.getElementById('outOfStockCount');
                if (countEl) countEl.textContent = newCount;
                
                // 버튼 상태는 유지
                btn.classList.add('active');
                
                // GA 추적
                if (window.gtag) {
                    window.gtag('event', 'out_of_stock_report', {
                        event_category: 'Out of Stock Report',
                        event_label: `Product ID: ${productId}`
                    });
                }
            }
        }
    } catch (error) {
        console.error('품절 업데이트 실패:', error);
    }
};

// 상품 상세보기 게시글 로드
async function loadProductDetailPosts(productId) {
    try {
        // Firebase에서 해당 상품의 게시글 로드
        const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
        const q = window.firebaseQuery(postsRef, window.firebaseWhere('productId', '==', productId));
        const querySnapshot = await window.firebaseGetDocs(q);
        
        const postsContainer = document.getElementById('productDetailPosts');
        if (!postsContainer) return;
        
        // 버튼 섹션과 댓글 작성 섹션은 유지하고, 게시글/댓글만 초기화
        const commentActionsSection = document.getElementById('commentActionsSection');
        const commentFormSection = document.getElementById('commentFormSection');
        
        // 기존 게시글/댓글 요소만 제거
        const existingPosts = postsContainer.querySelectorAll('.product-post');
        existingPosts.forEach(post => post.remove());
        
        const posts = []; // 게시글 (이미지가 있거나 긴 내용)
        const comments = []; // 댓글
        const seenIds = new Set(); // 중복 방지를 위한 ID 추적
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // 삭제되지 않은 것만 표시
            if (!data.deleted) {
                // 답글(parentId가 있는 것)은 제외
                if (data.parentId) {
                    return; // 답글은 부모 댓글의 replies 배열에서 로드하므로 여기서는 제외
                }
                
                // 중복 방지: 이미 본 ID인 경우 스킵
                if (seenIds.has(doc.id)) {
                    console.log('중복 댓글 감지, 스킵:', doc.id);
                    return;
                }
                seenIds.add(doc.id);
                
                // 게시글과 댓글 구분
                const hasImages = (data.imageUrls && data.imageUrls.length > 0) || data.imageUrl;
                const isLongContent = data.content && data.content.length > 100;
                // 상품 설명과 동일한 내용인 경우 제외 (중복 방지)
                const isDuplicateContent = data.content && window.priceComparisonSite?.currentProductDescription === data.content.trim();
                
                // 게시글로 판단: 이미지가 있거나 내용이 긴 경우 (단, 중복 내용 제외)
                if ((hasImages || isLongContent) && !isDuplicateContent) {
                posts.push({ id: doc.id, ...data });
                } else if (!isDuplicateContent) {
                    comments.push({ id: doc.id, ...data });
                }
            }
        });
        
        // 시간순 정렬 (최신순)
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 게시글 표시
        posts.forEach((post) => {
            const currentUserId = getUserId();
            const postElement = document.createElement('div');
            postElement.className = 'product-post';
            postElement.dataset.postId = post.id;
            postElement.dataset.postType = 'post';
            
            // 날짜 포맷 (YY-MM-DD HH:MM 형식)
            const date = new Date(post.createdAt);
            const year = (date.getFullYear() % 100).toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
            
            // 이미지 표시 (여러 장 가능) - 최적화 적용
            let imagesHtml = '';
            if (post.imageUrls && Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
                // 여러 이미지가 있는 경우 순서대로 표시 (첫 번째만 우선 로드)
                imagesHtml = post.imageUrls.map((imgUrl, index) => {
                    const safeImageUrl = imgUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                    const safeProductId = (productId || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
                    // 첫 번째 이미지만 높은 우선순위, 나머지는 지연 로드
                    const fetchPriority = index === 0 ? 'high' : 'low';
                    const loading = index === 0 ? 'eager' : 'lazy';
                    // CORS 문제를 방지하기 위해 crossorigin 속성 제거 (Firebase Storage 보안 규칙 수정 필요)
                    return `<div class="post-image-wrapper"><img src="${imgUrl}" class="post-image" alt="상품 이미지" loading="${loading}" decoding="async" fetchpriority="${fetchPriority}" referrerpolicy="no-referrer" onerror="handleImageLoadError(this, '${safeProductId}', '${safeImageUrl}');" onclick="window.open('${imgUrl}')"></div>`;
                }).join('');
            } else if (post.imageUrl) {
                // 단일 이미지가 있는 경우 (하위 호환성)
                const safeImageUrl = post.imageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                const safeProductId = (productId || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
                // CORS 문제를 방지하기 위해 crossorigin 속성 제거 (Firebase Storage 보안 규칙 수정 필요)
                imagesHtml = `<div class="post-image-wrapper"><img src="${post.imageUrl}" class="post-image" alt="상품 이미지" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" onerror="handleImageLoadError(this, '${safeProductId}', '${safeImageUrl}');" onclick="window.open('${post.imageUrl}')"></div>`;
            }
            
            // URL을 클릭 가능한 링크로 변환하는 함수
            const convertUrlsToLinks = (text) => {
                if (!text) return '';
                // URL 패턴 매칭 (http, https, www로 시작하는 URL)
                const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;
                return text.replace(urlPattern, (url) => {
                    // www로 시작하는 경우 http:// 추가
                    let href = url;
                    if (url.startsWith('www.')) {
                        href = 'http://' + url;
                    }
                    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">${url}</a>`;
                });
            };
            
            const postContentWithLinks = post.content ? convertUrlsToLinks(post.content) : '';
            
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-left">
                        <span class="post-author">익명</span>
                        <span class="post-date">${formattedDate}</span>
                    </div>
                    ${post.userId === currentUserId ? `
                        <div class="post-actions">
                            <button class="post-edit-btn" onclick="editProductPost('${post.id}')">✏️ 수정</button>
                            <button class="post-delete-btn" onclick="deleteProductPost('${post.id}')">🗑️ 삭제</button>
                        </div>
                    ` : ''}
                </div>
                <div class="post-content" style="white-space: pre-wrap; word-break: break-word;">${postContentWithLinks.replace(/\n/g, '<br>')}</div>
                ${imagesHtml}
            `;
            
            postsContainer.appendChild(postElement);
        });
        
        // 댓글 표시
        if (comments.length > 0) {
            // 댓글 작성 칸을 postsContainer 내부, 첫 번째 댓글 앞에 삽입
            if (commentFormSection) {
                // 댓글이 있으면 댓글 작성 칸을 첫 번째 댓글 앞에 삽입
                // 댓글은 아직 추가되지 않았으므로, 댓글 추가 전에 댓글 작성 칸을 삽입
                // 게시글이 있다면 게시글 뒤에, 없다면 처음에 삽입
                const existingPostsInContainer = postsContainer.querySelectorAll('.product-post[data-post-type="post"]');
                if (existingPostsInContainer.length > 0) {
                    // 게시글이 있으면 마지막 게시글 뒤에 삽입
                    const lastPost = existingPostsInContainer[existingPostsInContainer.length - 1];
                    lastPost.insertAdjacentElement('afterend', commentFormSection);
                } else {
                    // 게시글이 없으면 처음에 삽입
                    postsContainer.insertBefore(commentFormSection, postsContainer.firstChild);
                }
            }
            
            // 버튼 섹션을 댓글 작성 칸 바로 위로 이동
            if (commentActionsSection && commentFormSection) {
                commentActionsSection.style.display = 'block';
                // 댓글 작성 칸 앞에 버튼 삽입
                commentFormSection.insertAdjacentElement('beforebegin', commentActionsSection);
            }
            
            comments.forEach((comment) => {
                const currentUserId = getUserId();
                const commentElement = document.createElement('div');
                commentElement.className = 'product-post';
                commentElement.dataset.postId = comment.id;
                
                // 날짜 포맷 (YY-MM-DD HH:MM 형식)
                const date = new Date(comment.createdAt);
                const year = (date.getFullYear() % 100).toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
                
                // URL을 클릭 가능한 링크로 변환 (댓글용)
                const convertUrlsToLinksForComment = (text) => {
                    if (!text) return '';
                    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;
                    return text.replace(urlPattern, (url) => {
                        let href = url;
                        if (url.startsWith('www.')) {
                            href = 'http://' + url;
                        }
                        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">${url}</a>`;
                    });
                };
                
                const commentContentWithLinks = comment.content ? convertUrlsToLinksForComment(comment.content) : '';
                
                commentElement.innerHTML = `
                    <div class="post-header">
                        <div class="post-left">
                            <span class="post-author">익명</span>
                            <span class="post-date">${formattedDate}</span>
                        </div>
                        ${comment.userId === currentUserId ? `
                            <div class="post-actions">
                                <button class="post-edit-btn" onclick="editProductPost('${comment.id}')">✏️ 수정</button>
                                <button class="post-delete-btn" onclick="deleteProductPost('${comment.id}')">🗑️ 삭제</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="post-content" style="white-space: pre-wrap; word-break: break-word;">${commentContentWithLinks.replace(/\n/g, '<br>')}</div>
                    <div class="comment-reply-section" style="margin-top: 12px;">
                        <button class="reply-btn" onclick="showReplyForm('${comment.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">답글</button>
                        <div id="replyForm-${comment.id}" style="display: none; margin-top: 8px;">
                            <textarea id="replyContent-${comment.id}" rows="2" placeholder="답글을 입력하세요..." style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.9rem; resize: vertical;"></textarea>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <button onclick="submitReply('${comment.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">등록</button>
                                <button onclick="hideReplyForm('${comment.id}')" style="background: #6b7280; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">취소</button>
                            </div>
                        </div>
                        <div id="replies-${comment.id}" class="comment-replies" style="margin-top: 12px; padding-left: 24px; border-left: 2px solid #e2e8f0;"></div>
                    </div>
                `;
                
                postsContainer.appendChild(commentElement);
                
                // 기존 답글 로드
                if (comment.replies && comment.replies.length > 0) {
                    loadReplies(comment.id, comment.replies);
                }
            });
        } else {
            // 댓글이 없는 경우에도 버튼을 댓글 작성 칸 위에 위치
            if (commentActionsSection && commentFormSection) {
                commentActionsSection.style.display = 'block';
                // 게시글이 있으면 게시글 뒤, 없으면 처음에 삽입
                const existingPostsInContainer = postsContainer.querySelectorAll('.product-post[data-post-type="post"]');
                if (existingPostsInContainer.length > 0) {
                    const lastPost = existingPostsInContainer[existingPostsInContainer.length - 1];
                    lastPost.insertAdjacentElement('afterend', commentActionsSection);
                    lastPost.insertAdjacentElement('afterend', commentFormSection);
                } else {
                    postsContainer.insertBefore(commentActionsSection, postsContainer.firstChild);
                    postsContainer.insertBefore(commentFormSection, commentActionsSection.nextSibling);
                }
            }
        }
        
        console.log('게시글 로드 완료:', posts.length, '개 게시글,', comments.length, '개 댓글');
    } catch (error) {
        console.error('게시글 로드 실패:', error);
    }
}

// 글로벌 getUserId 함수
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// 사용자가 등록한 최저가 신고 목록 조회
window.showMyPriceReports = async function() {
    // 최저가 신고 팝업 닫기
    const productFormDropdown = document.getElementById('productFormDropdown');
    if (productFormDropdown && !productFormDropdown.classList.contains('collapsed')) {
        productFormDropdown.classList.add('collapsed');
        // 모바일에서도 확실히 닫기
        productFormDropdown.style.display = 'none';
        productFormDropdown.style.visibility = 'hidden';
        productFormDropdown.style.maxHeight = '0';
        productFormDropdown.style.padding = '0';
        productFormDropdown.style.overflow = 'hidden';
    }
    
    const userId = getUserId();
    console.log('사용자 ID:', userId);
    
    try {
        // Firebase에서 해당 사용자의 최저가 신고 조회
        const productsRef = window.firebaseCollection(window.firebaseDb, 'products');
        const q = window.firebaseQuery(productsRef, window.firebaseWhere('userId', '==', userId));
        const querySnapshot = await window.firebaseGetDocs(q);
        
        const reports = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            reports.push({ id: doc.id, ...data });
        });
        
        console.log('사용자의 최저가 신고:', reports);
        
        if (reports.length === 0) {
            alert('등록한 최저가 신고가 없습니다.');
            return;
        }
        
        // 목록 표시
        let reportList = '등록한 최저가 신고 목록:\n\n';
        reports.forEach((report, index) => {
            const status = report.status === 'pending' ? '승인대기' : 
                          report.status === 'approved' ? '승인됨' : '거절됨';
            reportList += `${index + 1}. ${report.name} - ${report.price}원\n   상태: ${status}\n   등록일: ${new Date(report.createdAt || report.reportedAt).toLocaleDateString()}\n\n`;
        });
        
        alert(reportList);
        
        // 수정할 항목 선택
        const selectedIndex = prompt('수정할 항목 번호를 입력하세요:', '');
        if (selectedIndex === null) return;
        
        const index = parseInt(selectedIndex) - 1;
        if (index >= 0 && index < reports.length) {
            const selectedReport = reports[index];
            
            // 승인 대기 중인 것만 수정 가능
            if (selectedReport.status === 'approved') {
                alert('승인된 제품은 수정할 수 없습니다.');
                return;
            }
            
            // 수정 화면 표시
            showEditPriceReportModal(selectedReport);
        }
    } catch (error) {
        console.error('최저가 신고 조회 실패:', error);
        alert('최저가 신고 조회에 실패했습니다.');
    }
};

// 최저가 신고 수정 모달 표시
window.showEditPriceReportModal = async function(report) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    content.innerHTML = `
        <h2 style="margin-top: 0;">핫딜 신고 수정</h2>
        <div class="form-group">
            <label>제품명</label>
            <input type="text" id="editProductName" value="${report.name}" style="width: 100%; padding: 8px;">
        </div>
        <div class="form-group">
            <label style="color: #60a5fa;">정가(시작가)</label>
            <input type="number" id="editProductOriginalPrice" value="${report.originalPrice || 0}" style="width: 100%; padding: 8px;">
        </div>
        <div class="form-group">
            <label style="color: #dc2626;">최종가</label>
            <input type="number" id="editProductPrice" value="${report.price || report.finalPrice || 0}" style="width: 100%; padding: 8px;">
        </div>
        <div class="form-group">
            <label>링크</label>
            <input type="url" id="editProductLink" value="${report.link}" style="width: 100%; padding: 8px;">
        </div>
        <div class="form-group">
            <label>쇼핑몰</label>
            <select id="editProductStore" style="width: 100%; padding: 8px;">
                <option value="쿠팡" ${report.store === '쿠팡' ? 'selected' : ''}>쿠팡</option>
                <option value="네이버" ${report.store === '네이버' ? 'selected' : ''}>네이버</option>
                <option value="11번가" ${report.store === '11번가' ? 'selected' : ''}>11번가</option>
                <option value="G마켓" ${report.store === 'G마켓' ? 'selected' : ''}>G마켓</option>
                <option value="옥션" ${report.store === '옥션' ? 'selected' : ''}>옥션</option>
                <option value="롯데온" ${report.store === '롯데온' ? 'selected' : ''}>롯데온</option>
                <option value="기타" ${report.store === '기타' ? 'selected' : ''}>기타</option>
            </select>
        </div>
        <div class="form-group">
            <label>카테고리</label>
            <select id="editProductCategory" style="width: 100%; padding: 8px;">
                <option value="">카테고리 선택 안함</option>
                <option value="식품" ${report.category === '식품' ? 'selected' : ''}>식품</option>
                <option value="생활" ${report.category === '생활' ? 'selected' : ''}>생활</option>
                <option value="가전" ${report.category === '가전' ? 'selected' : ''}>가전</option>
                <option value="유아" ${report.category === '유아' ? 'selected' : ''}>유아</option>
                <option value="기타" ${report.category === '기타' ? 'selected' : ''}>일반딜</option>
            </select>
        </div>
        <div class="form-group">
            <label>게시글 작성 (선택사항)</label>
            <textarea id="editProductDescription" rows="8" style="width: 100%; padding: 8px;" placeholder="게시글 내용을 입력하세요... (인터넷 주소를 입력하면 클릭 가능한 링크로 변환됩니다)">${report.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>상품 이미지 (선택사항, 여러장 가능)</label>
            <input type="file" id="editProductImage" accept="image/*" multiple>
            <small style="color: #6b7280; font-size: 0.8rem;">JPG, PNG 형식, 최대 5MB</small>
            ${report.imageUrl ? `<div style="margin-top: 10px;"><img src="${report.imageUrl}" style="max-width: 200px; max-height: 200px; border-radius: 8px;"></div>` : ''}
        </div>
        <button onclick="submitEditPriceReport('${report.id}')" style="padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
            저장
        </button>
        <button onclick="deleteMyPriceReportProduct('${report.id}')" style="padding: 12px 24px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
            삭제
        </button>
        <button onclick="closeEditPriceReportModal()" style="padding: 12px 24px; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            취소
        </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // ESC 키로 닫기
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeEditPriceReportModal();
        }
    };
    window.addEventListener('keydown', escapeHandler);
    modal.escapeHandler = escapeHandler;
};

// 최저가 신고 수정 제출
window.submitEditPriceReport = async function(reportId) {
    const name = document.getElementById('editProductName').value.trim();
    const originalPrice = parseInt(document.getElementById('editProductOriginalPrice').value) || 0;
    const price = parseInt(document.getElementById('editProductPrice').value);
    const link = document.getElementById('editProductLink').value.trim();
    const store = document.getElementById('editProductStore').value;
    const category = document.getElementById('editProductCategory').value;
    const description = document.getElementById('editProductDescription').value.trim();
    
    if (!name || !price || !link) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
    }
    
    try {
        // 이미지 업로드 처리 (새 이미지가 있는 경우)
        const imageFiles = document.getElementById('editProductImage').files;
        let imageUrls = [];
        
        if (imageFiles && imageFiles.length > 0) {
            try {
                console.log('이미지 업로드 시작:', imageFiles.length, '개');
                
                const storageRef = window.firebaseStorage();
                if (!storageRef) {
                    throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                }
                
                for (let i = 0; i < imageFiles.length; i++) {
                    const imageFile = imageFiles[i];
                    
                    // 파일 크기 검증 (5MB)
                    if (imageFile.size > 5 * 1024 * 1024) {
                        alert(`이미지 ${i + 1}번의 크기가 5MB를 초과합니다.`);
                        return;
                    }
                    
                    // Firebase Storage에 이미지 업로드
                    try {
                        const imageRef = window.firebaseStorageRef(storageRef, `products/${Date.now()}_${i}_${imageFile.name}`);
                        console.log(`이미지 ${i + 1}/${imageFiles.length} 업로드 시도:`, imageFile.name, `(${(imageFile.size / 1024).toFixed(1)}KB)`);
                        
                        const snapshot = await window.firebaseUploadBytes(imageRef, imageFile);
                        const imageUrl = await window.firebaseGetDownloadURL(snapshot.ref);
                        imageUrls.push(imageUrl);
                        console.log(`이미지 ${i + 1}/${imageFiles.length} 업로드 완료:`, imageUrl);
                    } catch (uploadError) {
                        console.error(`이미지 ${i + 1} 업로드 실패:`, uploadError);
                        throw new Error(`이미지 ${i + 1} 업로드 실패: ${uploadError.message || uploadError.code || '알 수 없는 오류'}`);
                    }
                }
            } catch (error) {
                console.error('이미지 업로드 실패:', error);
                console.error('에러 상세 정보:', {
                    message: error.message,
                    code: error.code,
                    stack: error.stack,
                    name: error.name
                });
                
                // Firebase Storage 권한 오류인지 확인
                if (error.code === 'storage/unauthorized' || error.code === 'permission-denied') {
                    alert('⚠️ Firebase Storage 접근 권한 오류\n\nFirebase Console에서 Storage 보안 규칙을 확인하세요.\n\n필요한 규칙:\nallow write: if request.auth != null;\n또는\nallow write: if true; (임시 테스트용)\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.');
                } else if (error.code === 'storage/quota-exceeded') {
                    alert('⚠️ Firebase Storage 용량 초과\n\n저장 공간이 부족합니다. Firebase Console에서 확인하세요.');
                } else {
                    alert(`이미지 업로드에 실패했습니다.\n\n오류: ${error.message || error.code || '알 수 없는 오류'}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`);
                }
                return;
            }
        }
        
        // 기본 상품 이미지 URL (첫 번째 이미지만)
        const imageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
        
        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), reportId);
        
        const updateData = {
            name: name,
            originalPrice: originalPrice,
            finalPrice: price, // 최종가
            price: price, // 호환성을 위해 유지
            link: link,
            store: store,
            category: category,
            description: description,
            lastUpdated: new Date().toISOString()
        };
        
        // 새 이미지가 있는 경우에만 업데이트
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
            updateData.imageUrls = imageUrls;
        }
        
        await window.firebaseUpdateDoc(productRef, updateData);
        
        alert('최저가 신고가 수정되었습니다.');
        closeEditPriceReportModal();
        
        // 화면 새로고침
        if (window.priceComparisonSite) {
            window.location.reload();
        }
    } catch (error) {
        console.error('최저가 신고 수정 실패:', error);
        alert('수정에 실패했습니다.');
    }
};

// 수정 모달 닫기
window.closeEditPriceReportModal = function() {
    const modal = document.querySelector('[style*="z-index: 10000"]');
    if (modal) {
        if (modal.escapeHandler) {
            window.removeEventListener('keydown', modal.escapeHandler);
        }
        modal.remove();
    }
};

// 내 최저가 신고 삭제 (사용자가 자신이 등록한 제품 삭제)
window.deleteMyPriceReportProduct = async function(productId) {
    if (!confirm('정말로 이 최저가 신고를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const userId = getUserId();
        
        // 제품이 해당 사용자의 것인지 확인
        const productRef = window.firebaseDoc(window.firebaseCollection(window.firebaseDb, 'products'), productId);
        const productDoc = await window.firebaseGetDoc(productRef);
        
        if (!productDoc.exists()) {
            alert('제품을 찾을 수 없습니다.');
            return;
        }
        
        const productData = productDoc.data();
        
        // 사용자 ID 확인 (자신이 등록한 것만 삭제 가능)
        if (productData.userId !== userId) {
            alert('본인이 등록한 최저가 신고만 삭제할 수 있습니다.');
            return;
        }
        
        // 제품 삭제
        await window.firebaseDeleteDoc(productRef);
        
        alert('최저가 신고가 삭제되었습니다.');
        closeEditPriceReportModal();
        
        // 화면 새로고침
        if (window.priceComparisonSite) {
            window.location.reload();
        }
    } catch (error) {
        console.error('최저가 신고 삭제 실패:', error);
        alert('삭제에 실패했습니다.');
    }
};

// 가격 변경 신고 삭제 (관리자용 폼에서 사용)
window.deleteMyPriceReport = async function(reportId) {
    if (!confirm('정말로 이 가격 변경 신고를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const userId = getUserId();
        
        // 신고가 해당 사용자의 것인지 확인
        const reportRef = window.firebaseDoc(window.firebaseDb, 'priceReports', reportId);
        const reportDoc = await window.firebaseGetDoc(reportRef);
        
        if (!reportDoc.exists()) {
            alert('신고를 찾을 수 없습니다.');
            return;
        }
        
        const reportData = reportDoc.data();
        
        // 사용자 ID 확인 (자신이 신고한 것만 삭제 가능)
        // reporter 필드나 userId 필드 확인
        if (reportData.reporterUserId && reportData.reporterUserId !== userId) {
            alert('본인이 신고한 가격 변경 신고만 삭제할 수 있습니다.');
            return;
        }
        
        // 신고 삭제
        await window.firebaseDeleteDoc(reportRef);
        
        alert('가격 변경 신고가 삭제되었습니다.');
        closeEditPopup();
        
        // 화면 새로고침
        if (window.priceComparisonSite) {
            window.priceComparisonSite.loadPriceReportsFromFirebase();
            window.location.reload();
        }
    } catch (error) {
        console.error('가격 변경 신고 삭제 실패:', error);
        alert('삭제에 실패했습니다.');
    }
};

// 게시글 수정
window.editProductPost = async function(postId) {
    try {
        const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
        const q = window.firebaseQuery(postsRef, window.firebaseWhere('__name__', '==', postId));
        const querySnapshot = await window.firebaseGetDocs(q);
        
        let post = null;
        querySnapshot.forEach((doc) => {
            post = { id: doc.id, ...doc.data() };
        });
        
        if (!post) {
            alert('게시글을 찾을 수 없습니다.');
            return;
        }
        
        const currentUserId = getUserId();
        if (post.userId !== currentUserId) {
            alert('작성자만 수정할 수 있습니다.');
            return;
        }
        
        const newContent = prompt('게시글 내용을 수정하세요:', post.content);
        if (newContent !== null && newContent.trim() !== '') {
            const postRef = window.firebaseDoc(postsRef, postId);
            await window.firebaseUpdateDoc(postRef, {
                content: newContent.trim(),
                updatedAt: new Date().toISOString()
            });
            
            alert('게시글이 수정되었습니다.');
            await loadProductDetailPosts(window.currentProductId);
        }
    } catch (error) {
        console.error('게시글 수정 실패:', error);
        alert('게시글 수정에 실패했습니다.');
    }
};

// 게시글 삭제
window.deleteProductPost = async function(postId) {
    try {
        const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
        const q = window.firebaseQuery(postsRef, window.firebaseWhere('__name__', '==', postId));
        const querySnapshot = await window.firebaseGetDocs(q);
        
        let post = null;
        querySnapshot.forEach((doc) => {
            post = { id: doc.id, ...doc.data() };
        });
        
        if (!post) {
            alert('게시글을 찾을 수 없습니다.');
            return;
        }
        
        const currentUserId = getUserId();
        if (post.userId !== currentUserId) {
            alert('작성자만 삭제할 수 있습니다.');
            return;
        }
        
        if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            return;
        }
        
        const postRef = window.firebaseDoc(postsRef, postId);
        await window.firebaseUpdateDoc(postRef, {
            deleted: true,
            deletedAt: new Date().toISOString()
        });
        
        alert('게시글이 삭제되었습니다.');
        await loadProductDetailPosts(window.currentProductId);
    } catch (error) {
        console.error('게시글 삭제 실패:', error);
        alert('게시글 삭제에 실패했습니다.');
    }
};

// 상품 상세보기 댓글 작성
let isSubmittingProductComment = false; // 중복 제출 방지 플래그
async function submitProductDetailComment() {
    // 중복 제출 방지
    if (isSubmittingProductComment) {
        console.log('댓글 작성 중... 중복 제출 방지');
        return;
    }
    
    isSubmittingProductComment = true;
    
    const commentInput = document.getElementById('productDetailComment');
    const content = commentInput?.value.trim();
    
    if (!content) {
        isSubmittingProductComment = false;
        return;
    }
    
    if (!window.currentProductId) {
        alert('상품 정보가 없습니다.');
        isSubmittingProductComment = false;
        return;
    }
    
    try {
        const comment = {
            productId: window.currentProductId,
            content: content,
            userId: getUserId(),
            createdAt: new Date().toISOString(),
            deleted: false,
            replies: []
        };
        
        // Firebase에 댓글 저장
        const commentsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
        await window.firebaseAddDoc(commentsRef, comment);
        
        console.log('댓글 작성 완료:', comment);
        commentInput.value = '';
        
        // 게시글 목록 즉시 새로고침
        if (window.currentProductId && typeof loadProductDetailPosts === 'function') {
        await loadProductDetailPosts(window.currentProductId);
        }
    } catch (error) {
        console.error('댓글 작성 실패:', error);
        alert('댓글 작성에 실패했습니다.');
    } finally {
        // 플래그 해제 (약간의 지연으로 실시간 리스너와의 충돌 방지)
        setTimeout(() => {
            isSubmittingProductComment = false;
        }, 1000);
    }
}

// 답글 작성 폼 표시
window.showReplyForm = function(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    const replyTextarea = document.getElementById(`replyContent-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'block';
        // 답글 입력칸에 포커스
        if (replyTextarea) {
            setTimeout(() => {
                replyTextarea.focus();
            }, 100);
        }
    }
};

// 답글 작성 폼 숨기기
window.hideReplyForm = function(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    const replyInput = document.getElementById(`replyContent-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'none';
    }
    if (replyInput) {
        replyInput.value = '';
    }
};

// 답글 작성
window.submitReply = async function(parentCommentId) {
    const replyInput = document.getElementById(`replyContent-${parentCommentId}`);
    const content = replyInput?.value.trim();
    
    if (!content) {
        alert('답글 내용을 입력해주세요.');
        return;
    }
    
    if (!window.currentProductId) {
        alert('상품 정보가 없습니다.');
        return;
    }
    
    try {
        // 부모 댓글 가져오기
        const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
        const parentDoc = await window.firebaseGetDoc(window.firebaseDoc(postsRef, parentCommentId));
        
        if (!parentDoc.exists()) {
            alert('부모 댓글을 찾을 수 없습니다.');
            return;
        }
        
        const parentComment = { id: parentDoc.id, ...parentDoc.data() };
        
        // 답글 생성
        const reply = {
            productId: window.currentProductId,
            content: content,
            userId: getUserId(),
            createdAt: new Date().toISOString(),
            deleted: false,
            parentId: parentCommentId,
            replies: []
        };
        
        // Firebase에 답글 저장
        const replyDoc = await window.firebaseAddDoc(postsRef, reply);
        
        // 부모 댓글의 replies 배열 업데이트
        const parentRef = window.firebaseDoc(postsRef, parentCommentId);
        const existingReplies = parentComment.replies || [];
        existingReplies.push(replyDoc.id);
        await window.firebaseUpdateDoc(parentRef, { replies: existingReplies });
        
        console.log('답글 작성 완료:', reply);
        replyInput.value = '';
        hideReplyForm(parentCommentId);
        
        // 게시글 목록 새로고침
        await loadProductDetailPosts(window.currentProductId);
    } catch (error) {
        console.error('답글 작성 실패:', error);
        alert('답글 작성에 실패했습니다.');
    }
};

// 답글 로드 및 표시
async function loadReplies(parentCommentId, replyIds) {
    const repliesContainer = document.getElementById(`replies-${parentCommentId}`);
    if (!repliesContainer || !replyIds || replyIds.length === 0) return;
    
    // 기존 답글 초기화 (중복 방지)
    repliesContainer.innerHTML = '';
    
    try {
        const postsRef = window.firebaseCollection(window.firebaseDb, 'productPosts');
        const currentUserId = getUserId();
        
        for (const replyId of replyIds) {
            // 이미 표시된 답글인지 확인 (중복 방지)
            if (repliesContainer.querySelector(`[data-reply-id="${replyId}"]`)) {
                continue;
            }
            
            const replyDoc = await window.firebaseGetDoc(window.firebaseDoc(postsRef, replyId));
            if (replyDoc.exists()) {
                const reply = { id: replyDoc.id, ...replyDoc.data() };
                
                if (!reply.deleted && reply.parentId === parentCommentId) {
                    // 날짜 포맷 (YY-MM-DD HH:MM 형식)
                    const date = new Date(reply.createdAt);
                    const year = (date.getFullYear() % 100).toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
                    
                    const replyElement = document.createElement('div');
                    replyElement.className = 'product-post';
                    replyElement.dataset.replyId = reply.id;
                    replyElement.style.cssText = 'margin-bottom: 8px; padding: 12px; background: #f9fafb;';
                    replyElement.innerHTML = `
                        <div class="post-header" style="margin-bottom: 8px;">
                            <div class="post-left">
                                <span class="post-author">익명</span>
                                <span class="post-date">${formattedDate}</span>
                            </div>
                            ${reply.userId === currentUserId ? `
                                <div class="post-actions">
                                    <button class="post-edit-btn" onclick="editProductPost('${reply.id}')">✏️ 수정</button>
                                    <button class="post-delete-btn" onclick="deleteProductPost('${reply.id}')">🗑️ 삭제</button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="post-content">${reply.content ? reply.content.replace(/\n/g, '<br>') : ''}</div>
                    `;
                    
                    repliesContainer.appendChild(replyElement);
                }
            }
        }
    } catch (error) {
        console.error('답글 로드 실패:', error);
    }
}

// 공지사항 댓글 수정
window.editNoticePost = async function(postId) {
    try {
        const postsRef = window.firebaseCollection(window.firebaseDb, 'noticePosts');
        const postDoc = await window.firebaseGetDoc(window.firebaseDoc(postsRef, postId));
        
        if (!postDoc.exists()) {
            alert('댓글을 찾을 수 없습니다.');
            return;
        }
        
        const post = { id: postDoc.id, ...postDoc.data() };
        const currentUserId = getUserId();
        
        if (post.userId !== currentUserId && !window.adminAuth.isAuthenticated()) {
            alert('작성자만 수정할 수 있습니다.');
            return;
        }
        
        const newContent = prompt('댓글 내용을 수정하세요:', post.content);
        if (newContent !== null && newContent.trim() !== '') {
            const postRef = window.firebaseDoc(postsRef, postId);
            await window.firebaseUpdateDoc(postRef, {
                content: newContent.trim(),
                updatedAt: new Date().toISOString()
            });
            
            // 댓글 목록 새로고침
            if (window.priceComparisonSite && window.priceComparisonSite.loadNoticeComments) {
                await window.priceComparisonSite.loadNoticeComments();
            }
        }
    } catch (error) {
        console.error('공지사항 댓글 수정 실패:', error);
        alert('댓글 수정에 실패했습니다.');
    }
};

// 공지사항 댓글 삭제
window.deleteNoticePost = async function(postId) {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const postsRef = window.firebaseCollection(window.firebaseDb, 'noticePosts');
        const postDoc = await window.firebaseGetDoc(window.firebaseDoc(postsRef, postId));
        
        if (!postDoc.exists()) {
            alert('댓글을 찾을 수 없습니다.');
            return;
        }
        
        const post = { id: postDoc.id, ...postDoc.data() };
        const currentUserId = getUserId();
        
        if (post.userId !== currentUserId && !window.adminAuth.isAuthenticated()) {
            alert('작성자만 삭제할 수 있습니다.');
            return;
        }
        
        const postRef = window.firebaseDoc(postsRef, postId);
        await window.firebaseUpdateDoc(postRef, {
            deleted: true,
            deletedAt: new Date().toISOString()
        });
        
        // 댓글 목록 새로고침
        if (window.priceComparisonSite && window.priceComparisonSite.loadNoticeComments) {
            await window.priceComparisonSite.loadNoticeComments();
        }
    } catch (error) {
        console.error('공지사항 댓글 삭제 실패:', error);
        alert('댓글 삭제에 실패했습니다.');
    }
};

// 최종 가격 계산 (기존 함수를 전역으로 사용)
function calculateFinalPrice(product) {
    if (product.finalPrice !== undefined && product.finalPrice !== null) {
        return parseInt(product.finalPrice) || 0;
    }
    const originalPrice = parseInt(product.originalPrice) || 0;
    const deliveryFee = parseInt(product.deliveryFee) || 0;
    return originalPrice + deliveryFee;
}

// 품절 버튼 핸들러
window.handleOutOfStock = async function(productId) {
    console.log('품절 버튼 클릭됨:', productId);
    const isAdmin = adminAuth.authenticated;
    console.log('관리자 인증 상태:', isAdmin);
    
    if (isAdmin) {
        // 관리자는 수정 화면 표시
        console.log('관리자 모드: 수정 화면 표시');
        showOutOfStockEditModal(productId);
    } else {
        console.log('일반 유저 모드: 카운트 증가');
        // 일반 유저는 카운트만 증가
        try {
            const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
            const productDoc = await window.firebaseGetDoc(productRef);
            
            if (productDoc.exists()) {
                const product = productDoc.data();
                const currentCount = (product.outOfStockCount || 0) + 1;
                
                await window.firebaseUpdateDoc(productRef, {
                    outOfStockCount: currentCount,
                    lastUpdated: new Date().toISOString()
                });
                
                console.log('품절 카운트 업데이트 완료:', currentCount);
                
                // 관리자 설정 불러오기
                const savedAutoReport = localStorage.getItem('outOfStockAutoReport');
                const autoReportThreshold = savedAutoReport ? parseInt(savedAutoReport) : 5;
                
                // 관리자 설정값에 도달하면 자동으로 품절신고 생성
                if (currentCount === autoReportThreshold) {
                    console.log(`품절 카운트가 관리자 설정값(${autoReportThreshold})에 도달 - 자동 품절신고 생성`);
                    
                    const outOfStockReport = {
                        productId: productId,
                        reportType: 'outOfStock',
                        reporter: 'system',
                        reportedAt: new Date().toISOString(),
                        status: 'pending',
                        productName: product.name || '알 수 없는 제품',
                        productLink: product.link || '',
                        autoGenerated: true,
                        outOfStockCount: currentCount
                    };
                    
                    try {
                        await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'priceReports'), outOfStockReport);
                        console.log('자동 품절신고 생성 완료');
                        
                        // 알림 업데이트
                        if (window.priceComparisonSite) {
                            window.priceComparisonSite.updateAdminNotification();
                        }
                    } catch (error) {
                        console.error('자동 품절신고 생성 실패:', error);
                    }
                }
                
                // UI 업데이트
                updateOutOfStockCount(productId, currentCount);
                
                // X선 업데이트
                if (window.priceComparisonSite) {
                    window.priceComparisonSite.updateOutOfStockCrosses();
                }
            }
        } catch (error) {
            console.error('품절 카운트 업데이트 실패:', error);
        }
    }
};

// 품절 카운트 수정 화면 표시
window.showOutOfStockEditModal = async function(productId) {
    try {
        const productRef = window.firebaseDoc(window.firebaseDb, 'products', productId);
        const productDoc = await window.firebaseGetDoc(productRef);
        
        if (productDoc.exists()) {
            const currentCount = productDoc.data().outOfStockCount || 0;
            
            const newCount = prompt(`품절 카운트를 수정하세요.\n현재 카운트: ${currentCount}`, currentCount);
            
            if (newCount !== null && !isNaN(newCount)) {
                const count = parseInt(newCount);
                await window.firebaseUpdateDoc(productRef, {
                    outOfStockCount: count,
                    lastUpdated: new Date().toISOString()
                });
                
                updateOutOfStockCount(productId, count);
                
                // X선 업데이트
                if (window.priceComparisonSite) {
                    window.priceComparisonSite.updateOutOfStockCrosses();
                }
                
                alert('품절 카운트가 수정되었습니다.');
            }
        }
    } catch (error) {
        console.error('품절 카운트 수정 실패:', error);
        alert('품절 카운트 수정에 실패했습니다.');
    }
};

// 품절 카운트 UI 업데이트
function updateOutOfStockCount(productId, count) {
    // onclick 속성으로 버튼 찾기
    const buttons = document.querySelectorAll('.out-of-stock-btn');
    const button = Array.from(buttons).find(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(`'${productId}'`);
    });
    
    if (button) {
        const wrapper = button.parentElement;
        const existingCount = wrapper.querySelector('.out-of-stock-count');
        
        if (count > 0) {
            if (existingCount) {
                existingCount.textContent = count;
            } else {
                const countSpan = document.createElement('span');
                countSpan.className = 'out-of-stock-count';
                countSpan.textContent = count;
                wrapper.appendChild(countSpan);
            }
        } else if (existingCount) {
            existingCount.remove();
        }
    }
}

// 이미지 선택 및 순서 관리 전역 함수
window.handleImageSelection = function() {
    const input = document.getElementById('productImage');
    const files = input.files;
    const container = document.getElementById('imagePreviewContainer');
    
    if (window.priceComparisonSite && files && files.length > 0) {
        // 기존 이미지 배열이 있으면 새 파일 추가, 없으면 새로 생성
        const fileArray = Array.from(files);
        if (!window.priceComparisonSite.selectedImageOrder) {
            window.priceComparisonSite.selectedImageOrder = [];
        }
        
        // 새로 선택한 파일 중 기존에 없는 것만 추가
        fileArray.forEach(newFile => {
            const isDuplicate = window.priceComparisonSite.selectedImageOrder.some(existingFile => 
                existingFile.name === newFile.name && existingFile.size === newFile.size && existingFile.lastModified === newFile.lastModified
            );
            if (!isDuplicate) {
                window.priceComparisonSite.selectedImageOrder.push(newFile);
            }
        });
        
        // input의 files를 업데이트하기 위해 DataTransfer 사용
        const dataTransfer = new DataTransfer();
        window.priceComparisonSite.selectedImageOrder.forEach(file => {
            dataTransfer.items.add(file);
        });
        input.files = dataTransfer.files;
    }
    
    if (!window.priceComparisonSite || !window.priceComparisonSite.selectedImageOrder || window.priceComparisonSite.selectedImageOrder.length === 0) {
        container.style.display = 'none';
    if (window.priceComparisonSite) {
            window.priceComparisonSite.selectedImageOrder = [];
        }
        return;
    }
    
    const currentOrder = window.priceComparisonSite.selectedImageOrder;
    
    // 총 용량 계산
    const totalSize = currentOrder.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    container.style.display = 'block';
    container.innerHTML = `
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <strong>이미지를 드래그하여 순서 변경:</strong>
            <span style="font-size: 0.85rem; color: #6b7280;">총 용량: ${totalSizeMB} MB</span>
        </div>
        <div id="imageList" style="display: flex; gap: 12px; overflow-x: auto; padding: 8px 0;"></div>
    `;
    const imageList = document.getElementById('imageList');
    
    // 이미지 미리보기 생성
    currentOrder.forEach((file, idx) => {
        (function(index) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item';
                imageDiv.style.cssText = `
                    position: relative;
                    flex-shrink: 0;
                    width: 100px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    cursor: move;
                    transition: all 0.2s;
                    user-select: none;
                `;
                imageDiv.setAttribute('data-index', index.toString());
                imageDiv.setAttribute('draggable', 'true');
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width: 100%; height: 100px; object-fit: cover; border-radius: 6px 6px 0 0; pointer-events: none; user-select: none;';
                img.setAttribute('draggable', 'false');
                
                const orderBadge = document.createElement('div');
                orderBadge.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    pointer-events: none;
                    z-index: 1;
                `;
                orderBadge.textContent = (index + 1).toString();
                
                // 삭제 버튼 추가
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '×';
                deleteBtn.style.cssText = `
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(220, 38, 38, 0.9);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    transition: all 0.2s;
                `;
                deleteBtn.onmouseover = function() {
                    this.style.background = 'rgba(220, 38, 38, 1)';
                    this.style.transform = 'scale(1.1)';
                };
                deleteBtn.onmouseout = function() {
                    this.style.background = 'rgba(220, 38, 38, 0.9)';
                    this.style.transform = 'scale(1)';
                };
                deleteBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 이미지 삭제
                    if (window.priceComparisonSite && window.priceComparisonSite.selectedImageOrder) {
                        window.priceComparisonSite.selectedImageOrder.splice(index, 1);
                        
                        // input의 files 업데이트
                        const input = document.getElementById('productImage');
                        const dataTransfer = new DataTransfer();
                        window.priceComparisonSite.selectedImageOrder.forEach(file => {
                            dataTransfer.items.add(file);
                        });
                        input.files = dataTransfer.files;
                        
                        // 미리보기 다시 그리기
                        window.handleImageSelection();
                    }
                };
                
                imageDiv.appendChild(img);
                imageDiv.appendChild(orderBadge);
                imageDiv.appendChild(deleteBtn);
                imageList.appendChild(imageDiv);
                
                // 삭제 버튼 클릭 시 드래그 방지
                deleteBtn.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                });
                
                // 드래그 앤 드롭 설정 (PC용) - 삭제 버튼이 아닐 때만
                imageDiv.addEventListener('dragstart', function(e) {
                    // 삭제 버튼 클릭이면 드래그 무시
                    if (e.target === deleteBtn || deleteBtn.contains(e.target)) {
                        e.preventDefault();
                        return false;
                    }
                    console.log('Drag start:', index);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                    imageDiv.style.opacity = '0.5';
                    imageDiv.style.transform = 'scale(0.9)';
                });
                
                imageDiv.addEventListener('dragend', function() {
                    console.log('Drag end:', index);
                    imageDiv.style.opacity = '1';
                    imageDiv.style.transform = 'scale(1)';
                    // 모든 아이템의 테두리 초기화
                    const allItems = imageList.querySelectorAll('.image-preview-item');
                    allItems.forEach(item => {
                        item.style.borderColor = '#e2e8f0';
                    });
                });
                
                imageDiv.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    imageDiv.style.borderColor = '#3b82f6';
                    imageDiv.style.borderWidth = '3px';
                });
                
                imageDiv.addEventListener('dragleave', function() {
                    imageDiv.style.borderColor = '#e2e8f0';
                    imageDiv.style.borderWidth = '2px';
                });
                
                imageDiv.addEventListener('drop', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    imageDiv.style.borderColor = '#e2e8f0';
                    imageDiv.style.borderWidth = '2px';
                    
                    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const targetIndex = index;
                    
                    console.log('Drop:', sourceIndex, '->', targetIndex);
                    
                    if (sourceIndex !== targetIndex && window.priceComparisonSite) {
                        // 배열 순서 변경
                        const order = window.priceComparisonSite.selectedImageOrder;
                        const [movedItem] = order.splice(sourceIndex, 1);
                        order.splice(targetIndex, 0, movedItem);
                        
                        console.log('Order changed:', order);
                        
                        // 미리보기 다시 그리기
                        window.handleImageSelection();
                    }
                });
                
                // 모바일 터치 이벤트 설정
                let touchStartX = 0;
                let touchStartY = 0;
                let isDragging = false;
                let draggedIndex = null;
                
                imageDiv.addEventListener('touchstart', function(e) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    imageDiv.style.opacity = '0.5';
                    imageDiv.style.transform = 'scale(0.9)';
                    draggedIndex = index;
                    console.log('Touch start:', index);
                }, { passive: true });
                
                imageDiv.addEventListener('touchmove', function(e) {
                    if (!isDragging) {
                        const touchCurrentX = e.touches[0].clientX;
                        const touchCurrentY = e.touches[0].clientY;
                        const deltaX = Math.abs(touchCurrentX - touchStartX);
                        const deltaY = Math.abs(touchCurrentY - touchStartY);
                        
                        // 이동 거리가 10px 이상이면 드래그 시작
                        if (deltaX > 10 || deltaY > 10) {
                            isDragging = true;
                            console.log('Drag started on mobile:', index);
                        }
                    }
                    
                    if (isDragging) {
                        // 다른 아이템들에 호버 효과
                        const allItems = imageList.querySelectorAll('.image-preview-item');
                        const touchPoint = e.touches[0];
                        allItems.forEach((item, idx) => {
                            const rect = item.getBoundingClientRect();
                            if (touchPoint.clientX >= rect.left && touchPoint.clientX <= rect.right &&
                                touchPoint.clientY >= rect.top && touchPoint.clientY <= rect.bottom) {
                                item.style.borderColor = '#3b82f6';
                                item.style.borderWidth = '3px';
                            } else {
                                item.style.borderColor = '#e2e8f0';
                                item.style.borderWidth = '2px';
                            }
                        });
                    }
                }, { passive: true });
                
                imageDiv.addEventListener('touchend', function(e) {
                    if (isDragging) {
                        isDragging = false;
                        imageDiv.style.opacity = '1';
                        imageDiv.style.transform = 'scale(1)';
                        
                        // 드롭된 위치 찾기
                        const touchEndX = e.changedTouches[0].clientX;
                        const touchEndY = e.changedTouches[0].clientY;
                        
                        const allItems = imageList.querySelectorAll('.image-preview-item');
                        let targetIndex = -1;
                        
                        allItems.forEach((item, idx) => {
                            const rect = item.getBoundingClientRect();
                            if (touchEndX >= rect.left && touchEndX <= rect.right &&
                                touchEndY >= rect.top && touchEndY <= rect.bottom) {
                                targetIndex = idx;
                            }
                            // 모든 아이템의 테두리 초기화
                            item.style.borderColor = '#e2e8f0';
                            item.style.borderWidth = '2px';
                        });
                        
                        // 순서 변경
                        if (draggedIndex !== null && targetIndex >= 0 && draggedIndex !== targetIndex && window.priceComparisonSite) {
                            console.log('Touch drop:', draggedIndex, '->', targetIndex);
                            const order = window.priceComparisonSite.selectedImageOrder;
                            const [movedItem] = order.splice(draggedIndex, 1);
                            order.splice(targetIndex, 0, movedItem);
                            console.log('Order changed:', order);
                            
                            // 미리보기 다시 그리기
                            window.handleImageSelection();
                        }
                    } else {
                        imageDiv.style.opacity = '1';
                        imageDiv.style.transform = 'scale(1)';
                    }
                    
                    draggedIndex = null;
                }, { passive: true });
            };
            reader.readAsDataURL(file);
        })(idx);
    });
};