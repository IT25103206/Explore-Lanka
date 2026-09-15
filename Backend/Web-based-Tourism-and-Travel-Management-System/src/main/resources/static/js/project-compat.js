
document.addEventListener('DOMContentLoaded',function(){
 const b=document.getElementById('projectAccountToggle'),m=document.getElementById('projectAccountMenu');
 b?.addEventListener('click',e=>{e.stopPropagation();m?.classList.toggle('open')});
 document.addEventListener('click',()=>m?.classList.remove('open'));
 document.querySelectorAll('a[href="#"]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
});
