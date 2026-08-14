
document.addEventListener("DOMContentLoaded", function () {
    function lockPerfectCenter() {
        const main = document.querySelector(".homeHero .hero__main");
        const title = document.querySelector(".homeHero .hero__heading.hero-perfect-center-title");

        if (main) {
            main.style.removeProperty("transform");
            main.style.removeProperty("translate");
        }

        if (title) {
            title.style.removeProperty("transform");
            title.style.removeProperty("translate");

            title.querySelectorAll(":scope > div").forEach(function (line) {
                line.style.removeProperty("transform");
                line.style.removeProperty("translate");
                line.style.setProperty("text-align", "center", "important");
            });
        }
    }

    lockPerfectCenter();

    let count = 0;
    const timer = setInterval(function () {
        lockPerfectCenter();
        count++;
        if (count >= 20) clearInterval(timer);
    }, 150);
});
