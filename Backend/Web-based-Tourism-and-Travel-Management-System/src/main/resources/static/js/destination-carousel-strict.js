
document.addEventListener("DOMContentLoaded",function(){
const map={
"Sri Lanka":{bg:"../images/sigiriya.png",images:["../images/sigiriya.png","../images/yala.png","../images/anuradhapura.png"]},
"Kandy":{bg:"../images/kandy.png",images:["../images/kandy.png","../images/kandy-card.png","../images/destinations/kandy.png"]},
"Mirissa":{bg:"../images/mirissa.png",images:["../images/mirissa.png","../images/mirissa-card.png","../images/mirissa-sunset-wallpaper.png"]},
"Ella":{bg:"../images/ella.png",images:["../images/ella.png","../images/ella-card.png","../images/nine-arch-bridge-about.jpg"]},
"Nuwara Eliya":{bg:"../images/nuwara-eliya.png",images:["../images/nuwara-eliya.png","../images/nuwara-eliya-card.png","../images/horton-plains.png"]},
"Beyond the Highlights":{bg:"../images/trincomalee.png",images:["../images/trincomalee.png","../images/arugam-bay.png","../images/unawatuna.png"]}
};
function apply(){
document.querySelectorAll(".homeDestinationsCarousel__slide[data-slide-title]").forEach(slide=>{
const title=slide.getAttribute("data-slide-title"),cfg=map[title]; if(!cfg)return;
slide.style.setProperty("--destination-bg",`url("${cfg.bg}")`);
slide.querySelectorAll(".homeDestinationsCarousel__images img").forEach((img,i)=>{
if(!cfg.images[i])return;
img.src=cfg.images[i]; img.removeAttribute("srcset");
img.alt=title+" travel experience";
img.style.setProperty("object-fit","cover","important");
img.style.setProperty("object-position","center","important");
});
});
}
apply(); let c=0; const t=setInterval(()=>{apply(); if(++c>=25)clearInterval(t)},200);
});
