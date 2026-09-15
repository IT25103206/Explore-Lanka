
document.addEventListener("DOMContentLoaded", function () {
    function applyFinalVisionTypography() {
        const p = document.querySelector(".explore-vision-copy");
        if (!p) return;

        let size = "32px";
        let lineHeight = "1.55";

        if (window.innerWidth <= 700) {
            size = "34px";
            lineHeight = "1.3";
        } else if (window.innerWidth <= 1199) {
            size = "48px";
            lineHeight = "1.24";
        }

        [p, ...p.querySelectorAll("*")].forEach(function (el) {
            el.style.setProperty("font-size", size, "important");
            el.style.setProperty("line-height", lineHeight, "important");
            el.style.setProperty("font-family", 'Georgia, "Times New Roman", serif', "important");
        });
    }

    applyFinalVisionTypography();
    window.addEventListener("resize", applyFinalVisionTypography);

    let ticks = 0;
    const timer = setInterval(function () {
        applyFinalVisionTypography();
        ticks++;
        if (ticks > 30) clearInterval(timer);
    }, 200);
});
