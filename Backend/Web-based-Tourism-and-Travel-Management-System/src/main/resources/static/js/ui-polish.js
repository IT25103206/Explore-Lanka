/* Shared presentation enhancements. Does not change API calls, permissions or form state. */
(function () {
    'use strict';
    const customer = location.pathname.startsWith('/customer/');
    const dashboard = /\/dashboard\.html$/.test(location.pathname);

    // Motion uses the browser animation API; content stays visible if scripts fail.
    function initMotion() {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const seen = new WeakSet();
        const active = new Set();
        const selector = '.page-intro,.stats > .stat,#page > .card,#page > .grid > .card,.pkg-card,.event-card,.offer-card,.table tbody tr';
        function animate(node, delay) {
            if (seen.has(node)) return;
            seen.add(node);
            if (preference.matches || !node.animate) return;
            const row = node.matches('tr');
            const animation = node.animate([
                {opacity:0.3, transform:row ? 'translateY(6px)' : 'translateY(20px) scale(.985)'},
                {opacity:1, transform:'translateY(0) scale(1)'}
            ], {duration:row ? 360 : 650, delay, easing:'cubic-bezier(.16,1,.3,1)'});
            active.add(animation);
            animation.finished.catch(() => {}).finally(() => active.delete(animation));
        }
        const entranceObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
            let index = 0;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entranceObserver.unobserve(entry.target);
                animate(entry.target, Math.min(index++, 6) * 65);
            });
        }, {threshold:0.08}) : null;
        function scan(root) {
            if (!root.querySelectorAll) return;
            const nodes = [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
            nodes.forEach(node => {
                if (seen.has(node)) return;
                if (entranceObserver) entranceObserver.observe(node);
                else animate(node, 0);
            });
        }
        scan(document);
        new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
            if (node.nodeType === 1) scan(node);
        }))).observe(document.body, {subtree:true,childList:true});
        window.addEventListener('beforeprint', () => active.forEach(animation => animation.cancel()));
        preference.addEventListener('change', () => {
            if (preference.matches) active.forEach(animation => animation.cancel());
        });
        // A delegated ripple avoids binding duplicate handlers as tables are refreshed.
        document.addEventListener('pointerdown', event => {
            if (preference.matches || event.button !== 0) return;
            const button = event.target.closest('.btn,.icon-btn,.el-shortcuts a,.tabs button');
            if (!button || button.disabled || button.matches('.loading,[aria-disabled="true"]')) return;
            const bounds = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'el-wave'; ripple.setAttribute('aria-hidden','true');
            const size = Math.max(bounds.width, bounds.height) * 2;
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = event.clientX - bounds.left - size / 2 + 'px';
            ripple.style.top = event.clientY - bounds.top - size / 2 + 'px';
            button.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove(), {once:true});
            setTimeout(() => ripple.remove(), 800);
        }, {passive:true});
        // Gentle image depth only for pointer devices; touch scrolling stays native.
        let frame = 0;
        document.addEventListener('pointermove', event => {
            if (preference.matches || event.pointerType !== 'mouse' || frame) return;
            const card = event.target.closest('.pkg-card');
            if (!card) return;
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - .5;
            const y = (event.clientY - bounds.top) / bounds.height - .5;
            frame = requestAnimationFrame(() => {
                card.style.setProperty('--el-image-x', (x * 8).toFixed(1) + 'px');
                card.style.setProperty('--el-image-y', (y * 8).toFixed(1) + 'px');
                frame = 0;
            });
        }, {passive:true});
        document.addEventListener('pointerout', event => {
            const card = event.target.closest('.pkg-card');
            if (card && !card.contains(event.relatedTarget)) {
                card.style.removeProperty('--el-image-x'); card.style.removeProperty('--el-image-y');
            }
        }, {passive:true});
    }

    function boot() {
        document.body.classList.add('el-refresh', customer ? 'el-customer' : 'el-management');
        if (dashboard) document.body.classList.add('el-dashboard');
        const content = document.querySelector('#contentSlot, .main .content');
        if (!content) return false;
        if (content.dataset.elDecorated) return true;
        content.dataset.elDecorated = 'true';
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.querySelector('#sideToggle, [data-menu]');
        if (sidebar && toggle) {
            sidebar.id = sidebar.id || 'el-sidebar';
            toggle.setAttribute('aria-controls', sidebar.id);
            toggle.setAttribute('aria-expanded', String(sidebar.classList.contains('open')));
            toggle.setAttribute('aria-label', 'Open navigation');
            const backdrop = document.createElement('button');
            backdrop.type = 'button'; backdrop.className = 'el-menu-shade';
            backdrop.setAttribute('aria-label', 'Close navigation');
            document.body.appendChild(backdrop);
            const close = () => { sidebar.classList.remove('open'); toggle.focus(); };
            backdrop.addEventListener('click', close);
            document.addEventListener('keydown', event => { if (event.key === 'Escape' && sidebar.classList.contains('open')) close(); });
            new MutationObserver(() => {
                const open = sidebar.classList.contains('open');
                toggle.setAttribute('aria-expanded', String(open));
                toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
            }).observe(sidebar, {attributes:true, attributeFilter:['class']});
        }
        content.id = content.id || 'el-content';
        content.tabIndex = -1;
        const skip = document.createElement('a');
        skip.className = 'el-skip'; skip.href = '#' + content.id; skip.textContent = 'Skip to content';
        document.body.prepend(skip);
        document.querySelectorAll('.sidebar nav a.active').forEach(a => a.setAttribute('aria-current', 'page'));
        // Group customer links without changing their URLs or event handlers.
        if (customer) {
            const groups = {dashboard:'Explore Sri Lanka',bookings:'Your journey',notifications:'Your account'};
            document.querySelectorAll('.sidebar [data-nav]').forEach(a => {
                if (!groups[a.dataset.nav]) return;
                const label = document.createElement('div'); label.className = 'group'; label.textContent = groups[a.dataset.nav];
                a.before(label);
            });
        }
        function decorate(root) {
            const intros = root.matches?.('.page-intro') ? [root] : root.querySelectorAll('.page-intro');
            intros.forEach(intro => {
                if (intro.dataset.elIntro) return;
                intro.dataset.elIntro = 'true';
                const label = document.createElement('span'); label.className = 'el-eyebrow';
                label.textContent = customer ? 'EXPLORE LANKA / YOUR JOURNEY' : 'EXPLORE LANKA / MANAGEMENT';
                const first = intro.firstElementChild;
                if (first && first.tagName === 'DIV') first.prepend(label);
                else {
                    const copy = document.createElement('div');
                    copy.appendChild(label);
                    if (first && first.tagName === 'P') copy.appendChild(first);
                    intro.prepend(copy);
                }
                if (dashboard && !customer) {
                    const shortcuts = document.createElement('div'); shortcuts.className = 'el-shortcuts';
                    ['bookings','packages','reports'].forEach(key => {
                        const nav = document.querySelector('.sidebar [data-nav="' + key + '"]');
                        if (!nav) return;
                        const a = document.createElement('a'); a.href = nav.getAttribute('href'); a.textContent = nav.textContent.trim() + ' →';
                        shortcuts.appendChild(a);
                    });
                    if (shortcuts.children.length) intro.firstElementChild.appendChild(shortcuts);
                }
            });
            const cards = root.matches?.('.card,.stat,.pkg-card,.event-card') ? [root] : root.querySelectorAll('.card,.stat,.pkg-card,.event-card');
            cards.forEach(card => { if (!card.dataset.elEntry) { card.dataset.elEntry='true'; card.classList.add('el-enter'); } });
        }
        decorate(content);
        new MutationObserver(records => {
            records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) decorate(node); }));
        }).observe(content, {childList:true, subtree:true});
        return true;
    }
    function start() {
        initMotion();
        if (boot()) return;
        const observer = new MutationObserver(() => { if (boot()) observer.disconnect(); });
        observer.observe(document.body, {childList:true,subtree:true});
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
