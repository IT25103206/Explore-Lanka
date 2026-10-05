/*
 * Home video scroll reveal (Red Dot style)
 * 1. Video is locked (sticky) on screen.
 * 2. While you scroll, the frame grows from inset 20% -> full screen.
 * 3. When the section ends, the video slides out with a slow parallax.
 * No GSAP needed - works with Lenis smooth scroll too.
 */
(function () {
    function init() {
        var section = document.querySelector('.homeVideo');
        if (!section) return;
        var container = section.querySelector('.homeVideo__container');
        var video = section.querySelector('video');
        if (!container || !video) return;

        var START_INSET = 20;   // % frame at the start (same as reddottours)
        var PARALLAX = 0.30;    // container moves 30% of its height on exit
        var ticking = false;

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            video.style.clipPath = 'inset(0%)';
            return;
        }

        function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

        function update() {
            ticking = false;
            var rect = section.getBoundingClientRect();
            var vh = window.innerHeight;
            var h = rect.height;

            // Phase 1: section center hits viewport bottom -> section bottom hits viewport bottom
            var p1 = clamp((vh - (rect.top + h / 2)) / (h / 2));
            var inset = START_INSET * (1 - p1);
            video.style.clipPath = 'inset(' + inset.toFixed(3) + '%)';
            video.style.webkitClipPath = video.style.clipPath;

            // Phase 2: section bottom hits viewport bottom -> section bottom hits viewport top
            var p2 = clamp((vh - rect.bottom) / vh);
            container.style.transform = 'translate3d(0,' + (p2 * PARALLAX * h).toFixed(2) + 'px,0)';
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }

        window.addEventListener('scroll', onScroll, {passive: true});
        window.addEventListener('resize', onScroll);
        // Lenis smooth scroll support (if used)
        if (window.lenis && typeof window.lenis.on === 'function') window.lenis.on('scroll', onScroll);

        // keep video playing (some browsers pause autoplay)
        var playPromise = video.play && video.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});

        update();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
