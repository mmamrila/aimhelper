/**
 * AimHelper Pro - Performance Optimization System
 * Comprehensive performance monitoring and optimization features
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            loadTimes: {},
            renderTimes: {},
            memoryUsage: {},
            cacheHits: 0,
            cacheMisses: 0,
            networkRequests: 0,
            errors: []
        };

        this.cache = new Map();
        this.observers = {};
        this.loadingStates = new Set();
        this.optimizations = {
            imageLoading: true,
            resourcePreloading: true,
            codesplitting: true,
            memoryManagement: true,
            renderOptimization: true
        };

        this.init();
    }

    init() {
        this.measureInitialLoad();
        this.setupPerformanceObserver();
        this.implementLazyLoading();
        this.setupResourcePreloading();
        this.implementCodeSplitting();
        this.setupMemoryManagement();
        this.optimizeRendering();
        this.setupNetworkOptimization();
        this.createPerformanceMonitor();
    }

    measureInitialLoad() {
        // Measure critical loading metrics
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paintEntries = performance.getEntriesByType('paint');

            this.metrics.loadTimes = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalLoad: navigation.loadEventEnd - navigation.fetchStart,
                timeToFirstByte: navigation.responseStart - navigation.requestStart,
                domInteractive: navigation.domInteractive - navigation.fetchStart,
                firstPaint: paintEntries.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0
            };

            this.logPerformanceMetrics('Initial Load', this.metrics.loadTimes);
            this.optimizeBasedOnMetrics();
        });
    }

    setupPerformanceObserver() {
        // Monitor Long Tasks
        if ('PerformanceObserver' in window) {
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                        this.metrics.errors.push({
                            type: 'long-task',
                            duration: entry.duration,
                            timestamp: Date.now()
                        });
                    }
                });
            });

            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task observer not supported');
            }

            // Monitor Layout Shifts
            const layoutShiftObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                list.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });

                if (clsValue > 0.1) { // CLS threshold
                    console.warn(`High Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
                }
            });

            try {
                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.log('Layout shift observer not supported');
            }

            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];

                if (lastEntry.startTime > 2500) { // LCP threshold
                    console.warn(`Slow Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
                }
            });

            try {
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.log('LCP observer not supported');
            }
        }
    }

    implementLazyLoading() {
        // Lazy load images
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observe existing images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        // Lazy load non-critical scripts
        this.lazyLoadScripts([
            { src: 'analytics.js', condition: () => document.querySelector('#analytics-section') },
            { src: 'community.js', condition: () => document.querySelector('#community-section') },
            { src: 'profile.js', condition: () => document.querySelector('#profile-section') }
        ]);

        this.observers.images = imageObserver;
    }

    lazyLoadScripts(scripts) {
        const loadScript = (scriptConfig) => {
            if (scriptConfig.condition && !scriptConfig.condition()) {
                return;
            }

            const script = document.createElement('script');
            script.src = scriptConfig.src;
            script.async = true;
            script.onload = () => {
                console.log(`Lazy loaded: ${scriptConfig.src}`);
            };
            script.onerror = () => {
                console.warn(`Failed to lazy load: ${scriptConfig.src}`);
            };
            document.head.appendChild(script);
        };

        // Load scripts when they become needed
        const checkConditions = () => {
            scripts.forEach(scriptConfig => {
                if (!scriptConfig.loaded && scriptConfig.condition()) {
                    loadScript(scriptConfig);
                    scriptConfig.loaded = true;
                }
            });
        };

        // Check immediately and on scroll/interaction
        checkConditions();

        let ticking = false;
        const throttledCheck = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkConditions();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledCheck, { passive: true });
        window.addEventListener('click', throttledCheck, { passive: true });
    }

    setupResourcePreloading() {
        // Preload critical resources
        const preloadResources = [
            { href: 'styles.css', as: 'style' },
            { href: 'ui-system.js', as: 'script' },
            { href: 'advanced-aim-trainer.js', as: 'script' }
        ];

        preloadResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
            document.head.appendChild(link);
        });

        // Prefetch likely next pages
        const prefetchPages = [
            '/converter.html',
            '/education.html',
            '/analytics.html'
        ];

        // Only prefetch when the user is likely to navigate
        let prefetchTriggered = false;
        const triggerPrefetch = () => {
            if (prefetchTriggered) return;
            prefetchTriggered = true;

            prefetchPages.forEach(page => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = page;
                document.head.appendChild(link);
            });
        };

        // Trigger prefetch on user interaction
        ['mouseenter', 'touchstart', 'focus'].forEach(event => {
            document.addEventListener(event, triggerPrefetch, { once: true, passive: true });
        });
    }

    implementCodeSplitting() {
        // Dynamic import utility
        this.dynamicImport = async (modulePath, condition = true) => {
            if (!condition) return null;

            const cacheKey = `module_${modulePath}`;

            // Check cache first
            if (this.cache.has(cacheKey)) {
                this.metrics.cacheHits++;
                return this.cache.get(cacheKey);
            }

            this.metrics.cacheMisses++;

            try {
                const startTime = performance.now();

                // For demo purposes, simulate dynamic imports
                // In a real implementation, these would be actual ES6 dynamic imports
                const module = await this.loadModuleSimulated(modulePath);

                const loadTime = performance.now() - startTime;
                this.metrics.renderTimes[modulePath] = loadTime;

                // Cache the module
                this.cache.set(cacheKey, module);

                console.log(`Dynamically loaded ${modulePath} in ${loadTime.toFixed(2)}ms`);
                return module;

            } catch (error) {
                console.error(`Failed to load module ${modulePath}:`, error);
                this.metrics.errors.push({
                    type: 'module-load-error',
                    module: modulePath,
                    error: error.message,
                    timestamp: Date.now()
                });
                return null;
            }
        };

        // Load modules on demand
        this.setupOnDemandLoading();
    }

    async loadModuleSimulated(modulePath) {
        // Simulate async module loading
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: modulePath,
                    loaded: true,
                    timestamp: Date.now()
                });
            }, Math.random() * 100 + 50); // 50-150ms simulation
        });
    }

    setupOnDemandLoading() {
        // Load analytics module when analytics section is viewed
        const analyticsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.dynamicImport('analytics-module');
                    analyticsObserver.unobserve(entry.target);
                }
            });
        });

        // Load community module when community features are used
        document.addEventListener('click', (e) => {
            if (e.target.closest('.community-feature')) {
                this.dynamicImport('community-module');
            }
        });

        // Load profile module when profile is accessed
        document.addEventListener('click', (e) => {
            if (e.target.closest('.profile-feature')) {
                this.dynamicImport('profile-module');
            }
        });

        this.observers.analytics = analyticsObserver;
    }

    setupMemoryManagement() {
        // Monitor memory usage
        this.monitorMemory();

        // Cleanup unused resources
        this.setupResourceCleanup();

        // Optimize garbage collection
        this.optimizeGarbageCollection();
    }

    monitorMemory() {
        if ('memory' in performance) {
            const checkMemory = () => {
                const memory = performance.memory;
                this.metrics.memoryUsage = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                };

                // Warn if memory usage is high
                if (this.metrics.memoryUsage.percentage > 80) {
                    console.warn(`High memory usage: ${this.metrics.memoryUsage.percentage.toFixed(1)}%`);
                    this.triggerMemoryCleanup();
                }
            };

            // Check memory every 30 seconds
            setInterval(checkMemory, 30000);
            checkMemory(); // Initial check
        }
    }

    setupResourceCleanup() {
        // Clean up cache when it gets too large
        const maxCacheSize = 50;

        const cleanupCache = () => {
            if (this.cache.size > maxCacheSize) {
                // Remove oldest entries (LRU-style)
                const entries = Array.from(this.cache.entries());
                const toRemove = entries.slice(0, entries.length - maxCacheSize);

                toRemove.forEach(([key]) => {
                    this.cache.delete(key);
                });

                console.log(`Cleaned up ${toRemove.length} cache entries`);
            }
        };

        // Cleanup on visibility change (when user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cleanupCache();
                this.pauseNonEssentialTasks();
            } else {
                this.resumeNonEssentialTasks();
            }
        });
    }

    triggerMemoryCleanup() {
        // Clear caches
        this.cache.clear();

        // Clear old metrics
        const now = Date.now();
        this.metrics.errors = this.metrics.errors.filter(
            error => now - error.timestamp < 300000 // Keep last 5 minutes
        );

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }

        console.log('Memory cleanup completed');
    }

    optimizeGarbageCollection() {
        // Minimize object creation in hot paths
        this.objectPool = {
            vectors: [],
            matrices: [],
            temp: {}
        };

        // Reuse objects where possible
        this.getPooledVector = () => {
            return this.objectPool.vectors.pop() || { x: 0, y: 0 };
        };

        this.returnPooledVector = (vector) => {
            vector.x = 0;
            vector.y = 0;
            this.objectPool.vectors.push(vector);
        };
    }

    optimizeRendering() {
        // Batch DOM updates
        this.domUpdateQueue = [];
        this.frameUpdateScheduled = false;

        this.queueDOMUpdate = (updateFn) => {
            this.domUpdateQueue.push(updateFn);

            if (!this.frameUpdateScheduled) {
                this.frameUpdateScheduled = true;
                requestAnimationFrame(() => {
                    this.processDOMUpdates();
                });
            }
        };

        this.processDOMUpdates = () => {
            const startTime = performance.now();

            // Process all queued updates in a single frame
            while (this.domUpdateQueue.length > 0 && (performance.now() - startTime) < 16) {
                const updateFn = this.domUpdateQueue.shift();
                updateFn();
            }

            this.frameUpdateScheduled = false;

            // If there are still updates, schedule another frame
            if (this.domUpdateQueue.length > 0) {
                requestAnimationFrame(() => this.processDOMUpdates());
            }
        };

        // Optimize scroll events
        this.optimizeScrollEvents();

        // Optimize resize events
        this.optimizeResizeEvents();
    }

    optimizeScrollEvents() {
        let scrollTimeout;
        let isScrolling = false;

        const handleScroll = () => {
            if (!isScrolling) {
                isScrolling = true;
                requestAnimationFrame(() => {
                    // Perform scroll-related updates here
                    this.updateScrollPosition();
                    isScrolling = false;
                });
            }

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Scroll ended
                this.onScrollEnd();
            }, 150);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    optimizeResizeEvents() {
        let resizeTimeout;

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.onResize();
            }, 250);
        };

        window.addEventListener('resize', handleResize, { passive: true });
    }

    updateScrollPosition() {
        // Efficient scroll position updates
        const scrollY = window.pageYOffset;

        // Use transform instead of changing position properties
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            element.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }

    onScrollEnd() {
        // Actions to perform when scrolling stops
        this.checkLazyLoadElements();
        this.updateVisibleContent();
    }

    onResize() {
        // Efficient resize handling
        this.updateCanvasSize();
        this.adjustLayoutBreakpoints();
    }

    checkLazyLoadElements() {
        // Check if new elements need lazy loading
        const newImages = document.querySelectorAll('img[data-src]:not([data-observed])');
        newImages.forEach(img => {
            img.setAttribute('data-observed', 'true');
            this.observers.images.observe(img);
        });
    }

    updateVisibleContent() {
        // Update content that's currently visible
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;

        document.querySelectorAll('.dynamic-content').forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < viewportHeight && rect.bottom > 0;

            if (isVisible && !element.dataset.loaded) {
                this.loadDynamicContent(element);
                element.dataset.loaded = 'true';
            }
        });
    }

    updateCanvasSize() {
        // Efficiently update canvas dimensions
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const container = canvas.parentElement;
            const containerRect = container.getBoundingClientRect();

            // Only update if size actually changed
            if (canvas.width !== containerRect.width || canvas.height !== containerRect.height) {
                canvas.width = containerRect.width;
                canvas.height = containerRect.height;
            }
        }
    }

    adjustLayoutBreakpoints() {
        // Adjust layout based on current viewport
        const width = window.innerWidth;

        if (width < 768 && !document.body.classList.contains('mobile-layout')) {
            document.body.classList.add('mobile-layout');
            document.body.classList.remove('desktop-layout');
        } else if (width >= 768 && !document.body.classList.contains('desktop-layout')) {
            document.body.classList.add('desktop-layout');
            document.body.classList.remove('mobile-layout');
        }
    }

    setupNetworkOptimization() {
        // Monitor network requests
        this.interceptFetch();

        // Implement request deduplication
        this.pendingRequests = new Map();

        // Setup request prioritization
        this.requestQueue = {
            high: [],
            normal: [],
            low: []
        };
    }

    interceptFetch() {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const startTime = performance.now();
            this.metrics.networkRequests++;

            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();

                console.log(`Network request completed in ${(endTime - startTime).toFixed(2)}ms: ${args[0]}`);

                return response;
            } catch (error) {
                const endTime = performance.now();
                console.error(`Network request failed in ${(endTime - startTime).toFixed(2)}ms: ${args[0]}`, error);

                this.metrics.errors.push({
                    type: 'network-error',
                    url: args[0],
                    error: error.message,
                    timestamp: Date.now()
                });

                throw error;
            }
        };
    }

    loadDynamicContent(element) {
        const contentType = element.dataset.contentType;

        switch (contentType) {
            case 'leaderboard':
                this.loadLeaderboardData(element);
                break;
            case 'analytics':
                this.loadAnalyticsData(element);
                break;
            case 'community':
                this.loadCommunityData(element);
                break;
            default:
                console.log(`Loading dynamic content for ${contentType}`);
        }
    }

    async loadLeaderboardData(element) {
        // Simulate loading leaderboard data
        const data = await this.fetchWithCache('/api/leaderboard');
        this.renderLeaderboard(element, data);
    }

    async loadAnalyticsData(element) {
        // Simulate loading analytics data
        const data = await this.fetchWithCache('/api/analytics');
        this.renderAnalytics(element, data);
    }

    async loadCommunityData(element) {
        // Simulate loading community data
        const data = await this.fetchWithCache('/api/community');
        this.renderCommunity(element, data);
    }

    async fetchWithCache(url, options = {}) {
        const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
            this.metrics.cacheHits++;
            return cached.data;
        }

        this.metrics.cacheMisses++;

        // Simulate network request
        const data = await this.simulateNetworkRequest(url);

        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    async simulateNetworkRequest(url) {
        // Simulate various response times
        const delay = Math.random() * 200 + 100; // 100-300ms

        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    url,
                    data: `Simulated data for ${url}`,
                    timestamp: Date.now()
                });
            }, delay);
        });
    }

    renderLeaderboard(element, data) {
        element.innerHTML = `
            <div class="leaderboard-content">
                <h3>Global Leaderboard</h3>
                <p>Data loaded: ${new Date(data.timestamp).toLocaleTimeString()}</p>
            </div>
        `;
    }

    renderAnalytics(element, data) {
        element.innerHTML = `
            <div class="analytics-content">
                <h3>Performance Analytics</h3>
                <p>Data loaded: ${new Date(data.timestamp).toLocaleTimeString()}</p>
            </div>
        `;
    }

    renderCommunity(element, data) {
        element.innerHTML = `
            <div class="community-content">
                <h3>Community Feed</h3>
                <p>Data loaded: ${new Date(data.timestamp).toLocaleTimeString()}</p>
            </div>
        `;
    }

    pauseNonEssentialTasks() {
        // Pause animations and non-critical timers when tab is hidden
        console.log('Pausing non-essential tasks');

        // Stop any running animations
        if (window.requestAnimationFrame) {
            // Cancel any pending animation frames
            this.pausedAnimations = true;
        }

        // Reduce timer frequency
        this.slowMode = true;
    }

    resumeNonEssentialTasks() {
        // Resume tasks when tab becomes visible
        console.log('Resuming non-essential tasks');

        this.pausedAnimations = false;
        this.slowMode = false;
    }

    optimizeBasedOnMetrics() {
        const { loadTimes } = this.metrics;

        // Adjust optimizations based on performance
        if (loadTimes.totalLoad > 3000) { // Slow loading
            console.log('Slow loading detected, enabling aggressive optimizations');
            this.enableAggressiveOptimizations();
        }

        if (loadTimes.firstContentfulPaint > 1500) { // Slow rendering
            console.log('Slow rendering detected, optimizing critical path');
            this.optimizeCriticalPath();
        }
    }

    enableAggressiveOptimizations() {
        // Enable more aggressive optimization strategies
        this.optimizations.imageLoading = true;
        this.optimizations.resourcePreloading = true;
        this.optimizations.codesplitting = true;

        // Reduce image quality for faster loading
        document.querySelectorAll('img').forEach(img => {
            if (img.src && !img.dataset.optimized) {
                img.dataset.optimized = 'true';
                // In a real implementation, this would compress images
            }
        });
    }

    optimizeCriticalPath() {
        // Optimize the critical rendering path

        // Inline critical CSS
        this.inlineCriticalCSS();

        // Defer non-critical JavaScript
        this.deferNonCriticalJS();

        // Prioritize above-the-fold content
        this.prioritizeAboveFold();
    }

    inlineCriticalCSS() {
        // Extract and inline critical CSS
        const criticalStyles = `
            .main-header, .nav-content, .test-arena, .onboarding-overlay {
                /* Critical styles would be inlined here */
            }
        `;

        const style = document.createElement('style');
        style.textContent = criticalStyles;
        document.head.insertBefore(style, document.head.firstChild);
    }

    deferNonCriticalJS() {
        // Add defer attribute to non-critical scripts
        document.querySelectorAll('script[src]').forEach(script => {
            if (!script.dataset.critical) {
                script.defer = true;
            }
        });
    }

    prioritizeAboveFold() {
        // Ensure above-the-fold content loads first
        const aboveFoldElements = document.querySelectorAll('.main-header, .test-setup');
        aboveFoldElements.forEach(element => {
            element.style.contentVisibility = 'auto';
            element.style.containIntrinsicSize = '1000px';
        });
    }

    createPerformanceMonitor() {
        // Create a performance monitoring panel
        const monitor = document.createElement('div');
        monitor.id = 'performance-monitor';
        monitor.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 11px;
            z-index: 10000;
            display: none;
            min-width: 200px;
        `;

        document.body.appendChild(monitor);
        this.performanceMonitor = monitor;

        // Show/hide with Ctrl+Shift+P
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                this.togglePerformanceMonitor();
            }
        });

        // Update monitor every second
        setInterval(() => this.updatePerformanceMonitor(), 1000);
    }

    togglePerformanceMonitor() {
        const isVisible = this.performanceMonitor.style.display !== 'none';
        this.performanceMonitor.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            this.updatePerformanceMonitor();
        }
    }

    updatePerformanceMonitor() {
        if (this.performanceMonitor.style.display === 'none') return;

        const memory = this.metrics.memoryUsage;
        const fps = this.calculateFPS();

        this.performanceMonitor.innerHTML = `
            <div><strong>Performance Monitor</strong></div>
            <div>FPS: ${fps}</div>
            <div>Memory: ${memory.used ? Math.round(memory.used / 1024 / 1024) + 'MB' : 'N/A'}</div>
            <div>Cache: ${this.metrics.cacheHits}/${this.metrics.cacheHits + this.metrics.cacheMisses} hits</div>
            <div>Network: ${this.metrics.networkRequests} requests</div>
            <div>Errors: ${this.metrics.errors.length}</div>
            <div>Load Time: ${this.metrics.loadTimes.totalLoad ? Math.round(this.metrics.loadTimes.totalLoad) + 'ms' : 'N/A'}</div>
            <div style="margin-top: 5px; font-size: 9px; color: #ccc;">Ctrl+Shift+P to toggle</div>
        `;
    }

    calculateFPS() {
        if (!this.fpsCounter) {
            this.fpsCounter = {
                frames: 0,
                lastTime: performance.now(),
                fps: 0
            };

            const countFrame = () => {
                this.fpsCounter.frames++;
                const now = performance.now();

                if (now - this.fpsCounter.lastTime >= 1000) {
                    this.fpsCounter.fps = Math.round((this.fpsCounter.frames * 1000) / (now - this.fpsCounter.lastTime));
                    this.fpsCounter.frames = 0;
                    this.fpsCounter.lastTime = now;
                }

                requestAnimationFrame(countFrame);
            };

            countFrame();
        }

        return this.fpsCounter.fps;
    }

    logPerformanceMetrics(label, metrics) {
        console.group(`🚀 Performance Metrics: ${label}`);
        Object.entries(metrics).forEach(([key, value]) => {
            const formattedValue = typeof value === 'number' ? `${value.toFixed(2)}ms` : value;
            console.log(`${key}: ${formattedValue}`);
        });
        console.groupEnd();
    }

    // Public API for other modules
    async optimizeFor(scenario) {
        switch (scenario) {
            case 'training':
                return this.optimizeForTraining();
            case 'converter':
                return this.optimizeForConverter();
            case 'analytics':
                return this.optimizeForAnalytics();
            default:
                return this.optimizeGeneral();
        }
    }

    async optimizeForTraining() {
        // Specific optimizations for training mode
        this.prioritizeCanvasRendering();
        this.preloadTrainingAssets();
        this.optimizeInputLatency();
    }

    prioritizeCanvasRendering() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            // Ensure canvas gets high priority for rendering
            canvas.style.willChange = 'transform';
            canvas.style.contentVisibility = 'auto';
        }
    }

    preloadTrainingAssets() {
        // Preload assets needed for training
        const assets = ['target-sound.mp3', 'hit-effect.png', 'miss-effect.png'];
        assets.forEach(asset => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = asset;
            document.head.appendChild(link);
        });
    }

    optimizeInputLatency() {
        // Minimize input lag for training scenarios
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.touchAction = 'none';
            canvas.addEventListener('contextmenu', e => e.preventDefault());
        }
    }

    async optimizeForConverter() {
        // Load converter-specific optimizations
        await this.dynamicImport('converter-optimizer');
    }

    async optimizeForAnalytics() {
        // Load analytics-specific optimizations
        await this.dynamicImport('analytics-optimizer');
    }

    optimizeGeneral() {
        // General performance optimizations
        return Promise.resolve();
    }

    // Cleanup method
    destroy() {
        // Clean up observers and event listeners
        Object.values(this.observers).forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });

        // Clear caches
        this.cache.clear();

        // Remove performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.remove();
        }

        console.log('Performance optimizer destroyed');
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();

    // Make it globally accessible
    window.performance.optimizer = window.performanceOptimizer;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}