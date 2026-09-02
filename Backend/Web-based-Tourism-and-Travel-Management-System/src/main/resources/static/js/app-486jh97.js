var xd = Object.defineProperty;
var Td = (s, e, t) => e in s ? xd(s, e, {enumerable: !0, configurable: !0, writable: !0, value: t}) : s[e] = t;
var V = (s, e, t) => Td(s, typeof e != "symbol" ? e + "" : e, t);

function ft() {
    if (!(this instanceof ft)) return new ft;
    this.size = 0, this.uid = 0, this.selectors = [], this.selectorObjects = {}, this.indexes = Object.create(this.indexes), this.activeIndexes = []
}

var fs = window.document.documentElement,
    Ed = fs.matches || fs.webkitMatchesSelector || fs.mozMatchesSelector || fs.oMatchesSelector || fs.msMatchesSelector;
ft.prototype.matchesSelector = function (s, e) {
    return Ed.call(s, e)
};
ft.prototype.querySelectorAll = function (s, e) {
    return e.querySelectorAll(s)
};
ft.prototype.indexes = [];
var Cd = /^#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
ft.prototype.indexes.push({
    name: "ID", selector: function (e) {
        var t;
        if (t = e.match(Cd)) return t[0].slice(1)
    }, element: function (e) {
        if (e.id) return [e.id]
    }
});
var Pd = /^\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
ft.prototype.indexes.push({
    name: "CLASS", selector: function (e) {
        var t;
        if (t = e.match(Pd)) return t[0].slice(1)
    }, element: function (e) {
        var t = e.className;
        if (t) {
            if (typeof t == "string") return t.split(/\s/);
            if (typeof t == "object" && "baseVal" in t) return t.baseVal.split(/\s/)
        }
    }
});
var Ld = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
ft.prototype.indexes.push({
    name: "TAG", selector: function (e) {
        var t;
        if (t = e.match(Ld)) return t[0].toUpperCase()
    }, element: function (e) {
        return [e.nodeName.toUpperCase()]
    }
});
ft.prototype.indexes.default = {
    name: "UNIVERSAL", selector: function () {
        return !0
    }, element: function () {
        return [!0]
    }
};
var Ho;
typeof window.Map == "function" ? Ho = window.Map : Ho = function () {
    function s() {
        this.map = {}
    }

    return s.prototype.get = function (e) {
        return this.map[e + " "]
    }, s.prototype.set = function (e, t) {
        this.map[e + " "] = t
    }, s
}();
var sl = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g;

function pc(s, e) {
    s = s.slice(0).concat(s.default);
    var t = s.length, i, r, n, o, a = e, l, c, u = [];
    do if (sl.exec(""), (n = sl.exec(a)) && (a = n[3], n[2] || !a)) {
        for (i = 0; i < t; i++) if (c = s[i], l = c.selector(n[1])) {
            for (r = u.length, o = !1; r--;) if (u[r].index === c && u[r].key === l) {
                o = !0;
                break
            }
            o || u.push({index: c, key: l});
            break
        }
    } while (n);
    return u
}

function Md(s, e) {
    var t, i, r;
    for (t = 0, i = s.length; t < i; t++) if (r = s[t], e.isPrototypeOf(r)) return r
}

ft.prototype.logDefaultIndexUsed = function () {
};
ft.prototype.add = function (s, e) {
    var t, i, r, n, o, a, l, c, u = this.activeIndexes, d = this.selectors, f = this.selectorObjects;
    if (typeof s == "string") {
        for (t = {
            id: this.uid++,
            selector: s,
            data: e
        }, f[t.id] = t, l = pc(this.indexes, s), i = 0; i < l.length; i++) c = l[i], n = c.key, r = c.index, o = Md(u, r), o || (o = Object.create(r), o.map = new Ho, u.push(o)), r === this.indexes.default && this.logDefaultIndexUsed(t), a = o.map.get(n), a || (a = [], o.map.set(n, a)), a.push(t);
        this.size++, d.push(s)
    }
};
ft.prototype.remove = function (s, e) {
    if (typeof s == "string") {
        var t, i, r, n, o, a, l, c, u = this.activeIndexes, d = this.selectors = [], f = this.selectorObjects, p = {},
            m = arguments.length === 1;
        for (t = pc(this.indexes, s), r = 0; r < t.length; r++) for (i = t[r], n = u.length; n--;) if (a = u[n], i.index.isPrototypeOf(a)) {
            if (l = a.map.get(i.key), l) for (o = l.length; o--;) c = l[o], c.selector === s && (m || c.data === e) && (l.splice(o, 1), p[c.id] = !0);
            break
        }
        for (r in p) delete f[r], this.size--;
        for (r in f) d.push(f[r].selector)
    }
};

function hc(s, e) {
    return s.id - e.id
}

ft.prototype.queryAll = function (s) {
    if (!this.selectors.length) return [];
    var e = {}, t = [], i = this.querySelectorAll(this.selectors.join(", "), s), r, n, o, a, l, c, u, d;
    for (r = 0, o = i.length; r < o; r++) for (l = i[r], c = this.matches(l), n = 0, a = c.length; n < a; n++) d = c[n], e[d.id] ? u = e[d.id] : (u = {
        id: d.id,
        selector: d.selector,
        data: d.data,
        elements: []
    }, e[d.id] = u, t.push(u)), u.elements.push(l);
    return t.sort(hc)
};
ft.prototype.matches = function (s) {
    if (!s) return [];
    var e, t, i, r, n, o, a, l, c, u, d, f = this.activeIndexes, p = {}, m = [];
    for (e = 0, r = f.length; e < r; e++) if (a = f[e], l = a.element(s), l) {
        for (t = 0, n = l.length; t < n; t++) if (c = a.map.get(l[t])) for (i = 0, o = c.length; i < o; i++) u = c[i], d = u.id, !p[d] && this.matchesSelector(s, u.selector) && (p[d] = !0, m.push(u))
    }
    return m.sort(hc)
};
const Vr = {}, Vi = {}, $o = ["mouseenter", "mouseleave", "pointerenter", "pointerleave", "blur", "focus"];

function nl(s) {
    Vi[s] === void 0 && (Vi[s] = new Set)
}

function Ad(s, e) {
    Vi[s] && Vi[s].forEach(t => {
        t(...e)
    })
}

function ol(s) {
    return typeof s == "string" ? document.querySelectorAll(s) : s
}

function sn(s) {
    let e = kd(Vr[s.type], s.target);
    if (e.length) for (let t = 0; t < e.length; t++) for (let i = 0; i < e[t].stack.length; i++) $o.indexOf(s.type) !== -1 ? (al(s, e[t].delegatedTarget), s.target === e[t].delegatedTarget && e[t].stack[i].data(s)) : (al(s, e[t].delegatedTarget), e[t].stack[i].data(s))
}

function kd(s, e) {
    const t = [];
    let i = e;
    do {
        if (i.nodeType !== 1) break;
        const r = s.matches(i);
        r.length && t.push({delegatedTarget: i, stack: r})
    } while (i = i.parentElement);
    return t
}

function al(s, e) {
    Object.defineProperty(s, "currentTarget", {configurable: !0, enumerable: !0, get: () => e})
}

function Od(s) {
    const e = {};
    for (const t in s) e[t] = [...s[t]];
    return e
}

class Id {
    bindAll(e, t) {
        t || (t = Object.getOwnPropertyNames(Object.getPrototypeOf(e)));
        for (let i = 0; i < t.length; i++) e[t[i]] = e[t[i]].bind(e)
    }

    on(e, t, i, r) {
        const n = e.split(" ");
        for (let o = 0; o < n.length; o++) {
            if (typeof t == "function" && i === void 0) {
                nl(n[o]), Vi[n[o]].add(t);
                continue
            }
            if (t.nodeType && t.nodeType === 1 || t === window || t === document) {
                t.addEventListener(n[o], i, r);
                continue
            }
            t = ol(t);
            for (let a = 0; a < t.length; a++) t[a].addEventListener(n[o], i, r)
        }
    }

    delegate(e, t, i) {
        const r = e.split(" ");
        for (let n = 0; n < r.length; n++) {
            let o = Vr[r[n]];
            o === void 0 && (o = new ft, Vr[r[n]] = o, $o.indexOf(r[n]) !== -1 ? document.addEventListener(r[n], sn, !0) : document.addEventListener(r[n], sn)), o.add(t, i)
        }
    }

    off(e, t, i, r) {
        var o;
        const n = e.split(" ");
        for (let a = 0; a < n.length; a++) {
            if (t === void 0) {
                (o = Vi[n[a]]) == null || o.clear();
                continue
            }
            if (typeof t == "function") {
                nl(n[a]), Vi[n[a]].delete(t);
                continue
            }
            const l = Vr[n[a]];
            if (l !== void 0 && (l.remove(t, i), l.size === 0)) {
                delete Vr[n[a]], $o.indexOf(n[a]) !== -1 ? document.removeEventListener(n[a], sn, !0) : document.removeEventListener(n[a], sn);
                continue
            }
            if (t.removeEventListener !== void 0) {
                t.removeEventListener(n[a], i, r);
                continue
            }
            t = ol(t);
            for (let c = 0; c < t.length; c++) t[c].removeEventListener(n[a], i, r)
        }
    }

    emit(e, ...t) {
        Ad(e, t)
    }

    debugDelegated() {
        return JSON.parse(JSON.stringify(Vr))
    }

    debugBus() {
        return Od(Vi)
    }

    hasBus(e) {
        return this.debugBus().hasOwnProperty(e)
    }
}

const qi = new Id, Dd = new DOMParser;

function Rd(s) {
    return typeof s == "string" ? Dd.parseFromString(s, "text/html") : s
}

function Si(s) {
    const e = new URL(s, window.location.origin), t = e.hash.length ? s.replace(e.hash, "") : null;
    return {
        hasHash: e.hash.length > 0,
        pathname: e.pathname.replace(/\/+$/, ""),
        host: e.host,
        search: e.search,
        raw: s,
        href: t || e.href
    }
}

function ll(s, e) {
    s.parentNode.replaceChild(mc(s, e), s)
}

function cl(s, e) {
    (s.parentNode.tagName === "HEAD" ? document.head : document.body).appendChild(mc(s, e))
}

function mc(s, e) {
    const t = document.createElement(e);
    for (let i = 0; i < s.attributes.length; i++) {
        const r = s.attributes[i];
        t.setAttribute(r.nodeName, r.nodeValue)
    }
    return s.innerHTML && (t.innerHTML = s.innerHTML), t
}

class Dn {
    constructor({wrapper: e}) {
        this.wrapper = e
    }

    leave(e) {
        return new Promise(t => {
            this.onLeave({...e, done: t})
        })
    }

    enter(e) {
        return new Promise(t => {
            this.onEnter({...e, done: t})
        })
    }

    onLeave({from: e, trigger: t, done: i}) {
        i()
    }

    onEnter({to: e, trigger: t, done: i}) {
        i()
    }
}

class Go {
    constructor({content: e, page: t, title: i, wrapper: r}) {
        this._contentString = e.outerHTML, this._DOM = null, this.page = t, this.title = i, this.wrapper = r, this.content = this.wrapper.lastElementChild
    }

    onEnter() {
    }

    onEnterCompleted() {
    }

    onLeave() {
    }

    onLeaveCompleted() {
    }

    initialLoad() {
        this.onEnter(), this.onEnterCompleted()
    }

    update() {
        document.title = this.title, this.wrapper.appendChild(this._DOM.firstElementChild), this.content = this.wrapper.lastElementChild, this._DOM = null
    }

    createDom() {
        this._DOM || (this._DOM = document.createElement("div"), this._DOM.innerHTML = this._contentString)
    }

    remove() {
        this.wrapper.firstElementChild.remove()
    }

    enter(e, t) {
        return new Promise(i => {
            this.onEnter(), e.enter({trigger: t, to: this.content}).then(() => {
                this.onEnterCompleted(), i()
            })
        })
    }

    leave(e, t, i) {
        return new Promise(r => {
            this.onLeave(), e.leave({trigger: t, from: this.content}).then(() => {
                i && this.remove(), this.onLeaveCompleted(), r()
            })
        })
    }
}

class qd {
    constructor() {
        V(this, "data", new Map);
        V(this, "regexCache", new Map)
    }

    add(e, t, i) {
        this.data.has(e) || (this.data.set(e, new Map), this.regexCache.set(e, new RegExp(`^${e}$`))), this.data.get(e).set(t, i), this.regexCache.set(t, new RegExp(`^${t}$`))
    }

    findMatch(e, t) {
        for (const [i, r] of this.data) if (e.pathname.match(this.regexCache.get(i))) {
            for (const [n, o] of r) if (t.pathname.match(this.regexCache.get(n))) return o;
            break
        }
        return null
    }
}

const ul = "A transition is currently in progress";

class zd {
    constructor(e = {}) {
        V(this, "isTransitioning", !1);
        V(this, "currentCacheEntry", null);
        V(this, "cache", new Map);
        V(this, "activePromises", new Map);
        V(this, "onClick", e => {
            if (!(e.metaKey || e.ctrlKey)) {
                const t = Si(e.currentTarget.href);
                if (this.currentLocation = Si(window.location.href), this.currentLocation.host !== t.host) return;
                if (this.currentLocation.href !== t.href || this.currentLocation.hasHash && !t.hasHash) {
                    e.preventDefault(), this.navigateTo(t.raw, e.currentTarget.dataset.transition || !1, e.currentTarget).catch(i => console.warn(i));
                    return
                }
                !this.currentLocation.hasHash && !t.hasHash && e.preventDefault()
            }
        });
        V(this, "onPopstate", () => {
            const e = Si(window.location.href);
            if (e.pathname === this.currentLocation.pathname && e.search === this.currentLocation.search && !this.isPopping) return !1;
            if (!this.allowInterruption && (this.isTransitioning || this.isPopping)) return window.history.pushState({}, "", this.popTarget), console.warn(ul), !1;
            this.isPopping || (this.popTarget = window.location.href), this.isPopping = !0, this.navigateTo(window.location.href, !1, "popstate")
        });
        V(this, "onPrefetch", e => {
            const t = Si(e.currentTarget.href);
            this.currentLocation.host === t.host && this.preload(e.currentTarget.href, !1)
        });
        const {
            links: t = "a[href]:not([target]):not([href^=\\#]):not([data-taxi-ignore])",
            removeOldContent: i = !0,
            allowInterruption: r = !1,
            bypassCache: n = !1,
            enablePrefetch: o = !0,
            renderers: a = {default: Go},
            transitions: l = {default: Dn},
            reloadJsFilter: c = d => d.dataset.taxiReload !== void 0,
            reloadCssFilter: u = d => !0
        } = e;
        this.renderers = a, this.transitions = l, this.defaultRenderer = this.renderers.default || Go, this.defaultTransition = this.transitions.default || Dn, this.wrapper = document.querySelector("[data-taxi]"), this.reloadJsFilter = c, this.reloadCssFilter = u, this.removeOldContent = i, this.allowInterruption = r, this.bypassCache = n, this.enablePrefetch = o, this.cache = new Map, this.isPopping = !1, this.attachEvents(t), this.currentLocation = Si(window.location.href), this.cache.set(this.currentLocation.href, this.createCacheEntry(document.cloneNode(!0), window.location.href)), this.currentCacheEntry = this.cache.get(this.currentLocation.href), this.currentCacheEntry.renderer.initialLoad()
    }

    setDefaultRenderer(e) {
        this.defaultRenderer = this.renderers[e]
    }

    setDefaultTransition(e) {
        this.defaultTransition = this.transitions[e]
    }

    addRoute(e, t, i) {
        this.router || (this.router = new qd), this.router.add(e, t, i)
    }

    preload(e, t = !1) {
        return e = Si(e).href, this.cache.has(e) ? Promise.resolve() : this.fetch(e, !1).then(async i => {
            this.cache.set(e, this.createCacheEntry(i.html, i.url)), t && this.cache.get(e).renderer.createDom()
        }).catch(i => console.warn(i))
    }

    updateCache(e) {
        const t = Si(e || window.location.href).href;
        this.cache.has(t) && this.cache.delete(t), this.cache.set(t, this.createCacheEntry(document.cloneNode(!0), t))
    }

    clearCache(e) {
        const t = Si(e || window.location.href).href;
        this.cache.has(t) && this.cache.delete(t)
    }

    navigateTo(e, t = !1, i = !1) {
        return new Promise((r, n) => {
            if (!this.allowInterruption && this.isTransitioning) {
                n(new Error(ul));
                return
            }
            this.isTransitioning = !0, this.isPopping = !0, this.targetLocation = Si(e), this.popTarget = window.location.href;
            const o = new (this.chooseTransition(t))({wrapper: this.wrapper});
            let a;
            if (this.bypassCache || !this.cache.has(this.targetLocation.href) || this.cache.get(this.targetLocation.href).skipCache) {
                const l = this.fetch(this.targetLocation.href).then(c => {
                    this.cache.set(this.targetLocation.href, this.createCacheEntry(c.html, c.url)), this.cache.get(this.targetLocation.href).renderer.createDom()
                }).catch(c => {
                    window.location.href = e
                });
                a = this.beforeFetch(this.targetLocation, o, i).then(async () => l.then(async () => await this.afterFetch(this.targetLocation, o, this.cache.get(this.targetLocation.href), i)))
            } else this.cache.get(this.targetLocation.href).renderer.createDom(), a = this.beforeFetch(this.targetLocation, o, i).then(async () => await this.afterFetch(this.targetLocation, o, this.cache.get(this.targetLocation.href), i));
            a.then(() => {
                r()
            })
        })
    }

    on(e, t) {
        qi.on(e, t)
    }

    off(e, t) {
        qi.off(e, t)
    }

    beforeFetch(e, t, i) {
        return qi.emit("NAVIGATE_OUT", {from: this.currentCacheEntry, trigger: i}), new Promise(r => {
            this.currentCacheEntry.renderer.leave(t, i, this.removeOldContent).then(() => {
                i !== "popstate" && window.history.pushState({}, "", e.raw), r()
            })
        })
    }

    afterFetch(e, t, i, r) {
        return this.currentLocation = e, this.popTarget = this.currentLocation.href, new Promise(n => {
            i.renderer.update(), qi.emit("NAVIGATE_IN", {
                from: this.currentCacheEntry,
                to: i,
                trigger: r
            }), this.reloadJsFilter && this.loadScripts(i.scripts), this.reloadCssFilter && this.loadStyles(i.styles), r !== "popstate" && e.href !== i.finalUrl && window.history.replaceState({}, "", i.finalUrl), i.renderer.enter(t, r).then(() => {
                qi.emit("NAVIGATE_END", {
                    from: this.currentCacheEntry,
                    to: i,
                    trigger: r
                }), this.currentCacheEntry = i, this.isTransitioning = !1, this.isPopping = !1, n()
            })
        })
    }

    loadScripts(e) {
        const t = [...e], i = Array.from(document.querySelectorAll("script")).filter(this.reloadJsFilter);
        for (let r = 0; r < i.length; r++) for (let n = 0; n < t.length; n++) if (i[r].outerHTML === t[n].outerHTML) {
            ll(i[r], "SCRIPT"), t.splice(n, 1);
            break
        }
        for (const r of t) cl(r, "SCRIPT")
    }

    loadStyles(e) {
        const t = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(this.reloadCssFilter),
            i = Array.from(document.querySelectorAll("style")).filter(this.reloadCssFilter), r = e.filter(n => {
                if (n.href) {
                    if (!t.find(o => o.href === n.href)) return document.body.append(n), !1
                } else return !0
            });
        for (let n = 0; n < i.length; n++) for (let o = 0; o < r.length; o++) if (i[n].outerHTML === r[o].outerHTML) {
            ll(i[n], "STYLE"), r.splice(o, 1);
            break
        }
        for (const n of r) cl(n, "STYLE")
    }

    attachEvents(e) {
        qi.delegate("click", e, this.onClick), qi.on("popstate", window, this.onPopstate), this.enablePrefetch && qi.delegate("mouseenter focus", e, this.onPrefetch)
    }

    fetch(e, t = !0) {
        if (this.activePromises.has(e)) return this.activePromises.get(e);
        const i = new Promise((r, n) => {
            let o;
            fetch(e, {
                mode: "same-origin",
                method: "GET",
                headers: {"X-Requested-With": "Taxi"},
                credentials: "same-origin"
            }).then(a => (a.ok || (n("Taxi encountered a non 2xx HTTP status code"), t && (window.location.href = e)), o = a.url, a.text())).then(a => {
                r({html: Rd(a), url: o})
            }).catch(a => {
                n(a), t && (window.location.href = e)
            }).finally(() => {
                this.activePromises.delete(e)
            })
        });
        return this.activePromises.set(e, i), i
    }

    chooseTransition(e) {
        var i;
        if (e) return this.transitions[e];
        const t = (i = this.router) == null ? void 0 : i.findMatch(this.currentLocation, this.targetLocation);
        return t ? this.transitions[t] : this.defaultTransition
    }

    createCacheEntry(e, t) {
        const i = e.querySelector("[data-taxi-view]"),
            r = i.dataset.taxiView.length ? this.renderers[i.dataset.taxiView] : this.defaultRenderer;
        return r || console.warn(`The Renderer "${i.dataset.taxiView}" was set in the data-taxi-view of the requested page, but not registered in Taxi.`), {
            page: e,
            content: i,
            finalUrl: t,
            skipCache: i.hasAttribute("data-taxi-nocache"),
            scripts: this.reloadJsFilter ? Array.from(e.querySelectorAll("script")).filter(this.reloadJsFilter) : [],
            styles: this.reloadCssFilter ? Array.from(e.querySelectorAll('link[rel="stylesheet"], style')).filter(this.reloadCssFilter) : [],
            title: e.title,
            renderer: new r({wrapper: this.wrapper, title: e.title, content: i, page: e})
        }
    }
}

var Bd = "1.3.4";

function gc(s, e, t) {
    return Math.max(s, Math.min(e, t))
}

function Fd(s, e, t) {
    return (1 - t) * s + t * e
}

function Vd(s, e, t, i) {
    return Fd(s, e, 1 - Math.exp(-t * i))
}

function Nd(s, e) {
    return (s % e + e) % e
}

var Hd = class {
    constructor() {
        V(this, "isRunning", !1);
        V(this, "value", 0);
        V(this, "from", 0);
        V(this, "to", 0);
        V(this, "currentTime", 0);
        V(this, "lerp");
        V(this, "duration");
        V(this, "easing");
        V(this, "onUpdate")
    }

    advance(s) {
        var t;
        if (!this.isRunning) return;
        let e = !1;
        if (this.duration && this.easing) {
            this.currentTime += s;
            const i = gc(0, this.currentTime / this.duration, 1);
            e = i >= 1;
            const r = e ? 1 : this.easing(i);
            this.value = this.from + (this.to - this.from) * r
        } else this.lerp ? (this.value = Vd(this.value, this.to, this.lerp * 60, s), Math.round(this.value) === this.to && (this.value = this.to, e = !0)) : (this.value = this.to, e = !0);
        e && this.stop(), (t = this.onUpdate) == null || t.call(this, this.value, e)
    }

    stop() {
        this.isRunning = !1
    }

    fromTo(s, e, {lerp: t, duration: i, easing: r, onStart: n, onUpdate: o}) {
        this.from = this.value = s, this.to = e, this.lerp = t, this.duration = i, this.easing = r, this.currentTime = 0, this.isRunning = !0, n == null || n(), this.onUpdate = o
    }
};

function $d(s, e) {
    let t;
    return function (...i) {
        let r = this;
        clearTimeout(t), t = setTimeout(() => {
            t = void 0, s.apply(r, i)
        }, e)
    }
}

var Gd = class {
    constructor(s, e, {autoResize: t = !0, debounce: i = 250} = {}) {
        V(this, "width", 0);
        V(this, "height", 0);
        V(this, "scrollHeight", 0);
        V(this, "scrollWidth", 0);
        V(this, "debouncedResize");
        V(this, "wrapperResizeObserver");
        V(this, "contentResizeObserver");
        V(this, "resize", () => {
            this.onWrapperResize(), this.onContentResize()
        });
        V(this, "onWrapperResize", () => {
            this.wrapper instanceof Window ? (this.width = window.innerWidth, this.height = window.innerHeight) : (this.width = this.wrapper.clientWidth, this.height = this.wrapper.clientHeight)
        });
        V(this, "onContentResize", () => {
            this.wrapper instanceof Window ? (this.scrollHeight = this.content.scrollHeight, this.scrollWidth = this.content.scrollWidth) : (this.scrollHeight = this.wrapper.scrollHeight, this.scrollWidth = this.wrapper.scrollWidth)
        });
        this.wrapper = s, this.content = e, t && (this.debouncedResize = $d(this.resize, i), this.wrapper instanceof Window ? window.addEventListener("resize", this.debouncedResize, !1) : (this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize), this.wrapperResizeObserver.observe(this.wrapper)), this.contentResizeObserver = new ResizeObserver(this.debouncedResize), this.contentResizeObserver.observe(this.content)), this.resize()
    }

    destroy() {
        var s, e;
        (s = this.wrapperResizeObserver) == null || s.disconnect(), (e = this.contentResizeObserver) == null || e.disconnect(), this.wrapper === window && this.debouncedResize && window.removeEventListener("resize", this.debouncedResize, !1)
    }

    get limit() {
        return {x: this.scrollWidth - this.width, y: this.scrollHeight - this.height}
    }
}, vc = class {
    constructor() {
        V(this, "events", {})
    }

    emit(s, ...e) {
        var i;
        let t = this.events[s] || [];
        for (let r = 0, n = t.length; r < n; r++) (i = t[r]) == null || i.call(t, ...e)
    }

    on(s, e) {
        var t;
        return (t = this.events[s]) != null && t.push(e) || (this.events[s] = [e]), () => {
            var i;
            this.events[s] = (i = this.events[s]) == null ? void 0 : i.filter(r => e !== r)
        }
    }

    off(s, e) {
        var t;
        this.events[s] = (t = this.events[s]) == null ? void 0 : t.filter(i => e !== i)
    }

    destroy() {
        this.events = {}
    }
}, dl = 100 / 6, zi = {passive: !1}, Wd = class {
    constructor(s, e = {wheelMultiplier: 1, touchMultiplier: 1}) {
        V(this, "touchStart", {x: 0, y: 0});
        V(this, "lastDelta", {x: 0, y: 0});
        V(this, "window", {width: 0, height: 0});
        V(this, "emitter", new vc);
        V(this, "onTouchStart", s => {
            const {clientX: e, clientY: t} = s.targetTouches ? s.targetTouches[0] : s;
            this.touchStart.x = e, this.touchStart.y = t, this.lastDelta = {
                x: 0,
                y: 0
            }, this.emitter.emit("scroll", {deltaX: 0, deltaY: 0, event: s})
        });
        V(this, "onTouchMove", s => {
            const {clientX: e, clientY: t} = s.targetTouches ? s.targetTouches[0] : s,
                i = -(e - this.touchStart.x) * this.options.touchMultiplier,
                r = -(t - this.touchStart.y) * this.options.touchMultiplier;
            this.touchStart.x = e, this.touchStart.y = t, this.lastDelta = {
                x: i,
                y: r
            }, this.emitter.emit("scroll", {deltaX: i, deltaY: r, event: s})
        });
        V(this, "onTouchEnd", s => {
            this.emitter.emit("scroll", {deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event: s})
        });
        V(this, "onWheel", s => {
            let {deltaX: e, deltaY: t, deltaMode: i} = s;
            const r = i === 1 ? dl : i === 2 ? this.window.width : 1,
                n = i === 1 ? dl : i === 2 ? this.window.height : 1;
            e *= r, t *= n, e *= this.options.wheelMultiplier, t *= this.options.wheelMultiplier, this.emitter.emit("scroll", {
                deltaX: e,
                deltaY: t,
                event: s
            })
        });
        V(this, "onWindowResize", () => {
            this.window = {width: window.innerWidth, height: window.innerHeight}
        });
        this.element = s, this.options = e, window.addEventListener("resize", this.onWindowResize, !1), this.onWindowResize(), this.element.addEventListener("wheel", this.onWheel, zi), this.element.addEventListener("touchstart", this.onTouchStart, zi), this.element.addEventListener("touchmove", this.onTouchMove, zi), this.element.addEventListener("touchend", this.onTouchEnd, zi)
    }

    on(s, e) {
        return this.emitter.on(s, e)
    }

    destroy() {
        this.emitter.destroy(), window.removeEventListener("resize", this.onWindowResize, !1), this.element.removeEventListener("wheel", this.onWheel, zi), this.element.removeEventListener("touchstart", this.onTouchStart, zi), this.element.removeEventListener("touchmove", this.onTouchMove, zi), this.element.removeEventListener("touchend", this.onTouchEnd, zi)
    }
}, fl = s => Math.min(1, 1.001 - Math.pow(2, -10 * s)), Yd = class {
    constructor({
                    wrapper: s = window,
                    content: e = document.documentElement,
                    eventsTarget: t = s,
                    smoothWheel: i = !0,
                    syncTouch: r = !1,
                    syncTouchLerp: n = .075,
                    touchInertiaMultiplier: o = 35,
                    duration: a,
                    easing: l,
                    lerp: c = .1,
                    infinite: u = !1,
                    orientation: d = "vertical",
                    gestureOrientation: f = "vertical",
                    touchMultiplier: p = 1,
                    wheelMultiplier: m = 1,
                    autoResize: h = !0,
                    prevent: g,
                    virtualScroll: y,
                    overscroll: v = !0,
                    autoRaf: _ = !1,
                    anchors: w = !1,
                    autoToggle: b = !1,
                    allowNestedScroll: T = !1,
                    __experimental__naiveDimensions: x = !1
                } = {}) {
        V(this, "_isScrolling", !1);
        V(this, "_isStopped", !1);
        V(this, "_isLocked", !1);
        V(this, "_preventNextNativeScrollEvent", !1);
        V(this, "_resetVelocityTimeout", null);
        V(this, "__rafID", null);
        V(this, "isTouching");
        V(this, "time", 0);
        V(this, "userData", {});
        V(this, "lastVelocity", 0);
        V(this, "velocity", 0);
        V(this, "direction", 0);
        V(this, "options");
        V(this, "targetScroll");
        V(this, "animatedScroll");
        V(this, "animate", new Hd);
        V(this, "emitter", new vc);
        V(this, "dimensions");
        V(this, "virtualScroll");
        V(this, "onScrollEnd", s => {
            s instanceof CustomEvent || (this.isScrolling === "smooth" || this.isScrolling === !1) && s.stopPropagation()
        });
        V(this, "dispatchScrollendEvent", () => {
            this.options.wrapper.dispatchEvent(new CustomEvent("scrollend", {
                bubbles: this.options.wrapper === window,
                detail: {lenisScrollEnd: !0}
            }))
        });
        V(this, "onTransitionEnd", s => {
            if (s.propertyName.includes("overflow")) {
                const e = this.isHorizontal ? "overflow-x" : "overflow-y", t = getComputedStyle(this.rootElement)[e];
                ["hidden", "clip"].includes(t) ? this.stop() : this.start()
            }
        });
        V(this, "onClick", s => {
            const t = s.composedPath().find(i => {
                var r, n, o;
                return i instanceof HTMLAnchorElement && (((r = i.getAttribute("href")) == null ? void 0 : r.startsWith("#")) || ((n = i.getAttribute("href")) == null ? void 0 : n.startsWith("/#")) || ((o = i.getAttribute("href")) == null ? void 0 : o.startsWith("./#")))
            });
            if (t) {
                const i = t.getAttribute("href");
                if (i) {
                    const r = typeof this.options.anchors == "object" && this.options.anchors ? this.options.anchors : void 0;
                    let n = `#${i.split("#")[1]}`;
                    ["#", "/#", "./#", "#top", "/#top", "./#top"].includes(i) && (n = 0), this.scrollTo(n, r)
                }
            }
        });
        V(this, "onPointerDown", s => {
            s.button === 1 && this.reset()
        });
        V(this, "onVirtualScroll", s => {
            if (typeof this.options.virtualScroll == "function" && this.options.virtualScroll(s) === !1) return;
            const {deltaX: e, deltaY: t, event: i} = s;
            if (this.emitter.emit("virtual-scroll", {
                deltaX: e,
                deltaY: t,
                event: i
            }), i.ctrlKey || i.lenisStopPropagation) return;
            const r = i.type.includes("touch"), n = i.type.includes("wheel");
            this.isTouching = i.type === "touchstart" || i.type === "touchmove";
            const o = e === 0 && t === 0;
            if (this.options.syncTouch && r && i.type === "touchstart" && o && !this.isStopped && !this.isLocked) {
                this.reset();
                return
            }
            const l = this.options.gestureOrientation === "vertical" && t === 0 || this.options.gestureOrientation === "horizontal" && e === 0;
            if (o || l) return;
            let c = i.composedPath();
            c = c.slice(0, c.indexOf(this.rootElement));
            const u = this.options.prevent;
            if (c.find(g => {
                var y, v, _;
                return g instanceof HTMLElement && (typeof u == "function" && (u == null ? void 0 : u(g)) || ((y = g.hasAttribute) == null ? void 0 : y.call(g, "data-lenis-prevent")) || r && ((v = g.hasAttribute) == null ? void 0 : v.call(g, "data-lenis-prevent-touch")) || n && ((_ = g.hasAttribute) == null ? void 0 : _.call(g, "data-lenis-prevent-wheel")) || this.options.allowNestedScroll && this.checkNestedScroll(g, {
                    deltaX: e,
                    deltaY: t
                }))
            })) return;
            if (this.isStopped || this.isLocked) {
                i.preventDefault();
                return
            }
            if (!(this.options.syncTouch && r || this.options.smoothWheel && n)) {
                this.isScrolling = "native", this.animate.stop(), i.lenisStopPropagation = !0;
                return
            }
            let f = t;
            this.options.gestureOrientation === "both" ? f = Math.abs(t) > Math.abs(e) ? t : e : this.options.gestureOrientation === "horizontal" && (f = e), (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && t > 0 || this.animatedScroll === this.limit && t < 0)) && (i.lenisStopPropagation = !0), i.preventDefault();
            const p = r && this.options.syncTouch, h = r && i.type === "touchend" && Math.abs(f) > 5;
            h && (f = this.velocity * this.options.touchInertiaMultiplier), this.scrollTo(this.targetScroll + f, {
                programmatic: !1, ...p ? {lerp: h ? this.options.syncTouchLerp : 1} : {
                    lerp: this.options.lerp,
                    duration: this.options.duration,
                    easing: this.options.easing
                }
            })
        });
        V(this, "onNativeScroll", () => {
            if (this._resetVelocityTimeout !== null && (clearTimeout(this._resetVelocityTimeout), this._resetVelocityTimeout = null), this._preventNextNativeScrollEvent) {
                this._preventNextNativeScrollEvent = !1;
                return
            }
            if (this.isScrolling === !1 || this.isScrolling === "native") {
                const s = this.animatedScroll;
                this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity, this.velocity = this.animatedScroll - s, this.direction = Math.sign(this.animatedScroll - s), this.isStopped || (this.isScrolling = "native"), this.emit(), this.velocity !== 0 && (this._resetVelocityTimeout = setTimeout(() => {
                    this.lastVelocity = this.velocity, this.velocity = 0, this.isScrolling = !1, this.emit()
                }, 400))
            }
        });
        V(this, "raf", s => {
            const e = s - (this.time || s);
            this.time = s, this.animate.advance(e * .001), this.options.autoRaf && (this.__rafID = requestAnimationFrame(this.raf))
        });
        window.lenisVersion = Bd, (!s || s === document.documentElement) && (s = window), typeof a == "number" && typeof l != "function" ? l = fl : typeof l == "function" && typeof a != "number" && (a = 1), this.options = {
            wrapper: s,
            content: e,
            eventsTarget: t,
            smoothWheel: i,
            syncTouch: r,
            syncTouchLerp: n,
            touchInertiaMultiplier: o,
            duration: a,
            easing: l,
            lerp: c,
            infinite: u,
            gestureOrientation: f,
            orientation: d,
            touchMultiplier: p,
            wheelMultiplier: m,
            autoResize: h,
            prevent: g,
            virtualScroll: y,
            overscroll: v,
            autoRaf: _,
            anchors: w,
            autoToggle: b,
            allowNestedScroll: T,
            __experimental__naiveDimensions: x
        }, this.dimensions = new Gd(s, e, {autoResize: h}), this.updateClassName(), this.targetScroll = this.animatedScroll = this.actualScroll, this.options.wrapper.addEventListener("scroll", this.onNativeScroll, !1), this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, {capture: !0}), this.options.anchors && this.options.wrapper === window && this.options.wrapper.addEventListener("click", this.onClick, !1), this.options.wrapper.addEventListener("pointerdown", this.onPointerDown, !1), this.virtualScroll = new Wd(t, {
            touchMultiplier: p,
            wheelMultiplier: m
        }), this.virtualScroll.on("scroll", this.onVirtualScroll), this.options.autoToggle && this.rootElement.addEventListener("transitionend", this.onTransitionEnd, {passive: !0}), this.options.autoRaf && (this.__rafID = requestAnimationFrame(this.raf))
    }

    destroy() {
        this.emitter.destroy(), this.options.wrapper.removeEventListener("scroll", this.onNativeScroll, !1), this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, {capture: !0}), this.options.wrapper.removeEventListener("pointerdown", this.onPointerDown, !1), this.options.anchors && this.options.wrapper === window && this.options.wrapper.removeEventListener("click", this.onClick, !1), this.virtualScroll.destroy(), this.dimensions.destroy(), this.cleanUpClassName(), this.__rafID && cancelAnimationFrame(this.__rafID)
    }

    on(s, e) {
        return this.emitter.on(s, e)
    }

    off(s, e) {
        return this.emitter.off(s, e)
    }

    setScroll(s) {
        this.isHorizontal ? this.options.wrapper.scrollTo({
            left: s,
            behavior: "instant"
        }) : this.options.wrapper.scrollTo({top: s, behavior: "instant"})
    }

    resize() {
        this.dimensions.resize(), this.animatedScroll = this.targetScroll = this.actualScroll, this.emit()
    }

    emit() {
        this.emitter.emit("scroll", this)
    }

    reset() {
        this.isLocked = !1, this.isScrolling = !1, this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity = 0, this.animate.stop()
    }

    start() {
        this.isStopped && (this.reset(), this.isStopped = !1, this.emit())
    }

    stop() {
        this.isStopped || (this.reset(), this.isStopped = !0, this.emit())
    }

    scrollTo(s, {
        offset: e = 0,
        immediate: t = !1,
        lock: i = !1,
        duration: r = this.options.duration,
        easing: n = this.options.easing,
        lerp: o = this.options.lerp,
        onStart: a,
        onComplete: l,
        force: c = !1,
        programmatic: u = !0,
        userData: d
    } = {}) {
        if (!((this.isStopped || this.isLocked) && !c)) {
            if (typeof s == "string" && ["top", "left", "start"].includes(s)) s = 0; else if (typeof s == "string" && ["bottom", "right", "end"].includes(s)) s = this.limit; else {
                let f;
                if (typeof s == "string" ? f = document.querySelector(s) : s instanceof HTMLElement && (s != null && s.nodeType) && (f = s), f) {
                    if (this.options.wrapper !== window) {
                        const m = this.rootElement.getBoundingClientRect();
                        e -= this.isHorizontal ? m.left : m.top
                    }
                    const p = f.getBoundingClientRect();
                    s = (this.isHorizontal ? p.left : p.top) + this.animatedScroll
                }
            }
            if (typeof s == "number") {
                if (s += e, s = Math.round(s), this.options.infinite) {
                    if (u) {
                        this.targetScroll = this.animatedScroll = this.scroll;
                        const f = s - this.animatedScroll;
                        f > this.limit / 2 ? s = s - this.limit : f < -this.limit / 2 && (s = s + this.limit)
                    }
                } else s = gc(0, s, this.limit);
                if (s === this.targetScroll) {
                    a == null || a(this), l == null || l(this);
                    return
                }
                if (this.userData = d ?? {}, t) {
                    this.animatedScroll = this.targetScroll = s, this.setScroll(this.scroll), this.reset(), this.preventNextNativeScrollEvent(), this.emit(), l == null || l(this), this.userData = {}, requestAnimationFrame(() => {
                        this.dispatchScrollendEvent()
                    });
                    return
                }
                u || (this.targetScroll = s), typeof r == "number" && typeof n != "function" ? n = fl : typeof n == "function" && typeof r != "number" && (r = 1), this.animate.fromTo(this.animatedScroll, s, {
                    duration: r,
                    easing: n,
                    lerp: o,
                    onStart: () => {
                        i && (this.isLocked = !0), this.isScrolling = "smooth", a == null || a(this)
                    },
                    onUpdate: (f, p) => {
                        this.isScrolling = "smooth", this.lastVelocity = this.velocity, this.velocity = f - this.animatedScroll, this.direction = Math.sign(this.velocity), this.animatedScroll = f, this.setScroll(this.scroll), u && (this.targetScroll = f), p || this.emit(), p && (this.reset(), this.emit(), l == null || l(this), this.userData = {}, requestAnimationFrame(() => {
                            this.dispatchScrollendEvent()
                        }), this.preventNextNativeScrollEvent())
                    }
                })
            }
        }
    }

    preventNextNativeScrollEvent() {
        this._preventNextNativeScrollEvent = !0, requestAnimationFrame(() => {
            this._preventNextNativeScrollEvent = !1
        })
    }

    checkNestedScroll(s, {deltaX: e, deltaY: t}) {
        const i = Date.now(), r = s._lenis ?? (s._lenis = {});
        let n, o, a, l, c, u, d, f;
        const p = this.options.gestureOrientation;
        if (i - (r.time ?? 0) > 2e3) {
            r.time = Date.now();
            const b = window.getComputedStyle(s);
            r.computedStyle = b;
            const T = b.overflowX, x = b.overflowY;
            if (n = ["auto", "overlay", "scroll"].includes(T), o = ["auto", "overlay", "scroll"].includes(x), r.hasOverflowX = n, r.hasOverflowY = o, !n && !o || p === "vertical" && !o || p === "horizontal" && !n) return !1;
            c = s.scrollWidth, u = s.scrollHeight, d = s.clientWidth, f = s.clientHeight, a = c > d, l = u > f, r.isScrollableX = a, r.isScrollableY = l, r.scrollWidth = c, r.scrollHeight = u, r.clientWidth = d, r.clientHeight = f
        } else a = r.isScrollableX, l = r.isScrollableY, n = r.hasOverflowX, o = r.hasOverflowY, c = r.scrollWidth, u = r.scrollHeight, d = r.clientWidth, f = r.clientHeight;
        if (!n && !o || !a && !l || p === "vertical" && (!o || !l) || p === "horizontal" && (!n || !a)) return !1;
        let m;
        if (p === "horizontal") m = "x"; else if (p === "vertical") m = "y"; else {
            const b = e !== 0, T = t !== 0;
            b && n && a && (m = "x"), T && o && l && (m = "y")
        }
        if (!m) return !1;
        let h, g, y, v, _;
        if (m === "x") h = s.scrollLeft, g = c - d, y = e, v = n, _ = a; else if (m === "y") h = s.scrollTop, g = u - f, y = t, v = o, _ = l; else return !1;
        return (y > 0 ? h < g : h > 0) && v && _
    }

    get rootElement() {
        return this.options.wrapper === window ? document.documentElement : this.options.wrapper
    }

    get limit() {
        return this.options.__experimental__naiveDimensions ? this.isHorizontal ? this.rootElement.scrollWidth - this.rootElement.clientWidth : this.rootElement.scrollHeight - this.rootElement.clientHeight : this.dimensions.limit[this.isHorizontal ? "x" : "y"]
    }

    get isHorizontal() {
        return this.options.orientation === "horizontal"
    }

    get actualScroll() {
        const s = this.options.wrapper;
        return this.isHorizontal ? s.scrollX ?? s.scrollLeft : s.scrollY ?? s.scrollTop
    }

    get scroll() {
        return this.options.infinite ? Nd(this.animatedScroll, this.limit) : this.animatedScroll
    }

    get progress() {
        return this.limit === 0 ? 1 : this.scroll / this.limit
    }

    get isScrolling() {
        return this._isScrolling
    }

    set isScrolling(s) {
        this._isScrolling !== s && (this._isScrolling = s, this.updateClassName())
    }

    get isStopped() {
        return this._isStopped
    }

    set isStopped(s) {
        this._isStopped !== s && (this._isStopped = s, this.updateClassName())
    }

    get isLocked() {
        return this._isLocked
    }

    set isLocked(s) {
        this._isLocked !== s && (this._isLocked = s, this.updateClassName())
    }

    get isSmooth() {
        return this.isScrolling === "smooth"
    }

    get className() {
        let s = "lenis";
        return this.options.autoToggle && (s += " lenis-autoToggle"), this.isStopped && (s += " lenis-stopped"), this.isLocked && (s += " lenis-locked"), this.isScrolling && (s += " lenis-scrolling"), this.isScrolling === "smooth" && (s += " lenis-smooth"), s
    }

    updateClassName() {
        this.cleanUpClassName(), this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim()
    }

    cleanUpClassName() {
        this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim()
    }
};

function xi(s) {
    if (s === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return s
}

function _c(s, e) {
    s.prototype = Object.create(e.prototype), s.prototype.constructor = s, s.__proto__ = e
}/*!
 * GSAP 3.13.0
 *
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at
 * @author: Jack Doyle, jack@greensock.com
*/
var Dt = {autoSleep: 120, force3D: "auto", nullTargetWarn: 1, units: {lineHeight: ""}},
    ts = {duration: .5, overwrite: !1, delay: 0}, Ca, Ye, me, Nt = 1e8, ue = 1 / Nt, Wo = Math.PI * 2, Xd = Wo / 4,
    Ud = 0, yc = Math.sqrt, jd = Math.cos, Kd = Math.sin, Ne = function (e) {
        return typeof e == "string"
    }, be = function (e) {
        return typeof e == "function"
    }, Li = function (e) {
        return typeof e == "number"
    }, Pa = function (e) {
        return typeof e > "u"
    }, mi = function (e) {
        return typeof e == "object"
    }, vt = function (e) {
        return e !== !1
    }, La = function () {
        return typeof window < "u"
    }, nn = function (e) {
        return be(e) || Ne(e)
    }, wc = typeof ArrayBuffer == "function" && ArrayBuffer.isView || function () {
    }, it = Array.isArray, Yo = /(?:-?\.?\d|\.)+/gi, bc = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g,
    Gr = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g, ho = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi, Sc = /[+-]=-?[.\d]+/,
    xc = /[^,'"\[\]\s]+/gi, Qd = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i, ve, ni, Xo, Ma, Rt = {}, Rn = {}, Tc,
    Ec = function (e) {
        return (Rn = is(e, Rt)) && bt
    }, Aa = function (e, t) {
        return console.warn("Invalid property", e, "set to", t, "Missing plugin? gsap.registerPlugin()")
    }, Ns = function (e, t) {
        return !t && console.warn(e)
    }, Cc = function (e, t) {
        return e && (Rt[e] = t) && Rn && (Rn[e] = t) || Rt
    }, Hs = function () {
        return 0
    }, Jd = {suppressEvents: !0, isStart: !0, kill: !1}, xn = {suppressEvents: !0, kill: !1}, Zd = {suppressEvents: !0},
    ka = {}, Xi = [], Uo = {}, Pc, Pt = {}, mo = {}, pl = 30, Tn = [], Oa = "", Ia = function (e) {
        var t = e[0], i, r;
        if (mi(t) || be(t) || (e = [e]), !(i = (t._gsap || {}).harness)) {
            for (r = Tn.length; r-- && !Tn[r].targetTest(t);) ;
            i = Tn[r]
        }
        for (r = e.length; r--;) e[r] && (e[r]._gsap || (e[r]._gsap = new Qc(e[r], i))) || e.splice(r, 1);
        return e
    }, hr = function (e) {
        return e._gsap || Ia(Ht(e))[0]._gsap
    }, Lc = function (e, t, i) {
        return (i = e[t]) && be(i) ? e[t]() : Pa(i) && e.getAttribute && e.getAttribute(t) || i
    }, _t = function (e, t) {
        return (e = e.split(",")).forEach(t) || e
    }, Ee = function (e) {
        return Math.round(e * 1e5) / 1e5 || 0
    }, ke = function (e) {
        return Math.round(e * 1e7) / 1e7 || 0
    }, Xr = function (e, t) {
        var i = t.charAt(0), r = parseFloat(t.substr(2));
        return e = parseFloat(e), i === "+" ? e + r : i === "-" ? e - r : i === "*" ? e * r : e / r
    }, ef = function (e, t) {
        for (var i = t.length, r = 0; e.indexOf(t[r]) < 0 && ++r < i;) ;
        return r < i
    }, qn = function () {
        var e = Xi.length, t = Xi.slice(0), i, r;
        for (Uo = {}, Xi.length = 0, i = 0; i < e; i++) r = t[i], r && r._lazy && (r.render(r._lazy[0], r._lazy[1], !0)._lazy = 0)
    }, Da = function (e) {
        return !!(e._initted || e._startAt || e.add)
    }, Mc = function (e, t, i, r) {
        Xi.length && !Ye && qn(), e.render(t, i, !!(Ye && t < 0 && Da(e))), Xi.length && !Ye && qn()
    }, Ac = function (e) {
        var t = parseFloat(e);
        return (t || t === 0) && (e + "").match(xc).length < 2 ? t : Ne(e) ? e.trim() : e
    }, kc = function (e) {
        return e
    }, qt = function (e, t) {
        for (var i in t) i in e || (e[i] = t[i]);
        return e
    }, tf = function (e) {
        return function (t, i) {
            for (var r in i) r in t || r === "duration" && e || r === "ease" || (t[r] = i[r])
        }
    }, is = function (e, t) {
        for (var i in t) e[i] = t[i];
        return e
    }, hl = function s(e, t) {
        for (var i in t) i !== "__proto__" && i !== "constructor" && i !== "prototype" && (e[i] = mi(t[i]) ? s(e[i] || (e[i] = {}), t[i]) : t[i]);
        return e
    }, zn = function (e, t) {
        var i = {}, r;
        for (r in e) r in t || (i[r] = e[r]);
        return i
    }, Ls = function (e) {
        var t = e.parent || ve, i = e.keyframes ? tf(it(e.keyframes)) : qt;
        if (vt(e.inherit)) for (; t;) i(e, t.vars.defaults), t = t.parent || t._dp;
        return e
    }, rf = function (e, t) {
        for (var i = e.length, r = i === t.length; r && i-- && e[i] === t[i];) ;
        return i < 0
    }, Oc = function (e, t, i, r, n) {
        var o = e[r], a;
        if (n) for (a = t[n]; o && o[n] > a;) o = o._prev;
        return o ? (t._next = o._next, o._next = t) : (t._next = e[i], e[i] = t), t._next ? t._next._prev = t : e[r] = t, t._prev = o, t.parent = t._dp = e, t
    }, no = function (e, t, i, r) {
        i === void 0 && (i = "_first"), r === void 0 && (r = "_last");
        var n = t._prev, o = t._next;
        n ? n._next = o : e[i] === t && (e[i] = o), o ? o._prev = n : e[r] === t && (e[r] = n), t._next = t._prev = t.parent = null
    }, Ki = function (e, t) {
        e.parent && (!t || e.parent.autoRemoveChildren) && e.parent.remove && e.parent.remove(e), e._act = 0
    }, mr = function (e, t) {
        if (e && (!t || t._end > e._dur || t._start < 0)) for (var i = e; i;) i._dirty = 1, i = i.parent;
        return e
    }, sf = function (e) {
        for (var t = e.parent; t && t.parent;) t._dirty = 1, t.totalDuration(), t = t.parent;
        return e
    }, jo = function (e, t, i, r) {
        return e._startAt && (Ye ? e._startAt.revert(xn) : e.vars.immediateRender && !e.vars.autoRevert || e._startAt.render(t, !0, r))
    }, nf = function s(e) {
        return !e || e._ts && s(e.parent)
    }, ml = function (e) {
        return e._repeat ? rs(e._tTime, e = e.duration() + e._rDelay) * e : 0
    }, rs = function (e, t) {
        var i = Math.floor(e = ke(e / t));
        return e && i === e ? i - 1 : i
    }, Bn = function (e, t) {
        return (e - t._start) * t._ts + (t._ts >= 0 ? 0 : t._dirty ? t.totalDuration() : t._tDur)
    }, oo = function (e) {
        return e._end = ke(e._start + (e._tDur / Math.abs(e._ts || e._rts || ue) || 0))
    }, ao = function (e, t) {
        var i = e._dp;
        return i && i.smoothChildTiming && e._ts && (e._start = ke(i._time - (e._ts > 0 ? t / e._ts : ((e._dirty ? e.totalDuration() : e._tDur) - t) / -e._ts)), oo(e), i._dirty || mr(i, e)), e
    }, Ic = function (e, t) {
        var i;
        if ((t._time || !t._dur && t._initted || t._start < e._time && (t._dur || !t.add)) && (i = Bn(e.rawTime(), t), (!t._dur || Zs(0, t.totalDuration(), i) - t._tTime > ue) && t.render(i, !0)), mr(e, t)._dp && e._initted && e._time >= e._dur && e._ts) {
            if (e._dur < e.duration()) for (i = e; i._dp;) i.rawTime() >= 0 && i.totalTime(i._tTime), i = i._dp;
            e._zTime = -ue
        }
    }, li = function (e, t, i, r) {
        return t.parent && Ki(t), t._start = ke((Li(i) ? i : i || e !== ve ? Bt(e, i, t) : e._time) + t._delay), t._end = ke(t._start + (t.totalDuration() / Math.abs(t.timeScale()) || 0)), Oc(e, t, "_first", "_last", e._sort ? "_start" : 0), Ko(t) || (e._recent = t), r || Ic(e, t), e._ts < 0 && ao(e, e._tTime), e
    }, Dc = function (e, t) {
        return (Rt.ScrollTrigger || Aa("scrollTrigger", t)) && Rt.ScrollTrigger.create(t, e)
    }, Rc = function (e, t, i, r, n) {
        if (qa(e, t, n), !e._initted) return 1;
        if (!i && e._pt && !Ye && (e._dur && e.vars.lazy !== !1 || !e._dur && e.vars.lazy) && Pc !== At.frame) return Xi.push(e), e._lazy = [n, r], 1
    }, of = function s(e) {
        var t = e.parent;
        return t && t._ts && t._initted && !t._lock && (t.rawTime() < 0 || s(t))
    }, Ko = function (e) {
        var t = e.data;
        return t === "isFromStart" || t === "isStart"
    }, af = function (e, t, i, r) {
        var n = e.ratio,
            o = t < 0 || !t && (!e._start && of(e) && !(!e._initted && Ko(e)) || (e._ts < 0 || e._dp._ts < 0) && !Ko(e)) ? 0 : 1,
            a = e._rDelay, l = 0, c, u, d;
        if (a && e._repeat && (l = Zs(0, e._tDur, t), u = rs(l, a), e._yoyo && u & 1 && (o = 1 - o), u !== rs(e._tTime, a) && (n = 1 - o, e.vars.repeatRefresh && e._initted && e.invalidate())), o !== n || Ye || r || e._zTime === ue || !t && e._zTime) {
            if (!e._initted && Rc(e, t, r, i, l)) return;
            for (d = e._zTime, e._zTime = t || (i ? ue : 0), i || (i = t && !d), e.ratio = o, e._from && (o = 1 - o), e._time = 0, e._tTime = l, c = e._pt; c;) c.r(o, c.d), c = c._next;
            t < 0 && jo(e, t, i, !0), e._onUpdate && !i && It(e, "onUpdate"), l && e._repeat && !i && e.parent && It(e, "onRepeat"), (t >= e._tDur || t < 0) && e.ratio === o && (o && Ki(e, 1), !i && !Ye && (It(e, o ? "onComplete" : "onReverseComplete", !0), e._prom && e._prom()))
        } else e._zTime || (e._zTime = t)
    }, lf = function (e, t, i) {
        var r;
        if (i > t) for (r = e._first; r && r._start <= i;) {
            if (r.data === "isPause" && r._start > t) return r;
            r = r._next
        } else for (r = e._last; r && r._start >= i;) {
            if (r.data === "isPause" && r._start < t) return r;
            r = r._prev
        }
    }, ss = function (e, t, i, r) {
        var n = e._repeat, o = ke(t) || 0, a = e._tTime / e._tDur;
        return a && !r && (e._time *= o / e._dur), e._dur = o, e._tDur = n ? n < 0 ? 1e10 : ke(o * (n + 1) + e._rDelay * n) : o, a > 0 && !r && ao(e, e._tTime = e._tDur * a), e.parent && oo(e), i || mr(e.parent, e), e
    }, gl = function (e) {
        return e instanceof ut ? mr(e) : ss(e, e._dur)
    }, cf = {_start: 0, endTime: Hs, totalDuration: Hs}, Bt = function s(e, t, i) {
        var r = e.labels, n = e._recent || cf, o = e.duration() >= Nt ? n.endTime(!1) : e._dur, a, l, c;
        return Ne(t) && (isNaN(t) || t in r) ? (l = t.charAt(0), c = t.substr(-1) === "%", a = t.indexOf("="), l === "<" || l === ">" ? (a >= 0 && (t = t.replace(/=/, "")), (l === "<" ? n._start : n.endTime(n._repeat >= 0)) + (parseFloat(t.substr(1)) || 0) * (c ? (a < 0 ? n : i).totalDuration() / 100 : 1)) : a < 0 ? (t in r || (r[t] = o), r[t]) : (l = parseFloat(t.charAt(a - 1) + t.substr(a + 1)), c && i && (l = l / 100 * (it(i) ? i[0] : i).totalDuration()), a > 1 ? s(e, t.substr(0, a - 1), i) + l : o + l)) : t == null ? o : +t
    }, Ms = function (e, t, i) {
        var r = Li(t[1]), n = (r ? 2 : 1) + (e < 2 ? 0 : 1), o = t[n], a, l;
        if (r && (o.duration = t[1]), o.parent = i, e) {
            for (a = o, l = i; l && !("immediateRender" in a);) a = l.vars.defaults || {}, l = vt(l.vars.inherit) && l.parent;
            o.immediateRender = vt(a.immediateRender), e < 2 ? o.runBackwards = 1 : o.startAt = t[n - 1]
        }
        return new Ae(t[0], o, t[n + 1])
    }, Zi = function (e, t) {
        return e || e === 0 ? t(e) : t
    }, Zs = function (e, t, i) {
        return i < e ? e : i > t ? t : i
    }, et = function (e, t) {
        return !Ne(e) || !(t = Qd.exec(e)) ? "" : t[1]
    }, uf = function (e, t, i) {
        return Zi(i, function (r) {
            return Zs(e, t, r)
        })
    }, Qo = [].slice, qc = function (e, t) {
        return e && mi(e) && "length" in e && (!t && !e.length || e.length - 1 in e && mi(e[0])) && !e.nodeType && e !== ni
    }, df = function (e, t, i) {
        return i === void 0 && (i = []), e.forEach(function (r) {
            var n;
            return Ne(r) && !t || qc(r, 1) ? (n = i).push.apply(n, Ht(r)) : i.push(r)
        }) || i
    }, Ht = function (e, t, i) {
        return me && !t && me.selector ? me.selector(e) : Ne(e) && !i && (Xo || !ns()) ? Qo.call((t || Ma).querySelectorAll(e), 0) : it(e) ? df(e, i) : qc(e) ? Qo.call(e, 0) : e ? [e] : []
    }, Jo = function (e) {
        return e = Ht(e)[0] || Ns("Invalid scope") || {}, function (t) {
            var i = e.current || e.nativeElement || e;
            return Ht(t, i.querySelectorAll ? i : i === e ? Ns("Invalid scope") || Ma.createElement("div") : e)
        }
    }, zc = function (e) {
        return e.sort(function () {
            return .5 - Math.random()
        })
    }, Bc = function (e) {
        if (be(e)) return e;
        var t = mi(e) ? e : {each: e}, i = gr(t.ease), r = t.from || 0, n = parseFloat(t.base) || 0, o = {},
            a = r > 0 && r < 1, l = isNaN(r) || a, c = t.axis, u = r, d = r;
        return Ne(r) ? u = d = {
            center: .5,
            edges: .5,
            end: 1
        }[r] || 0 : !a && l && (u = r[0], d = r[1]), function (f, p, m) {
            var h = (m || t).length, g = o[h], y, v, _, w, b, T, x, C, P;
            if (!g) {
                if (P = t.grid === "auto" ? 0 : (t.grid || [1, Nt])[1], !P) {
                    for (x = -Nt; x < (x = m[P++].getBoundingClientRect().left) && P < h;) ;
                    P < h && P--
                }
                for (g = o[h] = [], y = l ? Math.min(P, h) * u - .5 : r % P, v = P === Nt ? 0 : l ? h * d / P - .5 : r / P | 0, x = 0, C = Nt, T = 0; T < h; T++) _ = T % P - y, w = v - (T / P | 0), g[T] = b = c ? Math.abs(c === "y" ? w : _) : yc(_ * _ + w * w), b > x && (x = b), b < C && (C = b);
                r === "random" && zc(g), g.max = x - C, g.min = C, g.v = h = (parseFloat(t.amount) || parseFloat(t.each) * (P > h ? h - 1 : c ? c === "y" ? h / P : P : Math.max(P, h / P)) || 0) * (r === "edges" ? -1 : 1), g.b = h < 0 ? n - h : n, g.u = et(t.amount || t.each) || 0, i = i && h < 0 ? Uc(i) : i
            }
            return h = (g[f] - g.min) / g.max || 0, ke(g.b + (i ? i(h) : h) * g.v) + g.u
        }
    }, Zo = function (e) {
        var t = Math.pow(10, ((e + "").split(".")[1] || "").length);
        return function (i) {
            var r = ke(Math.round(parseFloat(i) / e) * e * t);
            return (r - r % 1) / t + (Li(i) ? 0 : et(i))
        }
    }, Fc = function (e, t) {
        var i = it(e), r, n;
        return !i && mi(e) && (r = i = e.radius || Nt, e.values ? (e = Ht(e.values), (n = !Li(e[0])) && (r *= r)) : e = Zo(e.increment)), Zi(t, i ? be(e) ? function (o) {
            return n = e(o), Math.abs(n - o) <= r ? n : o
        } : function (o) {
            for (var a = parseFloat(n ? o.x : o), l = parseFloat(n ? o.y : 0), c = Nt, u = 0, d = e.length, f, p; d--;) n ? (f = e[d].x - a, p = e[d].y - l, f = f * f + p * p) : f = Math.abs(e[d] - a), f < c && (c = f, u = d);
            return u = !r || c <= r ? e[u] : o, n || u === o || Li(o) ? u : u + et(o)
        } : Zo(e))
    }, Vc = function (e, t, i, r) {
        return Zi(it(e) ? !t : i === !0 ? !!(i = 0) : !r, function () {
            return it(e) ? e[~~(Math.random() * e.length)] : (i = i || 1e-5) && (r = i < 1 ? Math.pow(10, (i + "").length - 2) : 1) && Math.floor(Math.round((e - i / 2 + Math.random() * (t - e + i * .99)) / i) * i * r) / r
        })
    }, ff = function () {
        for (var e = arguments.length, t = new Array(e), i = 0; i < e; i++) t[i] = arguments[i];
        return function (r) {
            return t.reduce(function (n, o) {
                return o(n)
            }, r)
        }
    }, pf = function (e, t) {
        return function (i) {
            return e(parseFloat(i)) + (t || et(i))
        }
    }, hf = function (e, t, i) {
        return Hc(e, t, 0, 1, i)
    }, Nc = function (e, t, i) {
        return Zi(i, function (r) {
            return e[~~t(r)]
        })
    }, mf = function s(e, t, i) {
        var r = t - e;
        return it(e) ? Nc(e, s(0, e.length), t) : Zi(i, function (n) {
            return (r + (n - e) % r) % r + e
        })
    }, gf = function s(e, t, i) {
        var r = t - e, n = r * 2;
        return it(e) ? Nc(e, s(0, e.length - 1), t) : Zi(i, function (o) {
            return o = (n + (o - e) % n) % n || 0, e + (o > r ? n - o : o)
        })
    }, $s = function (e) {
        for (var t = 0, i = "", r, n, o, a; ~(r = e.indexOf("random(", t));) o = e.indexOf(")", r), a = e.charAt(r + 7) === "[", n = e.substr(r + 7, o - r - 7).match(a ? xc : Yo), i += e.substr(t, r - t) + Vc(a ? n : +n[0], a ? 0 : +n[1], +n[2] || 1e-5), t = o + 1;
        return i + e.substr(t, e.length - t)
    }, Hc = function (e, t, i, r, n) {
        var o = t - e, a = r - i;
        return Zi(n, function (l) {
            return i + ((l - e) / o * a || 0)
        })
    }, vf = function s(e, t, i, r) {
        var n = isNaN(e + t) ? 0 : function (p) {
            return (1 - p) * e + p * t
        };
        if (!n) {
            var o = Ne(e), a = {}, l, c, u, d, f;
            if (i === !0 && (r = 1) && (i = null), o) e = {p: e}, t = {p: t}; else if (it(e) && !it(t)) {
                for (u = [], d = e.length, f = d - 2, c = 1; c < d; c++) u.push(s(e[c - 1], e[c]));
                d--, n = function (m) {
                    m *= d;
                    var h = Math.min(f, ~~m);
                    return u[h](m - h)
                }, i = t
            } else r || (e = is(it(e) ? [] : {}, e));
            if (!u) {
                for (l in t) Ra.call(a, e, l, "get", t[l]);
                n = function (m) {
                    return Fa(m, a) || (o ? e.p : e)
                }
            }
        }
        return Zi(i, n)
    }, vl = function (e, t, i) {
        var r = e.labels, n = Nt, o, a, l;
        for (o in r) a = r[o] - t, a < 0 == !!i && a && n > (a = Math.abs(a)) && (l = o, n = a);
        return l
    }, It = function (e, t, i) {
        var r = e.vars, n = r[t], o = me, a = e._ctx, l, c, u;
        if (n) return l = r[t + "Params"], c = r.callbackScope || e, i && Xi.length && qn(), a && (me = a), u = l ? n.apply(c, l) : n.call(c), me = o, u
    }, bs = function (e) {
        return Ki(e), e.scrollTrigger && e.scrollTrigger.kill(!!Ye), e.progress() < 1 && It(e, "onInterrupt"), e
    }, Wr, $c = [], Gc = function (e) {
        if (e) if (e = !e.name && e.default || e, La() || e.headless) {
            var t = e.name, i = be(e), r = t && !i && e.init ? function () {
                    this._props = []
                } : e, n = {init: Hs, render: Fa, add: Ra, kill: If, modifier: Of, rawVars: 0},
                o = {targetTest: 0, get: 0, getSetter: Ba, aliases: {}, register: 0};
            if (ns(), e !== r) {
                if (Pt[t]) return;
                qt(r, qt(zn(e, n), o)), is(r.prototype, is(n, zn(e, o))), Pt[r.prop = t] = r, e.targetTest && (Tn.push(r), ka[t] = 1), t = (t === "css" ? "CSS" : t.charAt(0).toUpperCase() + t.substr(1)) + "Plugin"
            }
            Cc(t, r), e.register && e.register(bt, r, yt)
        } else $c.push(e)
    }, le = 255, Ss = {
        aqua: [0, le, le],
        lime: [0, le, 0],
        silver: [192, 192, 192],
        black: [0, 0, 0],
        maroon: [128, 0, 0],
        teal: [0, 128, 128],
        blue: [0, 0, le],
        navy: [0, 0, 128],
        white: [le, le, le],
        olive: [128, 128, 0],
        yellow: [le, le, 0],
        orange: [le, 165, 0],
        gray: [128, 128, 128],
        purple: [128, 0, 128],
        green: [0, 128, 0],
        red: [le, 0, 0],
        pink: [le, 192, 203],
        cyan: [0, le, le],
        transparent: [le, le, le, 0]
    }, go = function (e, t, i) {
        return e += e < 0 ? 1 : e > 1 ? -1 : 0, (e * 6 < 1 ? t + (i - t) * e * 6 : e < .5 ? i : e * 3 < 2 ? t + (i - t) * (2 / 3 - e) * 6 : t) * le + .5 | 0
    }, Wc = function (e, t, i) {
        var r = e ? Li(e) ? [e >> 16, e >> 8 & le, e & le] : 0 : Ss.black, n, o, a, l, c, u, d, f, p, m;
        if (!r) {
            if (e.substr(-1) === "," && (e = e.substr(0, e.length - 1)), Ss[e]) r = Ss[e]; else if (e.charAt(0) === "#") {
                if (e.length < 6 && (n = e.charAt(1), o = e.charAt(2), a = e.charAt(3), e = "#" + n + n + o + o + a + a + (e.length === 5 ? e.charAt(4) + e.charAt(4) : "")), e.length === 9) return r = parseInt(e.substr(1, 6), 16), [r >> 16, r >> 8 & le, r & le, parseInt(e.substr(7), 16) / 255];
                e = parseInt(e.substr(1), 16), r = [e >> 16, e >> 8 & le, e & le]
            } else if (e.substr(0, 3) === "hsl") {
                if (r = m = e.match(Yo), !t) l = +r[0] % 360 / 360, c = +r[1] / 100, u = +r[2] / 100, o = u <= .5 ? u * (c + 1) : u + c - u * c, n = u * 2 - o, r.length > 3 && (r[3] *= 1), r[0] = go(l + 1 / 3, n, o), r[1] = go(l, n, o), r[2] = go(l - 1 / 3, n, o); else if (~e.indexOf("=")) return r = e.match(bc), i && r.length < 4 && (r[3] = 1), r
            } else r = e.match(Yo) || Ss.transparent;
            r = r.map(Number)
        }
        return t && !m && (n = r[0] / le, o = r[1] / le, a = r[2] / le, d = Math.max(n, o, a), f = Math.min(n, o, a), u = (d + f) / 2, d === f ? l = c = 0 : (p = d - f, c = u > .5 ? p / (2 - d - f) : p / (d + f), l = d === n ? (o - a) / p + (o < a ? 6 : 0) : d === o ? (a - n) / p + 2 : (n - o) / p + 4, l *= 60), r[0] = ~~(l + .5), r[1] = ~~(c * 100 + .5), r[2] = ~~(u * 100 + .5)), i && r.length < 4 && (r[3] = 1), r
    }, Yc = function (e) {
        var t = [], i = [], r = -1;
        return e.split(Ui).forEach(function (n) {
            var o = n.match(Gr) || [];
            t.push.apply(t, o), i.push(r += o.length + 1)
        }), t.c = i, t
    }, _l = function (e, t, i) {
        var r = "", n = (e + r).match(Ui), o = t ? "hsla(" : "rgba(", a = 0, l, c, u, d;
        if (!n) return e;
        if (n = n.map(function (f) {
            return (f = Wc(f, t, 1)) && o + (t ? f[0] + "," + f[1] + "%," + f[2] + "%," + f[3] : f.join(",")) + ")"
        }), i && (u = Yc(e), l = i.c, l.join(r) !== u.c.join(r))) for (c = e.replace(Ui, "1").split(Gr), d = c.length - 1; a < d; a++) r += c[a] + (~l.indexOf(a) ? n.shift() || o + "0,0,0,0)" : (u.length ? u : n.length ? n : i).shift());
        if (!c) for (c = e.split(Ui), d = c.length - 1; a < d; a++) r += c[a] + n[a];
        return r + c[d]
    }, Ui = function () {
        var s = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", e;
        for (e in Ss) s += "|" + e + "\\b";
        return new RegExp(s + ")", "gi")
    }(), _f = /hsl[a]?\(/, Xc = function (e) {
        var t = e.join(" "), i;
        if (Ui.lastIndex = 0, Ui.test(t)) return i = _f.test(t), e[1] = _l(e[1], i), e[0] = _l(e[0], i, Yc(e[1])), !0
    }, Gs, At = function () {
        var s = Date.now, e = 500, t = 33, i = s(), r = i, n = 1e3 / 240, o = n, a = [], l, c, u, d, f, p,
            m = function h(g) {
                var y = s() - r, v = g === !0, _, w, b, T;
                if ((y > e || y < 0) && (i += y - t), r += y, b = r - i, _ = b - o, (_ > 0 || v) && (T = ++d.frame, f = b - d.time * 1e3, d.time = b = b / 1e3, o += _ + (_ >= n ? 4 : n - _), w = 1), v || (l = c(h)), w) for (p = 0; p < a.length; p++) a[p](b, f, T, g)
            };
        return d = {
            time: 0, frame: 0, tick: function () {
                m(!0)
            }, deltaRatio: function (g) {
                return f / (1e3 / (g || 60))
            }, wake: function () {
                Tc && (!Xo && La() && (ni = Xo = window, Ma = ni.document || {}, Rt.gsap = bt, (ni.gsapVersions || (ni.gsapVersions = [])).push(bt.version), Ec(Rn || ni.GreenSockGlobals || !ni.gsap && ni || {}), $c.forEach(Gc)), u = typeof requestAnimationFrame < "u" && requestAnimationFrame, l && d.sleep(), c = u || function (g) {
                    return setTimeout(g, o - d.time * 1e3 + 1 | 0)
                }, Gs = 1, m(2))
            }, sleep: function () {
                (u ? cancelAnimationFrame : clearTimeout)(l), Gs = 0, c = Hs
            }, lagSmoothing: function (g, y) {
                e = g || 1 / 0, t = Math.min(y || 33, e)
            }, fps: function (g) {
                n = 1e3 / (g || 240), o = d.time * 1e3 + n
            }, add: function (g, y, v) {
                var _ = y ? function (w, b, T, x) {
                    g(w, b, T, x), d.remove(_)
                } : g;
                return d.remove(g), a[v ? "unshift" : "push"](_), ns(), _
            }, remove: function (g, y) {
                ~(y = a.indexOf(g)) && a.splice(y, 1) && p >= y && p--
            }, _listeners: a
        }, d
    }(), ns = function () {
        return !Gs && At.wake()
    }, te = {}, yf = /^[\d.\-M][\d.\-,\s]/, wf = /["']/g, bf = function (e) {
        for (var t = {}, i = e.substr(1, e.length - 3).split(":"), r = i[0], n = 1, o = i.length, a, l, c; n < o; n++) l = i[n], a = n !== o - 1 ? l.lastIndexOf(",") : l.length, c = l.substr(0, a), t[r] = isNaN(c) ? c.replace(wf, "").trim() : +c, r = l.substr(a + 1).trim();
        return t
    }, Sf = function (e) {
        var t = e.indexOf("(") + 1, i = e.indexOf(")"), r = e.indexOf("(", t);
        return e.substring(t, ~r && r < i ? e.indexOf(")", i + 1) : i)
    }, xf = function (e) {
        var t = (e + "").split("("), i = te[t[0]];
        return i && t.length > 1 && i.config ? i.config.apply(null, ~e.indexOf("{") ? [bf(t[1])] : Sf(e).split(",").map(Ac)) : te._CE && yf.test(e) ? te._CE("", e) : i
    }, Uc = function (e) {
        return function (t) {
            return 1 - e(1 - t)
        }
    }, jc = function s(e, t) {
        for (var i = e._first, r; i;) i instanceof ut ? s(i, t) : i.vars.yoyoEase && (!i._yoyo || !i._repeat) && i._yoyo !== t && (i.timeline ? s(i.timeline, t) : (r = i._ease, i._ease = i._yEase, i._yEase = r, i._yoyo = t)), i = i._next
    }, gr = function (e, t) {
        return e && (be(e) ? e : te[e] || xf(e)) || t
    }, Mr = function (e, t, i, r) {
        i === void 0 && (i = function (l) {
            return 1 - t(1 - l)
        }), r === void 0 && (r = function (l) {
            return l < .5 ? t(l * 2) / 2 : 1 - t((1 - l) * 2) / 2
        });
        var n = {easeIn: t, easeOut: i, easeInOut: r}, o;
        return _t(e, function (a) {
            te[a] = Rt[a] = n, te[o = a.toLowerCase()] = i;
            for (var l in n) te[o + (l === "easeIn" ? ".in" : l === "easeOut" ? ".out" : ".inOut")] = te[a + "." + l] = n[l]
        }), n
    }, Kc = function (e) {
        return function (t) {
            return t < .5 ? (1 - e(1 - t * 2)) / 2 : .5 + e((t - .5) * 2) / 2
        }
    }, vo = function s(e, t, i) {
        var r = t >= 1 ? t : 1, n = (i || (e ? .3 : .45)) / (t < 1 ? t : 1), o = n / Wo * (Math.asin(1 / r) || 0),
            a = function (u) {
                return u === 1 ? 1 : r * Math.pow(2, -10 * u) * Kd((u - o) * n) + 1
            }, l = e === "out" ? a : e === "in" ? function (c) {
                return 1 - a(1 - c)
            } : Kc(a);
        return n = Wo / n, l.config = function (c, u) {
            return s(e, c, u)
        }, l
    }, _o = function s(e, t) {
        t === void 0 && (t = 1.70158);
        var i = function (o) {
            return o ? --o * o * ((t + 1) * o + t) + 1 : 0
        }, r = e === "out" ? i : e === "in" ? function (n) {
            return 1 - i(1 - n)
        } : Kc(i);
        return r.config = function (n) {
            return s(e, n)
        }, r
    };
_t("Linear,Quad,Cubic,Quart,Quint,Strong", function (s, e) {
    var t = e < 5 ? e + 1 : e;
    Mr(s + ",Power" + (t - 1), e ? function (i) {
        return Math.pow(i, t)
    } : function (i) {
        return i
    }, function (i) {
        return 1 - Math.pow(1 - i, t)
    }, function (i) {
        return i < .5 ? Math.pow(i * 2, t) / 2 : 1 - Math.pow((1 - i) * 2, t) / 2
    })
});
te.Linear.easeNone = te.none = te.Linear.easeIn;
Mr("Elastic", vo("in"), vo("out"), vo());
(function (s, e) {
    var t = 1 / e, i = 2 * t, r = 2.5 * t, n = function (a) {
        return a < t ? s * a * a : a < i ? s * Math.pow(a - 1.5 / e, 2) + .75 : a < r ? s * (a -= 2.25 / e) * a + .9375 : s * Math.pow(a - 2.625 / e, 2) + .984375
    };
    Mr("Bounce", function (o) {
        return 1 - n(1 - o)
    }, n)
})(7.5625, 2.75);
Mr("Expo", function (s) {
    return Math.pow(2, 10 * (s - 1)) * s + s * s * s * s * s * s * (1 - s)
});
Mr("Circ", function (s) {
    return -(yc(1 - s * s) - 1)
});
Mr("Sine", function (s) {
    return s === 1 ? 1 : -jd(s * Xd) + 1
});
Mr("Back", _o("in"), _o("out"), _o());
te.SteppedEase = te.steps = Rt.SteppedEase = {
    config: function (e, t) {
        e === void 0 && (e = 1);
        var i = 1 / e, r = e + (t ? 0 : 1), n = t ? 1 : 0, o = 1 - ue;
        return function (a) {
            return ((r * Zs(0, o, a) | 0) + n) * i
        }
    }
};
ts.ease = te["quad.out"];
_t("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function (s) {
    return Oa += s + "," + s + "Params,"
});
var Qc = function (e, t) {
    this.id = Ud++, e._gsap = this, this.target = e, this.harness = t, this.get = t ? t.get : Lc, this.set = t ? t.getSetter : Ba
}, Ws = function () {
    function s(t) {
        this.vars = t, this._delay = +t.delay || 0, (this._repeat = t.repeat === 1 / 0 ? -2 : t.repeat || 0) && (this._rDelay = t.repeatDelay || 0, this._yoyo = !!t.yoyo || !!t.yoyoEase), this._ts = 1, ss(this, +t.duration, 1, 1), this.data = t.data, me && (this._ctx = me, me.data.push(this)), Gs || At.wake()
    }

    var e = s.prototype;
    return e.delay = function (i) {
        return i || i === 0 ? (this.parent && this.parent.smoothChildTiming && this.startTime(this._start + i - this._delay), this._delay = i, this) : this._delay
    }, e.duration = function (i) {
        return arguments.length ? this.totalDuration(this._repeat > 0 ? i + (i + this._rDelay) * this._repeat : i) : this.totalDuration() && this._dur
    }, e.totalDuration = function (i) {
        return arguments.length ? (this._dirty = 0, ss(this, this._repeat < 0 ? i : (i - this._repeat * this._rDelay) / (this._repeat + 1))) : this._tDur
    }, e.totalTime = function (i, r) {
        if (ns(), !arguments.length) return this._tTime;
        var n = this._dp;
        if (n && n.smoothChildTiming && this._ts) {
            for (ao(this, i), !n._dp || n.parent || Ic(n, this); n && n.parent;) n.parent._time !== n._start + (n._ts >= 0 ? n._tTime / n._ts : (n.totalDuration() - n._tTime) / -n._ts) && n.totalTime(n._tTime, !0), n = n.parent;
            !this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && i < this._tDur || this._ts < 0 && i > 0 || !this._tDur && !i) && li(this._dp, this, this._start - this._delay)
        }
        return (this._tTime !== i || !this._dur && !r || this._initted && Math.abs(this._zTime) === ue || !i && !this._initted && (this.add || this._ptLookup)) && (this._ts || (this._pTime = i), Mc(this, i, r)), this
    }, e.time = function (i, r) {
        return arguments.length ? this.totalTime(Math.min(this.totalDuration(), i + ml(this)) % (this._dur + this._rDelay) || (i ? this._dur : 0), r) : this._time
    }, e.totalProgress = function (i, r) {
        return arguments.length ? this.totalTime(this.totalDuration() * i, r) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0
    }, e.progress = function (i, r) {
        return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - i : i) + ml(this), r) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0
    }, e.iteration = function (i, r) {
        var n = this.duration() + this._rDelay;
        return arguments.length ? this.totalTime(this._time + (i - 1) * n, r) : this._repeat ? rs(this._tTime, n) + 1 : 1
    }, e.timeScale = function (i, r) {
        if (!arguments.length) return this._rts === -ue ? 0 : this._rts;
        if (this._rts === i) return this;
        var n = this.parent && this._ts ? Bn(this.parent._time, this) : this._tTime;
        return this._rts = +i || 0, this._ts = this._ps || i === -ue ? 0 : this._rts, this.totalTime(Zs(-Math.abs(this._delay), this.totalDuration(), n), r !== !1), oo(this), sf(this)
    }, e.paused = function (i) {
        return arguments.length ? (this._ps !== i && (this._ps = i, i ? (this._pTime = this._tTime || Math.max(-this._delay, this.rawTime()), this._ts = this._act = 0) : (ns(), this._ts = this._rts, this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== ue && (this._tTime -= ue)))), this) : this._ps
    }, e.startTime = function (i) {
        if (arguments.length) {
            this._start = i;
            var r = this.parent || this._dp;
            return r && (r._sort || !this.parent) && li(r, this, i - this._delay), this
        }
        return this._start
    }, e.endTime = function (i) {
        return this._start + (vt(i) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1)
    }, e.rawTime = function (i) {
        var r = this.parent || this._dp;
        return r ? i && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : this._ts ? Bn(r.rawTime(i), this) : this._tTime : this._tTime
    }, e.revert = function (i) {
        i === void 0 && (i = Zd);
        var r = Ye;
        return Ye = i, Da(this) && (this.timeline && this.timeline.revert(i), this.totalTime(-.01, i.suppressEvents)), this.data !== "nested" && i.kill !== !1 && this.kill(), Ye = r, this
    }, e.globalTime = function (i) {
        for (var r = this, n = arguments.length ? i : r.rawTime(); r;) n = r._start + n / (Math.abs(r._ts) || 1), r = r._dp;
        return !this.parent && this._sat ? this._sat.globalTime(i) : n
    }, e.repeat = function (i) {
        return arguments.length ? (this._repeat = i === 1 / 0 ? -2 : i, gl(this)) : this._repeat === -2 ? 1 / 0 : this._repeat
    }, e.repeatDelay = function (i) {
        if (arguments.length) {
            var r = this._time;
            return this._rDelay = i, gl(this), r ? this.time(r) : this
        }
        return this._rDelay
    }, e.yoyo = function (i) {
        return arguments.length ? (this._yoyo = i, this) : this._yoyo
    }, e.seek = function (i, r) {
        return this.totalTime(Bt(this, i), vt(r))
    }, e.restart = function (i, r) {
        return this.play().totalTime(i ? -this._delay : 0, vt(r)), this._dur || (this._zTime = -ue), this
    }, e.play = function (i, r) {
        return i != null && this.seek(i, r), this.reversed(!1).paused(!1)
    }, e.reverse = function (i, r) {
        return i != null && this.seek(i || this.totalDuration(), r), this.reversed(!0).paused(!1)
    }, e.pause = function (i, r) {
        return i != null && this.seek(i, r), this.paused(!0)
    }, e.resume = function () {
        return this.paused(!1)
    }, e.reversed = function (i) {
        return arguments.length ? (!!i !== this.reversed() && this.timeScale(-this._rts || (i ? -ue : 0)), this) : this._rts < 0
    }, e.invalidate = function () {
        return this._initted = this._act = 0, this._zTime = -ue, this
    }, e.isActive = function () {
        var i = this.parent || this._dp, r = this._start, n;
        return !!(!i || this._ts && this._initted && i.isActive() && (n = i.rawTime(!0)) >= r && n < this.endTime(!0) - ue)
    }, e.eventCallback = function (i, r, n) {
        var o = this.vars;
        return arguments.length > 1 ? (r ? (o[i] = r, n && (o[i + "Params"] = n), i === "onUpdate" && (this._onUpdate = r)) : delete o[i], this) : o[i]
    }, e.then = function (i) {
        var r = this;
        return new Promise(function (n) {
            var o = be(i) ? i : kc, a = function () {
                var c = r.then;
                r.then = null, be(o) && (o = o(r)) && (o.then || o === r) && (r.then = c), n(o), r.then = c
            };
            r._initted && r.totalProgress() === 1 && r._ts >= 0 || !r._tTime && r._ts < 0 ? a() : r._prom = a
        })
    }, e.kill = function () {
        bs(this)
    }, s
}();
qt(Ws.prototype, {
    _time: 0,
    _start: 0,
    _end: 0,
    _tTime: 0,
    _tDur: 0,
    _dirty: 0,
    _repeat: 0,
    _yoyo: !1,
    parent: null,
    _initted: !1,
    _rDelay: 0,
    _ts: 1,
    _dp: 0,
    ratio: 0,
    _zTime: -ue,
    _prom: 0,
    _ps: !1,
    _rts: 1
});
var ut = function (s) {
    _c(e, s);

    function e(i, r) {
        var n;
        return i === void 0 && (i = {}), n = s.call(this, i) || this, n.labels = {}, n.smoothChildTiming = !!i.smoothChildTiming, n.autoRemoveChildren = !!i.autoRemoveChildren, n._sort = vt(i.sortChildren), ve && li(i.parent || ve, xi(n), r), i.reversed && n.reverse(), i.paused && n.paused(!0), i.scrollTrigger && Dc(xi(n), i.scrollTrigger), n
    }

    var t = e.prototype;
    return t.to = function (r, n, o) {
        return Ms(0, arguments, this), this
    }, t.from = function (r, n, o) {
        return Ms(1, arguments, this), this
    }, t.fromTo = function (r, n, o, a) {
        return Ms(2, arguments, this), this
    }, t.set = function (r, n, o) {
        return n.duration = 0, n.parent = this, Ls(n).repeatDelay || (n.repeat = 0), n.immediateRender = !!n.immediateRender, new Ae(r, n, Bt(this, o), 1), this
    }, t.call = function (r, n, o) {
        return li(this, Ae.delayedCall(0, r, n), o)
    }, t.staggerTo = function (r, n, o, a, l, c, u) {
        return o.duration = n, o.stagger = o.stagger || a, o.onComplete = c, o.onCompleteParams = u, o.parent = this, new Ae(r, o, Bt(this, l)), this
    }, t.staggerFrom = function (r, n, o, a, l, c, u) {
        return o.runBackwards = 1, Ls(o).immediateRender = vt(o.immediateRender), this.staggerTo(r, n, o, a, l, c, u)
    }, t.staggerFromTo = function (r, n, o, a, l, c, u, d) {
        return a.startAt = o, Ls(a).immediateRender = vt(a.immediateRender), this.staggerTo(r, n, a, l, c, u, d)
    }, t.render = function (r, n, o) {
        var a = this._time, l = this._dirty ? this.totalDuration() : this._tDur, c = this._dur, u = r <= 0 ? 0 : ke(r),
            d = this._zTime < 0 != r < 0 && (this._initted || !c), f, p, m, h, g, y, v, _, w, b, T, x;
        if (this !== ve && u > l && r >= 0 && (u = l), u !== this._tTime || o || d) {
            if (a !== this._time && c && (u += this._time - a, r += this._time - a), f = u, w = this._start, _ = this._ts, y = !_, d && (c || (a = this._zTime), (r || !n) && (this._zTime = r)), this._repeat) {
                if (T = this._yoyo, g = c + this._rDelay, this._repeat < -1 && r < 0) return this.totalTime(g * 100 + r, n, o);
                if (f = ke(u % g), u === l ? (h = this._repeat, f = c) : (b = ke(u / g), h = ~~b, h && h === b && (f = c, h--), f > c && (f = c)), b = rs(this._tTime, g), !a && this._tTime && b !== h && this._tTime - b * g - this._dur <= 0 && (b = h), T && h & 1 && (f = c - f, x = 1), h !== b && !this._lock) {
                    var C = T && b & 1, P = C === (T && h & 1);
                    if (h < b && (C = !C), a = C ? 0 : u % c ? c : u, this._lock = 1, this.render(a || (x ? 0 : ke(h * g)), n, !c)._lock = 0, this._tTime = u, !n && this.parent && It(this, "onRepeat"), this.vars.repeatRefresh && !x && (this.invalidate()._lock = 1), a && a !== this._time || y !== !this._ts || this.vars.onRepeat && !this.parent && !this._act) return this;
                    if (c = this._dur, l = this._tDur, P && (this._lock = 2, a = C ? c : -1e-4, this.render(a, !0), this.vars.repeatRefresh && !x && this.invalidate()), this._lock = 0, !this._ts && !y) return this;
                    jc(this, x)
                }
            }
            if (this._hasPause && !this._forcing && this._lock < 2 && (v = lf(this, ke(a), ke(f)), v && (u -= f - (f = v._start))), this._tTime = u, this._time = f, this._act = !_, this._initted || (this._onUpdate = this.vars.onUpdate, this._initted = 1, this._zTime = r, a = 0), !a && u && !n && !b && (It(this, "onStart"), this._tTime !== u)) return this;
            if (f >= a && r >= 0) for (p = this._first; p;) {
                if (m = p._next, (p._act || f >= p._start) && p._ts && v !== p) {
                    if (p.parent !== this) return this.render(r, n, o);
                    if (p.render(p._ts > 0 ? (f - p._start) * p._ts : (p._dirty ? p.totalDuration() : p._tDur) + (f - p._start) * p._ts, n, o), f !== this._time || !this._ts && !y) {
                        v = 0, m && (u += this._zTime = -ue);
                        break
                    }
                }
                p = m
            } else {
                p = this._last;
                for (var E = r < 0 ? r : f; p;) {
                    if (m = p._prev, (p._act || E <= p._end) && p._ts && v !== p) {
                        if (p.parent !== this) return this.render(r, n, o);
                        if (p.render(p._ts > 0 ? (E - p._start) * p._ts : (p._dirty ? p.totalDuration() : p._tDur) + (E - p._start) * p._ts, n, o || Ye && Da(p)), f !== this._time || !this._ts && !y) {
                            v = 0, m && (u += this._zTime = E ? -ue : ue);
                            break
                        }
                    }
                    p = m
                }
            }
            if (v && !n && (this.pause(), v.render(f >= a ? 0 : -ue)._zTime = f >= a ? 1 : -1, this._ts)) return this._start = w, oo(this), this.render(r, n, o);
            this._onUpdate && !n && It(this, "onUpdate", !0), (u === l && this._tTime >= this.totalDuration() || !u && a) && (w === this._start || Math.abs(_) !== Math.abs(this._ts)) && (this._lock || ((r || !c) && (u === l && this._ts > 0 || !u && this._ts < 0) && Ki(this, 1), !n && !(r < 0 && !a) && (u || a || !l) && (It(this, u === l && r >= 0 ? "onComplete" : "onReverseComplete", !0), this._prom && !(u < l && this.timeScale() > 0) && this._prom())))
        }
        return this
    }, t.add = function (r, n) {
        var o = this;
        if (Li(n) || (n = Bt(this, n, r)), !(r instanceof Ws)) {
            if (it(r)) return r.forEach(function (a) {
                return o.add(a, n)
            }), this;
            if (Ne(r)) return this.addLabel(r, n);
            if (be(r)) r = Ae.delayedCall(0, r); else return this
        }
        return this !== r ? li(this, r, n) : this
    }, t.getChildren = function (r, n, o, a) {
        r === void 0 && (r = !0), n === void 0 && (n = !0), o === void 0 && (o = !0), a === void 0 && (a = -Nt);
        for (var l = [], c = this._first; c;) c._start >= a && (c instanceof Ae ? n && l.push(c) : (o && l.push(c), r && l.push.apply(l, c.getChildren(!0, n, o)))), c = c._next;
        return l
    }, t.getById = function (r) {
        for (var n = this.getChildren(1, 1, 1), o = n.length; o--;) if (n[o].vars.id === r) return n[o]
    }, t.remove = function (r) {
        return Ne(r) ? this.removeLabel(r) : be(r) ? this.killTweensOf(r) : (r.parent === this && no(this, r), r === this._recent && (this._recent = this._last), mr(this))
    }, t.totalTime = function (r, n) {
        return arguments.length ? (this._forcing = 1, !this._dp && this._ts && (this._start = ke(At.time - (this._ts > 0 ? r / this._ts : (this.totalDuration() - r) / -this._ts))), s.prototype.totalTime.call(this, r, n), this._forcing = 0, this) : this._tTime
    }, t.addLabel = function (r, n) {
        return this.labels[r] = Bt(this, n), this
    }, t.removeLabel = function (r) {
        return delete this.labels[r], this
    }, t.addPause = function (r, n, o) {
        var a = Ae.delayedCall(0, n || Hs, o);
        return a.data = "isPause", this._hasPause = 1, li(this, a, Bt(this, r))
    }, t.removePause = function (r) {
        var n = this._first;
        for (r = Bt(this, r); n;) n._start === r && n.data === "isPause" && Ki(n), n = n._next
    }, t.killTweensOf = function (r, n, o) {
        for (var a = this.getTweensOf(r, o), l = a.length; l--;) Ni !== a[l] && a[l].kill(r, n);
        return this
    }, t.getTweensOf = function (r, n) {
        for (var o = [], a = Ht(r), l = this._first, c = Li(n), u; l;) l instanceof Ae ? ef(l._targets, a) && (c ? (!Ni || l._initted && l._ts) && l.globalTime(0) <= n && l.globalTime(l.totalDuration()) > n : !n || l.isActive()) && o.push(l) : (u = l.getTweensOf(a, n)).length && o.push.apply(o, u), l = l._next;
        return o
    }, t.tweenTo = function (r, n) {
        n = n || {};
        var o = this, a = Bt(o, r), l = n, c = l.startAt, u = l.onStart, d = l.onStartParams, f = l.immediateRender, p,
            m = Ae.to(o, qt({
                ease: n.ease || "none",
                lazy: !1,
                immediateRender: !1,
                time: a,
                overwrite: "auto",
                duration: n.duration || Math.abs((a - (c && "time" in c ? c.time : o._time)) / o.timeScale()) || ue,
                onStart: function () {
                    if (o.pause(), !p) {
                        var g = n.duration || Math.abs((a - (c && "time" in c ? c.time : o._time)) / o.timeScale());
                        m._dur !== g && ss(m, g, 0, 1).render(m._time, !0, !0), p = 1
                    }
                    u && u.apply(m, d || [])
                }
            }, n));
        return f ? m.render(0) : m
    }, t.tweenFromTo = function (r, n, o) {
        return this.tweenTo(n, qt({startAt: {time: Bt(this, r)}}, o))
    }, t.recent = function () {
        return this._recent
    }, t.nextLabel = function (r) {
        return r === void 0 && (r = this._time), vl(this, Bt(this, r))
    }, t.previousLabel = function (r) {
        return r === void 0 && (r = this._time), vl(this, Bt(this, r), 1)
    }, t.currentLabel = function (r) {
        return arguments.length ? this.seek(r, !0) : this.previousLabel(this._time + ue)
    }, t.shiftChildren = function (r, n, o) {
        o === void 0 && (o = 0);
        for (var a = this._first, l = this.labels, c; a;) a._start >= o && (a._start += r, a._end += r), a = a._next;
        if (n) for (c in l) l[c] >= o && (l[c] += r);
        return mr(this)
    }, t.invalidate = function (r) {
        var n = this._first;
        for (this._lock = 0; n;) n.invalidate(r), n = n._next;
        return s.prototype.invalidate.call(this, r)
    }, t.clear = function (r) {
        r === void 0 && (r = !0);
        for (var n = this._first, o; n;) o = n._next, this.remove(n), n = o;
        return this._dp && (this._time = this._tTime = this._pTime = 0), r && (this.labels = {}), mr(this)
    }, t.totalDuration = function (r) {
        var n = 0, o = this, a = o._last, l = Nt, c, u, d;
        if (arguments.length) return o.timeScale((o._repeat < 0 ? o.duration() : o.totalDuration()) / (o.reversed() ? -r : r));
        if (o._dirty) {
            for (d = o.parent; a;) c = a._prev, a._dirty && a.totalDuration(), u = a._start, u > l && o._sort && a._ts && !o._lock ? (o._lock = 1, li(o, a, u - a._delay, 1)._lock = 0) : l = u, u < 0 && a._ts && (n -= u, (!d && !o._dp || d && d.smoothChildTiming) && (o._start += u / o._ts, o._time -= u, o._tTime -= u), o.shiftChildren(-u, !1, -1 / 0), l = 0), a._end > n && a._ts && (n = a._end), a = c;
            ss(o, o === ve && o._time > n ? o._time : n, 1, 1), o._dirty = 0
        }
        return o._tDur
    }, e.updateRoot = function (r) {
        if (ve._ts && (Mc(ve, Bn(r, ve)), Pc = At.frame), At.frame >= pl) {
            pl += Dt.autoSleep || 120;
            var n = ve._first;
            if ((!n || !n._ts) && Dt.autoSleep && At._listeners.length < 2) {
                for (; n && !n._ts;) n = n._next;
                n || At.sleep()
            }
        }
    }, e
}(Ws);
qt(ut.prototype, {_lock: 0, _hasPause: 0, _forcing: 0});
var Tf = function (e, t, i, r, n, o, a) {
    var l = new yt(this._pt, e, t, 0, 1, ru, null, n), c = 0, u = 0, d, f, p, m, h, g, y, v;
    for (l.b = i, l.e = r, i += "", r += "", (y = ~r.indexOf("random(")) && (r = $s(r)), o && (v = [i, r], o(v, e, t), i = v[0], r = v[1]), f = i.match(ho) || []; d = ho.exec(r);) m = d[0], h = r.substring(c, d.index), p ? p = (p + 1) % 5 : h.substr(-5) === "rgba(" && (p = 1), m !== f[u++] && (g = parseFloat(f[u - 1]) || 0, l._pt = {
        _next: l._pt,
        p: h || u === 1 ? h : ",",
        s: g,
        c: m.charAt(1) === "=" ? Xr(g, m) - g : parseFloat(m) - g,
        m: p && p < 4 ? Math.round : 0
    }, c = ho.lastIndex);
    return l.c = c < r.length ? r.substring(c, r.length) : "", l.fp = a, (Sc.test(r) || y) && (l.e = 0), this._pt = l, l
}, Ra = function (e, t, i, r, n, o, a, l, c, u) {
    be(r) && (r = r(n || 0, e, o));
    var d = e[t],
        f = i !== "get" ? i : be(d) ? c ? e[t.indexOf("set") || !be(e["get" + t.substr(3)]) ? t : "get" + t.substr(3)](c) : e[t]() : d,
        p = be(d) ? c ? Mf : tu : za, m;
    if (Ne(r) && (~r.indexOf("random(") && (r = $s(r)), r.charAt(1) === "=" && (m = Xr(f, r) + (et(f) || 0), (m || m === 0) && (r = m))), !u || f !== r || ea) return !isNaN(f * r) && r !== "" ? (m = new yt(this._pt, e, t, +f || 0, r - (f || 0), typeof d == "boolean" ? kf : iu, 0, p), c && (m.fp = c), a && m.modifier(a, this, e), this._pt = m) : (!d && !(t in e) && Aa(t, r), Tf.call(this, e, t, f, r, p, l || Dt.stringFilter, c))
}, Ef = function (e, t, i, r, n) {
    if (be(e) && (e = As(e, n, t, i, r)), !mi(e) || e.style && e.nodeType || it(e) || wc(e)) return Ne(e) ? As(e, n, t, i, r) : e;
    var o = {}, a;
    for (a in e) o[a] = As(e[a], n, t, i, r);
    return o
}, Jc = function (e, t, i, r, n, o) {
    var a, l, c, u;
    if (Pt[e] && (a = new Pt[e]).init(n, a.rawVars ? t[e] : Ef(t[e], r, n, o, i), i, r, o) !== !1 && (i._pt = l = new yt(i._pt, n, e, 0, 1, a.render, a, 0, a.priority), i !== Wr)) for (c = i._ptLookup[i._targets.indexOf(n)], u = a._props.length; u--;) c[a._props[u]] = l;
    return a
}, Ni, ea, qa = function s(e, t, i) {
    var r = e.vars, n = r.ease, o = r.startAt, a = r.immediateRender, l = r.lazy, c = r.onUpdate, u = r.runBackwards,
        d = r.yoyoEase, f = r.keyframes, p = r.autoRevert, m = e._dur, h = e._startAt, g = e._targets, y = e.parent,
        v = y && y.data === "nested" ? y.vars.targets : g, _ = e._overwrite === "auto" && !Ca, w = e.timeline, b, T, x,
        C, P, E, A, L, k, R, q, I, z;
    if (w && (!f || !n) && (n = "none"), e._ease = gr(n, ts.ease), e._yEase = d ? Uc(gr(d === !0 ? n : d, ts.ease)) : 0, d && e._yoyo && !e._repeat && (d = e._yEase, e._yEase = e._ease, e._ease = d), e._from = !w && !!r.runBackwards, !w || f && !r.stagger) {
        if (L = g[0] ? hr(g[0]).harness : 0, I = L && r[L.prop], b = zn(r, ka), h && (h._zTime < 0 && h.progress(1), t < 0 && u && a && !p ? h.render(-1, !0) : h.revert(u && m ? xn : Jd), h._lazy = 0), o) {
            if (Ki(e._startAt = Ae.set(g, qt({
                data: "isStart",
                overwrite: !1,
                parent: y,
                immediateRender: !0,
                lazy: !h && vt(l),
                startAt: null,
                delay: 0,
                onUpdate: c && function () {
                    return It(e, "onUpdate")
                },
                stagger: 0
            }, o))), e._startAt._dp = 0, e._startAt._sat = e, t < 0 && (Ye || !a && !p) && e._startAt.revert(xn), a && m && t <= 0 && i <= 0) {
                t && (e._zTime = t);
                return
            }
        } else if (u && m && !h) {
            if (t && (a = !1), x = qt({
                overwrite: !1,
                data: "isFromStart",
                lazy: a && !h && vt(l),
                immediateRender: a,
                stagger: 0,
                parent: y
            }, b), I && (x[L.prop] = I), Ki(e._startAt = Ae.set(g, x)), e._startAt._dp = 0, e._startAt._sat = e, t < 0 && (Ye ? e._startAt.revert(xn) : e._startAt.render(-1, !0)), e._zTime = t, !a) s(e._startAt, ue, ue); else if (!t) return
        }
        for (e._pt = e._ptCache = 0, l = m && vt(l) || l && !m, T = 0; T < g.length; T++) {
            if (P = g[T], A = P._gsap || Ia(g)[T]._gsap, e._ptLookup[T] = R = {}, Uo[A.id] && Xi.length && qn(), q = v === g ? T : v.indexOf(P), L && (k = new L).init(P, I || b, e, q, v) !== !1 && (e._pt = C = new yt(e._pt, P, k.name, 0, 1, k.render, k, 0, k.priority), k._props.forEach(function (D) {
                R[D] = C
            }), k.priority && (E = 1)), !L || I) for (x in b) Pt[x] && (k = Jc(x, b, e, q, P, v)) ? k.priority && (E = 1) : R[x] = C = Ra.call(e, P, x, "get", b[x], q, v, 0, r.stringFilter);
            e._op && e._op[T] && e.kill(P, e._op[T]), _ && e._pt && (Ni = e, ve.killTweensOf(P, R, e.globalTime(t)), z = !e.parent, Ni = 0), e._pt && l && (Uo[A.id] = 1)
        }
        E && su(e), e._onInit && e._onInit(e)
    }
    e._onUpdate = c, e._initted = (!e._op || e._pt) && !z, f && t <= 0 && w.render(Nt, !0, !0)
}, Cf = function (e, t, i, r, n, o, a, l) {
    var c = (e._pt && e._ptCache || (e._ptCache = {}))[t], u, d, f, p;
    if (!c) for (c = e._ptCache[t] = [], f = e._ptLookup, p = e._targets.length; p--;) {
        if (u = f[p][t], u && u.d && u.d._pt) for (u = u.d._pt; u && u.p !== t && u.fp !== t;) u = u._next;
        if (!u) return ea = 1, e.vars[t] = "+=0", qa(e, a), ea = 0, l ? Ns(t + " not eligible for reset") : 1;
        c.push(u)
    }
    for (p = c.length; p--;) d = c[p], u = d._pt || d, u.s = (r || r === 0) && !n ? r : u.s + (r || 0) + o * u.c, u.c = i - u.s, d.e && (d.e = Ee(i) + et(d.e)), d.b && (d.b = u.s + et(d.b))
}, Pf = function (e, t) {
    var i = e[0] ? hr(e[0]).harness : 0, r = i && i.aliases, n, o, a, l;
    if (!r) return t;
    n = is({}, t);
    for (o in r) if (o in n) for (l = r[o].split(","), a = l.length; a--;) n[l[a]] = n[o];
    return n
}, Lf = function (e, t, i, r) {
    var n = t.ease || r || "power1.inOut", o, a;
    if (it(t)) a = i[e] || (i[e] = []), t.forEach(function (l, c) {
        return a.push({t: c / (t.length - 1) * 100, v: l, e: n})
    }); else for (o in t) a = i[o] || (i[o] = []), o === "ease" || a.push({t: parseFloat(e), v: t[o], e: n})
}, As = function (e, t, i, r, n) {
    return be(e) ? e.call(t, i, r, n) : Ne(e) && ~e.indexOf("random(") ? $s(e) : e
}, Zc = Oa + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert", eu = {};
_t(Zc + ",id,stagger,delay,duration,paused,scrollTrigger", function (s) {
    return eu[s] = 1
});
var Ae = function (s) {
    _c(e, s);

    function e(i, r, n, o) {
        var a;
        typeof r == "number" && (n.duration = r, r = n, n = null), a = s.call(this, o ? r : Ls(r)) || this;
        var l = a.vars, c = l.duration, u = l.delay, d = l.immediateRender, f = l.stagger, p = l.overwrite,
            m = l.keyframes, h = l.defaults, g = l.scrollTrigger, y = l.yoyoEase, v = r.parent || ve,
            _ = (it(i) || wc(i) ? Li(i[0]) : "length" in r) ? [i] : Ht(i), w, b, T, x, C, P, E, A;
        if (a._targets = _.length ? Ia(_) : Ns("GSAP target " + i + " not found. ", !Dt.nullTargetWarn) || [], a._ptLookup = [], a._overwrite = p, m || f || nn(c) || nn(u)) {
            if (r = a.vars, w = a.timeline = new ut({
                data: "nested",
                defaults: h || {},
                targets: v && v.data === "nested" ? v.vars.targets : _
            }), w.kill(), w.parent = w._dp = xi(a), w._start = 0, f || nn(c) || nn(u)) {
                if (x = _.length, E = f && Bc(f), mi(f)) for (C in f) ~Zc.indexOf(C) && (A || (A = {}), A[C] = f[C]);
                for (b = 0; b < x; b++) T = zn(r, eu), T.stagger = 0, y && (T.yoyoEase = y), A && is(T, A), P = _[b], T.duration = +As(c, xi(a), b, P, _), T.delay = (+As(u, xi(a), b, P, _) || 0) - a._delay, !f && x === 1 && T.delay && (a._delay = u = T.delay, a._start += u, T.delay = 0), w.to(P, T, E ? E(b, P, _) : 0), w._ease = te.none;
                w.duration() ? c = u = 0 : a.timeline = 0
            } else if (m) {
                Ls(qt(w.vars.defaults, {ease: "none"})), w._ease = gr(m.ease || r.ease || "none");
                var L = 0, k, R, q;
                if (it(m)) m.forEach(function (I) {
                    return w.to(_, I, ">")
                }), w.duration(); else {
                    T = {};
                    for (C in m) C === "ease" || C === "easeEach" || Lf(C, m[C], T, m.easeEach);
                    for (C in T) for (k = T[C].sort(function (I, z) {
                        return I.t - z.t
                    }), L = 0, b = 0; b < k.length; b++) R = k[b], q = {
                        ease: R.e,
                        duration: (R.t - (b ? k[b - 1].t : 0)) / 100 * c
                    }, q[C] = R.v, w.to(_, q, L), L += q.duration;
                    w.duration() < c && w.to({}, {duration: c - w.duration()})
                }
            }
            c || a.duration(c = w.duration())
        } else a.timeline = 0;
        return p === !0 && !Ca && (Ni = xi(a), ve.killTweensOf(_), Ni = 0), li(v, xi(a), n), r.reversed && a.reverse(), r.paused && a.paused(!0), (d || !c && !m && a._start === ke(v._time) && vt(d) && nf(xi(a)) && v.data !== "nested") && (a._tTime = -ue, a.render(Math.max(0, -u) || 0)), g && Dc(xi(a), g), a
    }

    var t = e.prototype;
    return t.render = function (r, n, o) {
        var a = this._time, l = this._tDur, c = this._dur, u = r < 0, d = r > l - ue && !u ? l : r < ue ? 0 : r, f, p,
            m, h, g, y, v, _, w;
        if (!c) af(this, r, n, o); else if (d !== this._tTime || !r || o || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== u || this._lazy) {
            if (f = d, _ = this.timeline, this._repeat) {
                if (h = c + this._rDelay, this._repeat < -1 && u) return this.totalTime(h * 100 + r, n, o);
                if (f = ke(d % h), d === l ? (m = this._repeat, f = c) : (g = ke(d / h), m = ~~g, m && m === g ? (f = c, m--) : f > c && (f = c)), y = this._yoyo && m & 1, y && (w = this._yEase, f = c - f), g = rs(this._tTime, h), f === a && !o && this._initted && m === g) return this._tTime = d, this;
                m !== g && (_ && this._yEase && jc(_, y), this.vars.repeatRefresh && !y && !this._lock && f !== h && this._initted && (this._lock = o = 1, this.render(ke(h * m), !0).invalidate()._lock = 0))
            }
            if (!this._initted) {
                if (Rc(this, u ? r : f, o, n, d)) return this._tTime = 0, this;
                if (a !== this._time && !(o && this.vars.repeatRefresh && m !== g)) return this;
                if (c !== this._dur) return this.render(r, n, o)
            }
            if (this._tTime = d, this._time = f, !this._act && this._ts && (this._act = 1, this._lazy = 0), this.ratio = v = (w || this._ease)(f / c), this._from && (this.ratio = v = 1 - v), !a && d && !n && !g && (It(this, "onStart"), this._tTime !== d)) return this;
            for (p = this._pt; p;) p.r(v, p.d), p = p._next;
            _ && _.render(r < 0 ? r : _._dur * _._ease(f / this._dur), n, o) || this._startAt && (this._zTime = r), this._onUpdate && !n && (u && jo(this, r, n, o), It(this, "onUpdate")), this._repeat && m !== g && this.vars.onRepeat && !n && this.parent && It(this, "onRepeat"), (d === this._tDur || !d) && this._tTime === d && (u && !this._onUpdate && jo(this, r, !0, !0), (r || !c) && (d === this._tDur && this._ts > 0 || !d && this._ts < 0) && Ki(this, 1), !n && !(u && !a) && (d || a || y) && (It(this, d === l ? "onComplete" : "onReverseComplete", !0), this._prom && !(d < l && this.timeScale() > 0) && this._prom()))
        }
        return this
    }, t.targets = function () {
        return this._targets
    }, t.invalidate = function (r) {
        return (!r || !this.vars.runBackwards) && (this._startAt = 0), this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0, this._ptLookup = [], this.timeline && this.timeline.invalidate(r), s.prototype.invalidate.call(this, r)
    }, t.resetTo = function (r, n, o, a, l) {
        Gs || At.wake(), this._ts || this.play();
        var c = Math.min(this._dur, (this._dp._time - this._start) * this._ts), u;
        return this._initted || qa(this, c), u = this._ease(c / this._dur), Cf(this, r, n, o, a, u, c, l) ? this.resetTo(r, n, o, a, 1) : (ao(this, 0), this.parent || Oc(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0), this.render(0))
    }, t.kill = function (r, n) {
        if (n === void 0 && (n = "all"), !r && (!n || n === "all")) return this._lazy = this._pt = 0, this.parent ? bs(this) : this.scrollTrigger && this.scrollTrigger.kill(!!Ye), this;
        if (this.timeline) {
            var o = this.timeline.totalDuration();
            return this.timeline.killTweensOf(r, n, Ni && Ni.vars.overwrite !== !0)._first || bs(this), this.parent && o !== this.timeline.totalDuration() && ss(this, this._dur * this.timeline._tDur / o, 0, 1), this
        }
        var a = this._targets, l = r ? Ht(r) : a, c = this._ptLookup, u = this._pt, d, f, p, m, h, g, y;
        if ((!n || n === "all") && rf(a, l)) return n === "all" && (this._pt = 0), bs(this);
        for (d = this._op = this._op || [], n !== "all" && (Ne(n) && (h = {}, _t(n, function (v) {
            return h[v] = 1
        }), n = h), n = Pf(a, n)), y = a.length; y--;) if (~l.indexOf(a[y])) {
            f = c[y], n === "all" ? (d[y] = n, m = f, p = {}) : (p = d[y] = d[y] || {}, m = n);
            for (h in m) g = f && f[h], g && ((!("kill" in g.d) || g.d.kill(h) === !0) && no(this, g, "_pt"), delete f[h]), p !== "all" && (p[h] = 1)
        }
        return this._initted && !this._pt && u && bs(this), this
    }, e.to = function (r, n) {
        return new e(r, n, arguments[2])
    }, e.from = function (r, n) {
        return Ms(1, arguments)
    }, e.delayedCall = function (r, n, o, a) {
        return new e(n, 0, {
            immediateRender: !1,
            lazy: !1,
            overwrite: !1,
            delay: r,
            onComplete: n,
            onReverseComplete: n,
            onCompleteParams: o,
            onReverseCompleteParams: o,
            callbackScope: a
        })
    }, e.fromTo = function (r, n, o) {
        return Ms(2, arguments)
    }, e.set = function (r, n) {
        return n.duration = 0, n.repeatDelay || (n.repeat = 0), new e(r, n)
    }, e.killTweensOf = function (r, n, o) {
        return ve.killTweensOf(r, n, o)
    }, e
}(Ws);
qt(Ae.prototype, {_targets: [], _lazy: 0, _startAt: 0, _op: 0, _onInit: 0});
_t("staggerTo,staggerFrom,staggerFromTo", function (s) {
    Ae[s] = function () {
        var e = new ut, t = Qo.call(arguments, 0);
        return t.splice(s === "staggerFromTo" ? 5 : 4, 0, 0), e[s].apply(e, t)
    }
});
var za = function (e, t, i) {
    return e[t] = i
}, tu = function (e, t, i) {
    return e[t](i)
}, Mf = function (e, t, i, r) {
    return e[t](r.fp, i)
}, Af = function (e, t, i) {
    return e.setAttribute(t, i)
}, Ba = function (e, t) {
    return be(e[t]) ? tu : Pa(e[t]) && e.setAttribute ? Af : za
}, iu = function (e, t) {
    return t.set(t.t, t.p, Math.round((t.s + t.c * e) * 1e6) / 1e6, t)
}, kf = function (e, t) {
    return t.set(t.t, t.p, !!(t.s + t.c * e), t)
}, ru = function (e, t) {
    var i = t._pt, r = "";
    if (!e && t.b) r = t.b; else if (e === 1 && t.e) r = t.e; else {
        for (; i;) r = i.p + (i.m ? i.m(i.s + i.c * e) : Math.round((i.s + i.c * e) * 1e4) / 1e4) + r, i = i._next;
        r += t.c
    }
    t.set(t.t, t.p, r, t)
}, Fa = function (e, t) {
    for (var i = t._pt; i;) i.r(e, i.d), i = i._next
}, Of = function (e, t, i, r) {
    for (var n = this._pt, o; n;) o = n._next, n.p === r && n.modifier(e, t, i), n = o
}, If = function (e) {
    for (var t = this._pt, i, r; t;) r = t._next, t.p === e && !t.op || t.op === e ? no(this, t, "_pt") : t.dep || (i = 1), t = r;
    return !i
}, Df = function (e, t, i, r) {
    r.mSet(e, t, r.m.call(r.tween, i, r.mt), r)
}, su = function (e) {
    for (var t = e._pt, i, r, n, o; t;) {
        for (i = t._next, r = n; r && r.pr > t.pr;) r = r._next;
        (t._prev = r ? r._prev : o) ? t._prev._next = t : n = t, (t._next = r) ? r._prev = t : o = t, t = i
    }
    e._pt = n
}, yt = function () {
    function s(t, i, r, n, o, a, l, c, u) {
        this.t = i, this.s = n, this.c = o, this.p = r, this.r = a || iu, this.d = l || this, this.set = c || za, this.pr = u || 0, this._next = t, t && (t._prev = this)
    }

    var e = s.prototype;
    return e.modifier = function (i, r, n) {
        this.mSet = this.mSet || this.set, this.set = Df, this.m = i, this.mt = n, this.tween = r
    }, s
}();
_t(Oa + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger", function (s) {
    return ka[s] = 1
});
Rt.TweenMax = Rt.TweenLite = Ae;
Rt.TimelineLite = Rt.TimelineMax = ut;
ve = new ut({sortChildren: !1, defaults: ts, autoRemoveChildren: !0, id: "root", smoothChildTiming: !0});
Dt.stringFilter = Xc;
var vr = [], En = {}, Rf = [], yl = 0, qf = 0, yo = function (e) {
    return (En[e] || Rf).map(function (t) {
        return t()
    })
}, ta = function () {
    var e = Date.now(), t = [];
    e - yl > 2 && (yo("matchMediaInit"), vr.forEach(function (i) {
        var r = i.queries, n = i.conditions, o, a, l, c;
        for (a in r) o = ni.matchMedia(r[a]).matches, o && (l = 1), o !== n[a] && (n[a] = o, c = 1);
        c && (i.revert(), l && t.push(i))
    }), yo("matchMediaRevert"), t.forEach(function (i) {
        return i.onMatch(i, function (r) {
            return i.add(null, r)
        })
    }), yl = e, yo("matchMedia"))
}, nu = function () {
    function s(t, i) {
        this.selector = i && Jo(i), this.data = [], this._r = [], this.isReverted = !1, this.id = qf++, t && this.add(t)
    }

    var e = s.prototype;
    return e.add = function (i, r, n) {
        be(i) && (n = r, r = i, i = be);
        var o = this, a = function () {
            var c = me, u = o.selector, d;
            return c && c !== o && c.data.push(o), n && (o.selector = Jo(n)), me = o, d = r.apply(o, arguments), be(d) && o._r.push(d), me = c, o.selector = u, o.isReverted = !1, d
        };
        return o.last = a, i === be ? a(o, function (l) {
            return o.add(null, l)
        }) : i ? o[i] = a : a
    }, e.ignore = function (i) {
        var r = me;
        me = null, i(this), me = r
    }, e.getTweens = function () {
        var i = [];
        return this.data.forEach(function (r) {
            return r instanceof s ? i.push.apply(i, r.getTweens()) : r instanceof Ae && !(r.parent && r.parent.data === "nested") && i.push(r)
        }), i
    }, e.clear = function () {
        this._r.length = this.data.length = 0
    }, e.kill = function (i, r) {
        var n = this;
        if (i ? function () {
            for (var a = n.getTweens(), l = n.data.length, c; l--;) c = n.data[l], c.data === "isFlip" && (c.revert(), c.getChildren(!0, !0, !1).forEach(function (u) {
                return a.splice(a.indexOf(u), 1)
            }));
            for (a.map(function (u) {
                return {
                    g: u._dur || u._delay || u._sat && !u._sat.vars.immediateRender ? u.globalTime(0) : -1 / 0,
                    t: u
                }
            }).sort(function (u, d) {
                return d.g - u.g || -1 / 0
            }).forEach(function (u) {
                return u.t.revert(i)
            }), l = n.data.length; l--;) c = n.data[l], c instanceof ut ? c.data !== "nested" && (c.scrollTrigger && c.scrollTrigger.revert(), c.kill()) : !(c instanceof Ae) && c.revert && c.revert(i);
            n._r.forEach(function (u) {
                return u(i, n)
            }), n.isReverted = !0
        }() : this.data.forEach(function (a) {
            return a.kill && a.kill()
        }), this.clear(), r) for (var o = vr.length; o--;) vr[o].id === this.id && vr.splice(o, 1)
    }, e.revert = function (i) {
        this.kill(i || {})
    }, s
}(), zf = function () {
    function s(t) {
        this.contexts = [], this.scope = t, me && me.data.push(this)
    }

    var e = s.prototype;
    return e.add = function (i, r, n) {
        mi(i) || (i = {matches: i});
        var o = new nu(0, n || this.scope), a = o.conditions = {}, l, c, u;
        me && !o.selector && (o.selector = me.selector), this.contexts.push(o), r = o.add("onMatch", r), o.queries = i;
        for (c in i) c === "all" ? u = 1 : (l = ni.matchMedia(i[c]), l && (vr.indexOf(o) < 0 && vr.push(o), (a[c] = l.matches) && (u = 1), l.addListener ? l.addListener(ta) : l.addEventListener("change", ta)));
        return u && r(o, function (d) {
            return o.add(null, d)
        }), this
    }, e.revert = function (i) {
        this.kill(i || {})
    }, e.kill = function (i) {
        this.contexts.forEach(function (r) {
            return r.kill(i, !0)
        })
    }, s
}(), Fn = {
    registerPlugin: function () {
        for (var e = arguments.length, t = new Array(e), i = 0; i < e; i++) t[i] = arguments[i];
        t.forEach(function (r) {
            return Gc(r)
        })
    },
    timeline: function (e) {
        return new ut(e)
    },
    getTweensOf: function (e, t) {
        return ve.getTweensOf(e, t)
    },
    getProperty: function (e, t, i, r) {
        Ne(e) && (e = Ht(e)[0]);
        var n = hr(e || {}).get, o = i ? kc : Ac;
        return i === "native" && (i = ""), e && (t ? o((Pt[t] && Pt[t].get || n)(e, t, i, r)) : function (a, l, c) {
            return o((Pt[a] && Pt[a].get || n)(e, a, l, c))
        })
    },
    quickSetter: function (e, t, i) {
        if (e = Ht(e), e.length > 1) {
            var r = e.map(function (u) {
                return bt.quickSetter(u, t, i)
            }), n = r.length;
            return function (u) {
                for (var d = n; d--;) r[d](u)
            }
        }
        e = e[0] || {};
        var o = Pt[t], a = hr(e), l = a.harness && (a.harness.aliases || {})[t] || t, c = o ? function (u) {
            var d = new o;
            Wr._pt = 0, d.init(e, i ? u + i : u, Wr, 0, [e]), d.render(1, d), Wr._pt && Fa(1, Wr)
        } : a.set(e, l);
        return o ? c : function (u) {
            return c(e, l, i ? u + i : u, a, 1)
        }
    },
    quickTo: function (e, t, i) {
        var r, n = bt.to(e, qt((r = {}, r[t] = "+=0.1", r.paused = !0, r.stagger = 0, r), i || {})),
            o = function (l, c, u) {
                return n.resetTo(t, l, c, u)
            };
        return o.tween = n, o
    },
    isTweening: function (e) {
        return ve.getTweensOf(e, !0).length > 0
    },
    defaults: function (e) {
        return e && e.ease && (e.ease = gr(e.ease, ts.ease)), hl(ts, e || {})
    },
    config: function (e) {
        return hl(Dt, e || {})
    },
    registerEffect: function (e) {
        var t = e.name, i = e.effect, r = e.plugins, n = e.defaults, o = e.extendTimeline;
        (r || "").split(",").forEach(function (a) {
            return a && !Pt[a] && !Rt[a] && Ns(t + " effect requires " + a + " plugin.")
        }), mo[t] = function (a, l, c) {
            return i(Ht(a), qt(l || {}, n), c)
        }, o && (ut.prototype[t] = function (a, l, c) {
            return this.add(mo[t](a, mi(l) ? l : (c = l) && {}, this), c)
        })
    },
    registerEase: function (e, t) {
        te[e] = gr(t)
    },
    parseEase: function (e, t) {
        return arguments.length ? gr(e, t) : te
    },
    getById: function (e) {
        return ve.getById(e)
    },
    exportRoot: function (e, t) {
        e === void 0 && (e = {});
        var i = new ut(e), r, n;
        for (i.smoothChildTiming = vt(e.smoothChildTiming), ve.remove(i), i._dp = 0, i._time = i._tTime = ve._time, r = ve._first; r;) n = r._next, (t || !(!r._dur && r instanceof Ae && r.vars.onComplete === r._targets[0])) && li(i, r, r._start - r._delay), r = n;
        return li(ve, i, 0), i
    },
    context: function (e, t) {
        return e ? new nu(e, t) : me
    },
    matchMedia: function (e) {
        return new zf(e)
    },
    matchMediaRefresh: function () {
        return vr.forEach(function (e) {
            var t = e.conditions, i, r;
            for (r in t) t[r] && (t[r] = !1, i = 1);
            i && e.revert()
        }) || ta()
    },
    addEventListener: function (e, t) {
        var i = En[e] || (En[e] = []);
        ~i.indexOf(t) || i.push(t)
    },
    removeEventListener: function (e, t) {
        var i = En[e], r = i && i.indexOf(t);
        r >= 0 && i.splice(r, 1)
    },
    utils: {
        wrap: mf,
        wrapYoyo: gf,
        distribute: Bc,
        random: Vc,
        snap: Fc,
        normalize: hf,
        getUnit: et,
        clamp: uf,
        splitColor: Wc,
        toArray: Ht,
        selector: Jo,
        mapRange: Hc,
        pipe: ff,
        unitize: pf,
        interpolate: vf,
        shuffle: zc
    },
    install: Ec,
    effects: mo,
    ticker: At,
    updateRoot: ut.updateRoot,
    plugins: Pt,
    globalTimeline: ve,
    core: {
        PropTween: yt,
        globals: Cc,
        Tween: Ae,
        Timeline: ut,
        Animation: Ws,
        getCache: hr,
        _removeLinkedListItem: no,
        reverting: function () {
            return Ye
        },
        context: function (e) {
            return e && me && (me.data.push(e), e._ctx = me), me
        },
        suppressOverwrites: function (e) {
            return Ca = e
        }
    }
};
_t("to,from,fromTo,delayedCall,set,killTweensOf", function (s) {
    return Fn[s] = Ae[s]
});
At.add(ut.updateRoot);
Wr = Fn.to({}, {duration: 0});
var Bf = function (e, t) {
    for (var i = e._pt; i && i.p !== t && i.op !== t && i.fp !== t;) i = i._next;
    return i
}, Ff = function (e, t) {
    var i = e._targets, r, n, o;
    for (r in t) for (n = i.length; n--;) o = e._ptLookup[n][r], o && (o = o.d) && (o._pt && (o = Bf(o, r)), o && o.modifier && o.modifier(t[r], e, i[n], r))
}, wo = function (e, t) {
    return {
        name: e, headless: 1, rawVars: 1, init: function (r, n, o) {
            o._onInit = function (a) {
                var l, c;
                if (Ne(n) && (l = {}, _t(n, function (u) {
                    return l[u] = 1
                }), n = l), t) {
                    l = {};
                    for (c in n) l[c] = t(n[c]);
                    n = l
                }
                Ff(a, n)
            }
        }
    }
}, bt = Fn.registerPlugin({
    name: "attr", init: function (e, t, i, r, n) {
        var o, a, l;
        this.tween = i;
        for (o in t) l = e.getAttribute(o) || "", a = this.add(e, "setAttribute", (l || 0) + "", t[o], r, n, 0, 0, o), a.op = o, a.b = l, this._props.push(o)
    }, render: function (e, t) {
        for (var i = t._pt; i;) Ye ? i.set(i.t, i.p, i.b, i) : i.r(e, i.d), i = i._next
    }
}, {
    name: "endArray", headless: 1, init: function (e, t) {
        for (var i = t.length; i--;) this.add(e, i, e[i] || 0, t[i], 0, 0, 0, 0, 0, 1)
    }
}, wo("roundProps", Zo), wo("modifiers"), wo("snap", Fc)) || Fn;
Ae.version = ut.version = bt.version = "3.13.0";
Tc = 1;
La() && ns();
te.Power0;
te.Power1;
te.Power2;
te.Power3;
te.Power4;
te.Linear;
te.Quad;
te.Cubic;
te.Quart;
te.Quint;
te.Strong;
te.Elastic;
te.Back;
te.SteppedEase;
te.Bounce;
te.Sine;
te.Expo;
te.Circ;/*!
 * CSSPlugin 3.13.0
 *
 *
 * Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at
 * @author: Jack Doyle, jack@greensock.com
*/
var wl, Hi, Ur, Va, ur, bl, Na, Vf = function () {
        return typeof window < "u"
    }, Mi = {}, ar = 180 / Math.PI, jr = Math.PI / 180, Ir = Math.atan2, Sl = 1e8, Ha = /([A-Z])/g,
    Nf = /(left|right|width|margin|padding|x)/i, Hf = /[\s,\(]\S/,
    ui = {autoAlpha: "opacity,visibility", scale: "scaleX,scaleY", alpha: "opacity"}, ia = function (e, t) {
        return t.set(t.t, t.p, Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u, t)
    }, $f = function (e, t) {
        return t.set(t.t, t.p, e === 1 ? t.e : Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u, t)
    }, Gf = function (e, t) {
        return t.set(t.t, t.p, e ? Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u : t.b, t)
    }, Wf = function (e, t) {
        var i = t.s + t.c * e;
        t.set(t.t, t.p, ~~(i + (i < 0 ? -.5 : .5)) + t.u, t)
    }, ou = function (e, t) {
        return t.set(t.t, t.p, e ? t.e : t.b, t)
    }, au = function (e, t) {
        return t.set(t.t, t.p, e !== 1 ? t.b : t.e, t)
    }, Yf = function (e, t, i) {
        return e.style[t] = i
    }, Xf = function (e, t, i) {
        return e.style.setProperty(t, i)
    }, Uf = function (e, t, i) {
        return e._gsap[t] = i
    }, jf = function (e, t, i) {
        return e._gsap.scaleX = e._gsap.scaleY = i
    }, Kf = function (e, t, i, r, n) {
        var o = e._gsap;
        o.scaleX = o.scaleY = i, o.renderTransform(n, o)
    }, Qf = function (e, t, i, r, n) {
        var o = e._gsap;
        o[t] = i, o.renderTransform(n, o)
    }, _e = "transform", wt = _e + "Origin", Jf = function s(e, t) {
        var i = this, r = this.target, n = r.style, o = r._gsap;
        if (e in Mi && n) {
            if (this.tfm = this.tfm || {}, e !== "transform") e = ui[e] || e, ~e.indexOf(",") ? e.split(",").forEach(function (a) {
                return i.tfm[a] = Ti(r, a)
            }) : this.tfm[e] = o.x ? o[e] : Ti(r, e), e === wt && (this.tfm.zOrigin = o.zOrigin); else return ui.transform.split(",").forEach(function (a) {
                return s.call(i, a, t)
            });
            if (this.props.indexOf(_e) >= 0) return;
            o.svg && (this.svgo = r.getAttribute("data-svg-origin"), this.props.push(wt, t, "")), e = _e
        }
        (n || t) && this.props.push(e, t, n[e])
    }, lu = function (e) {
        e.translate && (e.removeProperty("translate"), e.removeProperty("scale"), e.removeProperty("rotate"))
    }, Zf = function () {
        var e = this.props, t = this.target, i = t.style, r = t._gsap, n, o;
        for (n = 0; n < e.length; n += 3) e[n + 1] ? e[n + 1] === 2 ? t[e[n]](e[n + 2]) : t[e[n]] = e[n + 2] : e[n + 2] ? i[e[n]] = e[n + 2] : i.removeProperty(e[n].substr(0, 2) === "--" ? e[n] : e[n].replace(Ha, "-$1").toLowerCase());
        if (this.tfm) {
            for (o in this.tfm) r[o] = this.tfm[o];
            r.svg && (r.renderTransform(), t.setAttribute("data-svg-origin", this.svgo || "")), n = Na(), (!n || !n.isStart) && !i[_e] && (lu(i), r.zOrigin && i[wt] && (i[wt] += " " + r.zOrigin + "px", r.zOrigin = 0, r.renderTransform()), r.uncache = 1)
        }
    }, cu = function (e, t) {
        var i = {target: e, props: [], revert: Zf, save: Jf};
        return e._gsap || bt.core.getCache(e), t && e.style && e.nodeType && t.split(",").forEach(function (r) {
            return i.save(r)
        }), i
    }, uu, ra = function (e, t) {
        var i = Hi.createElementNS ? Hi.createElementNS((t || "").replace(/^https/, "http"), e) : Hi.createElement(e);
        return i && i.style ? i : Hi.createElement(e)
    }, $t = function s(e, t, i) {
        var r = getComputedStyle(e);
        return r[t] || r.getPropertyValue(t.replace(Ha, "-$1").toLowerCase()) || r.getPropertyValue(t) || !i && s(e, os(t) || t, 1) || ""
    }, xl = "O,Moz,ms,Ms,Webkit".split(","), os = function (e, t, i) {
        var r = t || ur, n = r.style, o = 5;
        if (e in n && !i) return e;
        for (e = e.charAt(0).toUpperCase() + e.substr(1); o-- && !(xl[o] + e in n);) ;
        return o < 0 ? null : (o === 3 ? "ms" : o >= 0 ? xl[o] : "") + e
    }, sa = function () {
        Vf() && window.document && (wl = window, Hi = wl.document, Ur = Hi.documentElement, ur = ra("div") || {style: {}}, ra("div"), _e = os(_e), wt = _e + "Origin", ur.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0", uu = !!os("perspective"), Na = bt.core.reverting, Va = 1)
    }, Tl = function (e) {
        var t = e.ownerSVGElement, i = ra("svg", t && t.getAttribute("xmlns") || ""), r = e.cloneNode(!0), n;
        r.style.display = "block", i.appendChild(r), Ur.appendChild(i);
        try {
            n = r.getBBox()
        } catch {
        }
        return i.removeChild(r), Ur.removeChild(i), n
    }, El = function (e, t) {
        for (var i = t.length; i--;) if (e.hasAttribute(t[i])) return e.getAttribute(t[i])
    }, du = function (e) {
        var t, i;
        try {
            t = e.getBBox()
        } catch {
            t = Tl(e), i = 1
        }
        return t && (t.width || t.height) || i || (t = Tl(e)), t && !t.width && !t.x && !t.y ? {
            x: +El(e, ["x", "cx", "x1"]) || 0,
            y: +El(e, ["y", "cy", "y1"]) || 0,
            width: 0,
            height: 0
        } : t
    }, fu = function (e) {
        return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && du(e))
    }, xr = function (e, t) {
        if (t) {
            var i = e.style, r;
            t in Mi && t !== wt && (t = _e), i.removeProperty ? (r = t.substr(0, 2), (r === "ms" || t.substr(0, 6) === "webkit") && (t = "-" + t), i.removeProperty(r === "--" ? t : t.replace(Ha, "-$1").toLowerCase())) : i.removeAttribute(t)
        }
    }, $i = function (e, t, i, r, n, o) {
        var a = new yt(e._pt, t, i, 0, 1, o ? au : ou);
        return e._pt = a, a.b = r, a.e = n, e._props.push(i), a
    }, Cl = {deg: 1, rad: 1, turn: 1}, ep = {grid: 1, flex: 1}, Qi = function s(e, t, i, r) {
        var n = parseFloat(i) || 0, o = (i + "").trim().substr((n + "").length) || "px", a = ur.style, l = Nf.test(t),
            c = e.tagName.toLowerCase() === "svg", u = (c ? "client" : "offset") + (l ? "Width" : "Height"), d = 100,
            f = r === "px", p = r === "%", m, h, g, y;
        if (r === o || !n || Cl[r] || Cl[o]) return n;
        if (o !== "px" && !f && (n = s(e, t, i, "px")), y = e.getCTM && fu(e), (p || o === "%") && (Mi[t] || ~t.indexOf("adius"))) return m = y ? e.getBBox()[l ? "width" : "height"] : e[u], Ee(p ? n / m * d : n / 100 * m);
        if (a[l ? "width" : "height"] = d + (f ? o : r), h = r !== "rem" && ~t.indexOf("adius") || r === "em" && e.appendChild && !c ? e : e.parentNode, y && (h = (e.ownerSVGElement || {}).parentNode), (!h || h === Hi || !h.appendChild) && (h = Hi.body), g = h._gsap, g && p && g.width && l && g.time === At.time && !g.uncache) return Ee(n / g.width * d);
        if (p && (t === "height" || t === "width")) {
            var v = e.style[t];
            e.style[t] = d + r, m = e[u], v ? e.style[t] = v : xr(e, t)
        } else (p || o === "%") && !ep[$t(h, "display")] && (a.position = $t(e, "position")), h === e && (a.position = "static"), h.appendChild(ur), m = ur[u], h.removeChild(ur), a.position = "absolute";
        return l && p && (g = hr(h), g.time = At.time, g.width = h[u]), Ee(f ? m * n / d : m && n ? d / m * n : 0)
    }, Ti = function (e, t, i, r) {
        var n;
        return Va || sa(), t in ui && t !== "transform" && (t = ui[t], ~t.indexOf(",") && (t = t.split(",")[0])), Mi[t] && t !== "transform" ? (n = Xs(e, r), n = t !== "transformOrigin" ? n[t] : n.svg ? n.origin : Nn($t(e, wt)) + " " + n.zOrigin + "px") : (n = e.style[t], (!n || n === "auto" || r || ~(n + "").indexOf("calc(")) && (n = Vn[t] && Vn[t](e, t, i) || $t(e, t) || Lc(e, t) || (t === "opacity" ? 1 : 0))), i && !~(n + "").trim().indexOf(" ") ? Qi(e, t, n, i) + i : n
    }, tp = function (e, t, i, r) {
        if (!i || i === "none") {
            var n = os(t, e, 1), o = n && $t(e, n, 1);
            o && o !== i ? (t = n, i = o) : t === "borderColor" && (i = $t(e, "borderTopColor"))
        }
        var a = new yt(this._pt, e.style, t, 0, 1, ru), l = 0, c = 0, u, d, f, p, m, h, g, y, v, _, w, b;
        if (a.b = i, a.e = r, i += "", r += "", r.substring(0, 6) === "var(--" && (r = $t(e, r.substring(4, r.indexOf(")")))), r === "auto" && (h = e.style[t], e.style[t] = r, r = $t(e, t) || r, h ? e.style[t] = h : xr(e, t)), u = [i, r], Xc(u), i = u[0], r = u[1], f = i.match(Gr) || [], b = r.match(Gr) || [], b.length) {
            for (; d = Gr.exec(r);) g = d[0], v = r.substring(l, d.index), m ? m = (m + 1) % 5 : (v.substr(-5) === "rgba(" || v.substr(-5) === "hsla(") && (m = 1), g !== (h = f[c++] || "") && (p = parseFloat(h) || 0, w = h.substr((p + "").length), g.charAt(1) === "=" && (g = Xr(p, g) + w), y = parseFloat(g), _ = g.substr((y + "").length), l = Gr.lastIndex - _.length, _ || (_ = _ || Dt.units[t] || w, l === r.length && (r += _, a.e += _)), w !== _ && (p = Qi(e, t, h, _) || 0), a._pt = {
                _next: a._pt,
                p: v || c === 1 ? v : ",",
                s: p,
                c: y - p,
                m: m && m < 4 || t === "zIndex" ? Math.round : 0
            });
            a.c = l < r.length ? r.substring(l, r.length) : ""
        } else a.r = t === "display" && r === "none" ? au : ou;
        return Sc.test(r) && (a.e = 0), this._pt = a, a
    }, Pl = {top: "0%", bottom: "100%", left: "0%", right: "100%", center: "50%"}, ip = function (e) {
        var t = e.split(" "), i = t[0], r = t[1] || "50%";
        return (i === "top" || i === "bottom" || r === "left" || r === "right") && (e = i, i = r, r = e), t[0] = Pl[i] || i, t[1] = Pl[r] || r, t.join(" ")
    }, rp = function (e, t) {
        if (t.tween && t.tween._time === t.tween._dur) {
            var i = t.t, r = i.style, n = t.u, o = i._gsap, a, l, c;
            if (n === "all" || n === !0) r.cssText = "", l = 1; else for (n = n.split(","), c = n.length; --c > -1;) a = n[c], Mi[a] && (l = 1, a = a === "transformOrigin" ? wt : _e), xr(i, a);
            l && (xr(i, _e), o && (o.svg && i.removeAttribute("transform"), r.scale = r.rotate = r.translate = "none", Xs(i, 1), o.uncache = 1, lu(r)))
        }
    }, Vn = {
        clearProps: function (e, t, i, r, n) {
            if (n.data !== "isFromStart") {
                var o = e._pt = new yt(e._pt, t, i, 0, 0, rp);
                return o.u = r, o.pr = -10, o.tween = n, e._props.push(i), 1
            }
        }
    }, Ys = [1, 0, 0, 1, 0, 0], pu = {}, hu = function (e) {
        return e === "matrix(1, 0, 0, 1, 0, 0)" || e === "none" || !e
    }, Ll = function (e) {
        var t = $t(e, _e);
        return hu(t) ? Ys : t.substr(7).match(bc).map(Ee)
    }, $a = function (e, t) {
        var i = e._gsap || hr(e), r = e.style, n = Ll(e), o, a, l, c;
        return i.svg && e.getAttribute("transform") ? (l = e.transform.baseVal.consolidate().matrix, n = [l.a, l.b, l.c, l.d, l.e, l.f], n.join(",") === "1,0,0,1,0,0" ? Ys : n) : (n === Ys && !e.offsetParent && e !== Ur && !i.svg && (l = r.display, r.display = "block", o = e.parentNode, (!o || !e.offsetParent && !e.getBoundingClientRect().width) && (c = 1, a = e.nextElementSibling, Ur.appendChild(e)), n = Ll(e), l ? r.display = l : xr(e, "display"), c && (a ? o.insertBefore(e, a) : o ? o.appendChild(e) : Ur.removeChild(e))), t && n.length > 6 ? [n[0], n[1], n[4], n[5], n[12], n[13]] : n)
    }, na = function (e, t, i, r, n, o) {
        var a = e._gsap, l = n || $a(e, !0), c = a.xOrigin || 0, u = a.yOrigin || 0, d = a.xOffset || 0, f = a.yOffset || 0,
            p = l[0], m = l[1], h = l[2], g = l[3], y = l[4], v = l[5], _ = t.split(" "), w = parseFloat(_[0]) || 0,
            b = parseFloat(_[1]) || 0, T, x, C, P;
        i ? l !== Ys && (x = p * g - m * h) && (C = w * (g / x) + b * (-h / x) + (h * v - g * y) / x, P = w * (-m / x) + b * (p / x) - (p * v - m * y) / x, w = C, b = P) : (T = du(e), w = T.x + (~_[0].indexOf("%") ? w / 100 * T.width : w), b = T.y + (~(_[1] || _[0]).indexOf("%") ? b / 100 * T.height : b)), r || r !== !1 && a.smooth ? (y = w - c, v = b - u, a.xOffset = d + (y * p + v * h) - y, a.yOffset = f + (y * m + v * g) - v) : a.xOffset = a.yOffset = 0, a.xOrigin = w, a.yOrigin = b, a.smooth = !!r, a.origin = t, a.originIsAbsolute = !!i, e.style[wt] = "0px 0px", o && ($i(o, a, "xOrigin", c, w), $i(o, a, "yOrigin", u, b), $i(o, a, "xOffset", d, a.xOffset), $i(o, a, "yOffset", f, a.yOffset)), e.setAttribute("data-svg-origin", w + " " + b)
    }, Xs = function (e, t) {
        var i = e._gsap || new Qc(e);
        if ("x" in i && !t && !i.uncache) return i;
        var r = e.style, n = i.scaleX < 0, o = "px", a = "deg", l = getComputedStyle(e), c = $t(e, wt) || "0", u, d, f, p,
            m, h, g, y, v, _, w, b, T, x, C, P, E, A, L, k, R, q, I, z, D, H, S, Y, re, Oe, fe, He;
        return u = d = f = h = g = y = v = _ = w = 0, p = m = 1, i.svg = !!(e.getCTM && fu(e)), l.translate && ((l.translate !== "none" || l.scale !== "none" || l.rotate !== "none") && (r[_e] = (l.translate !== "none" ? "translate3d(" + (l.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (l.rotate !== "none" ? "rotate(" + l.rotate + ") " : "") + (l.scale !== "none" ? "scale(" + l.scale.split(" ").join(",") + ") " : "") + (l[_e] !== "none" ? l[_e] : "")), r.scale = r.rotate = r.translate = "none"), x = $a(e, i.svg), i.svg && (i.uncache ? (D = e.getBBox(), c = i.xOrigin - D.x + "px " + (i.yOrigin - D.y) + "px", z = "") : z = !t && e.getAttribute("data-svg-origin"), na(e, z || c, !!z || i.originIsAbsolute, i.smooth !== !1, x)), b = i.xOrigin || 0, T = i.yOrigin || 0, x !== Ys && (A = x[0], L = x[1], k = x[2], R = x[3], u = q = x[4], d = I = x[5], x.length === 6 ? (p = Math.sqrt(A * A + L * L), m = Math.sqrt(R * R + k * k), h = A || L ? Ir(L, A) * ar : 0, v = k || R ? Ir(k, R) * ar + h : 0, v && (m *= Math.abs(Math.cos(v * jr))), i.svg && (u -= b - (b * A + T * k), d -= T - (b * L + T * R))) : (He = x[6], Oe = x[7], S = x[8], Y = x[9], re = x[10], fe = x[11], u = x[12], d = x[13], f = x[14], C = Ir(He, re), g = C * ar, C && (P = Math.cos(-C), E = Math.sin(-C), z = q * P + S * E, D = I * P + Y * E, H = He * P + re * E, S = q * -E + S * P, Y = I * -E + Y * P, re = He * -E + re * P, fe = Oe * -E + fe * P, q = z, I = D, He = H), C = Ir(-k, re), y = C * ar, C && (P = Math.cos(-C), E = Math.sin(-C), z = A * P - S * E, D = L * P - Y * E, H = k * P - re * E, fe = R * E + fe * P, A = z, L = D, k = H), C = Ir(L, A), h = C * ar, C && (P = Math.cos(C), E = Math.sin(C), z = A * P + L * E, D = q * P + I * E, L = L * P - A * E, I = I * P - q * E, A = z, q = D), g && Math.abs(g) + Math.abs(h) > 359.9 && (g = h = 0, y = 180 - y), p = Ee(Math.sqrt(A * A + L * L + k * k)), m = Ee(Math.sqrt(I * I + He * He)), C = Ir(q, I), v = Math.abs(C) > 2e-4 ? C * ar : 0, w = fe ? 1 / (fe < 0 ? -fe : fe) : 0), i.svg && (z = e.getAttribute("transform"), i.forceCSS = e.setAttribute("transform", "") || !hu($t(e, _e)), z && e.setAttribute("transform", z))), Math.abs(v) > 90 && Math.abs(v) < 270 && (n ? (p *= -1, v += h <= 0 ? 180 : -180, h += h <= 0 ? 180 : -180) : (m *= -1, v += v <= 0 ? 180 : -180)), t = t || i.uncache, i.x = u - ((i.xPercent = u && (!t && i.xPercent || (Math.round(e.offsetWidth / 2) === Math.round(-u) ? -50 : 0))) ? e.offsetWidth * i.xPercent / 100 : 0) + o, i.y = d - ((i.yPercent = d && (!t && i.yPercent || (Math.round(e.offsetHeight / 2) === Math.round(-d) ? -50 : 0))) ? e.offsetHeight * i.yPercent / 100 : 0) + o, i.z = f + o, i.scaleX = Ee(p), i.scaleY = Ee(m), i.rotation = Ee(h) + a, i.rotationX = Ee(g) + a, i.rotationY = Ee(y) + a, i.skewX = v + a, i.skewY = _ + a, i.transformPerspective = w + o, (i.zOrigin = parseFloat(c.split(" ")[2]) || !t && i.zOrigin || 0) && (r[wt] = Nn(c)), i.xOffset = i.yOffset = 0, i.force3D = Dt.force3D, i.renderTransform = i.svg ? np : uu ? mu : sp, i.uncache = 0, i
    }, Nn = function (e) {
        return (e = e.split(" "))[0] + " " + e[1]
    }, bo = function (e, t, i) {
        var r = et(t);
        return Ee(parseFloat(t) + parseFloat(Qi(e, "x", i + "px", r))) + r
    }, sp = function (e, t) {
        t.z = "0px", t.rotationY = t.rotationX = "0deg", t.force3D = 0, mu(e, t)
    }, nr = "0deg", ps = "0px", or = ") ", mu = function (e, t) {
        var i = t || this, r = i.xPercent, n = i.yPercent, o = i.x, a = i.y, l = i.z, c = i.rotation, u = i.rotationY,
            d = i.rotationX, f = i.skewX, p = i.skewY, m = i.scaleX, h = i.scaleY, g = i.transformPerspective,
            y = i.force3D, v = i.target, _ = i.zOrigin, w = "", b = y === "auto" && e && e !== 1 || y === !0;
        if (_ && (d !== nr || u !== nr)) {
            var T = parseFloat(u) * jr, x = Math.sin(T), C = Math.cos(T), P;
            T = parseFloat(d) * jr, P = Math.cos(T), o = bo(v, o, x * P * -_), a = bo(v, a, -Math.sin(T) * -_), l = bo(v, l, C * P * -_ + _)
        }
        g !== ps && (w += "perspective(" + g + or), (r || n) && (w += "translate(" + r + "%, " + n + "%) "), (b || o !== ps || a !== ps || l !== ps) && (w += l !== ps || b ? "translate3d(" + o + ", " + a + ", " + l + ") " : "translate(" + o + ", " + a + or), c !== nr && (w += "rotate(" + c + or), u !== nr && (w += "rotateY(" + u + or), d !== nr && (w += "rotateX(" + d + or), (f !== nr || p !== nr) && (w += "skew(" + f + ", " + p + or), (m !== 1 || h !== 1) && (w += "scale(" + m + ", " + h + or), v.style[_e] = w || "translate(0, 0)"
    }, np = function (e, t) {
        var i = t || this, r = i.xPercent, n = i.yPercent, o = i.x, a = i.y, l = i.rotation, c = i.skewX, u = i.skewY,
            d = i.scaleX, f = i.scaleY, p = i.target, m = i.xOrigin, h = i.yOrigin, g = i.xOffset, y = i.yOffset,
            v = i.forceCSS, _ = parseFloat(o), w = parseFloat(a), b, T, x, C, P;
        l = parseFloat(l), c = parseFloat(c), u = parseFloat(u), u && (u = parseFloat(u), c += u, l += u), l || c ? (l *= jr, c *= jr, b = Math.cos(l) * d, T = Math.sin(l) * d, x = Math.sin(l - c) * -f, C = Math.cos(l - c) * f, c && (u *= jr, P = Math.tan(c - u), P = Math.sqrt(1 + P * P), x *= P, C *= P, u && (P = Math.tan(u), P = Math.sqrt(1 + P * P), b *= P, T *= P)), b = Ee(b), T = Ee(T), x = Ee(x), C = Ee(C)) : (b = d, C = f, T = x = 0), (_ && !~(o + "").indexOf("px") || w && !~(a + "").indexOf("px")) && (_ = Qi(p, "x", o, "px"), w = Qi(p, "y", a, "px")), (m || h || g || y) && (_ = Ee(_ + m - (m * b + h * x) + g), w = Ee(w + h - (m * T + h * C) + y)), (r || n) && (P = p.getBBox(), _ = Ee(_ + r / 100 * P.width), w = Ee(w + n / 100 * P.height)), P = "matrix(" + b + "," + T + "," + x + "," + C + "," + _ + "," + w + ")", p.setAttribute("transform", P), v && (p.style[_e] = P)
    }, op = function (e, t, i, r, n) {
        var o = 360, a = Ne(n), l = parseFloat(n) * (a && ~n.indexOf("rad") ? ar : 1), c = l - r, u = r + c + "deg", d, f;
        return a && (d = n.split("_")[1], d === "short" && (c %= o, c !== c % (o / 2) && (c += c < 0 ? o : -o)), d === "cw" && c < 0 ? c = (c + o * Sl) % o - ~~(c / o) * o : d === "ccw" && c > 0 && (c = (c - o * Sl) % o - ~~(c / o) * o)), e._pt = f = new yt(e._pt, t, i, r, c, $f), f.e = u, f.u = "deg", e._props.push(i), f
    }, Ml = function (e, t) {
        for (var i in t) e[i] = t[i];
        return e
    }, ap = function (e, t, i) {
        var r = Ml({}, i._gsap), n = "perspective,force3D,transformOrigin,svgOrigin", o = i.style, a, l, c, u, d, f, p, m;
        r.svg ? (c = i.getAttribute("transform"), i.setAttribute("transform", ""), o[_e] = t, a = Xs(i, 1), xr(i, _e), i.setAttribute("transform", c)) : (c = getComputedStyle(i)[_e], o[_e] = t, a = Xs(i, 1), o[_e] = c);
        for (l in Mi) c = r[l], u = a[l], c !== u && n.indexOf(l) < 0 && (p = et(c), m = et(u), d = p !== m ? Qi(i, l, c, m) : parseFloat(c), f = parseFloat(u), e._pt = new yt(e._pt, a, l, d, f - d, ia), e._pt.u = m || 0, e._props.push(l));
        Ml(a, r)
    };
_t("padding,margin,Width,Radius", function (s, e) {
    var t = "Top", i = "Right", r = "Bottom", n = "Left",
        o = (e < 3 ? [t, i, r, n] : [t + n, t + i, r + i, r + n]).map(function (a) {
            return e < 2 ? s + a : "border" + a + s
        });
    Vn[e > 1 ? "border" + s : s] = function (a, l, c, u, d) {
        var f, p;
        if (arguments.length < 4) return f = o.map(function (m) {
            return Ti(a, m, c)
        }), p = f.join(" "), p.split(f[0]).length === 5 ? f[0] : p;
        f = (u + "").split(" "), p = {}, o.forEach(function (m, h) {
            return p[m] = f[h] = f[h] || f[(h - 1) / 2 | 0]
        }), a.init(l, p, d)
    }
});
var gu = {
    name: "css", register: sa, targetTest: function (e) {
        return e.style && e.nodeType
    }, init: function (e, t, i, r, n) {
        var o = this._props, a = e.style, l = i.vars.startAt, c, u, d, f, p, m, h, g, y, v, _, w, b, T, x, C;
        Va || sa(), this.styles = this.styles || cu(e), C = this.styles.props, this.tween = i;
        for (h in t) if (h !== "autoRound" && (u = t[h], !(Pt[h] && Jc(h, t, i, r, e, n)))) {
            if (p = typeof u, m = Vn[h], p === "function" && (u = u.call(i, r, e, n), p = typeof u), p === "string" && ~u.indexOf("random(") && (u = $s(u)), m) m(this, e, h, u, i) && (x = 1); else if (h.substr(0, 2) === "--") c = (getComputedStyle(e).getPropertyValue(h) + "").trim(), u += "", Ui.lastIndex = 0, Ui.test(c) || (g = et(c), y = et(u)), y ? g !== y && (c = Qi(e, h, c, y) + y) : g && (u += g), this.add(a, "setProperty", c, u, r, n, 0, 0, h), o.push(h), C.push(h, 0, a[h]); else if (p !== "undefined") {
                if (l && h in l ? (c = typeof l[h] == "function" ? l[h].call(i, r, e, n) : l[h], Ne(c) && ~c.indexOf("random(") && (c = $s(c)), et(c + "") || c === "auto" || (c += Dt.units[h] || et(Ti(e, h)) || ""), (c + "").charAt(1) === "=" && (c = Ti(e, h))) : c = Ti(e, h), f = parseFloat(c), v = p === "string" && u.charAt(1) === "=" && u.substr(0, 2), v && (u = u.substr(2)), d = parseFloat(u), h in ui && (h === "autoAlpha" && (f === 1 && Ti(e, "visibility") === "hidden" && d && (f = 0), C.push("visibility", 0, a.visibility), $i(this, a, "visibility", f ? "inherit" : "hidden", d ? "inherit" : "hidden", !d)), h !== "scale" && h !== "transform" && (h = ui[h], ~h.indexOf(",") && (h = h.split(",")[0]))), _ = h in Mi, _) {
                    if (this.styles.save(h), p === "string" && u.substring(0, 6) === "var(--" && (u = $t(e, u.substring(4, u.indexOf(")"))), d = parseFloat(u)), w || (b = e._gsap, b.renderTransform && !t.parseTransform || Xs(e, t.parseTransform), T = t.smoothOrigin !== !1 && b.smooth, w = this._pt = new yt(this._pt, a, _e, 0, 1, b.renderTransform, b, 0, -1), w.dep = 1), h === "scale") this._pt = new yt(this._pt, b, "scaleY", b.scaleY, (v ? Xr(b.scaleY, v + d) : d) - b.scaleY || 0, ia), this._pt.u = 0, o.push("scaleY", h), h += "X"; else if (h === "transformOrigin") {
                        C.push(wt, 0, a[wt]), u = ip(u), b.svg ? na(e, u, 0, T, 0, this) : (y = parseFloat(u.split(" ")[2]) || 0, y !== b.zOrigin && $i(this, b, "zOrigin", b.zOrigin, y), $i(this, a, h, Nn(c), Nn(u)));
                        continue
                    } else if (h === "svgOrigin") {
                        na(e, u, 1, T, 0, this);
                        continue
                    } else if (h in pu) {
                        op(this, b, h, f, v ? Xr(f, v + u) : u);
                        continue
                    } else if (h === "smoothOrigin") {
                        $i(this, b, "smooth", b.smooth, u);
                        continue
                    } else if (h === "force3D") {
                        b[h] = u;
                        continue
                    } else if (h === "transform") {
                        ap(this, u, e);
                        continue
                    }
                } else h in a || (h = os(h) || h);
                if (_ || (d || d === 0) && (f || f === 0) && !Hf.test(u) && h in a) g = (c + "").substr((f + "").length), d || (d = 0), y = et(u) || (h in Dt.units ? Dt.units[h] : g), g !== y && (f = Qi(e, h, c, y)), this._pt = new yt(this._pt, _ ? b : a, h, f, (v ? Xr(f, v + d) : d) - f, !_ && (y === "px" || h === "zIndex") && t.autoRound !== !1 ? Wf : ia), this._pt.u = y || 0, g !== y && y !== "%" && (this._pt.b = c, this._pt.r = Gf); else if (h in a) tp.call(this, e, h, c, v ? v + u : u); else if (h in e) this.add(e, h, c || e[h], v ? v + u : u, r, n); else if (h !== "parseTransform") {
                    Aa(h, u);
                    continue
                }
                _ || (h in a ? C.push(h, 0, a[h]) : typeof e[h] == "function" ? C.push(h, 2, e[h]()) : C.push(h, 1, c || e[h])), o.push(h)
            }
        }
        x && su(this)
    }, render: function (e, t) {
        if (t.tween._time || !Na()) for (var i = t._pt; i;) i.r(e, i.d), i = i._next; else t.styles.revert()
    }, get: Ti, aliases: ui, getSetter: function (e, t, i) {
        var r = ui[t];
        return r && r.indexOf(",") < 0 && (t = r), t in Mi && t !== wt && (e._gsap.x || Ti(e, "x")) ? i && bl === i ? t === "scale" ? jf : Uf : (bl = i || {}) && (t === "scale" ? Kf : Qf) : e.style && !Pa(e.style[t]) ? Yf : ~t.indexOf("-") ? Xf : Ba(e, t)
    }, core: {_removeProperty: xr, _getMatrix: $a}
};
bt.utils.checkPrefix = os;
bt.core.getStyleSaver = cu;
(function (s, e, t, i) {
    var r = _t(s + "," + e + "," + t, function (n) {
        Mi[n] = 1
    });
    _t(e, function (n) {
        Dt.units[n] = "deg", pu[n] = 1
    }), ui[r[13]] = s + "," + e, _t(i, function (n) {
        var o = n.split(":");
        ui[o[1]] = r[o[0]]
    })
})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
_t("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function (s) {
    Dt.units[s] = "px"
});
bt.registerPlugin(gu);
var O = bt.registerPlugin(gu) || bt;
O.core.Tween;

function lp(s, e) {
    for (var t = 0; t < e.length; t++) {
        var i = e[t];
        i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(s, i.key, i)
    }
}

function cp(s, e, t) {
    return e && lp(s.prototype, e), s
}/*!
 * Observer 3.13.0
 *
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at
 * @author: Jack Doyle, jack@greensock.com
*/
var We, Cn, kt, Gi, Wi, Kr, vu, lr, ks, _u, Ci, Zt, yu, wu = function () {
    return We || typeof window < "u" && (We = window.gsap) && We.registerPlugin && We
}, bu = 1, Yr = [], J = [], fi = [], Os = Date.now, oa = function (e, t) {
    return t
}, up = function () {
    var e = ks.core, t = e.bridge || {}, i = e._scrollers, r = e._proxies;
    i.push.apply(i, J), r.push.apply(r, fi), J = i, fi = r, oa = function (o, a) {
        return t[o](a)
    }
}, ji = function (e, t) {
    return ~fi.indexOf(e) && fi[fi.indexOf(e) + 1][t]
}, Is = function (e) {
    return !!~_u.indexOf(e)
}, ot = function (e, t, i, r, n) {
    return e.addEventListener(t, i, {passive: r !== !1, capture: !!n})
}, nt = function (e, t, i, r) {
    return e.removeEventListener(t, i, !!r)
}, on = "scrollLeft", an = "scrollTop", aa = function () {
    return Ci && Ci.isPressed || J.cache++
}, Hn = function (e, t) {
    var i = function r(n) {
        if (n || n === 0) {
            bu && (kt.history.scrollRestoration = "manual");
            var o = Ci && Ci.isPressed;
            n = r.v = Math.round(n) || (Ci && Ci.iOS ? 1 : 0), e(n), r.cacheID = J.cache, o && oa("ss", n)
        } else (t || J.cache !== r.cacheID || oa("ref")) && (r.cacheID = J.cache, r.v = e());
        return r.v + r.offset
    };
    return i.offset = 0, e && i
}, dt = {
    s: on, p: "left", p2: "Left", os: "right", os2: "Right", d: "width", d2: "Width", a: "x", sc: Hn(function (s) {
        return arguments.length ? kt.scrollTo(s, Re.sc()) : kt.pageXOffset || Gi[on] || Wi[on] || Kr[on] || 0
    })
}, Re = {
    s: an,
    p: "top",
    p2: "Top",
    os: "bottom",
    os2: "Bottom",
    d: "height",
    d2: "Height",
    a: "y",
    op: dt,
    sc: Hn(function (s) {
        return arguments.length ? kt.scrollTo(dt.sc(), s) : kt.pageYOffset || Gi[an] || Wi[an] || Kr[an] || 0
    })
}, gt = function (e, t) {
    return (t && t._ctx && t._ctx.selector || We.utils.toArray)(e)[0] || (typeof e == "string" && We.config().nullTargetWarn !== !1 ? console.warn("Element not found:", e) : null)
}, dp = function (e, t) {
    for (var i = t.length; i--;) if (t[i] === e || t[i].contains(e)) return !0;
    return !1
}, Ji = function (e, t) {
    var i = t.s, r = t.sc;
    Is(e) && (e = Gi.scrollingElement || Wi);
    var n = J.indexOf(e), o = r === Re.sc ? 1 : 2;
    !~n && (n = J.push(e) - 1), J[n + o] || ot(e, "scroll", aa);
    var a = J[n + o], l = a || (J[n + o] = Hn(ji(e, i), !0) || (Is(e) ? r : Hn(function (c) {
        return arguments.length ? e[i] = c : e[i]
    })));
    return l.target = e, a || (l.smooth = We.getProperty(e, "scrollBehavior") === "smooth"), l
}, la = function (e, t, i) {
    var r = e, n = e, o = Os(), a = o, l = t || 50, c = Math.max(500, l * 3), u = function (m, h) {
        var g = Os();
        h || g - o > l ? (n = r, r = m, a = o, o = g) : i ? r += m : r = n + (m - n) / (g - a) * (o - a)
    }, d = function () {
        n = r = i ? 0 : r, a = o = 0
    }, f = function (m) {
        var h = a, g = n, y = Os();
        return (m || m === 0) && m !== r && u(m), o === a || y - a > c ? 0 : (r + (i ? g : -g)) / ((i ? y : o) - h) * 1e3
    };
    return {update: u, reset: d, getVelocity: f}
}, hs = function (e, t) {
    return t && !e._gsapAllow && e.preventDefault(), e.changedTouches ? e.changedTouches[0] : e
}, Al = function (e) {
    var t = Math.max.apply(Math, e), i = Math.min.apply(Math, e);
    return Math.abs(t) >= Math.abs(i) ? t : i
}, Su = function () {
    ks = We.core.globals().ScrollTrigger, ks && ks.core && up()
}, xu = function (e) {
    return We = e || wu(), !Cn && We && typeof document < "u" && document.body && (kt = window, Gi = document, Wi = Gi.documentElement, Kr = Gi.body, _u = [kt, Gi, Wi, Kr], We.utils.clamp, yu = We.core.context || function () {
    }, lr = "onpointerenter" in Kr ? "pointer" : "mouse", vu = Ce.isTouch = kt.matchMedia && kt.matchMedia("(hover: none), (pointer: coarse)").matches ? 1 : "ontouchstart" in kt || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 ? 2 : 0, Zt = Ce.eventTypes = ("ontouchstart" in Wi ? "touchstart,touchmove,touchcancel,touchend" : "onpointerdown" in Wi ? "pointerdown,pointermove,pointercancel,pointerup" : "mousedown,mousemove,mouseup,mouseup").split(","), setTimeout(function () {
        return bu = 0
    }, 500), Su(), Cn = 1), Cn
};
dt.op = Re;
J.cache = 0;
var Ce = function () {
    function s(t) {
        this.init(t)
    }

    var e = s.prototype;
    return e.init = function (i) {
        Cn || xu(We) || console.warn("Please gsap.registerPlugin(Observer)"), ks || Su();
        var r = i.tolerance, n = i.dragMinimum, o = i.type, a = i.target, l = i.lineHeight, c = i.debounce,
            u = i.preventDefault, d = i.onStop, f = i.onStopDelay, p = i.ignore, m = i.wheelSpeed, h = i.event,
            g = i.onDragStart, y = i.onDragEnd, v = i.onDrag, _ = i.onPress, w = i.onRelease, b = i.onRight,
            T = i.onLeft, x = i.onUp, C = i.onDown, P = i.onChangeX, E = i.onChangeY, A = i.onChange, L = i.onToggleX,
            k = i.onToggleY, R = i.onHover, q = i.onHoverEnd, I = i.onMove, z = i.ignoreCheck, D = i.isNormalizer,
            H = i.onGestureStart, S = i.onGestureEnd, Y = i.onWheel, re = i.onEnable, Oe = i.onDisable, fe = i.onClick,
            He = i.scrollSpeed, Xe = i.capture, Pe = i.allowClicks, rt = i.lockAxis, Ue = i.onLockAxis;
        this.target = a = gt(a) || Wi, this.vars = i, p && (p = We.utils.toArray(p)), r = r || 1e-9, n = n || 0, m = m || 1, He = He || 1, o = o || "wheel,touch,pointer", c = c !== !1, l || (l = parseFloat(kt.getComputedStyle(Kr).lineHeight) || 22);
        var Ai, st, ht, ie, Se, mt, St, M = this, xt = 0, vi = 0, ki = i.passive || !u && i.passive !== !1,
            ye = Ji(a, dt), _i = Ji(a, Re), Oi = ye(), er = _i(),
            qe = ~o.indexOf("touch") && !~o.indexOf("pointer") && Zt[0] === "pointerdown", Ii = Is(a),
            xe = a.ownerDocument || Gi, Xt = [0, 0, 0], zt = [0, 0, 0], yi = 0, ls = function () {
                return yi = Os()
            }, Le = function (W, se) {
                return (M.event = W) && p && dp(W.target, p) || se && qe && W.pointerType !== "touch" || z && z(W, se)
            }, en = function () {
                M._vx.reset(), M._vy.reset(), st.pause(), d && d(M)
            }, wi = function () {
                var W = M.deltaX = Al(Xt), se = M.deltaY = Al(zt), F = Math.abs(W) >= r, X = Math.abs(se) >= r;
                A && (F || X) && A(M, W, se, Xt, zt), F && (b && M.deltaX > 0 && b(M), T && M.deltaX < 0 && T(M), P && P(M), L && M.deltaX < 0 != xt < 0 && L(M), xt = M.deltaX, Xt[0] = Xt[1] = Xt[2] = 0), X && (C && M.deltaY > 0 && C(M), x && M.deltaY < 0 && x(M), E && E(M), k && M.deltaY < 0 != vi < 0 && k(M), vi = M.deltaY, zt[0] = zt[1] = zt[2] = 0), (ie || ht) && (I && I(M), ht && (g && ht === 1 && g(M), v && v(M), ht = 0), ie = !1), mt && !(mt = !1) && Ue && Ue(M), Se && (Y(M), Se = !1), Ai = 0
            }, Ar = function (W, se, F) {
                Xt[F] += W, zt[F] += se, M._vx.update(W), M._vy.update(se), c ? Ai || (Ai = requestAnimationFrame(wi)) : wi()
            }, kr = function (W, se) {
                rt && !St && (M.axis = St = Math.abs(W) > Math.abs(se) ? "x" : "y", mt = !0), St !== "y" && (Xt[2] += W, M._vx.update(W, !0)), St !== "x" && (zt[2] += se, M._vy.update(se, !0)), c ? Ai || (Ai = requestAnimationFrame(wi)) : wi()
            }, Di = function (W) {
                if (!Le(W, 1)) {
                    W = hs(W, u);
                    var se = W.clientX, F = W.clientY, X = se - M.x, G = F - M.y, U = M.isDragging;
                    M.x = se, M.y = F, (U || (X || G) && (Math.abs(M.startX - se) >= n || Math.abs(M.startY - F) >= n)) && (ht = U ? 2 : 1, U || (M.isDragging = !0), kr(X, G))
                }
            }, tr = M.onPress = function (j) {
                Le(j, 1) || j && j.button || (M.axis = St = null, st.pause(), M.isPressed = !0, j = hs(j), xt = vi = 0, M.startX = M.x = j.clientX, M.startY = M.y = j.clientY, M._vx.reset(), M._vy.reset(), ot(D ? a : xe, Zt[1], Di, ki, !0), M.deltaX = M.deltaY = 0, _ && _(M))
            }, Z = M.onRelease = function (j) {
                if (!Le(j, 1)) {
                    nt(D ? a : xe, Zt[1], Di, !0);
                    var W = !isNaN(M.y - M.startY), se = M.isDragging,
                        F = se && (Math.abs(M.x - M.startX) > 3 || Math.abs(M.y - M.startY) > 3), X = hs(j);
                    !F && W && (M._vx.reset(), M._vy.reset(), u && Pe && We.delayedCall(.08, function () {
                        if (Os() - yi > 300 && !j.defaultPrevented) {
                            if (j.target.click) j.target.click(); else if (xe.createEvent) {
                                var G = xe.createEvent("MouseEvents");
                                G.initMouseEvent("click", !0, !0, kt, 1, X.screenX, X.screenY, X.clientX, X.clientY, !1, !1, !1, !1, 0, null), j.target.dispatchEvent(G)
                            }
                        }
                    })), M.isDragging = M.isGesturing = M.isPressed = !1, d && se && !D && st.restart(!0), ht && wi(), y && se && y(M), w && w(M, F)
                }
            }, ir = function (W) {
                return W.touches && W.touches.length > 1 && (M.isGesturing = !0) && H(W, M.isDragging)
            }, Ut = function () {
                return (M.isGesturing = !1) || S(M)
            }, jt = function (W) {
                if (!Le(W)) {
                    var se = ye(), F = _i();
                    Ar((se - Oi) * He, (F - er) * He, 1), Oi = se, er = F, d && st.restart(!0)
                }
            }, Kt = function (W) {
                if (!Le(W)) {
                    W = hs(W, u), Y && (Se = !0);
                    var se = (W.deltaMode === 1 ? l : W.deltaMode === 2 ? kt.innerHeight : 1) * m;
                    Ar(W.deltaX * se, W.deltaY * se, 0), d && !D && st.restart(!0)
                }
            }, rr = function (W) {
                if (!Le(W)) {
                    var se = W.clientX, F = W.clientY, X = se - M.x, G = F - M.y;
                    M.x = se, M.y = F, ie = !0, d && st.restart(!0), (X || G) && kr(X, G)
                }
            }, Or = function (W) {
                M.event = W, R(M)
            }, bi = function (W) {
                M.event = W, q(M)
            }, cs = function (W) {
                return Le(W) || hs(W, u) && fe(M)
            };
        st = M._dc = We.delayedCall(f || .25, en).pause(), M.deltaX = M.deltaY = 0, M._vx = la(0, 50, !0), M._vy = la(0, 50, !0), M.scrollX = ye, M.scrollY = _i, M.isDragging = M.isGesturing = M.isPressed = !1, yu(this), M.enable = function (j) {
            return M.isEnabled || (ot(Ii ? xe : a, "scroll", aa), o.indexOf("scroll") >= 0 && ot(Ii ? xe : a, "scroll", jt, ki, Xe), o.indexOf("wheel") >= 0 && ot(a, "wheel", Kt, ki, Xe), (o.indexOf("touch") >= 0 && vu || o.indexOf("pointer") >= 0) && (ot(a, Zt[0], tr, ki, Xe), ot(xe, Zt[2], Z), ot(xe, Zt[3], Z), Pe && ot(a, "click", ls, !0, !0), fe && ot(a, "click", cs), H && ot(xe, "gesturestart", ir), S && ot(xe, "gestureend", Ut), R && ot(a, lr + "enter", Or), q && ot(a, lr + "leave", bi), I && ot(a, lr + "move", rr)), M.isEnabled = !0, M.isDragging = M.isGesturing = M.isPressed = ie = ht = !1, M._vx.reset(), M._vy.reset(), Oi = ye(), er = _i(), j && j.type && tr(j), re && re(M)), M
        }, M.disable = function () {
            M.isEnabled && (Yr.filter(function (j) {
                return j !== M && Is(j.target)
            }).length || nt(Ii ? xe : a, "scroll", aa), M.isPressed && (M._vx.reset(), M._vy.reset(), nt(D ? a : xe, Zt[1], Di, !0)), nt(Ii ? xe : a, "scroll", jt, Xe), nt(a, "wheel", Kt, Xe), nt(a, Zt[0], tr, Xe), nt(xe, Zt[2], Z), nt(xe, Zt[3], Z), nt(a, "click", ls, !0), nt(a, "click", cs), nt(xe, "gesturestart", ir), nt(xe, "gestureend", Ut), nt(a, lr + "enter", Or), nt(a, lr + "leave", bi), nt(a, lr + "move", rr), M.isEnabled = M.isPressed = M.isDragging = !1, Oe && Oe(M))
        }, M.kill = M.revert = function () {
            M.disable();
            var j = Yr.indexOf(M);
            j >= 0 && Yr.splice(j, 1), Ci === M && (Ci = 0)
        }, Yr.push(M), D && Is(a) && (Ci = M), M.enable(h)
    }, cp(s, [{
        key: "velocityX", get: function () {
            return this._vx.getVelocity()
        }
    }, {
        key: "velocityY", get: function () {
            return this._vy.getVelocity()
        }
    }]), s
}();
Ce.version = "3.13.0";
Ce.create = function (s) {
    return new Ce(s)
};
Ce.register = xu;
Ce.getAll = function () {
    return Yr.slice()
};
Ce.getById = function (s) {
    return Yr.filter(function (e) {
        return e.vars.id === s
    })[0]
};
wu() && We.registerPlugin(Ce);/*!
 * ScrollTrigger 3.13.0
 *
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at
 * @author: Jack Doyle, jack@greensock.com
*/
var N, Nr, Q, de, Mt, ne, Ga, $n, Us, Ds, xs, ln, Je, lo, ca, lt, kl, Ol, Hr, Tu, So, Eu, at, ua, Cu, Pu, Fi, da, Wa,
    Qr, Ya, Gn, fa, xo, cn = 1, Ze = Date.now, To = Ze(), Yt = 0, Ts = 0, Il = function (e, t, i) {
        var r = Ct(e) && (e.substr(0, 6) === "clamp(" || e.indexOf("max") > -1);
        return i["_" + t + "Clamp"] = r, r ? e.substr(6, e.length - 7) : e
    }, Dl = function (e, t) {
        return t && (!Ct(e) || e.substr(0, 6) !== "clamp(") ? "clamp(" + e + ")" : e
    }, fp = function s() {
        return Ts && requestAnimationFrame(s)
    }, Rl = function () {
        return lo = 1
    }, ql = function () {
        return lo = 0
    }, oi = function (e) {
        return e
    }, Es = function (e) {
        return Math.round(e * 1e5) / 1e5 || 0
    }, Lu = function () {
        return typeof window < "u"
    }, Mu = function () {
        return N || Lu() && (N = window.gsap) && N.registerPlugin && N
    }, Tr = function (e) {
        return !!~Ga.indexOf(e)
    }, Au = function (e) {
        return (e === "Height" ? Ya : Q["inner" + e]) || Mt["client" + e] || ne["client" + e]
    }, ku = function (e) {
        return ji(e, "getBoundingClientRect") || (Tr(e) ? function () {
            return kn.width = Q.innerWidth, kn.height = Ya, kn
        } : function () {
            return Ei(e)
        })
    }, pp = function (e, t, i) {
        var r = i.d, n = i.d2, o = i.a;
        return (o = ji(e, "getBoundingClientRect")) ? function () {
            return o()[r]
        } : function () {
            return (t ? Au(n) : e["client" + n]) || 0
        }
    }, hp = function (e, t) {
        return !t || ~fi.indexOf(e) ? ku(e) : function () {
            return kn
        }
    }, di = function (e, t) {
        var i = t.s, r = t.d2, n = t.d, o = t.a;
        return Math.max(0, (i = "scroll" + r) && (o = ji(e, i)) ? o() - ku(e)()[n] : Tr(e) ? (Mt[i] || ne[i]) - Au(r) : e[i] - e["offset" + r])
    }, un = function (e, t) {
        for (var i = 0; i < Hr.length; i += 3) (!t || ~t.indexOf(Hr[i + 1])) && e(Hr[i], Hr[i + 1], Hr[i + 2])
    }, Ct = function (e) {
        return typeof e == "string"
    }, tt = function (e) {
        return typeof e == "function"
    }, Cs = function (e) {
        return typeof e == "number"
    }, cr = function (e) {
        return typeof e == "object"
    }, ms = function (e, t, i) {
        return e && e.progress(t ? 0 : 1) && i && e.pause()
    }, Eo = function (e, t) {
        if (e.enabled) {
            var i = e._ctx ? e._ctx.add(function () {
                return t(e)
            }) : t(e);
            i && i.totalTime && (e.callbackAnimation = i)
        }
    }, Dr = Math.abs, Ou = "left", Iu = "top", Xa = "right", Ua = "bottom", _r = "width", yr = "height", Rs = "Right",
    qs = "Left", zs = "Top", Bs = "Bottom", Me = "padding", Ft = "margin", as = "Width", ja = "Height", De = "px",
    Vt = function (e) {
        return Q.getComputedStyle(e)
    }, mp = function (e) {
        var t = Vt(e).position;
        e.style.position = t === "absolute" || t === "fixed" ? t : "relative"
    }, zl = function (e, t) {
        for (var i in t) i in e || (e[i] = t[i]);
        return e
    }, Ei = function (e, t) {
        var i = t && Vt(e)[ca] !== "matrix(1, 0, 0, 1, 0, 0)" && N.to(e, {
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            skewX: 0,
            skewY: 0
        }).progress(1), r = e.getBoundingClientRect();
        return i && i.progress(0).kill(), r
    }, Wn = function (e, t) {
        var i = t.d2;
        return e["offset" + i] || e["client" + i] || 0
    }, Du = function (e) {
        var t = [], i = e.labels, r = e.duration(), n;
        for (n in i) t.push(i[n] / r);
        return t
    }, gp = function (e) {
        return function (t) {
            return N.utils.snap(Du(e), t)
        }
    }, Ka = function (e) {
        var t = N.utils.snap(e), i = Array.isArray(e) && e.slice(0).sort(function (r, n) {
            return r - n
        });
        return i ? function (r, n, o) {
            o === void 0 && (o = .001);
            var a;
            if (!n) return t(r);
            if (n > 0) {
                for (r -= o, a = 0; a < i.length; a++) if (i[a] >= r) return i[a];
                return i[a - 1]
            } else for (a = i.length, r += o; a--;) if (i[a] <= r) return i[a];
            return i[0]
        } : function (r, n, o) {
            o === void 0 && (o = .001);
            var a = t(r);
            return !n || Math.abs(a - r) < o || a - r < 0 == n < 0 ? a : t(n < 0 ? r - e : r + e)
        }
    }, vp = function (e) {
        return function (t, i) {
            return Ka(Du(e))(t, i.direction)
        }
    }, dn = function (e, t, i, r) {
        return i.split(",").forEach(function (n) {
            return e(t, n, r)
        })
    }, Fe = function (e, t, i, r, n) {
        return e.addEventListener(t, i, {passive: !r, capture: !!n})
    }, Be = function (e, t, i, r) {
        return e.removeEventListener(t, i, !!r)
    }, fn = function (e, t, i) {
        i = i && i.wheelHandler, i && (e(t, "wheel", i), e(t, "touchmove", i))
    }, Bl = {startColor: "green", endColor: "red", indent: 0, fontSize: "16px", fontWeight: "normal"},
    pn = {toggleActions: "play", anticipatePin: 0}, Yn = {top: 0, left: 0, center: .5, bottom: 1, right: 1},
    Pn = function (e, t) {
        if (Ct(e)) {
            var i = e.indexOf("="), r = ~i ? +(e.charAt(i - 1) + 1) * parseFloat(e.substr(i + 1)) : 0;
            ~i && (e.indexOf("%") > i && (r *= t / 100), e = e.substr(0, i - 1)), e = r + (e in Yn ? Yn[e] * t : ~e.indexOf("%") ? parseFloat(e) * t / 100 : parseFloat(e) || 0)
        }
        return e
    }, hn = function (e, t, i, r, n, o, a, l) {
        var c = n.startColor, u = n.endColor, d = n.fontSize, f = n.indent, p = n.fontWeight, m = de.createElement("div"),
            h = Tr(i) || ji(i, "pinType") === "fixed", g = e.indexOf("scroller") !== -1, y = h ? ne : i,
            v = e.indexOf("start") !== -1, _ = v ? c : u,
            w = "border-color:" + _ + ";font-size:" + d + ";color:" + _ + ";font-weight:" + p + ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
        return w += "position:" + ((g || l) && h ? "fixed;" : "absolute;"), (g || l || !h) && (w += (r === Re ? Xa : Ua) + ":" + (o + parseFloat(f)) + "px;"), a && (w += "box-sizing:border-box;text-align:left;width:" + a.offsetWidth + "px;"), m._isStart = v, m.setAttribute("class", "gsap-marker-" + e + (t ? " marker-" + t : "")), m.style.cssText = w, m.innerText = t || t === 0 ? e + "-" + t : e, y.children[0] ? y.insertBefore(m, y.children[0]) : y.appendChild(m), m._offset = m["offset" + r.op.d2], Ln(m, 0, r, v), m
    }, Ln = function (e, t, i, r) {
        var n = {display: "block"}, o = i[r ? "os2" : "p2"], a = i[r ? "p2" : "os2"];
        e._isFlipped = r, n[i.a + "Percent"] = r ? -100 : 0, n[i.a] = r ? "1px" : 0, n["border" + o + as] = 1, n["border" + a + as] = 0, n[i.p] = t + "px", N.set(e, n)
    }, K = [], pa = {}, js, Fl = function () {
        return Ze() - Yt > 34 && (js || (js = requestAnimationFrame(Pi)))
    }, Rr = function () {
        (!at || !at.isPressed || at.startX > ne.clientWidth) && (J.cache++, at ? js || (js = requestAnimationFrame(Pi)) : Pi(), Yt || Cr("scrollStart"), Yt = Ze())
    }, Co = function () {
        Pu = Q.innerWidth, Cu = Q.innerHeight
    }, Ps = function (e) {
        J.cache++, (e === !0 || !Je && !Eu && !de.fullscreenElement && !de.webkitFullscreenElement && (!ua || Pu !== Q.innerWidth || Math.abs(Q.innerHeight - Cu) > Q.innerHeight * .25)) && $n.restart(!0)
    }, Er = {}, _p = [], Ru = function s() {
        return Be(B, "scrollEnd", s) || dr(!0)
    }, Cr = function (e) {
        return Er[e] && Er[e].map(function (t) {
            return t()
        }) || _p
    }, Et = [], qu = function (e) {
        for (var t = 0; t < Et.length; t += 5) (!e || Et[t + 4] && Et[t + 4].query === e) && (Et[t].style.cssText = Et[t + 1], Et[t].getBBox && Et[t].setAttribute("transform", Et[t + 2] || ""), Et[t + 3].uncache = 1)
    }, Qa = function (e, t) {
        var i;
        for (lt = 0; lt < K.length; lt++) i = K[lt], i && (!t || i._ctx === t) && (e ? i.kill(1) : i.revert(!0, !0));
        Gn = !0, t && qu(t), t || Cr("revert")
    }, zu = function (e, t) {
        J.cache++, (t || !ct) && J.forEach(function (i) {
            return tt(i) && i.cacheID++ && (i.rec = 0)
        }), Ct(e) && (Q.history.scrollRestoration = Wa = e)
    }, ct, wr = 0, Vl, yp = function () {
        if (Vl !== wr) {
            var e = Vl = wr;
            requestAnimationFrame(function () {
                return e === wr && dr(!0)
            })
        }
    }, Bu = function () {
        ne.appendChild(Qr), Ya = !at && Qr.offsetHeight || Q.innerHeight, ne.removeChild(Qr)
    }, Nl = function (e) {
        return Us(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(function (t) {
            return t.style.display = e ? "none" : "block"
        })
    }, dr = function (e, t) {
        if (Mt = de.documentElement, ne = de.body, Ga = [Q, de, Mt, ne], Yt && !e && !Gn) {
            Fe(B, "scrollEnd", Ru);
            return
        }
        Bu(), ct = B.isRefreshing = !0, J.forEach(function (r) {
            return tt(r) && ++r.cacheID && (r.rec = r())
        });
        var i = Cr("refreshInit");
        Tu && B.sort(), t || Qa(), J.forEach(function (r) {
            tt(r) && (r.smooth && (r.target.style.scrollBehavior = "auto"), r(0))
        }), K.slice(0).forEach(function (r) {
            return r.refresh()
        }), Gn = !1, K.forEach(function (r) {
            if (r._subPinOffset && r.pin) {
                var n = r.vars.horizontal ? "offsetWidth" : "offsetHeight", o = r.pin[n];
                r.revert(!0, 1), r.adjustPinSpacing(r.pin[n] - o), r.refresh()
            }
        }), fa = 1, Nl(!0), K.forEach(function (r) {
            var n = di(r.scroller, r._dir), o = r.vars.end === "max" || r._endClamp && r.end > n,
                a = r._startClamp && r.start >= n;
            (o || a) && r.setPositions(a ? n - 1 : r.start, o ? Math.max(a ? n : r.start + 1, n) : r.end, !0)
        }), Nl(!1), fa = 0, i.forEach(function (r) {
            return r && r.render && r.render(-1)
        }), J.forEach(function (r) {
            tt(r) && (r.smooth && requestAnimationFrame(function () {
                return r.target.style.scrollBehavior = "smooth"
            }), r.rec && r(r.rec))
        }), zu(Wa, 1), $n.pause(), wr++, ct = 2, Pi(2), K.forEach(function (r) {
            return tt(r.vars.onRefresh) && r.vars.onRefresh(r)
        }), ct = B.isRefreshing = !1, Cr("refresh")
    }, ha = 0, Mn = 1, Fs, Pi = function (e) {
        if (e === 2 || !ct && !Gn) {
            B.isUpdating = !0, Fs && Fs.update(0);
            var t = K.length, i = Ze(), r = i - To >= 50, n = t && K[0].scroll();
            if (Mn = ha > n ? -1 : 1, ct || (ha = n), r && (Yt && !lo && i - Yt > 200 && (Yt = 0, Cr("scrollEnd")), xs = To, To = i), Mn < 0) {
                for (lt = t; lt-- > 0;) K[lt] && K[lt].update(0, r);
                Mn = 1
            } else for (lt = 0; lt < t; lt++) K[lt] && K[lt].update(0, r);
            B.isUpdating = !1
        }
        js = 0
    },
    ma = [Ou, Iu, Ua, Xa, Ft + Bs, Ft + Rs, Ft + zs, Ft + qs, "display", "flexShrink", "float", "zIndex", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "gridArea", "justifySelf", "alignSelf", "placeSelf", "order"],
    An = ma.concat([_r, yr, "boxSizing", "max" + as, "max" + ja, "position", Ft, Me, Me + zs, Me + Rs, Me + Bs, Me + qs]),
    wp = function (e, t, i) {
        Jr(i);
        var r = e._gsap;
        if (r.spacerIsNative) Jr(r.spacerState); else if (e._gsap.swappedIn) {
            var n = t.parentNode;
            n && (n.insertBefore(e, t), n.removeChild(t))
        }
        e._gsap.swappedIn = !1
    }, Po = function (e, t, i, r) {
        if (!e._gsap.swappedIn) {
            for (var n = ma.length, o = t.style, a = e.style, l; n--;) l = ma[n], o[l] = i[l];
            o.position = i.position === "absolute" ? "absolute" : "relative", i.display === "inline" && (o.display = "inline-block"), a[Ua] = a[Xa] = "auto", o.flexBasis = i.flexBasis || "auto", o.overflow = "visible", o.boxSizing = "border-box", o[_r] = Wn(e, dt) + De, o[yr] = Wn(e, Re) + De, o[Me] = a[Ft] = a[Iu] = a[Ou] = "0", Jr(r), a[_r] = a["max" + as] = i[_r], a[yr] = a["max" + ja] = i[yr], a[Me] = i[Me], e.parentNode !== t && (e.parentNode.insertBefore(t, e), t.appendChild(e)), e._gsap.swappedIn = !0
        }
    }, bp = /([A-Z])/g, Jr = function (e) {
        if (e) {
            var t = e.t.style, i = e.length, r = 0, n, o;
            for ((e.t._gsap || N.core.getCache(e.t)).uncache = 1; r < i; r += 2) o = e[r + 1], n = e[r], o ? t[n] = o : t[n] && t.removeProperty(n.replace(bp, "-$1").toLowerCase())
        }
    }, mn = function (e) {
        for (var t = An.length, i = e.style, r = [], n = 0; n < t; n++) r.push(An[n], i[An[n]]);
        return r.t = e, r
    }, Sp = function (e, t, i) {
        for (var r = [], n = e.length, o = i ? 8 : 0, a; o < n; o += 2) a = e[o], r.push(a, a in t ? t[a] : e[o + 1]);
        return r.t = e.t, r
    }, kn = {left: 0, top: 0}, Hl = function (e, t, i, r, n, o, a, l, c, u, d, f, p, m) {
        tt(e) && (e = e(l)), Ct(e) && e.substr(0, 3) === "max" && (e = f + (e.charAt(4) === "=" ? Pn("0" + e.substr(3), i) : 0));
        var h = p ? p.time() : 0, g, y, v;
        if (p && p.seek(0), isNaN(e) || (e = +e), Cs(e)) p && (e = N.utils.mapRange(p.scrollTrigger.start, p.scrollTrigger.end, 0, f, e)), a && Ln(a, i, r, !0); else {
            tt(t) && (t = t(l));
            var _ = (e || "0").split(" "), w, b, T, x;
            v = gt(t, l) || ne, w = Ei(v) || {}, (!w || !w.left && !w.top) && Vt(v).display === "none" && (x = v.style.display, v.style.display = "block", w = Ei(v), x ? v.style.display = x : v.style.removeProperty("display")), b = Pn(_[0], w[r.d]), T = Pn(_[1] || "0", i), e = w[r.p] - c[r.p] - u + b + n - T, a && Ln(a, T, r, i - T < 20 || a._isStart && T > 20), i -= i - T
        }
        if (m && (l[m] = e || -.001, e < 0 && (e = 0)), o) {
            var C = e + i, P = o._isStart;
            g = "scroll" + r.d2, Ln(o, C, r, P && C > 20 || !P && (d ? Math.max(ne[g], Mt[g]) : o.parentNode[g]) <= C + 1), d && (c = Ei(a), d && (o.style[r.op.p] = c[r.op.p] - r.op.m - o._offset + De))
        }
        return p && v && (g = Ei(v), p.seek(f), y = Ei(v), p._caScrollDist = g[r.p] - y[r.p], e = e / p._caScrollDist * f), p && p.seek(h), p ? e : Math.round(e)
    }, xp = /(webkit|moz|length|cssText|inset)/i, $l = function (e, t, i, r) {
        if (e.parentNode !== t) {
            var n = e.style, o, a;
            if (t === ne) {
                e._stOrig = n.cssText, a = Vt(e);
                for (o in a) !+o && !xp.test(o) && a[o] && typeof n[o] == "string" && o !== "0" && (n[o] = a[o]);
                n.top = i, n.left = r
            } else n.cssText = e._stOrig;
            N.core.getCache(e).uncache = 1, t.appendChild(e)
        }
    }, Fu = function (e, t, i) {
        var r = t, n = r;
        return function (o) {
            var a = Math.round(e());
            return a !== r && a !== n && Math.abs(a - r) > 3 && Math.abs(a - n) > 3 && (o = a, i && i()), n = r, r = Math.round(o), r
        }
    }, gn = function (e, t, i) {
        var r = {};
        r[t.p] = "+=" + i, N.set(e, r)
    }, Gl = function (e, t) {
        var i = Ji(e, t), r = "_scroll" + t.p2, n = function o(a, l, c, u, d) {
            var f = o.tween, p = l.onComplete, m = {};
            c = c || i();
            var h = Fu(i, c, function () {
                f.kill(), o.tween = 0
            });
            return d = u && d || 0, u = u || a - c, f && f.kill(), l[r] = a, l.inherit = !1, l.modifiers = m, m[r] = function () {
                return h(c + u * f.ratio + d * f.ratio * f.ratio)
            }, l.onUpdate = function () {
                J.cache++, o.tween && Pi()
            }, l.onComplete = function () {
                o.tween = 0, p && p.call(f)
            }, f = o.tween = N.to(e, l), f
        };
        return e[r] = i, i.wheelHandler = function () {
            return n.tween && n.tween.kill() && (n.tween = 0)
        }, Fe(e, "wheel", i.wheelHandler), B.isTouch && Fe(e, "touchmove", i.wheelHandler), n
    }, B = function () {
        function s(t, i) {
            Nr || s.register(N) || console.warn("Please gsap.registerPlugin(ScrollTrigger)"), da(this), this.init(t, i)
        }

        var e = s.prototype;
        return e.init = function (i, r) {
            if (this.progress = this.start = 0, this.vars && this.kill(!0, !0), !Ts) {
                this.update = this.refresh = this.kill = oi;
                return
            }
            i = zl(Ct(i) || Cs(i) || i.nodeType ? {trigger: i} : i, pn);
            var n = i, o = n.onUpdate, a = n.toggleClass, l = n.id, c = n.onToggle, u = n.onRefresh, d = n.scrub,
                f = n.trigger, p = n.pin, m = n.pinSpacing, h = n.invalidateOnRefresh, g = n.anticipatePin,
                y = n.onScrubComplete, v = n.onSnapComplete, _ = n.once, w = n.snap, b = n.pinReparent, T = n.pinSpacer,
                x = n.containerAnimation, C = n.fastScrollEnd, P = n.preventOverlaps,
                E = i.horizontal || i.containerAnimation && i.horizontal !== !1 ? dt : Re, A = !d && d !== 0,
                L = gt(i.scroller || Q), k = N.core.getCache(L), R = Tr(L),
                q = ("pinType" in i ? i.pinType : ji(L, "pinType") || R && "fixed") === "fixed",
                I = [i.onEnter, i.onLeave, i.onEnterBack, i.onLeaveBack], z = A && i.toggleActions.split(" "),
                D = "markers" in i ? i.markers : pn.markers, H = R ? 0 : parseFloat(Vt(L)["border" + E.p2 + as]) || 0,
                S = this, Y = i.onRefreshInit && function () {
                    return i.onRefreshInit(S)
                }, re = pp(L, R, E), Oe = hp(L, R), fe = 0, He = 0, Xe = 0, Pe = Ji(L, E), rt, Ue, Ai, st, ht, ie, Se, mt, St,
                M, xt, vi, ki, ye, _i, Oi, er, qe, Ii, xe, Xt, zt, yi, ls, Le, en, wi, Ar, kr, Di, tr, Z, ir, Ut, jt, Kt,
                rr, Or, bi;
            if (S._startClamp = S._endClamp = !1, S._dir = E, g *= 45, S.scroller = L, S.scroll = x ? x.time.bind(x) : Pe, st = Pe(), S.vars = i, r = r || i.animation, "refreshPriority" in i && (Tu = 1, i.refreshPriority === -9999 && (Fs = S)), k.tweenScroll = k.tweenScroll || {
                top: Gl(L, Re),
                left: Gl(L, dt)
            }, S.tweenTo = rt = k.tweenScroll[E.p], S.scrubDuration = function (F) {
                ir = Cs(F) && F, ir ? Z ? Z.duration(F) : Z = N.to(r, {
                    ease: "expo",
                    totalProgress: "+=0",
                    inherit: !1,
                    duration: ir,
                    paused: !0,
                    onComplete: function () {
                        return y && y(S)
                    }
                }) : (Z && Z.progress(1).kill(), Z = 0)
            }, r && (r.vars.lazy = !1, r._initted && !S.isReverted || r.vars.immediateRender !== !1 && i.immediateRender !== !1 && r.duration() && r.render(0, !0, !0), S.animation = r.pause(), r.scrollTrigger = S, S.scrubDuration(d), Di = 0, l || (l = r.vars.id)), w && ((!cr(w) || w.push) && (w = {snapTo: w}), "scrollBehavior" in ne.style && N.set(R ? [ne, Mt] : L, {scrollBehavior: "auto"}), J.forEach(function (F) {
                return tt(F) && F.target === (R ? de.scrollingElement || Mt : L) && (F.smooth = !1)
            }), Ai = tt(w.snapTo) ? w.snapTo : w.snapTo === "labels" ? gp(r) : w.snapTo === "labelsDirectional" ? vp(r) : w.directional !== !1 ? function (F, X) {
                return Ka(w.snapTo)(F, Ze() - He < 500 ? 0 : X.direction)
            } : N.utils.snap(w.snapTo), Ut = w.duration || {
                min: .1,
                max: 2
            }, Ut = cr(Ut) ? Ds(Ut.min, Ut.max) : Ds(Ut, Ut), jt = N.delayedCall(w.delay || ir / 2 || .1, function () {
                var F = Pe(), X = Ze() - He < 500, G = rt.tween;
                if ((X || Math.abs(S.getVelocity()) < 10) && !G && !lo && fe !== F) {
                    var U = (F - ie) / ye, ze = r && !A ? r.totalProgress() : U,
                        ee = X ? 0 : (ze - tr) / (Ze() - xs) * 1e3 || 0,
                        Te = N.utils.clamp(-U, 1 - U, Dr(ee / 2) * ee / .185), je = U + (w.inertia === !1 ? 0 : Te), we, he,
                        ae = w, Qt = ae.onStart, ge = ae.onInterrupt, Tt = ae.onComplete;
                    if (we = Ai(je, S), Cs(we) || (we = je), he = Math.max(0, Math.round(ie + we * ye)), F <= Se && F >= ie && he !== F) {
                        if (G && !G._initted && G.data <= Dr(he - F)) return;
                        w.inertia === !1 && (Te = we - U), rt(he, {
                            duration: Ut(Dr(Math.max(Dr(je - ze), Dr(we - ze)) * .185 / ee / .05 || 0)),
                            ease: w.ease || "power3",
                            data: Dr(he - F),
                            onInterrupt: function () {
                                return jt.restart(!0) && ge && ge(S)
                            },
                            onComplete: function () {
                                S.update(), fe = Pe(), r && !A && (Z ? Z.resetTo("totalProgress", we, r._tTime / r._tDur) : r.progress(we)), Di = tr = r && !A ? r.totalProgress() : S.progress, v && v(S), Tt && Tt(S)
                            }
                        }, F, Te * ye, he - F - Te * ye), Qt && Qt(S, rt.tween)
                    }
                } else S.isActive && fe !== F && jt.restart(!0)
            }).pause()), l && (pa[l] = S), f = S.trigger = gt(f || p !== !0 && p), bi = f && f._gsap && f._gsap.stRevert, bi && (bi = bi(S)), p = p === !0 ? f : gt(p), Ct(a) && (a = {
                targets: f,
                className: a
            }), p && (m === !1 || m === Ft || (m = !m && p.parentNode && p.parentNode.style && Vt(p.parentNode).display === "flex" ? !1 : Me), S.pin = p, Ue = N.core.getCache(p), Ue.spacer ? _i = Ue.pinState : (T && (T = gt(T), T && !T.nodeType && (T = T.current || T.nativeElement), Ue.spacerIsNative = !!T, T && (Ue.spacerState = mn(T))), Ue.spacer = qe = T || de.createElement("div"), qe.classList.add("pin-spacer"), l && qe.classList.add("pin-spacer-" + l), Ue.pinState = _i = mn(p)), i.force3D !== !1 && N.set(p, {force3D: !0}), S.spacer = qe = Ue.spacer, kr = Vt(p), ls = kr[m + E.os2], xe = N.getProperty(p), Xt = N.quickSetter(p, E.a, De), Po(p, qe, kr), er = mn(p)), D) {
                vi = cr(D) ? zl(D, Bl) : Bl, M = hn("scroller-start", l, L, E, vi, 0), xt = hn("scroller-end", l, L, E, vi, 0, M), Ii = M["offset" + E.op.d2];
                var cs = gt(ji(L, "content") || L);
                mt = this.markerStart = hn("start", l, cs, E, vi, Ii, 0, x), St = this.markerEnd = hn("end", l, cs, E, vi, Ii, 0, x), x && (Or = N.quickSetter([mt, St], E.a, De)), !q && !(fi.length && ji(L, "fixedMarkers") === !0) && (mp(R ? ne : L), N.set([M, xt], {force3D: !0}), en = N.quickSetter(M, E.a, De), Ar = N.quickSetter(xt, E.a, De))
            }
            if (x) {
                var j = x.vars.onUpdate, W = x.vars.onUpdateParams;
                x.eventCallback("onUpdate", function () {
                    S.update(0, 0, 1), j && j.apply(x, W || [])
                })
            }
            if (S.previous = function () {
                return K[K.indexOf(S) - 1]
            }, S.next = function () {
                return K[K.indexOf(S) + 1]
            }, S.revert = function (F, X) {
                if (!X) return S.kill(!0);
                var G = F !== !1 || !S.enabled, U = Je;
                G !== S.isReverted && (G && (Kt = Math.max(Pe(), S.scroll.rec || 0), Xe = S.progress, rr = r && r.progress()), mt && [mt, St, M, xt].forEach(function (ze) {
                    return ze.style.display = G ? "none" : "block"
                }), G && (Je = S, S.update(G)), p && (!b || !S.isActive) && (G ? wp(p, qe, _i) : Po(p, qe, Vt(p), Le)), G || S.update(G), Je = U, S.isReverted = G)
            }, S.refresh = function (F, X, G, U) {
                if (!((Je || !S.enabled) && !X)) {
                    if (p && F && Yt) {
                        Fe(s, "scrollEnd", Ru);
                        return
                    }
                    !ct && Y && Y(S), Je = S, rt.tween && !G && (rt.tween.kill(), rt.tween = 0), Z && Z.pause(), h && r && (r.revert({kill: !1}).invalidate(), r.getChildren && r.getChildren(!0, !0, !1).forEach(function (Ri) {
                        return Ri.vars.immediateRender && Ri.render(0, !0, !0)
                    })), S.isReverted || S.revert(!0, !0), S._subPinOffset = !1;
                    var ze = re(), ee = Oe(), Te = x ? x.duration() : di(L, E), je = ye <= .01 || !ye, we = 0, he = U || 0,
                        ae = cr(G) ? G.end : i.end, Qt = i.endTrigger || f,
                        ge = cr(G) ? G.start : i.start || (i.start === 0 || !f ? 0 : p ? "0 0" : "0 100%"),
                        Tt = S.pinnedContainer = i.pinnedContainer && gt(i.pinnedContainer, S),
                        ti = f && Math.max(0, K.indexOf(S)) || 0, $e = ti, Ge, Ke, sr, tn, Qe, Ie, ii, po, rl, us, ri, ds,
                        rn;
                    for (D && cr(G) && (ds = N.getProperty(M, E.p), rn = N.getProperty(xt, E.p)); $e-- > 0;) Ie = K[$e], Ie.end || Ie.refresh(0, 1) || (Je = S), ii = Ie.pin, ii && (ii === f || ii === p || ii === Tt) && !Ie.isReverted && (us || (us = []), us.unshift(Ie), Ie.revert(!0, !0)), Ie !== K[$e] && (ti--, $e--);
                    for (tt(ge) && (ge = ge(S)), ge = Il(ge, "start", S), ie = Hl(ge, f, ze, E, Pe(), mt, M, S, ee, H, q, Te, x, S._startClamp && "_startClamp") || (p ? -.001 : 0), tt(ae) && (ae = ae(S)), Ct(ae) && !ae.indexOf("+=") && (~ae.indexOf(" ") ? ae = (Ct(ge) ? ge.split(" ")[0] : "") + ae : (we = Pn(ae.substr(2), ze), ae = Ct(ge) ? ge : (x ? N.utils.mapRange(0, x.duration(), x.scrollTrigger.start, x.scrollTrigger.end, ie) : ie) + we, Qt = f)), ae = Il(ae, "end", S), Se = Math.max(ie, Hl(ae || (Qt ? "100% 0" : Te), Qt, ze, E, Pe() + we, St, xt, S, ee, H, q, Te, x, S._endClamp && "_endClamp")) || -.001, we = 0, $e = ti; $e--;) Ie = K[$e], ii = Ie.pin, ii && Ie.start - Ie._pinPush <= ie && !x && Ie.end > 0 && (Ge = Ie.end - (S._startClamp ? Math.max(0, Ie.start) : Ie.start), (ii === f && Ie.start - Ie._pinPush < ie || ii === Tt) && isNaN(ge) && (we += Ge * (1 - Ie.progress)), ii === p && (he += Ge));
                    if (ie += we, Se += we, S._startClamp && (S._startClamp += we), S._endClamp && !ct && (S._endClamp = Se || -.001, Se = Math.min(Se, di(L, E))), ye = Se - ie || (ie -= .01) && .001, je && (Xe = N.utils.clamp(0, 1, N.utils.normalize(ie, Se, Kt))), S._pinPush = he, mt && we && (Ge = {}, Ge[E.a] = "+=" + we, Tt && (Ge[E.p] = "-=" + Pe()), N.set([mt, St], Ge)), p && !(fa && S.end >= di(L, E))) Ge = Vt(p), tn = E === Re, sr = Pe(), zt = parseFloat(xe(E.a)) + he, !Te && Se > 1 && (ri = (R ? de.scrollingElement || Mt : L).style, ri = {
                        style: ri,
                        value: ri["overflow" + E.a.toUpperCase()]
                    }, R && Vt(ne)["overflow" + E.a.toUpperCase()] !== "scroll" && (ri.style["overflow" + E.a.toUpperCase()] = "scroll")), Po(p, qe, Ge), er = mn(p), Ke = Ei(p, !0), po = q && Ji(L, tn ? dt : Re)(), m ? (Le = [m + E.os2, ye + he + De], Le.t = qe, $e = m === Me ? Wn(p, E) + ye + he : 0, $e && (Le.push(E.d, $e + De), qe.style.flexBasis !== "auto" && (qe.style.flexBasis = $e + De)), Jr(Le), Tt && K.forEach(function (Ri) {
                        Ri.pin === Tt && Ri.vars.pinSpacing !== !1 && (Ri._subPinOffset = !0)
                    }), q && Pe(Kt)) : ($e = Wn(p, E), $e && qe.style.flexBasis !== "auto" && (qe.style.flexBasis = $e + De)), q && (Qe = {
                        top: Ke.top + (tn ? sr - ie : po) + De,
                        left: Ke.left + (tn ? po : sr - ie) + De,
                        boxSizing: "border-box",
                        position: "fixed"
                    }, Qe[_r] = Qe["max" + as] = Math.ceil(Ke.width) + De, Qe[yr] = Qe["max" + ja] = Math.ceil(Ke.height) + De, Qe[Ft] = Qe[Ft + zs] = Qe[Ft + Rs] = Qe[Ft + Bs] = Qe[Ft + qs] = "0", Qe[Me] = Ge[Me], Qe[Me + zs] = Ge[Me + zs], Qe[Me + Rs] = Ge[Me + Rs], Qe[Me + Bs] = Ge[Me + Bs], Qe[Me + qs] = Ge[Me + qs], Oi = Sp(_i, Qe, b), ct && Pe(0)), r ? (rl = r._initted, So(1), r.render(r.duration(), !0, !0), yi = xe(E.a) - zt + ye + he, wi = Math.abs(ye - yi) > 1, q && wi && Oi.splice(Oi.length - 2, 2), r.render(0, !0, !0), rl || r.invalidate(!0), r.parent || r.totalTime(r.totalTime()), So(0)) : yi = ye, ri && (ri.value ? ri.style["overflow" + E.a.toUpperCase()] = ri.value : ri.style.removeProperty("overflow-" + E.a)); else if (f && Pe() && !x) for (Ke = f.parentNode; Ke && Ke !== ne;) Ke._pinOffset && (ie -= Ke._pinOffset, Se -= Ke._pinOffset), Ke = Ke.parentNode;
                    us && us.forEach(function (Ri) {
                        return Ri.revert(!1, !0)
                    }), S.start = ie, S.end = Se, st = ht = ct ? Kt : Pe(), !x && !ct && (st < Kt && Pe(Kt), S.scroll.rec = 0), S.revert(!1, !0), He = Ze(), jt && (fe = -1, jt.restart(!0)), Je = 0, r && A && (r._initted || rr) && r.progress() !== rr && r.progress(rr || 0, !0).render(r.time(), !0, !0), (je || Xe !== S.progress || x || h || r && !r._initted) && (r && !A && (r._initted || Xe || r.vars.immediateRender !== !1) && r.totalProgress(x && ie < -.001 && !Xe ? N.utils.normalize(ie, Se, 0) : Xe, !0), S.progress = je || (st - ie) / ye === Xe ? 0 : Xe), p && m && (qe._pinOffset = Math.round(S.progress * yi)), Z && Z.invalidate(), isNaN(ds) || (ds -= N.getProperty(M, E.p), rn -= N.getProperty(xt, E.p), gn(M, E, ds), gn(mt, E, ds - (U || 0)), gn(xt, E, rn), gn(St, E, rn - (U || 0))), je && !ct && S.update(), u && !ct && !ki && (ki = !0, u(S), ki = !1)
                }
            }, S.getVelocity = function () {
                return (Pe() - ht) / (Ze() - xs) * 1e3 || 0
            }, S.endAnimation = function () {
                ms(S.callbackAnimation), r && (Z ? Z.progress(1) : r.paused() ? A || ms(r, S.direction < 0, 1) : ms(r, r.reversed()))
            }, S.labelToScroll = function (F) {
                return r && r.labels && (ie || S.refresh() || ie) + r.labels[F] / r.duration() * ye || 0
            }, S.getTrailing = function (F) {
                var X = K.indexOf(S), G = S.direction > 0 ? K.slice(0, X).reverse() : K.slice(X + 1);
                return (Ct(F) ? G.filter(function (U) {
                    return U.vars.preventOverlaps === F
                }) : G).filter(function (U) {
                    return S.direction > 0 ? U.end <= ie : U.start >= Se
                })
            }, S.update = function (F, X, G) {
                if (!(x && !G && !F)) {
                    var U = ct === !0 ? Kt : S.scroll(), ze = F ? 0 : (U - ie) / ye, ee = ze < 0 ? 0 : ze > 1 ? 1 : ze || 0,
                        Te = S.progress, je, we, he, ae, Qt, ge, Tt, ti;
                    if (X && (ht = st, st = x ? Pe() : U, w && (tr = Di, Di = r && !A ? r.totalProgress() : ee)), g && p && !Je && !cn && Yt && (!ee && ie < U + (U - ht) / (Ze() - xs) * g ? ee = 1e-4 : ee === 1 && Se > U + (U - ht) / (Ze() - xs) * g && (ee = .9999)), ee !== Te && S.enabled) {
                        if (je = S.isActive = !!ee && ee < 1, we = !!Te && Te < 1, ge = je !== we, Qt = ge || !!ee != !!Te, S.direction = ee > Te ? 1 : -1, S.progress = ee, Qt && !Je && (he = ee && !Te ? 0 : ee === 1 ? 1 : Te === 1 ? 2 : 3, A && (ae = !ge && z[he + 1] !== "none" && z[he + 1] || z[he], ti = r && (ae === "complete" || ae === "reset" || ae in r))), P && (ge || ti) && (ti || d || !r) && (tt(P) ? P(S) : S.getTrailing(P).forEach(function (sr) {
                            return sr.endAnimation()
                        })), A || (Z && !Je && !cn ? (Z._dp._time - Z._start !== Z._time && Z.render(Z._dp._time - Z._start), Z.resetTo ? Z.resetTo("totalProgress", ee, r._tTime / r._tDur) : (Z.vars.totalProgress = ee, Z.invalidate().restart())) : r && r.totalProgress(ee, !!(Je && (He || F)))), p) {
                            if (F && m && (qe.style[m + E.os2] = ls), !q) Xt(Es(zt + yi * ee)); else if (Qt) {
                                if (Tt = !F && ee > Te && Se + 1 > U && U + 1 >= di(L, E), b) if (!F && (je || Tt)) {
                                    var $e = Ei(p, !0), Ge = U - ie;
                                    $l(p, ne, $e.top + (E === Re ? Ge : 0) + De, $e.left + (E === Re ? 0 : Ge) + De)
                                } else $l(p, qe);
                                Jr(je || Tt ? Oi : er), wi && ee < 1 && je || Xt(zt + (ee === 1 && !Tt ? yi : 0))
                            }
                        }
                        w && !rt.tween && !Je && !cn && jt.restart(!0), a && (ge || _ && ee && (ee < 1 || !xo)) && Us(a.targets).forEach(function (sr) {
                            return sr.classList[je || _ ? "add" : "remove"](a.className)
                        }), o && !A && !F && o(S), Qt && !Je ? (A && (ti && (ae === "complete" ? r.pause().totalProgress(1) : ae === "reset" ? r.restart(!0).pause() : ae === "restart" ? r.restart(!0) : r[ae]()), o && o(S)), (ge || !xo) && (c && ge && Eo(S, c), I[he] && Eo(S, I[he]), _ && (ee === 1 ? S.kill(!1, 1) : I[he] = 0), ge || (he = ee === 1 ? 1 : 3, I[he] && Eo(S, I[he]))), C && !je && Math.abs(S.getVelocity()) > (Cs(C) ? C : 2500) && (ms(S.callbackAnimation), Z ? Z.progress(1) : ms(r, ae === "reverse" ? 1 : !ee, 1))) : A && o && !Je && o(S)
                    }
                    if (Ar) {
                        var Ke = x ? U / x.duration() * (x._caScrollDist || 0) : U;
                        en(Ke + (M._isFlipped ? 1 : 0)), Ar(Ke)
                    }
                    Or && Or(-U / x.duration() * (x._caScrollDist || 0))
                }
            }, S.enable = function (F, X) {
                S.enabled || (S.enabled = !0, Fe(L, "resize", Ps), R || Fe(L, "scroll", Rr), Y && Fe(s, "refreshInit", Y), F !== !1 && (S.progress = Xe = 0, st = ht = fe = Pe()), X !== !1 && S.refresh())
            }, S.getTween = function (F) {
                return F && rt ? rt.tween : Z
            }, S.setPositions = function (F, X, G, U) {
                if (x) {
                    var ze = x.scrollTrigger, ee = x.duration(), Te = ze.end - ze.start;
                    F = ze.start + Te * F / ee, X = ze.start + Te * X / ee
                }
                S.refresh(!1, !1, {start: Dl(F, G && !!S._startClamp), end: Dl(X, G && !!S._endClamp)}, U), S.update()
            }, S.adjustPinSpacing = function (F) {
                if (Le && F) {
                    var X = Le.indexOf(E.d) + 1;
                    Le[X] = parseFloat(Le[X]) + F + De, Le[1] = parseFloat(Le[1]) + F + De, Jr(Le)
                }
            }, S.disable = function (F, X) {
                if (S.enabled && (F !== !1 && S.revert(!0, !0), S.enabled = S.isActive = !1, X || Z && Z.pause(), Kt = 0, Ue && (Ue.uncache = 1), Y && Be(s, "refreshInit", Y), jt && (jt.pause(), rt.tween && rt.tween.kill() && (rt.tween = 0)), !R)) {
                    for (var G = K.length; G--;) if (K[G].scroller === L && K[G] !== S) return;
                    Be(L, "resize", Ps), R || Be(L, "scroll", Rr)
                }
            }, S.kill = function (F, X) {
                S.disable(F, X), Z && !X && Z.kill(), l && delete pa[l];
                var G = K.indexOf(S);
                G >= 0 && K.splice(G, 1), G === lt && Mn > 0 && lt--, G = 0, K.forEach(function (U) {
                    return U.scroller === S.scroller && (G = 1)
                }), G || ct || (S.scroll.rec = 0), r && (r.scrollTrigger = null, F && r.revert({kill: !1}), X || r.kill()), mt && [mt, St, M, xt].forEach(function (U) {
                    return U.parentNode && U.parentNode.removeChild(U)
                }), Fs === S && (Fs = 0), p && (Ue && (Ue.uncache = 1), G = 0, K.forEach(function (U) {
                    return U.pin === p && G++
                }), G || (Ue.spacer = 0)), i.onKill && i.onKill(S)
            }, K.push(S), S.enable(!1, !1), bi && bi(S), r && r.add && !ye) {
                var se = S.update;
                S.update = function () {
                    S.update = se, J.cache++, ie || Se || S.refresh()
                }, N.delayedCall(.01, S.update), ye = .01, ie = Se = 0
            } else S.refresh();
            p && yp()
        }, s.register = function (i) {
            return Nr || (N = i || Mu(), Lu() && window.document && s.enable(), Nr = Ts), Nr
        }, s.defaults = function (i) {
            if (i) for (var r in i) pn[r] = i[r];
            return pn
        }, s.disable = function (i, r) {
            Ts = 0, K.forEach(function (o) {
                return o[r ? "kill" : "disable"](i)
            }), Be(Q, "wheel", Rr), Be(de, "scroll", Rr), clearInterval(ln), Be(de, "touchcancel", oi), Be(ne, "touchstart", oi), dn(Be, de, "pointerdown,touchstart,mousedown", Rl), dn(Be, de, "pointerup,touchend,mouseup", ql), $n.kill(), un(Be);
            for (var n = 0; n < J.length; n += 3) fn(Be, J[n], J[n + 1]), fn(Be, J[n], J[n + 2])
        }, s.enable = function () {
            if (Q = window, de = document, Mt = de.documentElement, ne = de.body, N && (Us = N.utils.toArray, Ds = N.utils.clamp, da = N.core.context || oi, So = N.core.suppressOverwrites || oi, Wa = Q.history.scrollRestoration || "auto", ha = Q.pageYOffset || 0, N.core.globals("ScrollTrigger", s), ne)) {
                Ts = 1, Qr = document.createElement("div"), Qr.style.height = "100vh", Qr.style.position = "absolute", Bu(), fp(), Ce.register(N), s.isTouch = Ce.isTouch, Fi = Ce.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent), ua = Ce.isTouch === 1, Fe(Q, "wheel", Rr), Ga = [Q, de, Mt, ne], N.matchMedia ? (s.matchMedia = function (c) {
                    var u = N.matchMedia(), d;
                    for (d in c) u.add(d, c[d]);
                    return u
                }, N.addEventListener("matchMediaInit", function () {
                    return Qa()
                }), N.addEventListener("matchMediaRevert", function () {
                    return qu()
                }), N.addEventListener("matchMedia", function () {
                    dr(0, 1), Cr("matchMedia")
                }), N.matchMedia().add("(orientation: portrait)", function () {
                    return Co(), Co
                })) : console.warn("Requires GSAP 3.11.0 or later"), Co(), Fe(de, "scroll", Rr);
                var i = ne.hasAttribute("style"), r = ne.style, n = r.borderTopStyle, o = N.core.Animation.prototype, a, l;
                for (o.revert || Object.defineProperty(o, "revert", {
                    value: function () {
                        return this.time(-.01, !0)
                    }
                }), r.borderTopStyle = "solid", a = Ei(ne), Re.m = Math.round(a.top + Re.sc()) || 0, dt.m = Math.round(a.left + dt.sc()) || 0, n ? r.borderTopStyle = n : r.removeProperty("border-top-style"), i || (ne.setAttribute("style", ""), ne.removeAttribute("style")), ln = setInterval(Fl, 250), N.delayedCall(.5, function () {
                    return cn = 0
                }), Fe(de, "touchcancel", oi), Fe(ne, "touchstart", oi), dn(Fe, de, "pointerdown,touchstart,mousedown", Rl), dn(Fe, de, "pointerup,touchend,mouseup", ql), ca = N.utils.checkPrefix("transform"), An.push(ca), Nr = Ze(), $n = N.delayedCall(.2, dr).pause(), Hr = [de, "visibilitychange", function () {
                    var c = Q.innerWidth, u = Q.innerHeight;
                    de.hidden ? (kl = c, Ol = u) : (kl !== c || Ol !== u) && Ps()
                }, de, "DOMContentLoaded", dr, Q, "load", dr, Q, "resize", Ps], un(Fe), K.forEach(function (c) {
                    return c.enable(0, 1)
                }), l = 0; l < J.length; l += 3) fn(Be, J[l], J[l + 1]), fn(Be, J[l], J[l + 2])
            }
        }, s.config = function (i) {
            "limitCallbacks" in i && (xo = !!i.limitCallbacks);
            var r = i.syncInterval;
            r && clearInterval(ln) || (ln = r) && setInterval(Fl, r), "ignoreMobileResize" in i && (ua = s.isTouch === 1 && i.ignoreMobileResize), "autoRefreshEvents" in i && (un(Be) || un(Fe, i.autoRefreshEvents || "none"), Eu = (i.autoRefreshEvents + "").indexOf("resize") === -1)
        }, s.scrollerProxy = function (i, r) {
            var n = gt(i), o = J.indexOf(n), a = Tr(n);
            ~o && J.splice(o, a ? 6 : 2), r && (a ? fi.unshift(Q, r, ne, r, Mt, r) : fi.unshift(n, r))
        }, s.clearMatchMedia = function (i) {
            K.forEach(function (r) {
                return r._ctx && r._ctx.query === i && r._ctx.kill(!0, !0)
            })
        }, s.isInViewport = function (i, r, n) {
            var o = (Ct(i) ? gt(i) : i).getBoundingClientRect(), a = o[n ? _r : yr] * r || 0;
            return n ? o.right - a > 0 && o.left + a < Q.innerWidth : o.bottom - a > 0 && o.top + a < Q.innerHeight
        }, s.positionInViewport = function (i, r, n) {
            Ct(i) && (i = gt(i));
            var o = i.getBoundingClientRect(), a = o[n ? _r : yr],
                l = r == null ? a / 2 : r in Yn ? Yn[r] * a : ~r.indexOf("%") ? parseFloat(r) * a / 100 : parseFloat(r) || 0;
            return n ? (o.left + l) / Q.innerWidth : (o.top + l) / Q.innerHeight
        }, s.killAll = function (i) {
            if (K.slice(0).forEach(function (n) {
                return n.vars.id !== "ScrollSmoother" && n.kill()
            }), i !== !0) {
                var r = Er.killAll || [];
                Er = {}, r.forEach(function (n) {
                    return n()
                })
            }
        }, s
    }();
B.version = "3.13.0";
B.saveStyles = function (s) {
    return s ? Us(s).forEach(function (e) {
        if (e && e.style) {
            var t = Et.indexOf(e);
            t >= 0 && Et.splice(t, 5), Et.push(e, e.style.cssText, e.getBBox && e.getAttribute("transform"), N.core.getCache(e), da())
        }
    }) : Et
};
B.revert = function (s, e) {
    return Qa(!s, e)
};
B.create = function (s, e) {
    return new B(s, e)
};
B.refresh = function (s) {
    return s ? Ps(!0) : (Nr || B.register()) && dr(!0)
};
B.update = function (s) {
    return ++J.cache && Pi(s === !0 ? 2 : 0)
};
B.clearScrollMemory = zu;
B.maxScroll = function (s, e) {
    return di(s, e ? dt : Re)
};
B.getScrollFunc = function (s, e) {
    return Ji(gt(s), e ? dt : Re)
};
B.getById = function (s) {
    return pa[s]
};
B.getAll = function () {
    return K.filter(function (s) {
        return s.vars.id !== "ScrollSmoother"
    })
};
B.isScrolling = function () {
    return !!Yt
};
B.snapDirectional = Ka;
B.addEventListener = function (s, e) {
    var t = Er[s] || (Er[s] = []);
    ~t.indexOf(e) || t.push(e)
};
B.removeEventListener = function (s, e) {
    var t = Er[s], i = t && t.indexOf(e);
    i >= 0 && t.splice(i, 1)
};
B.batch = function (s, e) {
    var t = [], i = {}, r = e.interval || .016, n = e.batchMax || 1e9, o = function (c, u) {
        var d = [], f = [], p = N.delayedCall(r, function () {
            u(d, f), d = [], f = []
        }).pause();
        return function (m) {
            d.length || p.restart(!0), d.push(m.trigger), f.push(m), n <= d.length && p.progress(1)
        }
    }, a;
    for (a in e) i[a] = a.substr(0, 2) === "on" && tt(e[a]) && a !== "onRefreshInit" ? o(a, e[a]) : e[a];
    return tt(n) && (n = n(), Fe(B, "refresh", function () {
        return n = e.batchMax()
    })), Us(s).forEach(function (l) {
        var c = {};
        for (a in i) c[a] = i[a];
        c.trigger = l, t.push(B.create(c))
    }), t
};
var Wl = function (e, t, i, r) {
    return t > r ? e(r) : t < 0 && e(0), i > r ? (r - t) / (i - t) : i < 0 ? t / (t - i) : 1
}, Lo = function s(e, t) {
    t === !0 ? e.style.removeProperty("touch-action") : e.style.touchAction = t === !0 ? "auto" : t ? "pan-" + t + (Ce.isTouch ? " pinch-zoom" : "") : "none", e === Mt && s(ne, t)
}, vn = {auto: 1, scroll: 1}, Tp = function (e) {
    var t = e.event, i = e.target, r = e.axis, n = (t.changedTouches ? t.changedTouches[0] : t).target,
        o = n._gsap || N.core.getCache(n), a = Ze(), l;
    if (!o._isScrollT || a - o._isScrollT > 2e3) {
        for (; n && n !== ne && (n.scrollHeight <= n.clientHeight && n.scrollWidth <= n.clientWidth || !(vn[(l = Vt(n)).overflowY] || vn[l.overflowX]));) n = n.parentNode;
        o._isScroll = n && n !== i && !Tr(n) && (vn[(l = Vt(n)).overflowY] || vn[l.overflowX]), o._isScrollT = a
    }
    (o._isScroll || r === "x") && (t.stopPropagation(), t._gsapAllow = !0)
}, Vu = function (e, t, i, r) {
    return Ce.create({
        target: e,
        capture: !0,
        debounce: !1,
        lockAxis: !0,
        type: t,
        onWheel: r = r && Tp,
        onPress: r,
        onDrag: r,
        onScroll: r,
        onEnable: function () {
            return i && Fe(de, Ce.eventTypes[0], Xl, !1, !0)
        },
        onDisable: function () {
            return Be(de, Ce.eventTypes[0], Xl, !0)
        }
    })
}, Ep = /(input|label|select|textarea)/i, Yl, Xl = function (e) {
    var t = Ep.test(e.target.tagName);
    (t || Yl) && (e._gsapAllow = !0, Yl = t)
}, Cp = function (e) {
    cr(e) || (e = {}), e.preventDefault = e.isNormalizer = e.allowClicks = !0, e.type || (e.type = "wheel,touch"), e.debounce = !!e.debounce, e.id = e.id || "normalizer";
    var t = e, i = t.normalizeScrollX, r = t.momentum, n = t.allowNestedScroll, o = t.onRelease, a, l,
        c = gt(e.target) || Mt, u = N.core.globals().ScrollSmoother, d = u && u.get(),
        f = Fi && (e.content && gt(e.content) || d && e.content !== !1 && !d.smooth() && d.content()), p = Ji(c, Re),
        m = Ji(c, dt), h = 1,
        g = (Ce.isTouch && Q.visualViewport ? Q.visualViewport.scale * Q.visualViewport.width : Q.outerWidth) / Q.innerWidth,
        y = 0, v = tt(r) ? function () {
            return r(a)
        } : function () {
            return r || 2.8
        }, _, w, b = Vu(c, e.type, !0, n), T = function () {
            return w = !1
        }, x = oi, C = oi, P = function () {
            l = di(c, Re), C = Ds(Fi ? 1 : 0, l), i && (x = Ds(0, di(c, dt))), _ = wr
        }, E = function () {
            f._gsap.y = Es(parseFloat(f._gsap.y) + p.offset) + "px", f.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + parseFloat(f._gsap.y) + ", 0, 1)", p.offset = p.cacheID = 0
        }, A = function () {
            if (w) {
                requestAnimationFrame(T);
                var D = Es(a.deltaY / 2), H = C(p.v - D);
                if (f && H !== p.v + p.offset) {
                    p.offset = H - p.v;
                    var S = Es((parseFloat(f && f._gsap.y) || 0) - p.offset);
                    f.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + S + ", 0, 1)", f._gsap.y = S + "px", p.cacheID = J.cache, Pi()
                }
                return !0
            }
            p.offset && E(), w = !0
        }, L, k, R, q, I = function () {
            P(), L.isActive() && L.vars.scrollY > l && (p() > l ? L.progress(1) && p(l) : L.resetTo("scrollY", l))
        };
    return f && N.set(f, {y: "+=0"}), e.ignoreCheck = function (z) {
        return Fi && z.type === "touchmove" && A() || h > 1.05 && z.type !== "touchstart" || a.isGesturing || z.touches && z.touches.length > 1
    }, e.onPress = function () {
        w = !1;
        var z = h;
        h = Es((Q.visualViewport && Q.visualViewport.scale || 1) / g), L.pause(), z !== h && Lo(c, h > 1.01 ? !0 : i ? !1 : "x"), k = m(), R = p(), P(), _ = wr
    }, e.onRelease = e.onGestureStart = function (z, D) {
        if (p.offset && E(), !D) q.restart(!0); else {
            J.cache++;
            var H = v(), S, Y;
            i && (S = m(), Y = S + H * .05 * -z.velocityX / .227, H *= Wl(m, S, Y, di(c, dt)), L.vars.scrollX = x(Y)), S = p(), Y = S + H * .05 * -z.velocityY / .227, H *= Wl(p, S, Y, di(c, Re)), L.vars.scrollY = C(Y), L.invalidate().duration(H).play(.01), (Fi && L.vars.scrollY >= l || S >= l - 1) && N.to({}, {
                onUpdate: I,
                duration: H
            })
        }
        o && o(z)
    }, e.onWheel = function () {
        L._ts && L.pause(), Ze() - y > 1e3 && (_ = 0, y = Ze())
    }, e.onChange = function (z, D, H, S, Y) {
        if (wr !== _ && P(), D && i && m(x(S[2] === D ? k + (z.startX - z.x) : m() + D - S[1])), H) {
            p.offset && E();
            var re = Y[2] === H, Oe = re ? R + z.startY - z.y : p() + H - Y[1], fe = C(Oe);
            re && Oe !== fe && (R += fe - Oe), p(fe)
        }
        (H || D) && Pi()
    }, e.onEnable = function () {
        Lo(c, i ? !1 : "x"), B.addEventListener("refresh", I), Fe(Q, "resize", I), p.smooth && (p.target.style.scrollBehavior = "auto", p.smooth = m.smooth = !1), b.enable()
    }, e.onDisable = function () {
        Lo(c, !0), Be(Q, "resize", I), B.removeEventListener("refresh", I), b.kill()
    }, e.lockAxis = e.lockAxis !== !1, a = new Ce(e), a.iOS = Fi, Fi && !p() && p(1), Fi && N.ticker.add(oi), q = a._dc, L = N.to(a, {
        ease: "power4",
        paused: !0,
        inherit: !1,
        scrollX: i ? "+=0.1" : "+=0",
        scrollY: "+=0.1",
        modifiers: {
            scrollY: Fu(p, p(), function () {
                return L.pause()
            })
        },
        onUpdate: Pi,
        onComplete: q.vars.onComplete
    }), a
};
B.sort = function (s) {
    if (tt(s)) return K.sort(s);
    var e = Q.pageYOffset || 0;
    return B.getAll().forEach(function (t) {
        return t._sortY = t.trigger ? e + t.trigger.getBoundingClientRect().top : t.start + Q.innerHeight
    }), K.sort(s || function (t, i) {
        return (t.vars.refreshPriority || 0) * -1e6 + (t.vars.containerAnimation ? 1e6 : t._sortY) - ((i.vars.containerAnimation ? 1e6 : i._sortY) + (i.vars.refreshPriority || 0) * -1e6)
    })
};
B.observe = function (s) {
    return new Ce(s)
};
B.normalizeScroll = function (s) {
    if (typeof s > "u") return at;
    if (s === !0 && at) return at.enable();
    if (s === !1) {
        at && at.kill(), at = s;
        return
    }
    var e = s instanceof Ce ? s : Cp(s);
    return at && at.target === e.target && at.kill(), Tr(e.target) && (at = e), e
};
B.core = {
    _getVelocityProp: la, _inputObserver: Vu, _scrollers: J, _proxies: fi, bridge: {
        ss: function () {
            Yt || Cr("scrollStart"), Yt = Ze()
        }, ref: function () {
            return Je
        }
    }
};
Mu() && N.registerPlugin(B);/*!
 * SplitText 3.13.0
 *
 *
 * @license Copyright 2025, GreenSock. All rights reserved. Subject to the terms at
 * @author: Jack Doyle
 */
let gs, qr, ga, Pp = () => ga || ai.register(window.gsap), Ul = typeof Intl < "u" ? new Intl.Segmenter : 0,
    Xn = s => typeof s == "string" ? Xn(document.querySelectorAll(s)) : "length" in s ? Array.from(s) : [s],
    jl = s => Xn(s).filter(e => e instanceof HTMLElement), va = [], Mo = function () {
    }, Lp = /\s+/g,
    Kl = new RegExp("\\p{RI}\\p{RI}|\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?(\\u{200D}\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?)*|.", "gu"),
    Ql = {left: 0, top: 0, width: 0, height: 0}, Jl = (s, e) => {
        if (e) {
            let t = new Set(s.join("").match(e) || va), i = s.length, r, n, o, a;
            if (t.size) for (; --i > -1;) {
                n = s[i];
                for (o of t) if (o.startsWith(n) && o.length > n.length) {
                    for (r = 0, a = n; o.startsWith(a += s[i + ++r]) && a.length < o.length;) ;
                    if (r && a.length === o.length) {
                        s[i] = o, s.splice(i + 1, r);
                        break
                    }
                }
            }
        }
        return s
    }, Zl = s => window.getComputedStyle(s).display === "inline" && (s.style.display = "inline-block"),
    zr = (s, e, t) => e.insertBefore(typeof s == "string" ? document.createTextNode(s) : s, t), _a = (s, e, t) => {
        let i = e[s + "sClass"] || "", {tag: r = "div", aria: n = "auto", propIndex: o = !1} = e,
            a = s === "line" ? "block" : "inline-block", l = i.indexOf("++") > -1, c = u => {
                let d = document.createElement(r), f = t.length + 1;
                return i && (d.className = i + (l ? " " + i + f : "")), o && d.style.setProperty("--" + s, f + ""), n !== "none" && d.setAttribute("aria-hidden", "true"), r !== "span" && (d.style.position = "relative", d.style.display = a), d.textContent = u, t.push(d), d
            };
        return l && (i = i.replace("++", "")), c.collection = t, c
    }, Mp = (s, e, t, i) => {
        let r = _a("line", t, i), n = window.getComputedStyle(s).textAlign || "left";
        return (o, a) => {
            let l = r("");
            for (l.style.textAlign = n, s.insertBefore(l, e[o]); o < a; o++) l.appendChild(e[o]);
            l.normalize()
        }
    }, Nu = (s, e, t, i, r, n, o, a, l, c) => {
        var u;
        let d = Array.from(s.childNodes), f = 0, {wordDelimiter: p, reduceWhiteSpace: m = !0, prepareText: h} = e,
            g = s.getBoundingClientRect(), y = g, v = !m && window.getComputedStyle(s).whiteSpace.substring(0, 3) === "pre",
            _ = 0, w = t.collection, b, T, x, C, P, E, A, L, k, R, q, I, z, D, H, S, Y, re;
        for (typeof p == "object" ? (x = p.delimiter || p, T = p.replaceWith || "") : T = p === "" ? "" : p || " ", b = T !== " "; f < d.length; f++) if (C = d[f], C.nodeType === 3) {
            for (H = C.textContent || "", m ? H = H.replace(Lp, " ") : v && (H = H.replace(/\n/g, T + `
`)), h && (H = h(H, s)), C.textContent = H, P = T || x ? H.split(x || T) : H.match(a) || va, Y = P[P.length - 1], L = b ? Y.slice(-1) === " " : !Y, Y || P.pop(), y = g, A = b ? P[0].charAt(0) === " " : !P[0], A && zr(" ", s, C), P[0] || P.shift(), Jl(P, l), n && c || (C.textContent = ""), k = 1; k <= P.length; k++) if (S = P[k - 1], !m && v && S.charAt(0) === `
` && ((u = C.previousSibling) == null || u.remove(), zr(document.createElement("br"), s, C), S = S.slice(1)), !m && S === "") zr(T, s, C); else if (S === " ") s.insertBefore(document.createTextNode(" "), C); else {
                if (b && S.charAt(0) === " " && zr(" ", s, C), _ && k === 1 && !A && w.indexOf(_.parentNode) > -1 ? (E = w[w.length - 1], E.appendChild(document.createTextNode(i ? "" : S))) : (E = t(i ? "" : S), zr(E, s, C), _ && k === 1 && !A && E.insertBefore(_, E.firstChild)), i) for (q = Ul ? Jl([...Ul.segment(S)].map(Oe => Oe.segment), l) : S.match(a) || va, re = 0; re < q.length; re++) E.appendChild(q[re] === " " ? document.createTextNode(" ") : i(q[re]));
                if (n && c) {
                    if (H = C.textContent = H.substring(S.length + 1, H.length), R = E.getBoundingClientRect(), R.top > y.top && R.left <= y.left) {
                        for (I = s.cloneNode(), z = s.childNodes[0]; z && z !== E;) D = z, z = z.nextSibling, I.appendChild(D);
                        s.parentNode.insertBefore(I, s), r && Zl(I)
                    }
                    y = R
                }
                (k < P.length || L) && zr(k >= P.length ? " " : b && S.slice(-1) === " " ? " " + T : T, s, C)
            }
            s.removeChild(C), _ = 0
        } else C.nodeType === 1 && (o && o.indexOf(C) > -1 ? (w.indexOf(C.previousSibling) > -1 && w[w.length - 1].appendChild(C), _ = C) : (Nu(C, e, t, i, r, n, o, a, l, !0), _ = 0), r && Zl(C))
    };
const Hu = class $u {
    constructor(e, t) {
        this.isSplit = !1, Pp(), this.elements = jl(e), this.chars = [], this.words = [], this.lines = [], this.masks = [], this.vars = t, this._split = () => this.isSplit && this.split(this.vars);
        let i = [], r, n = () => {
            let o = i.length, a;
            for (; o--;) {
                a = i[o];
                let l = a.element.offsetWidth;
                if (l !== a.width) {
                    a.width = l, this._split();
                    return
                }
            }
        };
        this._data = {
            orig: i, obs: typeof ResizeObserver < "u" && new ResizeObserver(() => {
                clearTimeout(r), r = setTimeout(n, 200)
            })
        }, Mo(this), this.split(t)
    }

    split(e) {
        this.isSplit && this.revert(), this.vars = e = e || this.vars || {};
        let {
                type: t = "chars,words,lines",
                aria: i = "auto",
                deepSlice: r = !0,
                smartWrap: n,
                onSplit: o,
                autoSplit: a = !1,
                specialChars: l,
                mask: c
            } = this.vars, u = t.indexOf("lines") > -1, d = t.indexOf("chars") > -1, f = t.indexOf("words") > -1,
            p = d && !f && !u, m = l && ("push" in l ? new RegExp("(?:" + l.join("|") + ")", "gu") : l),
            h = m ? new RegExp(m.source + "|" + Kl.source, "gu") : Kl, g = !!e.ignore && jl(e.ignore), {
                orig: y,
                animTime: v,
                obs: _
            } = this._data, w;
        return (d || f || u) && (this.elements.forEach((b, T) => {
            y[T] = {
                element: b,
                html: b.innerHTML,
                ariaL: b.getAttribute("aria-label"),
                ariaH: b.getAttribute("aria-hidden")
            }, i === "auto" ? b.setAttribute("aria-label", (b.textContent || "").trim()) : i === "hidden" && b.setAttribute("aria-hidden", "true");
            let x = [], C = [], P = [], E = d ? _a("char", e, x) : null, A = _a("word", e, C), L, k, R, q;
            if (Nu(b, e, A, E, p, r && (u || p), g, h, m, !1), u) {
                let I = Xn(b.childNodes), z = Mp(b, I, e, P), D, H = [], S = 0,
                    Y = I.map(Oe => Oe.nodeType === 1 ? Oe.getBoundingClientRect() : Ql), re = Ql;
                for (L = 0; L < I.length; L++) D = I[L], D.nodeType === 1 && (D.nodeName === "BR" ? (H.push(D), z(S, L + 1), S = L + 1, re = Y[S]) : (L && Y[L].top > re.top && Y[L].left <= re.left && (z(S, L), S = L), re = Y[L]));
                S < L && z(S, L), H.forEach(Oe => {
                    var fe;
                    return (fe = Oe.parentNode) == null ? void 0 : fe.removeChild(Oe)
                })
            }
            if (!f) {
                for (L = 0; L < C.length; L++) if (k = C[L], d || !k.nextSibling || k.nextSibling.nodeType !== 3) if (n && !u) {
                    for (R = document.createElement("span"), R.style.whiteSpace = "nowrap"; k.firstChild;) R.appendChild(k.firstChild);
                    k.replaceWith(R)
                } else k.replaceWith(...k.childNodes); else q = k.nextSibling, q && q.nodeType === 3 && (q.textContent = (k.textContent || "") + (q.textContent || ""), k.remove());
                C.length = 0, b.normalize()
            }
            this.lines.push(...P), this.words.push(...C), this.chars.push(...x)
        }), c && this[c] && this.masks.push(...this[c].map(b => {
            let T = b.cloneNode();
            return b.replaceWith(T), T.appendChild(b), b.className && (T.className = b.className.replace(/(\b\w+\b)/g, "$1-mask")), T.style.overflow = "clip", T
        }))), this.isSplit = !0, qr && (a ? qr.addEventListener("loadingdone", this._split) : qr.status === "loading" && console.warn("SplitText called before fonts loaded")), (w = o && o(this)) && w.totalTime && (this._data.anim = v ? w.totalTime(v) : w), u && a && this.elements.forEach((b, T) => {
            y[T].width = b.offsetWidth, _ && _.observe(b)
        }), this
    }

    revert() {
        var e, t;
        let {orig: i, anim: r, obs: n} = this._data;
        return n && n.disconnect(), i.forEach(({element: o, html: a, ariaL: l, ariaH: c}) => {
            o.innerHTML = a, l ? o.setAttribute("aria-label", l) : o.removeAttribute("aria-label"), c ? o.setAttribute("aria-hidden", c) : o.removeAttribute("aria-hidden")
        }), this.chars.length = this.words.length = this.lines.length = i.length = this.masks.length = 0, this.isSplit = !1, qr == null || qr.removeEventListener("loadingdone", this._split), r && (this._data.animTime = r.totalTime(), r.revert()), (t = (e = this.vars).onRevert) == null || t.call(e, this), this
    }

    static create(e, t) {
        return new $u(e, t)
    }

    static register(e) {
        gs = gs || e || window.gsap, gs && (Xn = gs.utils.toArray, Mo = gs.core.context || Mo), !ga && window.innerWidth > 0 && (qr = document.fonts, ga = !0)
    }
};
Hu.version = "3.13.0";
let ai = Hu;
O.registerPlugin(B);
O.registerPlugin(ai);

function Ap() {
    if (document.querySelector(".siteFooter__toplink").addEventListener("click", () => {
        window.scrollTo({top: 0, left: 0, behavior: "smooth"})
    }), document.querySelector(".handReveal") && O.set(".handReveal", {autoAlpha: 0}), document.querySelector(".headingReveal") && O.set(".headingReveal", {autoAlpha: 0}), document.querySelector(".fadeInReveal") && O.set(".fadeInReveal", {
        autoAlpha: 0,
        y: 40
    }), document.querySelector(".cardCarousel") && O.set(".cardCarousel .card", {
        autoAlpha: 0,
        y: 40
    }), document.querySelector(".homeVideoReviews") && O.set(".homeVideoReviews__slide", {
        autoAlpha: 0,
        y: 40
    }), document.querySelectorAll(".card__favourite").forEach(n => {
        n.addEventListener("click", () => {
            n.classList.toggle("is-favourited")
        })
    }), document.querySelectorAll(".imageMontage").forEach(n => {
        const o = n.querySelector(".imageMontage__primary"), a = n.querySelector(".imageMontage__secondary img"),
            l = n.querySelector(".imageMontage__tertiary");

        function c(u, d, f) {
            u && (O.set(u, {yPercent: d}), O.to(u, {
                yPercent: f,
                ease: "none",
                scrollTrigger: {trigger: n, start: "top bottom", end: "bottom top", scrub: !0}
            }))
        }

        c(o, 5, -5), c(a, -5, 5), c(l, -5, 10)
    }), document.querySelectorAll(".processDrawers").forEach(n => {
        const o = n.querySelectorAll(".processDrawers__section");
        o.forEach((a, l) => {
            const c = a.querySelector(".processDrawers__title"), u = a.querySelector(".processDrawers__subheading"),
                d = a.querySelector(".processDrawers__heading"), f = o.length;
            let p = O.matchMedia();
            O.set(u, {autoAlpha: 0}), O.set(d, {autoAlpha: 0}), p.add("(max-width: 959px)", () => {
                function m() {
                    O.set(a, {
                        "--title-width": `${c.offsetHeight}px`,
                        "--title-offset": `${c.offsetHeight * l}px`,
                        width: "100%",
                        height: () => window.innerHeight - document.querySelector(".siteHeader").offsetHeight - c.offsetHeight * l
                    }), O.set(n, {height: "auto"}), B.refresh()
                }

                m(), window.addEventListener("resize", m), O.set(u, {autoAlpha: 1}), O.set(d, {autoAlpha: 1}), ai.create(u, {
                    type: "words, chars",
                    charsClass: "char",
                    autoSplit: !0,
                    onSplit: h => O.from(h.chars, {
                        autoAlpha: 0,
                        filter: "blur(5px)",
                        duration: 2,
                        ease: "expo.out",
                        stagger: .02,
                        scrollTrigger: {trigger: a, once: !0, start: "bottom bottom+=200px"}
                    })
                }), ai.create(d, {
                    type: "lines",
                    charsClass: "line",
                    autoSplit: !0,
                    onSplit: h => O.from(h.lines, {
                        autoAlpha: 0,
                        y: 40,
                        filter: "blur(20px)",
                        duration: 2,
                        ease: "expo.out",
                        stagger: .15,
                        scrollTrigger: {trigger: a, once: !0, start: "bottom bottom+=200px"}
                    })
                })
            }), p.add("(min-width: 960px)", () => {
                function m() {
                    O.set(a, {
                        "--title-width": `${c.offsetHeight}px`,
                        width: () => n.offsetWidth - c.offsetHeight * (f - 1),
                        height: "100%"
                    }), O.set(n, {height: () => a.offsetHeight * (f + 1)}), B.refresh()
                }

                if (m(), window.addEventListener("resize", m), l !== 0) {
                    let h = O.fromTo(a, {x: () => n.offsetWidth - c.offsetHeight * (f - l)}, {
                        x: () => 0 + c.offsetHeight * l,
                        ease: "none",
                        scrollTrigger: {
                            trigger: n,
                            start: () => `${a.offsetHeight * l} 50%`,
                            end: () => `${a.offsetHeight * (l + 1)} 50%`,
                            scrub: !0,
                            invalidateOnRefresh: !0
                        }
                    });
                    O.set(u, {autoAlpha: 1}), O.set(d, {autoAlpha: 1}), ai.create(u, {
                        type: "words, chars",
                        charsClass: "char",
                        autoSplit: !0,
                        onSplit: g => O.from(g.chars, {
                            autoAlpha: 0,
                            filter: "blur(5px)",
                            duration: 2,
                            ease: "expo.out",
                            stagger: .02,
                            scrollTrigger: {trigger: a, containerAnimation: h, once: !0, start: "left 50%"}
                        })
                    }), ai.create(d, {
                        type: "lines",
                        charsClass: "line",
                        autoSplit: !0,
                        onSplit: g => O.from(g.lines, {
                            autoAlpha: 0,
                            y: 40,
                            filter: "blur(20px)",
                            duration: 2,
                            ease: "expo.out",
                            stagger: .15,
                            scrollTrigger: {trigger: a, containerAnimation: h, once: !0, start: "left 50%"}
                        })
                    })
                } else O.set(u, {autoAlpha: 1}), O.set(d, {autoAlpha: 1}), ai.create(u, {
                    type: "words, chars",
                    charsClass: "char",
                    autoSplit: !0,
                    onSplit: h => O.from(h.chars, {
                        autoAlpha: 0,
                        filter: "blur(5px)",
                        duration: 2,
                        ease: "expo.out",
                        stagger: .02,
                        scrollTrigger: {trigger: a, once: !0, start: "top top"}
                    })
                }), ai.create(d, {
                    type: "lines",
                    charsClass: "line",
                    autoSplit: !0,
                    onSplit: h => O.from(h.lines, {
                        autoAlpha: 0,
                        y: 40,
                        filter: "blur(20px)",
                        duration: 2,
                        ease: "expo.out",
                        stagger: .15,
                        scrollTrigger: {trigger: a, once: !0, start: "top top"}
                    })
                })
            })
        })
    }), O.matchMedia().add("(hover: hover) and (pointer: fine)", () => {
        document.querySelectorAll(".tripListings--alternate").forEach(o => {
            o.querySelectorAll(".tripListings__item").forEach(l => {
                const c = l.querySelector(".tripListings__image"), u = l.querySelector(".tripListings__image.right");
                let d = O.utils.random(10, 20, !0), f = O.utils.random(-20, 10, !0), p = O.utils.random(-10, 10, !0);
                O.set(c, {autoAlpha: 0, rotate: 0, yPercent: () => d()}), O.set(u, {
                    autoAlpha: 0,
                    rotate: 0,
                    yPercent: () => d()
                });
                let m = O.timeline({paused: !0});
                m.to(c, {
                    autoAlpha: 1,
                    rotate: () => p(),
                    yPercent: () => f(),
                    duration: .5,
                    ease: "power2.out",
                    delay: .1
                }), m.to(u, {
                    autoAlpha: 1,
                    rotate: () => p(),
                    yPercent: () => f(),
                    duration: .5,
                    ease: "power2.out"
                }, "<+0.2"), l.addEventListener("mouseenter", () => {
                    m.timeScale(1).play()
                }), l.addEventListener("mouseleave", () => {
                    m.timeScale(2).reverse()
                })
            })
        })
    }), document.querySelectorAll(".destinationsScrollSection").forEach(n => {
        const o = n.querySelector(".destinationsScrollSection__inner"),
            a = n.querySelectorAll(".destinationsScrollSection__image--lg");

        function l() {
            n.style.setProperty("height", `${o.offsetWidth}px`)
        }

        l(), window.addEventListener("resize", l);
        let c = O.to(o, {
            x: () => (o.offsetWidth - document.body.clientWidth) * -1,
            ease: "none",
            scrollTrigger: {trigger: n, start: "top top", end: "bottom bottom", scrub: !0, invalidateOnRefresh: !0}
        });
        a.forEach(u => {
            const d = u.querySelector("img");
            O.to(d, {
                xPercent: 20,
                ease: "none",
                scrollTrigger: {
                    trigger: u,
                    containerAnimation: c,
                    start: "left right",
                    end: "right left",
                    scrub: !0,
                    invalidateOnRefresh: !0
                }
            })
        })
    }), document.querySelector(".tailormadeScroll")) {
        const n = document.querySelectorAll(".tailormadeScroll__item"),
            o = document.querySelectorAll(".tailormadeScroll__image > img");
        O.set(o, {scale: 1.1, autoAlpha: 0, filter: "blur(20px)"}), n.forEach((a, l) => {
            const c = a.dataset.item, u = a.children,
                d = document.querySelectorAll(`.tailormadeScroll__image[data-item="${c}"] > img`);
            console.log(a, l), O.set(u, {opacity: .2}), B.create({
                trigger: () => l == 0 ? "html" : a,
                endTrigger: () => l == n.length - 1 ? "html" : a,
                start: "top 50%",
                end: "bottom 50%",
                onToggle: f => {
                    f.isActive ? (O.to(u, {opacity: 1}), O.to(d, {
                        scale: 1,
                        autoAlpha: 1,
                        filter: "blur(0px)",
                        duration: 1,
                        ease: "power3.inOut",
                        stagger: .1
                    })) : (O.to(u, {opacity: .2}), O.to(d, {
                        scale: 1.1,
                        autoAlpha: 0,
                        filter: "blur(20px)",
                        duration: 1,
                        ease: "power3.inOut",
                        stagger: .1
                    }))
                }
            })
        })
    }
}

function Un() {
    B.refresh(), document.fonts.ready.then(() => {
        document.querySelectorAll(".handReveal").forEach(r => {
            O.set(r, {autoAlpha: 1}), ai.create(r, {
                type: "words, chars",
                charsClass: "char",
                autoSplit: !0,
                onSplit: n => O.from(n.chars, {
                    autoAlpha: 0,
                    filter: "blur(5px)",
                    duration: 2,
                    ease: "expo.out",
                    stagger: .02,
                    scrollTrigger: {
                        trigger: r,
                        once: !0,
                        start: () => r.getBoundingClientRect().top + window.scrollY > window.innerHeight ? "top 80%" : "top bottom"
                    }
                })
            })
        }), document.querySelectorAll(".headingReveal").forEach(r => {
            O.set(r, {autoAlpha: 1}), ai.create(r, {
                type: "lines",
                charsClass: "line",
                autoSplit: !0,
                onSplit: n => O.from(n.lines, {
                    autoAlpha: 0,
                    y: 40,
                    filter: "blur(20px)",
                    duration: 2,
                    ease: "expo.out",
                    stagger: .15,
                    scrollTrigger: {
                        trigger: r,
                        once: !0,
                        start: () => r.getBoundingClientRect().top + window.scrollY > window.innerHeight ? "top 80%" : "top bottom"
                    }
                })
            })
        })
    }), document.querySelector(".fadeInReveal") && B.batch(".fadeInReveal", {
        batchMax: 10,
        onEnter: t => {
            O.to(t, {autoAlpha: 1, y: 0, duration: 2, ease: "expo.out", stagger: .15})
        },
        start: t => t.trigger.getBoundingClientRect().top + window.scrollY > window.innerHeight ? "top bottom-=150px" : "top bottom",
        once: !0
    }), document.querySelector(".homeVideoReviews") && O.to(".homeVideoReviews__slide", {
        autoAlpha: 1,
        y: 0,
        duration: 2,
        ease: "expo.out",
        stagger: .15,
        clearProps: "all",
        scrollTrigger: {
            trigger: ".homeVideoReviews",
            start: t => t.trigger.getBoundingClientRect().top + window.scrollY > window.innerHeight ? "top bottom-=150px" : "top bottom",
            once: !0
        }
    }), document.querySelectorAll(".cardCarousel").forEach(t => {
        const i = t.querySelectorAll(".card");
        O.to(i, {
            autoAlpha: 1,
            y: 0,
            duration: 2,
            ease: "expo.out",
            stagger: .15,
            clearProps: "all",
            scrollTrigger: {
                trigger: t,
                start: r => r.trigger.getBoundingClientRect().top + window.scrollY > window.innerHeight ? "top bottom-=150px" : "top bottom",
                once: !0
            }
        })
    }), document.querySelectorAll(".card__overlay-toggle").forEach(t => {
        const i = t.closest(".card");
        t.addEventListener("click", () => {
            i.classList.toggle("overlay-active")
        })
    })
}

function kp() {
    if (document.querySelector(".destinationsHero")) {
        let s = document.querySelector(".destinationsHero__image:nth-child(1)"),
            e = document.querySelector(".destinationsHero__image:nth-child(2)"),
            t = document.querySelector(".destinationsHero__image:nth-child(3)"),
            i = document.querySelector(".destinationsHero__image:nth-child(4)"), r = s.querySelector("img"),
            n = e.querySelector("img"), o = t.querySelector("img"), a = i.querySelector("img"), l = O.timeline({
                onStart: () => {
                    document.body.classList.add("pageTransition--in-progress")
                }, onComplete: () => {
                    document.body.classList.remove("pageTransition--in-progress"), Un()
                }
            });
        l.to(".pageTransition", {
            autoAlpha: 0,
            duration: .6,
            ease: "sine.inOut"
        }), l.from(s, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }), l.from(r, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), l.from(e, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }, "<+0.3"), l.from(n, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), l.from(t, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }, "<+0.3"), l.from(o, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), l.from(i, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }, "<+0.3"), l.from(a, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), l.from(s, {left: "50%", top: "50%", duration: .6, ease: "power4.inOut"}), l.from(e, {
            left: "50%",
            top: "50%",
            duration: .6,
            ease: "power4.inOut"
        }, "<+0.1"), l.from(t, {
            right: "50%",
            top: "50%",
            duration: .6,
            ease: "power4.inOut"
        }, "<+0.1"), l.from(i, {right: "50%", top: "50%", duration: .6, ease: "power4.inOut"}, "<+0.1")
    } else O.timeline({
        onStart: () => {
            document.body.classList.add("pageTransition--in-progress")
        }, onComplete: () => {
            document.body.classList.remove("pageTransition--in-progress"), Un()
        }
    }).to(".pageTransition", {autoAlpha: 0, duration: .6, ease: "sine.inOut"})
}

function Gu(s) {
    return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s
}

var Ao = {exports: {}}, ec;

function Op() {
    return ec || (ec = 1, function (s) {
        (function (e) {
            let t = 0;
            const i = function (r, n) {
                const o = "js-enabled", a = this;
                let l = !1;
                if (Array.isArray(r)) return !!r.length && r.map(d => new i(d, n));
                const c = {
                    init() {
                        this.options = Object.assign({
                            duration: 500,
                            ariaEnabled: !0,
                            collapse: !0,
                            showMultiple: !1,
                            onlyChildNodes: !0,
                            openOnInit: [],
                            elementClass: "ac",
                            triggerClass: "ac-trigger",
                            panelClass: "ac-panel",
                            activeClass: "is-active",
                            beforeOpen: () => {
                            },
                            onOpen: () => {
                            },
                            beforeClose: () => {
                            },
                            onClose: () => {
                            }
                        }, n);
                        const d = typeof r == "string";
                        this.container = d ? document.querySelector(r) : r, this.createDefinitions(), a.attachEvents()
                    }, createDefinitions() {
                        const {elementClass: d, openOnInit: f, onlyChildNodes: p} = this.options,
                            m = p ? this.container.childNodes : this.container.querySelectorAll(u(d));
                        this.elements = Array.from(m).filter(h => h.classList && h.classList.contains(d)), this.firstElement = this.elements[0], this.lastElement = this.elements[this.elements.length - 1], this.elements.filter(h => !h.classList.contains(o)).forEach(h => {
                            h.classList.add(o), this.generateIDs(h), this.setARIA(h), this.setTransition(h);
                            const g = this.elements.indexOf(h);
                            t++, f.includes(g) ? this.showElement(h, !1) : this.closeElement(h, !1)
                        })
                    }, setTransition(d) {
                        let f = arguments.length > 1 && arguments[1] !== void 0 && arguments[1];
                        const {duration: p, panelClass: m} = this.options;
                        d.querySelector(u(m)).style.transitionDuration = f ? null : "".concat(p, "ms")
                    }, generateIDs(d) {
                        const {triggerClass: f, panelClass: p} = this.options, m = d.querySelector(u(f)),
                            h = d.querySelector(u(p));
                        d.setAttribute("id", d.id || "ac-".concat(t)), m.setAttribute("id", m.id || "ac-trigger-".concat(t)), h.setAttribute("id", h.id || "ac-panel-".concat(t))
                    }, removeIDs(d) {
                        const {triggerClass: f, panelClass: p} = this.options, m = d.querySelector(u(f)),
                            h = d.querySelector(u(p));
                        d.id.startsWith("ac-") && d.removeAttribute("id"), m.id.startsWith("ac-") && m.removeAttribute("id"), h.id.startsWith("ac-") && h.removeAttribute("id")
                    }, setARIA(d) {
                        const {ariaEnabled: f, triggerClass: p, panelClass: m} = this.options;
                        if (!f) return;
                        const h = d.querySelector(u(p)), g = d.querySelector(u(m));
                        h.setAttribute("role", "button"), h.setAttribute("aria-controls", g.id), h.setAttribute("aria-disabled", !1), h.setAttribute("aria-expanded", !1), g.setAttribute("role", "region"), g.setAttribute("aria-labelledby", h.id)
                    }, updateARIA(d, f) {
                        let {ariaExpanded: p, ariaDisabled: m} = f;
                        const {ariaEnabled: h, triggerClass: g} = this.options;
                        if (!h) return;
                        const y = d.querySelector(u(g));
                        y.setAttribute("aria-expanded", p), y.setAttribute("aria-disabled", m)
                    }, removeARIA(d) {
                        const {ariaEnabled: f, triggerClass: p, panelClass: m} = this.options;
                        if (!f) return;
                        const h = d.querySelector(u(p)), g = d.querySelector(u(m));
                        h.removeAttribute("role"), h.removeAttribute("aria-controls"), h.removeAttribute("aria-disabled"), h.removeAttribute("aria-expanded"), g.removeAttribute("role"), g.removeAttribute("aria-labelledby")
                    }, focus(d, f) {
                        d.preventDefault();
                        const {triggerClass: p} = this.options;
                        f.querySelector(u(p)).focus()
                    }, focusFirstElement(d) {
                        this.focus(d, this.firstElement), this.currFocusedIdx = 0
                    }, focusLastElement(d) {
                        this.focus(d, this.lastElement), this.currFocusedIdx = this.elements.length - 1
                    }, focusNextElement(d) {
                        const f = this.currFocusedIdx + 1;
                        if (f > this.elements.length - 1) return this.focusFirstElement(d);
                        this.focus(d, this.elements[f]), this.currFocusedIdx = f
                    }, focusPrevElement(d) {
                        const f = this.currFocusedIdx - 1;
                        if (f < 0) return this.focusLastElement(d);
                        this.focus(d, this.elements[f]), this.currFocusedIdx = f
                    }, showElement(d) {
                        let f = !(arguments.length > 1 && arguments[1] !== void 0) || arguments[1];
                        const {panelClass: p, activeClass: m, collapse: h, beforeOpen: g} = this.options;
                        f && g(d);
                        const y = d.querySelector(u(p)), v = y.scrollHeight;
                        d.classList.add(m), requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                y.style.height = f ? "".concat(v, "px") : "auto"
                            })
                        }), this.updateARIA(d, {ariaExpanded: !0, ariaDisabled: !h})
                    }, closeElement(d) {
                        let f = !(arguments.length > 1 && arguments[1] !== void 0) || arguments[1];
                        const {panelClass: p, activeClass: m, beforeClose: h} = this.options, g = d.querySelector(u(p)),
                            y = g.scrollHeight;
                        d.classList.remove(m), f ? (h(d), requestAnimationFrame(() => {
                            g.style.height = "".concat(y, "px"), requestAnimationFrame(() => {
                                g.style.height = 0
                            })
                        })) : g.style.height = 0, this.updateARIA(d, {ariaExpanded: !1, ariaDisabled: !1})
                    }, toggleElement(d) {
                        const {activeClass: f, collapse: p} = this.options, m = d.classList.contains(f);
                        if (!m || p) return m ? this.closeElement(d) : this.showElement(d)
                    }, closeElements() {
                        const {activeClass: d, showMultiple: f} = this.options;
                        f || this.elements.forEach((p, m) => {
                            p.classList.contains(d) && m !== this.currFocusedIdx && this.closeElement(p)
                        })
                    }, handleClick(d) {
                        const f = d.currentTarget;
                        this.elements.forEach((p, m) => {
                            p.contains(f) && d.target.nodeName !== "A" && (this.currFocusedIdx = m, this.closeElements(), this.focus(d, p), this.toggleElement(p))
                        })
                    }, handleKeydown(d) {
                        switch (d.key) {
                            case"ArrowUp":
                                return this.focusPrevElement(d);
                            case"ArrowDown":
                                return this.focusNextElement(d);
                            case"Home":
                                return this.focusFirstElement(d);
                            case"End":
                                return this.focusLastElement(d);
                            default:
                                return null
                        }
                    }, handleFocus(d) {
                        const f = d.currentTarget, p = this.elements.find(m => m.contains(f));
                        this.currFocusedIdx = this.elements.indexOf(p)
                    }, handleTransitionEnd(d) {
                        if (d.stopPropagation(), d.propertyName !== "height") return;
                        const {onOpen: f, onClose: p} = this.options, m = d.currentTarget, h = parseInt(m.style.height),
                            g = this.elements.find(y => y.contains(m));
                        h > 0 ? (m.style.height = "auto", f(g)) : p(g)
                    }
                };
                this.attachEvents = () => {
                    if (l) return;
                    const {triggerClass: d, panelClass: f} = c.options;
                    c.handleClick = c.handleClick.bind(c), c.handleKeydown = c.handleKeydown.bind(c), c.handleFocus = c.handleFocus.bind(c), c.handleTransitionEnd = c.handleTransitionEnd.bind(c), c.elements.forEach(p => {
                        const m = p.querySelector(u(d)), h = p.querySelector(u(f));
                        m.addEventListener("click", c.handleClick), m.addEventListener("keydown", c.handleKeydown), m.addEventListener("focus", c.handleFocus), h.addEventListener("transitionend", c.handleTransitionEnd)
                    }), l = !0
                }, this.detachEvents = () => {
                    if (!l) return;
                    const {triggerClass: d, panelClass: f} = c.options;
                    c.elements.forEach(p => {
                        const m = p.querySelector(u(d)), h = p.querySelector(u(f));
                        m.removeEventListener("click", c.handleClick), m.removeEventListener("keydown", c.handleKeydown), m.removeEventListener("focus", c.handleFocus), h.removeEventListener("transitionend", c.handleTransitionEnd)
                    }), l = !1
                }, this.toggle = d => {
                    const f = c.elements[d];
                    f && c.toggleElement(f)
                }, this.open = d => {
                    const f = c.elements[d];
                    f && c.showElement(f)
                }, this.openAll = () => {
                    const {activeClass: d, onOpen: f} = c.options;
                    c.elements.forEach(p => {
                        p.classList.contains(d) || (c.showElement(p, !1), f(p))
                    })
                }, this.close = d => {
                    const f = c.elements[d];
                    f && c.closeElement(f)
                }, this.closeAll = () => {
                    const {activeClass: d, onClose: f} = c.options;
                    c.elements.forEach(p => {
                        p.classList.contains(d) && (c.closeElement(p, !1), f(p))
                    })
                }, this.destroy = () => {
                    this.detachEvents(), this.openAll(), c.elements.forEach(d => {
                        c.removeIDs(d), c.removeARIA(d), c.setTransition(d, !0), d.classList.remove(o)
                    }), l = !0
                }, this.update = () => {
                    c.createDefinitions(), this.detachEvents(), this.attachEvents()
                };
                const u = d => ".".concat(CSS.escape(d));
                c.init()
            };
            s.exports !== void 0 ? s.exports = i : e.Accordion = i
        })(window)
    }(Ao)), Ao.exports
}

var Ip = Op();
const vs = Gu(Ip);
O.registerPlugin(B);

function Dp() {
    const s = document.querySelectorAll(".filterSidebar"), e = document.querySelectorAll(".filterSidebar__accordion"),
        t = document.querySelectorAll(".accommodationAccordion"), i = document.querySelectorAll(".itineraryAccordion"),
        r = document.querySelectorAll(".faqAccordion"), n = window.matchMedia("(max-width: 1199px)");
    s.forEach(o => {
        const a = new vs(o, {
            onOpen: function () {
                B.refresh()
            }, onClose: function () {
                B.refresh()
            }
        });
        n.matches ? a.closeAll() : a.openAll(), window.addEventListener("resize", () => {
            n.matches ? a.closeAll() : a.openAll()
        })
    }), e.forEach(o => {
        new vs(o, {
            openOnInit: [0], collapse: !1, onOpen: function () {
                B.refresh()
            }, onClose: function () {
                B.refresh()
            }
        })
    }), t.forEach(o => {
        new vs(o, {
            onOpen: function () {
                B.refresh()
            }, onClose: function () {
                B.refresh()
            }
        })
    }), i.forEach(o => {
        new vs(o, {
            openOnInit: [0], onOpen: function () {
                B.refresh()
            }, onClose: function () {
                B.refresh()
            }
        })
    }), r.forEach(o => {
        new vs(o, {
            onOpen: function () {
                B.refresh()
            }, onClose: function () {
                B.refresh()
            }
        })
    })
}

function tc(s) {
    return s !== null && typeof s == "object" && "constructor" in s && s.constructor === Object
}

function Ja(s, e) {
    s === void 0 && (s = {}), e === void 0 && (e = {});
    const t = ["__proto__", "constructor", "prototype"];
    Object.keys(e).filter(i => t.indexOf(i) < 0).forEach(i => {
        typeof s[i] > "u" ? s[i] = e[i] : tc(e[i]) && tc(s[i]) && Object.keys(e[i]).length > 0 && Ja(s[i], e[i])
    })
}

const Wu = {
    body: {}, addEventListener() {
    }, removeEventListener() {
    }, activeElement: {
        blur() {
        }, nodeName: ""
    }, querySelector() {
        return null
    }, querySelectorAll() {
        return []
    }, getElementById() {
        return null
    }, createEvent() {
        return {
            initEvent() {
            }
        }
    }, createElement() {
        return {
            children: [], childNodes: [], style: {}, setAttribute() {
            }, getElementsByTagName() {
                return []
            }
        }
    }, createElementNS() {
        return {}
    }, importNode() {
        return null
    }, location: {hash: "", host: "", hostname: "", href: "", origin: "", pathname: "", protocol: "", search: ""}
};

function pi() {
    const s = typeof document < "u" ? document : {};
    return Ja(s, Wu), s
}

const Rp = {
    document: Wu,
    navigator: {userAgent: ""},
    location: {hash: "", host: "", hostname: "", href: "", origin: "", pathname: "", protocol: "", search: ""},
    history: {
        replaceState() {
        }, pushState() {
        }, go() {
        }, back() {
        }
    },
    CustomEvent: function () {
        return this
    },
    addEventListener() {
    },
    removeEventListener() {
    },
    getComputedStyle() {
        return {
            getPropertyValue() {
                return ""
            }
        }
    },
    Image() {
    },
    Date() {
    },
    screen: {},
    setTimeout() {
    },
    clearTimeout() {
    },
    matchMedia() {
        return {}
    },
    requestAnimationFrame(s) {
        return typeof setTimeout > "u" ? (s(), null) : setTimeout(s, 0)
    },
    cancelAnimationFrame(s) {
        typeof setTimeout > "u" || clearTimeout(s)
    }
};

function pt() {
    const s = typeof window < "u" ? window : {};
    return Ja(s, Rp), s
}

function qp(s) {
    return s === void 0 && (s = ""), s.trim().split(" ").filter(e => !!e.trim())
}

function zp(s) {
    const e = s;
    Object.keys(e).forEach(t => {
        try {
            e[t] = null
        } catch {
        }
        try {
            delete e[t]
        } catch {
        }
    })
}

function jn(s, e) {
    return e === void 0 && (e = 0), setTimeout(s, e)
}

function br() {
    return Date.now()
}

function Bp(s) {
    const e = pt();
    let t;
    return e.getComputedStyle && (t = e.getComputedStyle(s, null)), !t && s.currentStyle && (t = s.currentStyle), t || (t = s.style), t
}

function Fp(s, e) {
    e === void 0 && (e = "x");
    const t = pt();
    let i, r, n;
    const o = Bp(s);
    return t.WebKitCSSMatrix ? (r = o.transform || o.webkitTransform, r.split(",").length > 6 && (r = r.split(", ").map(a => a.replace(",", ".")).join(", ")), n = new t.WebKitCSSMatrix(r === "none" ? "" : r)) : (n = o.MozTransform || o.OTransform || o.MsTransform || o.msTransform || o.transform || o.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,"), i = n.toString().split(",")), e === "x" && (t.WebKitCSSMatrix ? r = n.m41 : i.length === 16 ? r = parseFloat(i[12]) : r = parseFloat(i[4])), e === "y" && (t.WebKitCSSMatrix ? r = n.m42 : i.length === 16 ? r = parseFloat(i[13]) : r = parseFloat(i[5])), r || 0
}

function _n(s) {
    return typeof s == "object" && s !== null && s.constructor && Object.prototype.toString.call(s).slice(8, -1) === "Object"
}

function Vp(s) {
    return typeof window < "u" && typeof window.HTMLElement < "u" ? s instanceof HTMLElement : s && (s.nodeType === 1 || s.nodeType === 11)
}

function Lt() {
    const s = Object(arguments.length <= 0 ? void 0 : arguments[0]), e = ["__proto__", "constructor", "prototype"];
    for (let t = 1; t < arguments.length; t += 1) {
        const i = t < 0 || arguments.length <= t ? void 0 : arguments[t];
        if (i != null && !Vp(i)) {
            const r = Object.keys(Object(i)).filter(n => e.indexOf(n) < 0);
            for (let n = 0, o = r.length; n < o; n += 1) {
                const a = r[n], l = Object.getOwnPropertyDescriptor(i, a);
                l !== void 0 && l.enumerable && (_n(s[a]) && _n(i[a]) ? i[a].__swiper__ ? s[a] = i[a] : Lt(s[a], i[a]) : !_n(s[a]) && _n(i[a]) ? (s[a] = {}, i[a].__swiper__ ? s[a] = i[a] : Lt(s[a], i[a])) : s[a] = i[a])
            }
        }
    }
    return s
}

function yn(s, e, t) {
    s.style.setProperty(e, t)
}

function Yu(s) {
    let {swiper: e, targetPosition: t, side: i} = s;
    const r = pt(), n = -e.translate;
    let o = null, a;
    const l = e.params.speed;
    e.wrapperEl.style.scrollSnapType = "none", r.cancelAnimationFrame(e.cssModeFrameID);
    const c = t > n ? "next" : "prev", u = (f, p) => c === "next" && f >= p || c === "prev" && f <= p, d = () => {
        a = new Date().getTime(), o === null && (o = a);
        const f = Math.max(Math.min((a - o) / l, 1), 0), p = .5 - Math.cos(f * Math.PI) / 2;
        let m = n + p * (t - n);
        if (u(m, t) && (m = t), e.wrapperEl.scrollTo({[i]: m}), u(m, t)) {
            e.wrapperEl.style.overflow = "hidden", e.wrapperEl.style.scrollSnapType = "", setTimeout(() => {
                e.wrapperEl.style.overflow = "", e.wrapperEl.scrollTo({[i]: m})
            }), r.cancelAnimationFrame(e.cssModeFrameID);
            return
        }
        e.cssModeFrameID = r.requestAnimationFrame(d)
    };
    d()
}

function co(s) {
    return s.querySelector(".swiper-slide-transform") || s.shadowRoot && s.shadowRoot.querySelector(".swiper-slide-transform") || s
}

function Gt(s, e) {
    e === void 0 && (e = "");
    const t = pt(), i = [...s.children];
    return t.HTMLSlotElement && s instanceof HTMLSlotElement && i.push(...s.assignedElements()), e ? i.filter(r => r.matches(e)) : i
}

function Np(s, e) {
    const t = [e];
    for (; t.length > 0;) {
        const i = t.shift();
        if (s === i) return !0;
        t.push(...i.children, ...i.shadowRoot ? i.shadowRoot.children : [], ...i.assignedElements ? i.assignedElements() : [])
    }
}

function Hp(s, e) {
    const t = pt();
    let i = e.contains(s);
    return !i && t.HTMLSlotElement && e instanceof HTMLSlotElement && (i = [...e.assignedElements()].includes(s), i || (i = Np(s, e))), i
}

function Kn(s) {
    try {
        console.warn(s);
        return
    } catch {
    }
}

function Ks(s, e) {
    e === void 0 && (e = []);
    const t = document.createElement(s);
    return t.classList.add(...Array.isArray(e) ? e : qp(e)), t
}

function $p(s, e) {
    const t = [];
    for (; s.previousElementSibling;) {
        const i = s.previousElementSibling;
        e ? i.matches(e) && t.push(i) : t.push(i), s = i
    }
    return t
}

function Gp(s, e) {
    const t = [];
    for (; s.nextElementSibling;) {
        const i = s.nextElementSibling;
        e ? i.matches(e) && t.push(i) : t.push(i), s = i
    }
    return t
}

function Yi(s, e) {
    return pt().getComputedStyle(s, null).getPropertyValue(e)
}

function Qn(s) {
    let e = s, t;
    if (e) {
        for (t = 0; (e = e.previousSibling) !== null;) e.nodeType === 1 && (t += 1);
        return t
    }
}

function Xu(s, e) {
    const t = [];
    let i = s.parentElement;
    for (; i;) e ? i.matches(e) && t.push(i) : t.push(i), i = i.parentElement;
    return t
}

function Vs(s, e) {
    function t(i) {
        i.target === s && (e.call(s, i), s.removeEventListener("transitionend", t))
    }

    e && s.addEventListener("transitionend", t)
}

function ya(s, e, t) {
    const i = pt();
    return s[e === "width" ? "offsetWidth" : "offsetHeight"] + parseFloat(i.getComputedStyle(s, null).getPropertyValue(e === "width" ? "margin-right" : "margin-top")) + parseFloat(i.getComputedStyle(s, null).getPropertyValue(e === "width" ? "margin-left" : "margin-bottom"))
}

function Ve(s) {
    return (Array.isArray(s) ? s : [s]).filter(e => !!e)
}

function Wp(s) {
    return e => Math.abs(e) > 0 && s.browser && s.browser.need3dFix && Math.abs(e) % 90 === 0 ? e + .001 : e
}

function ic(s, e) {
    e === void 0 && (e = ""), typeof trustedTypes < "u" ? s.innerHTML = trustedTypes.createPolicy("html", {createHTML: t => t}).createHTML(e) : s.innerHTML = e
}

let ko;

function Yp() {
    const s = pt(), e = pi();
    return {
        smoothScroll: e.documentElement && e.documentElement.style && "scrollBehavior" in e.documentElement.style,
        touch: !!("ontouchstart" in s || s.DocumentTouch && e instanceof s.DocumentTouch)
    }
}

function Uu() {
    return ko || (ko = Yp()), ko
}

let Oo;

function Xp(s) {
    let {userAgent: e} = s === void 0 ? {} : s;
    const t = Uu(), i = pt(), r = i.navigator.platform, n = e || i.navigator.userAgent, o = {ios: !1, android: !1},
        a = i.screen.width, l = i.screen.height, c = n.match(/(Android);?[\s\/]+([\d.]+)?/);
    let u = n.match(/(iPad).*OS\s([\d_]+)/);
    const d = n.match(/(iPod)(.*OS\s([\d_]+))?/), f = !u && n.match(/(iPhone\sOS|iOS)\s([\d_]+)/), p = r === "Win32";
    let m = r === "MacIntel";
    const h = ["1024x1366", "1366x1024", "834x1194", "1194x834", "834x1112", "1112x834", "768x1024", "1024x768", "820x1180", "1180x820", "810x1080", "1080x810"];
    return !u && m && t.touch && h.indexOf(`${a}x${l}`) >= 0 && (u = n.match(/(Version)\/([\d.]+)/), u || (u = [0, 1, "13_0_0"]), m = !1), c && !p && (o.os = "android", o.android = !0), (u || f || d) && (o.os = "ios", o.ios = !0), o
}

function ju(s) {
    return s === void 0 && (s = {}), Oo || (Oo = Xp(s)), Oo
}

let Io;

function Up() {
    const s = pt(), e = ju();
    let t = !1;

    function i() {
        const a = s.navigator.userAgent.toLowerCase();
        return a.indexOf("safari") >= 0 && a.indexOf("chrome") < 0 && a.indexOf("android") < 0
    }

    if (i()) {
        const a = String(s.navigator.userAgent);
        if (a.includes("Version/")) {
            const [l, c] = a.split("Version/")[1].split(" ")[0].split(".").map(u => Number(u));
            t = l < 16 || l === 16 && c < 2
        }
    }
    const r = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(s.navigator.userAgent), n = i(), o = n || r && e.ios;
    return {isSafari: t || n, needPerspectiveFix: t, need3dFix: o, isWebView: r}
}

function Ku() {
    return Io || (Io = Up()), Io
}

function jp(s) {
    let {swiper: e, on: t, emit: i} = s;
    const r = pt();
    let n = null, o = null;
    const a = () => {
        !e || e.destroyed || !e.initialized || (i("beforeResize"), i("resize"))
    }, l = () => {
        !e || e.destroyed || !e.initialized || (n = new ResizeObserver(d => {
            o = r.requestAnimationFrame(() => {
                const {width: f, height: p} = e;
                let m = f, h = p;
                d.forEach(g => {
                    let {contentBoxSize: y, contentRect: v, target: _} = g;
                    _ && _ !== e.el || (m = v ? v.width : (y[0] || y).inlineSize, h = v ? v.height : (y[0] || y).blockSize)
                }), (m !== f || h !== p) && a()
            })
        }), n.observe(e.el))
    }, c = () => {
        o && r.cancelAnimationFrame(o), n && n.unobserve && e.el && (n.unobserve(e.el), n = null)
    }, u = () => {
        !e || e.destroyed || !e.initialized || i("orientationchange")
    };
    t("init", () => {
        if (e.params.resizeObserver && typeof r.ResizeObserver < "u") {
            l();
            return
        }
        r.addEventListener("resize", a), r.addEventListener("orientationchange", u)
    }), t("destroy", () => {
        c(), r.removeEventListener("resize", a), r.removeEventListener("orientationchange", u)
    })
}

function Kp(s) {
    let {swiper: e, extendParams: t, on: i, emit: r} = s;
    const n = [], o = pt(), a = function (u, d) {
        d === void 0 && (d = {});
        const f = o.MutationObserver || o.WebkitMutationObserver, p = new f(m => {
            if (e.__preventObserver__) return;
            if (m.length === 1) {
                r("observerUpdate", m[0]);
                return
            }
            const h = function () {
                r("observerUpdate", m[0])
            };
            o.requestAnimationFrame ? o.requestAnimationFrame(h) : o.setTimeout(h, 0)
        });
        p.observe(u, {
            attributes: typeof d.attributes > "u" ? !0 : d.attributes,
            childList: e.isElement || (typeof d.childList > "u" ? !0 : d).childList,
            characterData: typeof d.characterData > "u" ? !0 : d.characterData
        }), n.push(p)
    }, l = () => {
        if (e.params.observer) {
            if (e.params.observeParents) {
                const u = Xu(e.hostEl);
                for (let d = 0; d < u.length; d += 1) a(u[d])
            }
            a(e.hostEl, {childList: e.params.observeSlideChildren}), a(e.wrapperEl, {attributes: !1})
        }
    }, c = () => {
        n.forEach(u => {
            u.disconnect()
        }), n.splice(0, n.length)
    };
    t({observer: !1, observeParents: !1, observeSlideChildren: !1}), i("init", l), i("destroy", c)
}

var Qp = {
    on(s, e, t) {
        const i = this;
        if (!i.eventsListeners || i.destroyed || typeof e != "function") return i;
        const r = t ? "unshift" : "push";
        return s.split(" ").forEach(n => {
            i.eventsListeners[n] || (i.eventsListeners[n] = []), i.eventsListeners[n][r](e)
        }), i
    }, once(s, e, t) {
        const i = this;
        if (!i.eventsListeners || i.destroyed || typeof e != "function") return i;

        function r() {
            i.off(s, r), r.__emitterProxy && delete r.__emitterProxy;
            for (var n = arguments.length, o = new Array(n), a = 0; a < n; a++) o[a] = arguments[a];
            e.apply(i, o)
        }

        return r.__emitterProxy = e, i.on(s, r, t)
    }, onAny(s, e) {
        const t = this;
        if (!t.eventsListeners || t.destroyed || typeof s != "function") return t;
        const i = e ? "unshift" : "push";
        return t.eventsAnyListeners.indexOf(s) < 0 && t.eventsAnyListeners[i](s), t
    }, offAny(s) {
        const e = this;
        if (!e.eventsListeners || e.destroyed || !e.eventsAnyListeners) return e;
        const t = e.eventsAnyListeners.indexOf(s);
        return t >= 0 && e.eventsAnyListeners.splice(t, 1), e
    }, off(s, e) {
        const t = this;
        return !t.eventsListeners || t.destroyed || !t.eventsListeners || s.split(" ").forEach(i => {
            typeof e > "u" ? t.eventsListeners[i] = [] : t.eventsListeners[i] && t.eventsListeners[i].forEach((r, n) => {
                (r === e || r.__emitterProxy && r.__emitterProxy === e) && t.eventsListeners[i].splice(n, 1)
            })
        }), t
    }, emit() {
        const s = this;
        if (!s.eventsListeners || s.destroyed || !s.eventsListeners) return s;
        let e, t, i;
        for (var r = arguments.length, n = new Array(r), o = 0; o < r; o++) n[o] = arguments[o];
        return typeof n[0] == "string" || Array.isArray(n[0]) ? (e = n[0], t = n.slice(1, n.length), i = s) : (e = n[0].events, t = n[0].data, i = n[0].context || s), t.unshift(i), (Array.isArray(e) ? e : e.split(" ")).forEach(l => {
            s.eventsAnyListeners && s.eventsAnyListeners.length && s.eventsAnyListeners.forEach(c => {
                c.apply(i, [l, ...t])
            }), s.eventsListeners && s.eventsListeners[l] && s.eventsListeners[l].forEach(c => {
                c.apply(i, t)
            })
        }), s
    }
};

function Jp() {
    const s = this;
    let e, t;
    const i = s.el;
    typeof s.params.width < "u" && s.params.width !== null ? e = s.params.width : e = i.clientWidth, typeof s.params.height < "u" && s.params.height !== null ? t = s.params.height : t = i.clientHeight, !(e === 0 && s.isHorizontal() || t === 0 && s.isVertical()) && (e = e - parseInt(Yi(i, "padding-left") || 0, 10) - parseInt(Yi(i, "padding-right") || 0, 10), t = t - parseInt(Yi(i, "padding-top") || 0, 10) - parseInt(Yi(i, "padding-bottom") || 0, 10), Number.isNaN(e) && (e = 0), Number.isNaN(t) && (t = 0), Object.assign(s, {
        width: e,
        height: t,
        size: s.isHorizontal() ? e : t
    }))
}

function Zp() {
    const s = this;

    function e(E, A) {
        return parseFloat(E.getPropertyValue(s.getDirectionLabel(A)) || 0)
    }

    const t = s.params, {wrapperEl: i, slidesEl: r, size: n, rtlTranslate: o, wrongRTL: a} = s,
        l = s.virtual && t.virtual.enabled, c = l ? s.virtual.slides.length : s.slides.length,
        u = Gt(r, `.${s.params.slideClass}, swiper-slide`), d = l ? s.virtual.slides.length : u.length;
    let f = [];
    const p = [], m = [];
    let h = t.slidesOffsetBefore;
    typeof h == "function" && (h = t.slidesOffsetBefore.call(s));
    let g = t.slidesOffsetAfter;
    typeof g == "function" && (g = t.slidesOffsetAfter.call(s));
    const y = s.snapGrid.length, v = s.slidesGrid.length;
    let _ = t.spaceBetween, w = -h, b = 0, T = 0;
    if (typeof n > "u") return;
    typeof _ == "string" && _.indexOf("%") >= 0 ? _ = parseFloat(_.replace("%", "")) / 100 * n : typeof _ == "string" && (_ = parseFloat(_)), s.virtualSize = -_, u.forEach(E => {
        o ? E.style.marginLeft = "" : E.style.marginRight = "", E.style.marginBottom = "", E.style.marginTop = ""
    }), t.centeredSlides && t.cssMode && (yn(i, "--swiper-centered-offset-before", ""), yn(i, "--swiper-centered-offset-after", ""));
    const x = t.grid && t.grid.rows > 1 && s.grid;
    x ? s.grid.initSlides(u) : s.grid && s.grid.unsetSlides();
    let C;
    const P = t.slidesPerView === "auto" && t.breakpoints && Object.keys(t.breakpoints).filter(E => typeof t.breakpoints[E].slidesPerView < "u").length > 0;
    for (let E = 0; E < d; E += 1) {
        C = 0;
        let A;
        if (u[E] && (A = u[E]), x && s.grid.updateSlide(E, A, u), !(u[E] && Yi(A, "display") === "none")) {
            if (t.slidesPerView === "auto") {
                P && (u[E].style[s.getDirectionLabel("width")] = "");
                const L = getComputedStyle(A), k = A.style.transform, R = A.style.webkitTransform;
                if (k && (A.style.transform = "none"), R && (A.style.webkitTransform = "none"), t.roundLengths) C = s.isHorizontal() ? ya(A, "width") : ya(A, "height"); else {
                    const q = e(L, "width"), I = e(L, "padding-left"), z = e(L, "padding-right"),
                        D = e(L, "margin-left"), H = e(L, "margin-right"), S = L.getPropertyValue("box-sizing");
                    if (S && S === "border-box") C = q + D + H; else {
                        const {clientWidth: Y, offsetWidth: re} = A;
                        C = q + I + z + D + H + (re - Y)
                    }
                }
                k && (A.style.transform = k), R && (A.style.webkitTransform = R), t.roundLengths && (C = Math.floor(C))
            } else C = (n - (t.slidesPerView - 1) * _) / t.slidesPerView, t.roundLengths && (C = Math.floor(C)), u[E] && (u[E].style[s.getDirectionLabel("width")] = `${C}px`);
            u[E] && (u[E].swiperSlideSize = C), m.push(C), t.centeredSlides ? (w = w + C / 2 + b / 2 + _, b === 0 && E !== 0 && (w = w - n / 2 - _), E === 0 && (w = w - n / 2 - _), Math.abs(w) < 1 / 1e3 && (w = 0), t.roundLengths && (w = Math.floor(w)), T % t.slidesPerGroup === 0 && f.push(w), p.push(w)) : (t.roundLengths && (w = Math.floor(w)), (T - Math.min(s.params.slidesPerGroupSkip, T)) % s.params.slidesPerGroup === 0 && f.push(w), p.push(w), w = w + C + _), s.virtualSize += C + _, b = C, T += 1
        }
    }
    if (s.virtualSize = Math.max(s.virtualSize, n) + g, o && a && (t.effect === "slide" || t.effect === "coverflow") && (i.style.width = `${s.virtualSize + _}px`), t.setWrapperSize && (i.style[s.getDirectionLabel("width")] = `${s.virtualSize + _}px`), x && s.grid.updateWrapperSize(C, f), !t.centeredSlides) {
        const E = [];
        for (let A = 0; A < f.length; A += 1) {
            let L = f[A];
            t.roundLengths && (L = Math.floor(L)), f[A] <= s.virtualSize - n && E.push(L)
        }
        f = E, Math.floor(s.virtualSize - n) - Math.floor(f[f.length - 1]) > 1 && f.push(s.virtualSize - n)
    }
    if (l && t.loop) {
        const E = m[0] + _;
        if (t.slidesPerGroup > 1) {
            const A = Math.ceil((s.virtual.slidesBefore + s.virtual.slidesAfter) / t.slidesPerGroup),
                L = E * t.slidesPerGroup;
            for (let k = 0; k < A; k += 1) f.push(f[f.length - 1] + L)
        }
        for (let A = 0; A < s.virtual.slidesBefore + s.virtual.slidesAfter; A += 1) t.slidesPerGroup === 1 && f.push(f[f.length - 1] + E), p.push(p[p.length - 1] + E), s.virtualSize += E
    }
    if (f.length === 0 && (f = [0]), _ !== 0) {
        const E = s.isHorizontal() && o ? "marginLeft" : s.getDirectionLabel("marginRight");
        u.filter((A, L) => !t.cssMode || t.loop ? !0 : L !== u.length - 1).forEach(A => {
            A.style[E] = `${_}px`
        })
    }
    if (t.centeredSlides && t.centeredSlidesBounds) {
        let E = 0;
        m.forEach(L => {
            E += L + (_ || 0)
        }), E -= _;
        const A = E > n ? E - n : 0;
        f = f.map(L => L <= 0 ? -h : L > A ? A + g : L)
    }
    if (t.centerInsufficientSlides) {
        let E = 0;
        m.forEach(L => {
            E += L + (_ || 0)
        }), E -= _;
        const A = (t.slidesOffsetBefore || 0) + (t.slidesOffsetAfter || 0);
        if (E + A < n) {
            const L = (n - E - A) / 2;
            f.forEach((k, R) => {
                f[R] = k - L
            }), p.forEach((k, R) => {
                p[R] = k + L
            })
        }
    }
    if (Object.assign(s, {
        slides: u,
        snapGrid: f,
        slidesGrid: p,
        slidesSizesGrid: m
    }), t.centeredSlides && t.cssMode && !t.centeredSlidesBounds) {
        yn(i, "--swiper-centered-offset-before", `${-f[0]}px`), yn(i, "--swiper-centered-offset-after", `${s.size / 2 - m[m.length - 1] / 2}px`);
        const E = -s.snapGrid[0], A = -s.slidesGrid[0];
        s.snapGrid = s.snapGrid.map(L => L + E), s.slidesGrid = s.slidesGrid.map(L => L + A)
    }
    if (d !== c && s.emit("slidesLengthChange"), f.length !== y && (s.params.watchOverflow && s.checkOverflow(), s.emit("snapGridLengthChange")), p.length !== v && s.emit("slidesGridLengthChange"), t.watchSlidesProgress && s.updateSlidesOffset(), s.emit("slidesUpdated"), !l && !t.cssMode && (t.effect === "slide" || t.effect === "fade")) {
        const E = `${t.containerModifierClass}backface-hidden`, A = s.el.classList.contains(E);
        d <= t.maxBackfaceHiddenSlides ? A || s.el.classList.add(E) : A && s.el.classList.remove(E)
    }
}

function eh(s) {
    const e = this, t = [], i = e.virtual && e.params.virtual.enabled;
    let r = 0, n;
    typeof s == "number" ? e.setTransition(s) : s === !0 && e.setTransition(e.params.speed);
    const o = a => i ? e.slides[e.getSlideIndexByData(a)] : e.slides[a];
    if (e.params.slidesPerView !== "auto" && e.params.slidesPerView > 1) if (e.params.centeredSlides) (e.visibleSlides || []).forEach(a => {
        t.push(a)
    }); else for (n = 0; n < Math.ceil(e.params.slidesPerView); n += 1) {
        const a = e.activeIndex + n;
        if (a > e.slides.length && !i) break;
        t.push(o(a))
    } else t.push(o(e.activeIndex));
    for (n = 0; n < t.length; n += 1) if (typeof t[n] < "u") {
        const a = t[n].offsetHeight;
        r = a > r ? a : r
    }
    (r || r === 0) && (e.wrapperEl.style.height = `${r}px`)
}

function th() {
    const s = this, e = s.slides,
        t = s.isElement ? s.isHorizontal() ? s.wrapperEl.offsetLeft : s.wrapperEl.offsetTop : 0;
    for (let i = 0; i < e.length; i += 1) e[i].swiperSlideOffset = (s.isHorizontal() ? e[i].offsetLeft : e[i].offsetTop) - t - s.cssOverflowAdjustment()
}

const rc = (s, e, t) => {
    e && !s.classList.contains(t) ? s.classList.add(t) : !e && s.classList.contains(t) && s.classList.remove(t)
};

function ih(s) {
    s === void 0 && (s = this && this.translate || 0);
    const e = this, t = e.params, {slides: i, rtlTranslate: r, snapGrid: n} = e;
    if (i.length === 0) return;
    typeof i[0].swiperSlideOffset > "u" && e.updateSlidesOffset();
    let o = -s;
    r && (o = s), e.visibleSlidesIndexes = [], e.visibleSlides = [];
    let a = t.spaceBetween;
    typeof a == "string" && a.indexOf("%") >= 0 ? a = parseFloat(a.replace("%", "")) / 100 * e.size : typeof a == "string" && (a = parseFloat(a));
    for (let l = 0; l < i.length; l += 1) {
        const c = i[l];
        let u = c.swiperSlideOffset;
        t.cssMode && t.centeredSlides && (u -= i[0].swiperSlideOffset);
        const d = (o + (t.centeredSlides ? e.minTranslate() : 0) - u) / (c.swiperSlideSize + a),
            f = (o - n[0] + (t.centeredSlides ? e.minTranslate() : 0) - u) / (c.swiperSlideSize + a), p = -(o - u),
            m = p + e.slidesSizesGrid[l], h = p >= 0 && p <= e.size - e.slidesSizesGrid[l],
            g = p >= 0 && p < e.size - 1 || m > 1 && m <= e.size || p <= 0 && m >= e.size;
        g && (e.visibleSlides.push(c), e.visibleSlidesIndexes.push(l)), rc(c, g, t.slideVisibleClass), rc(c, h, t.slideFullyVisibleClass), c.progress = r ? -d : d, c.originalProgress = r ? -f : f
    }
}

function rh(s) {
    const e = this;
    if (typeof s > "u") {
        const u = e.rtlTranslate ? -1 : 1;
        s = e && e.translate && e.translate * u || 0
    }
    const t = e.params, i = e.maxTranslate() - e.minTranslate();
    let {progress: r, isBeginning: n, isEnd: o, progressLoop: a} = e;
    const l = n, c = o;
    if (i === 0) r = 0, n = !0, o = !0; else {
        r = (s - e.minTranslate()) / i;
        const u = Math.abs(s - e.minTranslate()) < 1, d = Math.abs(s - e.maxTranslate()) < 1;
        n = u || r <= 0, o = d || r >= 1, u && (r = 0), d && (r = 1)
    }
    if (t.loop) {
        const u = e.getSlideIndexByData(0), d = e.getSlideIndexByData(e.slides.length - 1), f = e.slidesGrid[u],
            p = e.slidesGrid[d], m = e.slidesGrid[e.slidesGrid.length - 1], h = Math.abs(s);
        h >= f ? a = (h - f) / m : a = (h + m - p) / m, a > 1 && (a -= 1)
    }
    Object.assign(e, {
        progress: r,
        progressLoop: a,
        isBeginning: n,
        isEnd: o
    }), (t.watchSlidesProgress || t.centeredSlides && t.autoHeight) && e.updateSlidesProgress(s), n && !l && e.emit("reachBeginning toEdge"), o && !c && e.emit("reachEnd toEdge"), (l && !n || c && !o) && e.emit("fromEdge"), e.emit("progress", r)
}

const Do = (s, e, t) => {
    e && !s.classList.contains(t) ? s.classList.add(t) : !e && s.classList.contains(t) && s.classList.remove(t)
};

function sh() {
    const s = this, {slides: e, params: t, slidesEl: i, activeIndex: r} = s, n = s.virtual && t.virtual.enabled,
        o = s.grid && t.grid && t.grid.rows > 1, a = d => Gt(i, `.${t.slideClass}${d}, swiper-slide${d}`)[0];
    let l, c, u;
    if (n) if (t.loop) {
        let d = r - s.virtual.slidesBefore;
        d < 0 && (d = s.virtual.slides.length + d), d >= s.virtual.slides.length && (d -= s.virtual.slides.length), l = a(`[data-swiper-slide-index="${d}"]`)
    } else l = a(`[data-swiper-slide-index="${r}"]`); else o ? (l = e.find(d => d.column === r), u = e.find(d => d.column === r + 1), c = e.find(d => d.column === r - 1)) : l = e[r];
    l && (o || (u = Gp(l, `.${t.slideClass}, swiper-slide`)[0], t.loop && !u && (u = e[0]), c = $p(l, `.${t.slideClass}, swiper-slide`)[0], t.loop && !c === 0 && (c = e[e.length - 1]))), e.forEach(d => {
        Do(d, d === l, t.slideActiveClass), Do(d, d === u, t.slideNextClass), Do(d, d === c, t.slidePrevClass)
    }), s.emitSlidesClasses()
}

const On = (s, e) => {
    if (!s || s.destroyed || !s.params) return;
    const t = () => s.isElement ? "swiper-slide" : `.${s.params.slideClass}`, i = e.closest(t());
    if (i) {
        let r = i.querySelector(`.${s.params.lazyPreloaderClass}`);
        !r && s.isElement && (i.shadowRoot ? r = i.shadowRoot.querySelector(`.${s.params.lazyPreloaderClass}`) : requestAnimationFrame(() => {
            i.shadowRoot && (r = i.shadowRoot.querySelector(`.${s.params.lazyPreloaderClass}`), r && r.remove())
        })), r && r.remove()
    }
}, Ro = (s, e) => {
    if (!s.slides[e]) return;
    const t = s.slides[e].querySelector('[loading="lazy"]');
    t && t.removeAttribute("loading")
}, wa = s => {
    if (!s || s.destroyed || !s.params) return;
    let e = s.params.lazyPreloadPrevNext;
    const t = s.slides.length;
    if (!t || !e || e < 0) return;
    e = Math.min(e, t);
    const i = s.params.slidesPerView === "auto" ? s.slidesPerViewDynamic() : Math.ceil(s.params.slidesPerView),
        r = s.activeIndex;
    if (s.params.grid && s.params.grid.rows > 1) {
        const o = r, a = [o - e];
        a.push(...Array.from({length: e}).map((l, c) => o + i + c)), s.slides.forEach((l, c) => {
            a.includes(l.column) && Ro(s, c)
        });
        return
    }
    const n = r + i - 1;
    if (s.params.rewind || s.params.loop) for (let o = r - e; o <= n + e; o += 1) {
        const a = (o % t + t) % t;
        (a < r || a > n) && Ro(s, a)
    } else for (let o = Math.max(r - e, 0); o <= Math.min(n + e, t - 1); o += 1) o !== r && (o > n || o < r) && Ro(s, o)
};

function nh(s) {
    const {slidesGrid: e, params: t} = s, i = s.rtlTranslate ? s.translate : -s.translate;
    let r;
    for (let n = 0; n < e.length; n += 1) typeof e[n + 1] < "u" ? i >= e[n] && i < e[n + 1] - (e[n + 1] - e[n]) / 2 ? r = n : i >= e[n] && i < e[n + 1] && (r = n + 1) : i >= e[n] && (r = n);
    return t.normalizeSlideIndex && (r < 0 || typeof r > "u") && (r = 0), r
}

function oh(s) {
    const e = this, t = e.rtlTranslate ? e.translate : -e.translate, {
        snapGrid: i,
        params: r,
        activeIndex: n,
        realIndex: o,
        snapIndex: a
    } = e;
    let l = s, c;
    const u = p => {
        let m = p - e.virtual.slidesBefore;
        return m < 0 && (m = e.virtual.slides.length + m), m >= e.virtual.slides.length && (m -= e.virtual.slides.length), m
    };
    if (typeof l > "u" && (l = nh(e)), i.indexOf(t) >= 0) c = i.indexOf(t); else {
        const p = Math.min(r.slidesPerGroupSkip, l);
        c = p + Math.floor((l - p) / r.slidesPerGroup)
    }
    if (c >= i.length && (c = i.length - 1), l === n && !e.params.loop) {
        c !== a && (e.snapIndex = c, e.emit("snapIndexChange"));
        return
    }
    if (l === n && e.params.loop && e.virtual && e.params.virtual.enabled) {
        e.realIndex = u(l);
        return
    }
    const d = e.grid && r.grid && r.grid.rows > 1;
    let f;
    if (e.virtual && r.virtual.enabled && r.loop) f = u(l); else if (d) {
        const p = e.slides.find(h => h.column === l);
        let m = parseInt(p.getAttribute("data-swiper-slide-index"), 10);
        Number.isNaN(m) && (m = Math.max(e.slides.indexOf(p), 0)), f = Math.floor(m / r.grid.rows)
    } else if (e.slides[l]) {
        const p = e.slides[l].getAttribute("data-swiper-slide-index");
        p ? f = parseInt(p, 10) : f = l
    } else f = l;
    Object.assign(e, {
        previousSnapIndex: a,
        snapIndex: c,
        previousRealIndex: o,
        realIndex: f,
        previousIndex: n,
        activeIndex: l
    }), e.initialized && wa(e), e.emit("activeIndexChange"), e.emit("snapIndexChange"), (e.initialized || e.params.runCallbacksOnInit) && (o !== f && e.emit("realIndexChange"), e.emit("slideChange"))
}

function ah(s, e) {
    const t = this, i = t.params;
    let r = s.closest(`.${i.slideClass}, swiper-slide`);
    !r && t.isElement && e && e.length > 1 && e.includes(s) && [...e.slice(e.indexOf(s) + 1, e.length)].forEach(a => {
        !r && a.matches && a.matches(`.${i.slideClass}, swiper-slide`) && (r = a)
    });
    let n = !1, o;
    if (r) {
        for (let a = 0; a < t.slides.length; a += 1) if (t.slides[a] === r) {
            n = !0, o = a;
            break
        }
    }
    if (r && n) t.clickedSlide = r, t.virtual && t.params.virtual.enabled ? t.clickedIndex = parseInt(r.getAttribute("data-swiper-slide-index"), 10) : t.clickedIndex = o; else {
        t.clickedSlide = void 0, t.clickedIndex = void 0;
        return
    }
    i.slideToClickedSlide && t.clickedIndex !== void 0 && t.clickedIndex !== t.activeIndex && t.slideToClickedSlide()
}

var lh = {
    updateSize: Jp,
    updateSlides: Zp,
    updateAutoHeight: eh,
    updateSlidesOffset: th,
    updateSlidesProgress: ih,
    updateProgress: rh,
    updateSlidesClasses: sh,
    updateActiveIndex: oh,
    updateClickedSlide: ah
};

function ch(s) {
    s === void 0 && (s = this.isHorizontal() ? "x" : "y");
    const e = this, {params: t, rtlTranslate: i, translate: r, wrapperEl: n} = e;
    if (t.virtualTranslate) return i ? -r : r;
    if (t.cssMode) return r;
    let o = Fp(n, s);
    return o += e.cssOverflowAdjustment(), i && (o = -o), o || 0
}

function uh(s, e) {
    const t = this, {rtlTranslate: i, params: r, wrapperEl: n, progress: o} = t;
    let a = 0, l = 0;
    const c = 0;
    t.isHorizontal() ? a = i ? -s : s : l = s, r.roundLengths && (a = Math.floor(a), l = Math.floor(l)), t.previousTranslate = t.translate, t.translate = t.isHorizontal() ? a : l, r.cssMode ? n[t.isHorizontal() ? "scrollLeft" : "scrollTop"] = t.isHorizontal() ? -a : -l : r.virtualTranslate || (t.isHorizontal() ? a -= t.cssOverflowAdjustment() : l -= t.cssOverflowAdjustment(), n.style.transform = `translate3d(${a}px, ${l}px, ${c}px)`);
    let u;
    const d = t.maxTranslate() - t.minTranslate();
    d === 0 ? u = 0 : u = (s - t.minTranslate()) / d, u !== o && t.updateProgress(s), t.emit("setTranslate", t.translate, e)
}

function dh() {
    return -this.snapGrid[0]
}

function fh() {
    return -this.snapGrid[this.snapGrid.length - 1]
}

function ph(s, e, t, i, r) {
    s === void 0 && (s = 0), e === void 0 && (e = this.params.speed), t === void 0 && (t = !0), i === void 0 && (i = !0);
    const n = this, {params: o, wrapperEl: a} = n;
    if (n.animating && o.preventInteractionOnTransition) return !1;
    const l = n.minTranslate(), c = n.maxTranslate();
    let u;
    if (i && s > l ? u = l : i && s < c ? u = c : u = s, n.updateProgress(u), o.cssMode) {
        const d = n.isHorizontal();
        if (e === 0) a[d ? "scrollLeft" : "scrollTop"] = -u; else {
            if (!n.support.smoothScroll) return Yu({swiper: n, targetPosition: -u, side: d ? "left" : "top"}), !0;
            a.scrollTo({[d ? "left" : "top"]: -u, behavior: "smooth"})
        }
        return !0
    }
    return e === 0 ? (n.setTransition(0), n.setTranslate(u), t && (n.emit("beforeTransitionStart", e, r), n.emit("transitionEnd"))) : (n.setTransition(e), n.setTranslate(u), t && (n.emit("beforeTransitionStart", e, r), n.emit("transitionStart")), n.animating || (n.animating = !0, n.onTranslateToWrapperTransitionEnd || (n.onTranslateToWrapperTransitionEnd = function (f) {
        !n || n.destroyed || f.target === this && (n.wrapperEl.removeEventListener("transitionend", n.onTranslateToWrapperTransitionEnd), n.onTranslateToWrapperTransitionEnd = null, delete n.onTranslateToWrapperTransitionEnd, n.animating = !1, t && n.emit("transitionEnd"))
    }), n.wrapperEl.addEventListener("transitionend", n.onTranslateToWrapperTransitionEnd))), !0
}

var hh = {getTranslate: ch, setTranslate: uh, minTranslate: dh, maxTranslate: fh, translateTo: ph};

function mh(s, e) {
    const t = this;
    t.params.cssMode || (t.wrapperEl.style.transitionDuration = `${s}ms`, t.wrapperEl.style.transitionDelay = s === 0 ? "0ms" : ""), t.emit("setTransition", s, e)
}

function Qu(s) {
    let {swiper: e, runCallbacks: t, direction: i, step: r} = s;
    const {activeIndex: n, previousIndex: o} = e;
    let a = i;
    a || (n > o ? a = "next" : n < o ? a = "prev" : a = "reset"), e.emit(`transition${r}`), t && a === "reset" ? e.emit(`slideResetTransition${r}`) : t && n !== o && (e.emit(`slideChangeTransition${r}`), a === "next" ? e.emit(`slideNextTransition${r}`) : e.emit(`slidePrevTransition${r}`))
}

function gh(s, e) {
    s === void 0 && (s = !0);
    const t = this, {params: i} = t;
    i.cssMode || (i.autoHeight && t.updateAutoHeight(), Qu({swiper: t, runCallbacks: s, direction: e, step: "Start"}))
}

function vh(s, e) {
    s === void 0 && (s = !0);
    const t = this, {params: i} = t;
    t.animating = !1, !i.cssMode && (t.setTransition(0), Qu({swiper: t, runCallbacks: s, direction: e, step: "End"}))
}

var _h = {setTransition: mh, transitionStart: gh, transitionEnd: vh};

function yh(s, e, t, i, r) {
    s === void 0 && (s = 0), t === void 0 && (t = !0), typeof s == "string" && (s = parseInt(s, 10));
    const n = this;
    let o = s;
    o < 0 && (o = 0);
    const {
        params: a,
        snapGrid: l,
        slidesGrid: c,
        previousIndex: u,
        activeIndex: d,
        rtlTranslate: f,
        wrapperEl: p,
        enabled: m
    } = n;
    if (!m && !i && !r || n.destroyed || n.animating && a.preventInteractionOnTransition) return !1;
    typeof e > "u" && (e = n.params.speed);
    const h = Math.min(n.params.slidesPerGroupSkip, o);
    let g = h + Math.floor((o - h) / n.params.slidesPerGroup);
    g >= l.length && (g = l.length - 1);
    const y = -l[g];
    if (a.normalizeSlideIndex) for (let x = 0; x < c.length; x += 1) {
        const C = -Math.floor(y * 100), P = Math.floor(c[x] * 100), E = Math.floor(c[x + 1] * 100);
        typeof c[x + 1] < "u" ? C >= P && C < E - (E - P) / 2 ? o = x : C >= P && C < E && (o = x + 1) : C >= P && (o = x)
    }
    if (n.initialized && o !== d && (!n.allowSlideNext && (f ? y > n.translate && y > n.minTranslate() : y < n.translate && y < n.minTranslate()) || !n.allowSlidePrev && y > n.translate && y > n.maxTranslate() && (d || 0) !== o)) return !1;
    o !== (u || 0) && t && n.emit("beforeSlideChangeStart"), n.updateProgress(y);
    let v;
    o > d ? v = "next" : o < d ? v = "prev" : v = "reset";
    const _ = n.virtual && n.params.virtual.enabled;
    if (!(_ && r) && (f && -y === n.translate || !f && y === n.translate)) return n.updateActiveIndex(o), a.autoHeight && n.updateAutoHeight(), n.updateSlidesClasses(), a.effect !== "slide" && n.setTranslate(y), v !== "reset" && (n.transitionStart(t, v), n.transitionEnd(t, v)), !1;
    if (a.cssMode) {
        const x = n.isHorizontal(), C = f ? y : -y;
        if (e === 0) _ && (n.wrapperEl.style.scrollSnapType = "none", n._immediateVirtual = !0), _ && !n._cssModeVirtualInitialSet && n.params.initialSlide > 0 ? (n._cssModeVirtualInitialSet = !0, requestAnimationFrame(() => {
            p[x ? "scrollLeft" : "scrollTop"] = C
        })) : p[x ? "scrollLeft" : "scrollTop"] = C, _ && requestAnimationFrame(() => {
            n.wrapperEl.style.scrollSnapType = "", n._immediateVirtual = !1
        }); else {
            if (!n.support.smoothScroll) return Yu({swiper: n, targetPosition: C, side: x ? "left" : "top"}), !0;
            p.scrollTo({[x ? "left" : "top"]: C, behavior: "smooth"})
        }
        return !0
    }
    const T = Ku().isSafari;
    return _ && !r && T && n.isElement && n.virtual.update(!1, !1, o), n.setTransition(e), n.setTranslate(y), n.updateActiveIndex(o), n.updateSlidesClasses(), n.emit("beforeTransitionStart", e, i), n.transitionStart(t, v), e === 0 ? n.transitionEnd(t, v) : n.animating || (n.animating = !0, n.onSlideToWrapperTransitionEnd || (n.onSlideToWrapperTransitionEnd = function (C) {
        !n || n.destroyed || C.target === this && (n.wrapperEl.removeEventListener("transitionend", n.onSlideToWrapperTransitionEnd), n.onSlideToWrapperTransitionEnd = null, delete n.onSlideToWrapperTransitionEnd, n.transitionEnd(t, v))
    }), n.wrapperEl.addEventListener("transitionend", n.onSlideToWrapperTransitionEnd)), !0
}

function wh(s, e, t, i) {
    s === void 0 && (s = 0), t === void 0 && (t = !0), typeof s == "string" && (s = parseInt(s, 10));
    const r = this;
    if (r.destroyed) return;
    typeof e > "u" && (e = r.params.speed);
    const n = r.grid && r.params.grid && r.params.grid.rows > 1;
    let o = s;
    if (r.params.loop) if (r.virtual && r.params.virtual.enabled) o = o + r.virtual.slidesBefore; else {
        let a;
        if (n) {
            const f = o * r.params.grid.rows;
            a = r.slides.find(p => p.getAttribute("data-swiper-slide-index") * 1 === f).column
        } else a = r.getSlideIndexByData(o);
        const l = n ? Math.ceil(r.slides.length / r.params.grid.rows) : r.slides.length, {centeredSlides: c} = r.params;
        let u = r.params.slidesPerView;
        u === "auto" ? u = r.slidesPerViewDynamic() : (u = Math.ceil(parseFloat(r.params.slidesPerView, 10)), c && u % 2 === 0 && (u = u + 1));
        let d = l - a < u;
        if (c && (d = d || a < Math.ceil(u / 2)), i && c && r.params.slidesPerView !== "auto" && !n && (d = !1), d) {
            const f = c ? a < r.activeIndex ? "prev" : "next" : a - r.activeIndex - 1 < r.params.slidesPerView ? "next" : "prev";
            r.loopFix({
                direction: f,
                slideTo: !0,
                activeSlideIndex: f === "next" ? a + 1 : a - l + 1,
                slideRealIndex: f === "next" ? r.realIndex : void 0
            })
        }
        if (n) {
            const f = o * r.params.grid.rows;
            o = r.slides.find(p => p.getAttribute("data-swiper-slide-index") * 1 === f).column
        } else o = r.getSlideIndexByData(o)
    }
    return requestAnimationFrame(() => {
        r.slideTo(o, e, t, i)
    }), r
}

function bh(s, e, t) {
    e === void 0 && (e = !0);
    const i = this, {enabled: r, params: n, animating: o} = i;
    if (!r || i.destroyed) return i;
    typeof s > "u" && (s = i.params.speed);
    let a = n.slidesPerGroup;
    n.slidesPerView === "auto" && n.slidesPerGroup === 1 && n.slidesPerGroupAuto && (a = Math.max(i.slidesPerViewDynamic("current", !0), 1));
    const l = i.activeIndex < n.slidesPerGroupSkip ? 1 : a, c = i.virtual && n.virtual.enabled;
    if (n.loop) {
        if (o && !c && n.loopPreventsSliding) return !1;
        if (i.loopFix({direction: "next"}), i._clientLeft = i.wrapperEl.clientLeft, i.activeIndex === i.slides.length - 1 && n.cssMode) return requestAnimationFrame(() => {
            i.slideTo(i.activeIndex + l, s, e, t)
        }), !0
    }
    return n.rewind && i.isEnd ? i.slideTo(0, s, e, t) : i.slideTo(i.activeIndex + l, s, e, t)
}

function Sh(s, e, t) {
    e === void 0 && (e = !0);
    const i = this, {params: r, snapGrid: n, slidesGrid: o, rtlTranslate: a, enabled: l, animating: c} = i;
    if (!l || i.destroyed) return i;
    typeof s > "u" && (s = i.params.speed);
    const u = i.virtual && r.virtual.enabled;
    if (r.loop) {
        if (c && !u && r.loopPreventsSliding) return !1;
        i.loopFix({direction: "prev"}), i._clientLeft = i.wrapperEl.clientLeft
    }
    const d = a ? i.translate : -i.translate;

    function f(v) {
        return v < 0 ? -Math.floor(Math.abs(v)) : Math.floor(v)
    }

    const p = f(d), m = n.map(v => f(v)), h = r.freeMode && r.freeMode.enabled;
    let g = n[m.indexOf(p) - 1];
    if (typeof g > "u" && (r.cssMode || h)) {
        let v;
        n.forEach((_, w) => {
            p >= _ && (v = w)
        }), typeof v < "u" && (g = h ? n[v] : n[v > 0 ? v - 1 : v])
    }
    let y = 0;
    if (typeof g < "u" && (y = o.indexOf(g), y < 0 && (y = i.activeIndex - 1), r.slidesPerView === "auto" && r.slidesPerGroup === 1 && r.slidesPerGroupAuto && (y = y - i.slidesPerViewDynamic("previous", !0) + 1, y = Math.max(y, 0))), r.rewind && i.isBeginning) {
        const v = i.params.virtual && i.params.virtual.enabled && i.virtual ? i.virtual.slides.length - 1 : i.slides.length - 1;
        return i.slideTo(v, s, e, t)
    } else if (r.loop && i.activeIndex === 0 && r.cssMode) return requestAnimationFrame(() => {
        i.slideTo(y, s, e, t)
    }), !0;
    return i.slideTo(y, s, e, t)
}

function xh(s, e, t) {
    e === void 0 && (e = !0);
    const i = this;
    if (!i.destroyed) return typeof s > "u" && (s = i.params.speed), i.slideTo(i.activeIndex, s, e, t)
}

function Th(s, e, t, i) {
    e === void 0 && (e = !0), i === void 0 && (i = .5);
    const r = this;
    if (r.destroyed) return;
    typeof s > "u" && (s = r.params.speed);
    let n = r.activeIndex;
    const o = Math.min(r.params.slidesPerGroupSkip, n), a = o + Math.floor((n - o) / r.params.slidesPerGroup),
        l = r.rtlTranslate ? r.translate : -r.translate;
    if (l >= r.snapGrid[a]) {
        const c = r.snapGrid[a], u = r.snapGrid[a + 1];
        l - c > (u - c) * i && (n += r.params.slidesPerGroup)
    } else {
        const c = r.snapGrid[a - 1], u = r.snapGrid[a];
        l - c <= (u - c) * i && (n -= r.params.slidesPerGroup)
    }
    return n = Math.max(n, 0), n = Math.min(n, r.slidesGrid.length - 1), r.slideTo(n, s, e, t)
}

function Eh() {
    const s = this;
    if (s.destroyed) return;
    const {params: e, slidesEl: t} = s, i = e.slidesPerView === "auto" ? s.slidesPerViewDynamic() : e.slidesPerView;
    let r = s.clickedIndex, n;
    const o = s.isElement ? "swiper-slide" : `.${e.slideClass}`;
    if (e.loop) {
        if (s.animating) return;
        n = parseInt(s.clickedSlide.getAttribute("data-swiper-slide-index"), 10), e.centeredSlides ? r < s.loopedSlides - i / 2 || r > s.slides.length - s.loopedSlides + i / 2 ? (s.loopFix(), r = s.getSlideIndex(Gt(t, `${o}[data-swiper-slide-index="${n}"]`)[0]), jn(() => {
            s.slideTo(r)
        })) : s.slideTo(r) : r > s.slides.length - i ? (s.loopFix(), r = s.getSlideIndex(Gt(t, `${o}[data-swiper-slide-index="${n}"]`)[0]), jn(() => {
            s.slideTo(r)
        })) : s.slideTo(r)
    } else s.slideTo(r)
}

var Ch = {
    slideTo: yh,
    slideToLoop: wh,
    slideNext: bh,
    slidePrev: Sh,
    slideReset: xh,
    slideToClosest: Th,
    slideToClickedSlide: Eh
};

function Ph(s, e) {
    const t = this, {params: i, slidesEl: r} = t;
    if (!i.loop || t.virtual && t.params.virtual.enabled) return;
    const n = () => {
            Gt(r, `.${i.slideClass}, swiper-slide`).forEach((f, p) => {
                f.setAttribute("data-swiper-slide-index", p)
            })
        }, o = t.grid && i.grid && i.grid.rows > 1, a = i.slidesPerGroup * (o ? i.grid.rows : 1),
        l = t.slides.length % a !== 0, c = o && t.slides.length % i.grid.rows !== 0, u = d => {
            for (let f = 0; f < d; f += 1) {
                const p = t.isElement ? Ks("swiper-slide", [i.slideBlankClass]) : Ks("div", [i.slideClass, i.slideBlankClass]);
                t.slidesEl.append(p)
            }
        };
    if (l) {
        if (i.loopAddBlankSlides) {
            const d = a - t.slides.length % a;
            u(d), t.recalcSlides(), t.updateSlides()
        } else Kn("Swiper Loop Warning: The number of slides is not even to slidesPerGroup, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)");
        n()
    } else if (c) {
        if (i.loopAddBlankSlides) {
            const d = i.grid.rows - t.slides.length % i.grid.rows;
            u(d), t.recalcSlides(), t.updateSlides()
        } else Kn("Swiper Loop Warning: The number of slides is not even to grid.rows, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)");
        n()
    } else n();
    t.loopFix({slideRealIndex: s, direction: i.centeredSlides ? void 0 : "next", initial: e})
}

function Lh(s) {
    let {
        slideRealIndex: e,
        slideTo: t = !0,
        direction: i,
        setTranslate: r,
        activeSlideIndex: n,
        initial: o,
        byController: a,
        byMousewheel: l
    } = s === void 0 ? {} : s;
    const c = this;
    if (!c.params.loop) return;
    c.emit("beforeLoopFix");
    const {slides: u, allowSlidePrev: d, allowSlideNext: f, slidesEl: p, params: m} = c, {
        centeredSlides: h,
        initialSlide: g
    } = m;
    if (c.allowSlidePrev = !0, c.allowSlideNext = !0, c.virtual && m.virtual.enabled) {
        t && (!m.centeredSlides && c.snapIndex === 0 ? c.slideTo(c.virtual.slides.length, 0, !1, !0) : m.centeredSlides && c.snapIndex < m.slidesPerView ? c.slideTo(c.virtual.slides.length + c.snapIndex, 0, !1, !0) : c.snapIndex === c.snapGrid.length - 1 && c.slideTo(c.virtual.slidesBefore, 0, !1, !0)), c.allowSlidePrev = d, c.allowSlideNext = f, c.emit("loopFix");
        return
    }
    let y = m.slidesPerView;
    y === "auto" ? y = c.slidesPerViewDynamic() : (y = Math.ceil(parseFloat(m.slidesPerView, 10)), h && y % 2 === 0 && (y = y + 1));
    const v = m.slidesPerGroupAuto ? y : m.slidesPerGroup;
    let _ = v;
    _ % v !== 0 && (_ += v - _ % v), _ += m.loopAdditionalSlides, c.loopedSlides = _;
    const w = c.grid && m.grid && m.grid.rows > 1;
    u.length < y + _ || c.params.effect === "cards" && u.length < y + _ * 2 ? Kn("Swiper Loop Warning: The number of slides is not enough for loop mode, it will be disabled or not function properly. You need to add more slides (or make duplicates) or lower the values of slidesPerView and slidesPerGroup parameters") : w && m.grid.fill === "row" && Kn("Swiper Loop Warning: Loop mode is not compatible with grid.fill = `row`");
    const b = [], T = [], x = w ? Math.ceil(u.length / m.grid.rows) : u.length, C = o && x - g < y && !h;
    let P = C ? g : c.activeIndex;
    typeof n > "u" ? n = c.getSlideIndex(u.find(I => I.classList.contains(m.slideActiveClass))) : P = n;
    const E = i === "next" || !i, A = i === "prev" || !i;
    let L = 0, k = 0;
    const q = (w ? u[n].column : n) + (h && typeof r > "u" ? -y / 2 + .5 : 0);
    if (q < _) {
        L = Math.max(_ - q, v);
        for (let I = 0; I < _ - q; I += 1) {
            const z = I - Math.floor(I / x) * x;
            if (w) {
                const D = x - z - 1;
                for (let H = u.length - 1; H >= 0; H -= 1) u[H].column === D && b.push(H)
            } else b.push(x - z - 1)
        }
    } else if (q + y > x - _) {
        k = Math.max(q - (x - _ * 2), v), C && (k = Math.max(k, y - x + g + 1));
        for (let I = 0; I < k; I += 1) {
            const z = I - Math.floor(I / x) * x;
            w ? u.forEach((D, H) => {
                D.column === z && T.push(H)
            }) : T.push(z)
        }
    }
    if (c.__preventObserver__ = !0, requestAnimationFrame(() => {
        c.__preventObserver__ = !1
    }), c.params.effect === "cards" && u.length < y + _ * 2 && (T.includes(n) && T.splice(T.indexOf(n), 1), b.includes(n) && b.splice(b.indexOf(n), 1)), A && b.forEach(I => {
        u[I].swiperLoopMoveDOM = !0, p.prepend(u[I]), u[I].swiperLoopMoveDOM = !1
    }), E && T.forEach(I => {
        u[I].swiperLoopMoveDOM = !0, p.append(u[I]), u[I].swiperLoopMoveDOM = !1
    }), c.recalcSlides(), m.slidesPerView === "auto" ? c.updateSlides() : w && (b.length > 0 && A || T.length > 0 && E) && c.slides.forEach((I, z) => {
        c.grid.updateSlide(z, I, c.slides)
    }), m.watchSlidesProgress && c.updateSlidesOffset(), t) {
        if (b.length > 0 && A) {
            if (typeof e > "u") {
                const I = c.slidesGrid[P], D = c.slidesGrid[P + L] - I;
                l ? c.setTranslate(c.translate - D) : (c.slideTo(P + Math.ceil(L), 0, !1, !0), r && (c.touchEventsData.startTranslate = c.touchEventsData.startTranslate - D, c.touchEventsData.currentTranslate = c.touchEventsData.currentTranslate - D))
            } else if (r) {
                const I = w ? b.length / m.grid.rows : b.length;
                c.slideTo(c.activeIndex + I, 0, !1, !0), c.touchEventsData.currentTranslate = c.translate
            }
        } else if (T.length > 0 && E) if (typeof e > "u") {
            const I = c.slidesGrid[P], D = c.slidesGrid[P - k] - I;
            l ? c.setTranslate(c.translate - D) : (c.slideTo(P - k, 0, !1, !0), r && (c.touchEventsData.startTranslate = c.touchEventsData.startTranslate - D, c.touchEventsData.currentTranslate = c.touchEventsData.currentTranslate - D))
        } else {
            const I = w ? T.length / m.grid.rows : T.length;
            c.slideTo(c.activeIndex - I, 0, !1, !0)
        }
    }
    if (c.allowSlidePrev = d, c.allowSlideNext = f, c.controller && c.controller.control && !a) {
        const I = {slideRealIndex: e, direction: i, setTranslate: r, activeSlideIndex: n, byController: !0};
        Array.isArray(c.controller.control) ? c.controller.control.forEach(z => {
            !z.destroyed && z.params.loop && z.loopFix({
                ...I,
                slideTo: z.params.slidesPerView === m.slidesPerView ? t : !1
            })
        }) : c.controller.control instanceof c.constructor && c.controller.control.params.loop && c.controller.control.loopFix({
            ...I,
            slideTo: c.controller.control.params.slidesPerView === m.slidesPerView ? t : !1
        })
    }
    c.emit("loopFix")
}

function Mh() {
    const s = this, {params: e, slidesEl: t} = s;
    if (!e.loop || !t || s.virtual && s.params.virtual.enabled) return;
    s.recalcSlides();
    const i = [];
    s.slides.forEach(r => {
        const n = typeof r.swiperSlideIndex > "u" ? r.getAttribute("data-swiper-slide-index") * 1 : r.swiperSlideIndex;
        i[n] = r
    }), s.slides.forEach(r => {
        r.removeAttribute("data-swiper-slide-index")
    }), i.forEach(r => {
        t.append(r)
    }), s.recalcSlides(), s.slideTo(s.realIndex, 0)
}

var Ah = {loopCreate: Ph, loopFix: Lh, loopDestroy: Mh};

function kh(s) {
    const e = this;
    if (!e.params.simulateTouch || e.params.watchOverflow && e.isLocked || e.params.cssMode) return;
    const t = e.params.touchEventsTarget === "container" ? e.el : e.wrapperEl;
    e.isElement && (e.__preventObserver__ = !0), t.style.cursor = "move", t.style.cursor = s ? "grabbing" : "grab", e.isElement && requestAnimationFrame(() => {
        e.__preventObserver__ = !1
    })
}

function Oh() {
    const s = this;
    s.params.watchOverflow && s.isLocked || s.params.cssMode || (s.isElement && (s.__preventObserver__ = !0), s[s.params.touchEventsTarget === "container" ? "el" : "wrapperEl"].style.cursor = "", s.isElement && requestAnimationFrame(() => {
        s.__preventObserver__ = !1
    }))
}

var Ih = {setGrabCursor: kh, unsetGrabCursor: Oh};

function Dh(s, e) {
    e === void 0 && (e = this);

    function t(i) {
        if (!i || i === pi() || i === pt()) return null;
        i.assignedSlot && (i = i.assignedSlot);
        const r = i.closest(s);
        return !r && !i.getRootNode ? null : r || t(i.getRootNode().host)
    }

    return t(e)
}

function sc(s, e, t) {
    const i = pt(), {params: r} = s, n = r.edgeSwipeDetection, o = r.edgeSwipeThreshold;
    return n && (t <= o || t >= i.innerWidth - o) ? n === "prevent" ? (e.preventDefault(), !0) : !1 : !0
}

function Rh(s) {
    const e = this, t = pi();
    let i = s;
    i.originalEvent && (i = i.originalEvent);
    const r = e.touchEventsData;
    if (i.type === "pointerdown") {
        if (r.pointerId !== null && r.pointerId !== i.pointerId) return;
        r.pointerId = i.pointerId
    } else i.type === "touchstart" && i.targetTouches.length === 1 && (r.touchId = i.targetTouches[0].identifier);
    if (i.type === "touchstart") {
        sc(e, i, i.targetTouches[0].pageX);
        return
    }
    const {params: n, touches: o, enabled: a} = e;
    if (!a || !n.simulateTouch && i.pointerType === "mouse" || e.animating && n.preventInteractionOnTransition) return;
    !e.animating && n.cssMode && n.loop && e.loopFix();
    let l = i.target;
    if (n.touchEventsTarget === "wrapper" && !Hp(l, e.wrapperEl) || "which" in i && i.which === 3 || "button" in i && i.button > 0 || r.isTouched && r.isMoved) return;
    const c = !!n.noSwipingClass && n.noSwipingClass !== "", u = i.composedPath ? i.composedPath() : i.path;
    c && i.target && i.target.shadowRoot && u && (l = u[0]);
    const d = n.noSwipingSelector ? n.noSwipingSelector : `.${n.noSwipingClass}`,
        f = !!(i.target && i.target.shadowRoot);
    if (n.noSwiping && (f ? Dh(d, l) : l.closest(d))) {
        e.allowClick = !0;
        return
    }
    if (n.swipeHandler && !l.closest(n.swipeHandler)) return;
    o.currentX = i.pageX, o.currentY = i.pageY;
    const p = o.currentX, m = o.currentY;
    if (!sc(e, i, p)) return;
    Object.assign(r, {
        isTouched: !0,
        isMoved: !1,
        allowTouchCallbacks: !0,
        isScrolling: void 0,
        startMoving: void 0
    }), o.startX = p, o.startY = m, r.touchStartTime = br(), e.allowClick = !0, e.updateSize(), e.swipeDirection = void 0, n.threshold > 0 && (r.allowThresholdMove = !1);
    let h = !0;
    l.matches(r.focusableElements) && (h = !1, l.nodeName === "SELECT" && (r.isTouched = !1)), t.activeElement && t.activeElement.matches(r.focusableElements) && t.activeElement !== l && (i.pointerType === "mouse" || i.pointerType !== "mouse" && !l.matches(r.focusableElements)) && t.activeElement.blur();
    const g = h && e.allowTouchMove && n.touchStartPreventDefault;
    (n.touchStartForcePreventDefault || g) && !l.isContentEditable && i.preventDefault(), n.freeMode && n.freeMode.enabled && e.freeMode && e.animating && !n.cssMode && e.freeMode.onTouchStart(), e.emit("touchStart", i)
}

function qh(s) {
    const e = pi(), t = this, i = t.touchEventsData, {params: r, touches: n, rtlTranslate: o, enabled: a} = t;
    if (!a || !r.simulateTouch && s.pointerType === "mouse") return;
    let l = s;
    if (l.originalEvent && (l = l.originalEvent), l.type === "pointermove" && (i.touchId !== null || l.pointerId !== i.pointerId)) return;
    let c;
    if (l.type === "touchmove") {
        if (c = [...l.changedTouches].find(b => b.identifier === i.touchId), !c || c.identifier !== i.touchId) return
    } else c = l;
    if (!i.isTouched) {
        i.startMoving && i.isScrolling && t.emit("touchMoveOpposite", l);
        return
    }
    const u = c.pageX, d = c.pageY;
    if (l.preventedByNestedSwiper) {
        n.startX = u, n.startY = d;
        return
    }
    if (!t.allowTouchMove) {
        l.target.matches(i.focusableElements) || (t.allowClick = !1), i.isTouched && (Object.assign(n, {
            startX: u,
            startY: d,
            currentX: u,
            currentY: d
        }), i.touchStartTime = br());
        return
    }
    if (r.touchReleaseOnEdges && !r.loop) if (t.isVertical()) {
        if (d < n.startY && t.translate <= t.maxTranslate() || d > n.startY && t.translate >= t.minTranslate()) {
            i.isTouched = !1, i.isMoved = !1;
            return
        }
    } else {
        if (o && (u > n.startX && -t.translate <= t.maxTranslate() || u < n.startX && -t.translate >= t.minTranslate())) return;
        if (!o && (u < n.startX && t.translate <= t.maxTranslate() || u > n.startX && t.translate >= t.minTranslate())) return
    }
    if (e.activeElement && e.activeElement.matches(i.focusableElements) && e.activeElement !== l.target && l.pointerType !== "mouse" && e.activeElement.blur(), e.activeElement && l.target === e.activeElement && l.target.matches(i.focusableElements)) {
        i.isMoved = !0, t.allowClick = !1;
        return
    }
    i.allowTouchCallbacks && t.emit("touchMove", l), n.previousX = n.currentX, n.previousY = n.currentY, n.currentX = u, n.currentY = d;
    const f = n.currentX - n.startX, p = n.currentY - n.startY;
    if (t.params.threshold && Math.sqrt(f ** 2 + p ** 2) < t.params.threshold) return;
    if (typeof i.isScrolling > "u") {
        let b;
        t.isHorizontal() && n.currentY === n.startY || t.isVertical() && n.currentX === n.startX ? i.isScrolling = !1 : f * f + p * p >= 25 && (b = Math.atan2(Math.abs(p), Math.abs(f)) * 180 / Math.PI, i.isScrolling = t.isHorizontal() ? b > r.touchAngle : 90 - b > r.touchAngle)
    }
    if (i.isScrolling && t.emit("touchMoveOpposite", l), typeof i.startMoving > "u" && (n.currentX !== n.startX || n.currentY !== n.startY) && (i.startMoving = !0), i.isScrolling || l.type === "touchmove" && i.preventTouchMoveFromPointerMove) {
        i.isTouched = !1;
        return
    }
    if (!i.startMoving) return;
    t.allowClick = !1, !r.cssMode && l.cancelable && l.preventDefault(), r.touchMoveStopPropagation && !r.nested && l.stopPropagation();
    let m = t.isHorizontal() ? f : p, h = t.isHorizontal() ? n.currentX - n.previousX : n.currentY - n.previousY;
    r.oneWayMovement && (m = Math.abs(m) * (o ? 1 : -1), h = Math.abs(h) * (o ? 1 : -1)), n.diff = m, m *= r.touchRatio, o && (m = -m, h = -h);
    const g = t.touchesDirection;
    t.swipeDirection = m > 0 ? "prev" : "next", t.touchesDirection = h > 0 ? "prev" : "next";
    const y = t.params.loop && !r.cssMode,
        v = t.touchesDirection === "next" && t.allowSlideNext || t.touchesDirection === "prev" && t.allowSlidePrev;
    if (!i.isMoved) {
        if (y && v && t.loopFix({direction: t.swipeDirection}), i.startTranslate = t.getTranslate(), t.setTransition(0), t.animating) {
            const b = new window.CustomEvent("transitionend", {
                bubbles: !0,
                cancelable: !0,
                detail: {bySwiperTouchMove: !0}
            });
            t.wrapperEl.dispatchEvent(b)
        }
        i.allowMomentumBounce = !1, r.grabCursor && (t.allowSlideNext === !0 || t.allowSlidePrev === !0) && t.setGrabCursor(!0), t.emit("sliderFirstMove", l)
    }
    if (new Date().getTime(), r._loopSwapReset !== !1 && i.isMoved && i.allowThresholdMove && g !== t.touchesDirection && y && v && Math.abs(m) >= 1) {
        Object.assign(n, {
            startX: u,
            startY: d,
            currentX: u,
            currentY: d,
            startTranslate: i.currentTranslate
        }), i.loopSwapReset = !0, i.startTranslate = i.currentTranslate;
        return
    }
    t.emit("sliderMove", l), i.isMoved = !0, i.currentTranslate = m + i.startTranslate;
    let _ = !0, w = r.resistanceRatio;
    if (r.touchReleaseOnEdges && (w = 0), m > 0 ? (y && v && i.allowThresholdMove && i.currentTranslate > (r.centeredSlides ? t.minTranslate() - t.slidesSizesGrid[t.activeIndex + 1] - (r.slidesPerView !== "auto" && t.slides.length - r.slidesPerView >= 2 ? t.slidesSizesGrid[t.activeIndex + 1] + t.params.spaceBetween : 0) - t.params.spaceBetween : t.minTranslate()) && t.loopFix({
        direction: "prev",
        setTranslate: !0,
        activeSlideIndex: 0
    }), i.currentTranslate > t.minTranslate() && (_ = !1, r.resistance && (i.currentTranslate = t.minTranslate() - 1 + (-t.minTranslate() + i.startTranslate + m) ** w))) : m < 0 && (y && v && i.allowThresholdMove && i.currentTranslate < (r.centeredSlides ? t.maxTranslate() + t.slidesSizesGrid[t.slidesSizesGrid.length - 1] + t.params.spaceBetween + (r.slidesPerView !== "auto" && t.slides.length - r.slidesPerView >= 2 ? t.slidesSizesGrid[t.slidesSizesGrid.length - 1] + t.params.spaceBetween : 0) : t.maxTranslate()) && t.loopFix({
        direction: "next",
        setTranslate: !0,
        activeSlideIndex: t.slides.length - (r.slidesPerView === "auto" ? t.slidesPerViewDynamic() : Math.ceil(parseFloat(r.slidesPerView, 10)))
    }), i.currentTranslate < t.maxTranslate() && (_ = !1, r.resistance && (i.currentTranslate = t.maxTranslate() + 1 - (t.maxTranslate() - i.startTranslate - m) ** w))), _ && (l.preventedByNestedSwiper = !0), !t.allowSlideNext && t.swipeDirection === "next" && i.currentTranslate < i.startTranslate && (i.currentTranslate = i.startTranslate), !t.allowSlidePrev && t.swipeDirection === "prev" && i.currentTranslate > i.startTranslate && (i.currentTranslate = i.startTranslate), !t.allowSlidePrev && !t.allowSlideNext && (i.currentTranslate = i.startTranslate), r.threshold > 0) if (Math.abs(m) > r.threshold || i.allowThresholdMove) {
        if (!i.allowThresholdMove) {
            i.allowThresholdMove = !0, n.startX = n.currentX, n.startY = n.currentY, i.currentTranslate = i.startTranslate, n.diff = t.isHorizontal() ? n.currentX - n.startX : n.currentY - n.startY;
            return
        }
    } else {
        i.currentTranslate = i.startTranslate;
        return
    }
    !r.followFinger || r.cssMode || ((r.freeMode && r.freeMode.enabled && t.freeMode || r.watchSlidesProgress) && (t.updateActiveIndex(), t.updateSlidesClasses()), r.freeMode && r.freeMode.enabled && t.freeMode && t.freeMode.onTouchMove(), t.updateProgress(i.currentTranslate), t.setTranslate(i.currentTranslate))
}

function zh(s) {
    const e = this, t = e.touchEventsData;
    let i = s;
    i.originalEvent && (i = i.originalEvent);
    let r;
    if (i.type === "touchend" || i.type === "touchcancel") {
        if (r = [...i.changedTouches].find(b => b.identifier === t.touchId), !r || r.identifier !== t.touchId) return
    } else {
        if (t.touchId !== null || i.pointerId !== t.pointerId) return;
        r = i
    }
    if (["pointercancel", "pointerout", "pointerleave", "contextmenu"].includes(i.type) && !(["pointercancel", "contextmenu"].includes(i.type) && (e.browser.isSafari || e.browser.isWebView))) return;
    t.pointerId = null, t.touchId = null;
    const {params: o, touches: a, rtlTranslate: l, slidesGrid: c, enabled: u} = e;
    if (!u || !o.simulateTouch && i.pointerType === "mouse") return;
    if (t.allowTouchCallbacks && e.emit("touchEnd", i), t.allowTouchCallbacks = !1, !t.isTouched) {
        t.isMoved && o.grabCursor && e.setGrabCursor(!1), t.isMoved = !1, t.startMoving = !1;
        return
    }
    o.grabCursor && t.isMoved && t.isTouched && (e.allowSlideNext === !0 || e.allowSlidePrev === !0) && e.setGrabCursor(!1);
    const d = br(), f = d - t.touchStartTime;
    if (e.allowClick) {
        const b = i.path || i.composedPath && i.composedPath();
        e.updateClickedSlide(b && b[0] || i.target, b), e.emit("tap click", i), f < 300 && d - t.lastClickTime < 300 && e.emit("doubleTap doubleClick", i)
    }
    if (t.lastClickTime = br(), jn(() => {
        e.destroyed || (e.allowClick = !0)
    }), !t.isTouched || !t.isMoved || !e.swipeDirection || a.diff === 0 && !t.loopSwapReset || t.currentTranslate === t.startTranslate && !t.loopSwapReset) {
        t.isTouched = !1, t.isMoved = !1, t.startMoving = !1;
        return
    }
    t.isTouched = !1, t.isMoved = !1, t.startMoving = !1;
    let p;
    if (o.followFinger ? p = l ? e.translate : -e.translate : p = -t.currentTranslate, o.cssMode) return;
    if (o.freeMode && o.freeMode.enabled) {
        e.freeMode.onTouchEnd({currentPos: p});
        return
    }
    const m = p >= -e.maxTranslate() && !e.params.loop;
    let h = 0, g = e.slidesSizesGrid[0];
    for (let b = 0; b < c.length; b += b < o.slidesPerGroupSkip ? 1 : o.slidesPerGroup) {
        const T = b < o.slidesPerGroupSkip - 1 ? 1 : o.slidesPerGroup;
        typeof c[b + T] < "u" ? (m || p >= c[b] && p < c[b + T]) && (h = b, g = c[b + T] - c[b]) : (m || p >= c[b]) && (h = b, g = c[c.length - 1] - c[c.length - 2])
    }
    let y = null, v = null;
    o.rewind && (e.isBeginning ? v = o.virtual && o.virtual.enabled && e.virtual ? e.virtual.slides.length - 1 : e.slides.length - 1 : e.isEnd && (y = 0));
    const _ = (p - c[h]) / g, w = h < o.slidesPerGroupSkip - 1 ? 1 : o.slidesPerGroup;
    if (f > o.longSwipesMs) {
        if (!o.longSwipes) {
            e.slideTo(e.activeIndex);
            return
        }
        e.swipeDirection === "next" && (_ >= o.longSwipesRatio ? e.slideTo(o.rewind && e.isEnd ? y : h + w) : e.slideTo(h)), e.swipeDirection === "prev" && (_ > 1 - o.longSwipesRatio ? e.slideTo(h + w) : v !== null && _ < 0 && Math.abs(_) > o.longSwipesRatio ? e.slideTo(v) : e.slideTo(h))
    } else {
        if (!o.shortSwipes) {
            e.slideTo(e.activeIndex);
            return
        }
        e.navigation && (i.target === e.navigation.nextEl || i.target === e.navigation.prevEl) ? i.target === e.navigation.nextEl ? e.slideTo(h + w) : e.slideTo(h) : (e.swipeDirection === "next" && e.slideTo(y !== null ? y : h + w), e.swipeDirection === "prev" && e.slideTo(v !== null ? v : h))
    }
}

function nc() {
    const s = this, {params: e, el: t} = s;
    if (t && t.offsetWidth === 0) return;
    e.breakpoints && s.setBreakpoint();
    const {allowSlideNext: i, allowSlidePrev: r, snapGrid: n} = s, o = s.virtual && s.params.virtual.enabled;
    s.allowSlideNext = !0, s.allowSlidePrev = !0, s.updateSize(), s.updateSlides(), s.updateSlidesClasses();
    const a = o && e.loop;
    (e.slidesPerView === "auto" || e.slidesPerView > 1) && s.isEnd && !s.isBeginning && !s.params.centeredSlides && !a ? s.slideTo(s.slides.length - 1, 0, !1, !0) : s.params.loop && !o ? s.slideToLoop(s.realIndex, 0, !1, !0) : s.slideTo(s.activeIndex, 0, !1, !0), s.autoplay && s.autoplay.running && s.autoplay.paused && (clearTimeout(s.autoplay.resizeTimeout), s.autoplay.resizeTimeout = setTimeout(() => {
        s.autoplay && s.autoplay.running && s.autoplay.paused && s.autoplay.resume()
    }, 500)), s.allowSlidePrev = r, s.allowSlideNext = i, s.params.watchOverflow && n !== s.snapGrid && s.checkOverflow()
}

function Bh(s) {
    const e = this;
    e.enabled && (e.allowClick || (e.params.preventClicks && s.preventDefault(), e.params.preventClicksPropagation && e.animating && (s.stopPropagation(), s.stopImmediatePropagation())))
}

function Fh() {
    const s = this, {wrapperEl: e, rtlTranslate: t, enabled: i} = s;
    if (!i) return;
    s.previousTranslate = s.translate, s.isHorizontal() ? s.translate = -e.scrollLeft : s.translate = -e.scrollTop, s.translate === 0 && (s.translate = 0), s.updateActiveIndex(), s.updateSlidesClasses();
    let r;
    const n = s.maxTranslate() - s.minTranslate();
    n === 0 ? r = 0 : r = (s.translate - s.minTranslate()) / n, r !== s.progress && s.updateProgress(t ? -s.translate : s.translate), s.emit("setTranslate", s.translate, !1)
}

function Vh(s) {
    const e = this;
    On(e, s.target), !(e.params.cssMode || e.params.slidesPerView !== "auto" && !e.params.autoHeight) && e.update()
}

function Nh() {
    const s = this;
    s.documentTouchHandlerProceeded || (s.documentTouchHandlerProceeded = !0, s.params.touchReleaseOnEdges && (s.el.style.touchAction = "auto"))
}

const Ju = (s, e) => {
    const t = pi(), {params: i, el: r, wrapperEl: n, device: o} = s, a = !!i.nested,
        l = e === "on" ? "addEventListener" : "removeEventListener", c = e;
    !r || typeof r == "string" || (t[l]("touchstart", s.onDocumentTouchStart, {
        passive: !1,
        capture: a
    }), r[l]("touchstart", s.onTouchStart, {passive: !1}), r[l]("pointerdown", s.onTouchStart, {passive: !1}), t[l]("touchmove", s.onTouchMove, {
        passive: !1,
        capture: a
    }), t[l]("pointermove", s.onTouchMove, {
        passive: !1,
        capture: a
    }), t[l]("touchend", s.onTouchEnd, {passive: !0}), t[l]("pointerup", s.onTouchEnd, {passive: !0}), t[l]("pointercancel", s.onTouchEnd, {passive: !0}), t[l]("touchcancel", s.onTouchEnd, {passive: !0}), t[l]("pointerout", s.onTouchEnd, {passive: !0}), t[l]("pointerleave", s.onTouchEnd, {passive: !0}), t[l]("contextmenu", s.onTouchEnd, {passive: !0}), (i.preventClicks || i.preventClicksPropagation) && r[l]("click", s.onClick, !0), i.cssMode && n[l]("scroll", s.onScroll), i.updateOnWindowResize ? s[c](o.ios || o.android ? "resize orientationchange observerUpdate" : "resize observerUpdate", nc, !0) : s[c]("observerUpdate", nc, !0), r[l]("load", s.onLoad, {capture: !0}))
};

function Hh() {
    const s = this, {params: e} = s;
    s.onTouchStart = Rh.bind(s), s.onTouchMove = qh.bind(s), s.onTouchEnd = zh.bind(s), s.onDocumentTouchStart = Nh.bind(s), e.cssMode && (s.onScroll = Fh.bind(s)), s.onClick = Bh.bind(s), s.onLoad = Vh.bind(s), Ju(s, "on")
}

function $h() {
    Ju(this, "off")
}

var Gh = {attachEvents: Hh, detachEvents: $h};
const oc = (s, e) => s.grid && e.grid && e.grid.rows > 1;

function Wh() {
    const s = this, {realIndex: e, initialized: t, params: i, el: r} = s, n = i.breakpoints;
    if (!n || n && Object.keys(n).length === 0) return;
    const o = pi(), a = i.breakpointsBase === "window" || !i.breakpointsBase ? i.breakpointsBase : "container",
        l = ["window", "container"].includes(i.breakpointsBase) || !i.breakpointsBase ? s.el : o.querySelector(i.breakpointsBase),
        c = s.getBreakpoint(n, a, l);
    if (!c || s.currentBreakpoint === c) return;
    const d = (c in n ? n[c] : void 0) || s.originalParams, f = oc(s, i), p = oc(s, d), m = s.params.grabCursor,
        h = d.grabCursor, g = i.enabled;
    f && !p ? (r.classList.remove(`${i.containerModifierClass}grid`, `${i.containerModifierClass}grid-column`), s.emitContainerClasses()) : !f && p && (r.classList.add(`${i.containerModifierClass}grid`), (d.grid.fill && d.grid.fill === "column" || !d.grid.fill && i.grid.fill === "column") && r.classList.add(`${i.containerModifierClass}grid-column`), s.emitContainerClasses()), m && !h ? s.unsetGrabCursor() : !m && h && s.setGrabCursor(), ["navigation", "pagination", "scrollbar"].forEach(T => {
        if (typeof d[T] > "u") return;
        const x = i[T] && i[T].enabled, C = d[T] && d[T].enabled;
        x && !C && s[T].disable(), !x && C && s[T].enable()
    });
    const y = d.direction && d.direction !== i.direction, v = i.loop && (d.slidesPerView !== i.slidesPerView || y),
        _ = i.loop;
    y && t && s.changeDirection(), Lt(s.params, d);
    const w = s.params.enabled, b = s.params.loop;
    Object.assign(s, {
        allowTouchMove: s.params.allowTouchMove,
        allowSlideNext: s.params.allowSlideNext,
        allowSlidePrev: s.params.allowSlidePrev
    }), g && !w ? s.disable() : !g && w && s.enable(), s.currentBreakpoint = c, s.emit("_beforeBreakpoint", d), t && (v ? (s.loopDestroy(), s.loopCreate(e), s.updateSlides()) : !_ && b ? (s.loopCreate(e), s.updateSlides()) : _ && !b && s.loopDestroy()), s.emit("breakpoint", d)
}

function Yh(s, e, t) {
    if (e === void 0 && (e = "window"), !s || e === "container" && !t) return;
    let i = !1;
    const r = pt(), n = e === "window" ? r.innerHeight : t.clientHeight, o = Object.keys(s).map(a => {
        if (typeof a == "string" && a.indexOf("@") === 0) {
            const l = parseFloat(a.substr(1));
            return {value: n * l, point: a}
        }
        return {value: a, point: a}
    });
    o.sort((a, l) => parseInt(a.value, 10) - parseInt(l.value, 10));
    for (let a = 0; a < o.length; a += 1) {
        const {point: l, value: c} = o[a];
        e === "window" ? r.matchMedia(`(min-width: ${c}px)`).matches && (i = l) : c <= t.clientWidth && (i = l)
    }
    return i || "max"
}

var Xh = {setBreakpoint: Wh, getBreakpoint: Yh};

function Uh(s, e) {
    const t = [];
    return s.forEach(i => {
        typeof i == "object" ? Object.keys(i).forEach(r => {
            i[r] && t.push(e + r)
        }) : typeof i == "string" && t.push(e + i)
    }), t
}

function jh() {
    const s = this, {classNames: e, params: t, rtl: i, el: r, device: n} = s,
        o = Uh(["initialized", t.direction, {"free-mode": s.params.freeMode && t.freeMode.enabled}, {autoheight: t.autoHeight}, {rtl: i}, {grid: t.grid && t.grid.rows > 1}, {"grid-column": t.grid && t.grid.rows > 1 && t.grid.fill === "column"}, {android: n.android}, {ios: n.ios}, {"css-mode": t.cssMode}, {centered: t.cssMode && t.centeredSlides}, {"watch-progress": t.watchSlidesProgress}], t.containerModifierClass);
    e.push(...o), r.classList.add(...e), s.emitContainerClasses()
}

function Kh() {
    const s = this, {el: e, classNames: t} = s;
    !e || typeof e == "string" || (e.classList.remove(...t), s.emitContainerClasses())
}

var Qh = {addClasses: jh, removeClasses: Kh};

function Jh() {
    const s = this, {isLocked: e, params: t} = s, {slidesOffsetBefore: i} = t;
    if (i) {
        const r = s.slides.length - 1, n = s.slidesGrid[r] + s.slidesSizesGrid[r] + i * 2;
        s.isLocked = s.size > n
    } else s.isLocked = s.snapGrid.length === 1;
    t.allowSlideNext === !0 && (s.allowSlideNext = !s.isLocked), t.allowSlidePrev === !0 && (s.allowSlidePrev = !s.isLocked), e && e !== s.isLocked && (s.isEnd = !1), e !== s.isLocked && s.emit(s.isLocked ? "lock" : "unlock")
}

var Zh = {checkOverflow: Jh}, ac = {
    init: !0,
    direction: "horizontal",
    oneWayMovement: !1,
    swiperElementNodeName: "SWIPER-CONTAINER",
    touchEventsTarget: "wrapper",
    initialSlide: 0,
    speed: 300,
    cssMode: !1,
    updateOnWindowResize: !0,
    resizeObserver: !0,
    nested: !1,
    createElements: !1,
    eventsPrefix: "swiper",
    enabled: !0,
    focusableElements: "input, select, option, textarea, button, video, label",
    width: null,
    height: null,
    preventInteractionOnTransition: !1,
    userAgent: null,
    url: null,
    edgeSwipeDetection: !1,
    edgeSwipeThreshold: 20,
    autoHeight: !1,
    setWrapperSize: !1,
    virtualTranslate: !1,
    effect: "slide",
    breakpoints: void 0,
    breakpointsBase: "window",
    spaceBetween: 0,
    slidesPerView: 1,
    slidesPerGroup: 1,
    slidesPerGroupSkip: 0,
    slidesPerGroupAuto: !1,
    centeredSlides: !1,
    centeredSlidesBounds: !1,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
    normalizeSlideIndex: !0,
    centerInsufficientSlides: !1,
    watchOverflow: !0,
    roundLengths: !1,
    touchRatio: 1,
    touchAngle: 45,
    simulateTouch: !0,
    shortSwipes: !0,
    longSwipes: !0,
    longSwipesRatio: .5,
    longSwipesMs: 300,
    followFinger: !0,
    allowTouchMove: !0,
    threshold: 5,
    touchMoveStopPropagation: !1,
    touchStartPreventDefault: !0,
    touchStartForcePreventDefault: !1,
    touchReleaseOnEdges: !1,
    uniqueNavElements: !0,
    resistance: !0,
    resistanceRatio: .85,
    watchSlidesProgress: !1,
    grabCursor: !1,
    preventClicks: !0,
    preventClicksPropagation: !0,
    slideToClickedSlide: !1,
    loop: !1,
    loopAddBlankSlides: !0,
    loopAdditionalSlides: 0,
    loopPreventsSliding: !0,
    rewind: !1,
    allowSlidePrev: !0,
    allowSlideNext: !0,
    swipeHandler: null,
    noSwiping: !0,
    noSwipingClass: "swiper-no-swiping",
    noSwipingSelector: null,
    passiveListeners: !0,
    maxBackfaceHiddenSlides: 10,
    containerModifierClass: "swiper-",
    slideClass: "swiper-slide",
    slideBlankClass: "swiper-slide-blank",
    slideActiveClass: "swiper-slide-active",
    slideVisibleClass: "swiper-slide-visible",
    slideFullyVisibleClass: "swiper-slide-fully-visible",
    slideNextClass: "swiper-slide-next",
    slidePrevClass: "swiper-slide-prev",
    wrapperClass: "swiper-wrapper",
    lazyPreloaderClass: "swiper-lazy-preloader",
    lazyPreloadPrevNext: 0,
    runCallbacksOnInit: !0,
    _emitClasses: !1
};

function em(s, e) {
    return function (i) {
        i === void 0 && (i = {});
        const r = Object.keys(i)[0], n = i[r];
        if (typeof n != "object" || n === null) {
            Lt(e, i);
            return
        }
        if (s[r] === !0 && (s[r] = {enabled: !0}), r === "navigation" && s[r] && s[r].enabled && !s[r].prevEl && !s[r].nextEl && (s[r].auto = !0), ["pagination", "scrollbar"].indexOf(r) >= 0 && s[r] && s[r].enabled && !s[r].el && (s[r].auto = !0), !(r in s && "enabled" in n)) {
            Lt(e, i);
            return
        }
        typeof s[r] == "object" && !("enabled" in s[r]) && (s[r].enabled = !0), s[r] || (s[r] = {enabled: !1}), Lt(e, i)
    }
}

const qo = {
    eventsEmitter: Qp,
    update: lh,
    translate: hh,
    transition: _h,
    slide: Ch,
    loop: Ah,
    grabCursor: Ih,
    events: Gh,
    breakpoints: Xh,
    checkOverflow: Zh,
    classes: Qh
}, zo = {};

class pe {
    constructor() {
        let e, t;
        for (var i = arguments.length, r = new Array(i), n = 0; n < i; n++) r[n] = arguments[n];
        r.length === 1 && r[0].constructor && Object.prototype.toString.call(r[0]).slice(8, -1) === "Object" ? t = r[0] : [e, t] = r, t || (t = {}), t = Lt({}, t), e && !t.el && (t.el = e);
        const o = pi();
        if (t.el && typeof t.el == "string" && o.querySelectorAll(t.el).length > 1) {
            const u = [];
            return o.querySelectorAll(t.el).forEach(d => {
                const f = Lt({}, t, {el: d});
                u.push(new pe(f))
            }), u
        }
        const a = this;
        a.__swiper__ = !0, a.support = Uu(), a.device = ju({userAgent: t.userAgent}), a.browser = Ku(), a.eventsListeners = {}, a.eventsAnyListeners = [], a.modules = [...a.__modules__], t.modules && Array.isArray(t.modules) && a.modules.push(...t.modules);
        const l = {};
        a.modules.forEach(u => {
            u({
                params: t,
                swiper: a,
                extendParams: em(t, l),
                on: a.on.bind(a),
                once: a.once.bind(a),
                off: a.off.bind(a),
                emit: a.emit.bind(a)
            })
        });
        const c = Lt({}, ac, l);
        return a.params = Lt({}, c, zo, t), a.originalParams = Lt({}, a.params), a.passedParams = Lt({}, t), a.params && a.params.on && Object.keys(a.params.on).forEach(u => {
            a.on(u, a.params.on[u])
        }), a.params && a.params.onAny && a.onAny(a.params.onAny), Object.assign(a, {
            enabled: a.params.enabled,
            el: e,
            classNames: [],
            slides: [],
            slidesGrid: [],
            snapGrid: [],
            slidesSizesGrid: [],
            isHorizontal() {
                return a.params.direction === "horizontal"
            },
            isVertical() {
                return a.params.direction === "vertical"
            },
            activeIndex: 0,
            realIndex: 0,
            isBeginning: !0,
            isEnd: !1,
            translate: 0,
            previousTranslate: 0,
            progress: 0,
            velocity: 0,
            animating: !1,
            cssOverflowAdjustment() {
                return Math.trunc(this.translate / 2 ** 23) * 2 ** 23
            },
            allowSlideNext: a.params.allowSlideNext,
            allowSlidePrev: a.params.allowSlidePrev,
            touchEventsData: {
                isTouched: void 0,
                isMoved: void 0,
                allowTouchCallbacks: void 0,
                touchStartTime: void 0,
                isScrolling: void 0,
                currentTranslate: void 0,
                startTranslate: void 0,
                allowThresholdMove: void 0,
                focusableElements: a.params.focusableElements,
                lastClickTime: 0,
                clickTimeout: void 0,
                velocities: [],
                allowMomentumBounce: void 0,
                startMoving: void 0,
                pointerId: null,
                touchId: null
            },
            allowClick: !0,
            allowTouchMove: a.params.allowTouchMove,
            touches: {startX: 0, startY: 0, currentX: 0, currentY: 0, diff: 0},
            imagesToLoad: [],
            imagesLoaded: 0
        }), a.emit("_swiper"), a.params.init && a.init(), a
    }

    getDirectionLabel(e) {
        return this.isHorizontal() ? e : {
            width: "height",
            "margin-top": "margin-left",
            "margin-bottom ": "margin-right",
            "margin-left": "margin-top",
            "margin-right": "margin-bottom",
            "padding-left": "padding-top",
            "padding-right": "padding-bottom",
            marginRight: "marginBottom"
        }[e]
    }

    getSlideIndex(e) {
        const {slidesEl: t, params: i} = this, r = Gt(t, `.${i.slideClass}, swiper-slide`), n = Qn(r[0]);
        return Qn(e) - n
    }

    getSlideIndexByData(e) {
        return this.getSlideIndex(this.slides.find(t => t.getAttribute("data-swiper-slide-index") * 1 === e))
    }

    recalcSlides() {
        const e = this, {slidesEl: t, params: i} = e;
        e.slides = Gt(t, `.${i.slideClass}, swiper-slide`)
    }

    enable() {
        const e = this;
        e.enabled || (e.enabled = !0, e.params.grabCursor && e.setGrabCursor(), e.emit("enable"))
    }

    disable() {
        const e = this;
        e.enabled && (e.enabled = !1, e.params.grabCursor && e.unsetGrabCursor(), e.emit("disable"))
    }

    setProgress(e, t) {
        const i = this;
        e = Math.min(Math.max(e, 0), 1);
        const r = i.minTranslate(), o = (i.maxTranslate() - r) * e + r;
        i.translateTo(o, typeof t > "u" ? 0 : t), i.updateActiveIndex(), i.updateSlidesClasses()
    }

    emitContainerClasses() {
        const e = this;
        if (!e.params._emitClasses || !e.el) return;
        const t = e.el.className.split(" ").filter(i => i.indexOf("swiper") === 0 || i.indexOf(e.params.containerModifierClass) === 0);
        e.emit("_containerClasses", t.join(" "))
    }

    getSlideClasses(e) {
        const t = this;
        return t.destroyed ? "" : e.className.split(" ").filter(i => i.indexOf("swiper-slide") === 0 || i.indexOf(t.params.slideClass) === 0).join(" ")
    }

    emitSlidesClasses() {
        const e = this;
        if (!e.params._emitClasses || !e.el) return;
        const t = [];
        e.slides.forEach(i => {
            const r = e.getSlideClasses(i);
            t.push({slideEl: i, classNames: r}), e.emit("_slideClass", i, r)
        }), e.emit("_slideClasses", t)
    }

    slidesPerViewDynamic(e, t) {
        e === void 0 && (e = "current"), t === void 0 && (t = !1);
        const i = this, {params: r, slides: n, slidesGrid: o, slidesSizesGrid: a, size: l, activeIndex: c} = i;
        let u = 1;
        if (typeof r.slidesPerView == "number") return r.slidesPerView;
        if (r.centeredSlides) {
            let d = n[c] ? Math.ceil(n[c].swiperSlideSize) : 0, f;
            for (let p = c + 1; p < n.length; p += 1) n[p] && !f && (d += Math.ceil(n[p].swiperSlideSize), u += 1, d > l && (f = !0));
            for (let p = c - 1; p >= 0; p -= 1) n[p] && !f && (d += n[p].swiperSlideSize, u += 1, d > l && (f = !0))
        } else if (e === "current") for (let d = c + 1; d < n.length; d += 1) (t ? o[d] + a[d] - o[c] < l : o[d] - o[c] < l) && (u += 1); else for (let d = c - 1; d >= 0; d -= 1) o[c] - o[d] < l && (u += 1);
        return u
    }

    update() {
        const e = this;
        if (!e || e.destroyed) return;
        const {snapGrid: t, params: i} = e;
        i.breakpoints && e.setBreakpoint(), [...e.el.querySelectorAll('[loading="lazy"]')].forEach(o => {
            o.complete && On(e, o)
        }), e.updateSize(), e.updateSlides(), e.updateProgress(), e.updateSlidesClasses();

        function r() {
            const o = e.rtlTranslate ? e.translate * -1 : e.translate,
                a = Math.min(Math.max(o, e.maxTranslate()), e.minTranslate());
            e.setTranslate(a), e.updateActiveIndex(), e.updateSlidesClasses()
        }

        let n;
        if (i.freeMode && i.freeMode.enabled && !i.cssMode) r(), i.autoHeight && e.updateAutoHeight(); else {
            if ((i.slidesPerView === "auto" || i.slidesPerView > 1) && e.isEnd && !i.centeredSlides) {
                const o = e.virtual && i.virtual.enabled ? e.virtual.slides : e.slides;
                n = e.slideTo(o.length - 1, 0, !1, !0)
            } else n = e.slideTo(e.activeIndex, 0, !1, !0);
            n || r()
        }
        i.watchOverflow && t !== e.snapGrid && e.checkOverflow(), e.emit("update")
    }

    changeDirection(e, t) {
        t === void 0 && (t = !0);
        const i = this, r = i.params.direction;
        return e || (e = r === "horizontal" ? "vertical" : "horizontal"), e === r || e !== "horizontal" && e !== "vertical" || (i.el.classList.remove(`${i.params.containerModifierClass}${r}`), i.el.classList.add(`${i.params.containerModifierClass}${e}`), i.emitContainerClasses(), i.params.direction = e, i.slides.forEach(n => {
            e === "vertical" ? n.style.width = "" : n.style.height = ""
        }), i.emit("changeDirection"), t && i.update()), i
    }

    changeLanguageDirection(e) {
        const t = this;
        t.rtl && e === "rtl" || !t.rtl && e === "ltr" || (t.rtl = e === "rtl", t.rtlTranslate = t.params.direction === "horizontal" && t.rtl, t.rtl ? (t.el.classList.add(`${t.params.containerModifierClass}rtl`), t.el.dir = "rtl") : (t.el.classList.remove(`${t.params.containerModifierClass}rtl`), t.el.dir = "ltr"), t.update())
    }

    mount(e) {
        const t = this;
        if (t.mounted) return !0;
        let i = e || t.params.el;
        if (typeof i == "string" && (i = document.querySelector(i)), !i) return !1;
        i.swiper = t, i.parentNode && i.parentNode.host && i.parentNode.host.nodeName === t.params.swiperElementNodeName.toUpperCase() && (t.isElement = !0);
        const r = () => `.${(t.params.wrapperClass || "").trim().split(" ").join(".")}`;
        let o = i && i.shadowRoot && i.shadowRoot.querySelector ? i.shadowRoot.querySelector(r()) : Gt(i, r())[0];
        return !o && t.params.createElements && (o = Ks("div", t.params.wrapperClass), i.append(o), Gt(i, `.${t.params.slideClass}`).forEach(a => {
            o.append(a)
        })), Object.assign(t, {
            el: i,
            wrapperEl: o,
            slidesEl: t.isElement && !i.parentNode.host.slideSlots ? i.parentNode.host : o,
            hostEl: t.isElement ? i.parentNode.host : i,
            mounted: !0,
            rtl: i.dir.toLowerCase() === "rtl" || Yi(i, "direction") === "rtl",
            rtlTranslate: t.params.direction === "horizontal" && (i.dir.toLowerCase() === "rtl" || Yi(i, "direction") === "rtl"),
            wrongRTL: Yi(o, "display") === "-webkit-box"
        }), !0
    }

    init(e) {
        const t = this;
        if (t.initialized || t.mount(e) === !1) return t;
        t.emit("beforeInit"), t.params.breakpoints && t.setBreakpoint(), t.addClasses(), t.updateSize(), t.updateSlides(), t.params.watchOverflow && t.checkOverflow(), t.params.grabCursor && t.enabled && t.setGrabCursor(), t.params.loop && t.virtual && t.params.virtual.enabled ? t.slideTo(t.params.initialSlide + t.virtual.slidesBefore, 0, t.params.runCallbacksOnInit, !1, !0) : t.slideTo(t.params.initialSlide, 0, t.params.runCallbacksOnInit, !1, !0), t.params.loop && t.loopCreate(void 0, !0), t.attachEvents();
        const r = [...t.el.querySelectorAll('[loading="lazy"]')];
        return t.isElement && r.push(...t.hostEl.querySelectorAll('[loading="lazy"]')), r.forEach(n => {
            n.complete ? On(t, n) : n.addEventListener("load", o => {
                On(t, o.target)
            })
        }), wa(t), t.initialized = !0, wa(t), t.emit("init"), t.emit("afterInit"), t
    }

    destroy(e, t) {
        e === void 0 && (e = !0), t === void 0 && (t = !0);
        const i = this, {params: r, el: n, wrapperEl: o, slides: a} = i;
        return typeof i.params > "u" || i.destroyed || (i.emit("beforeDestroy"), i.initialized = !1, i.detachEvents(), r.loop && i.loopDestroy(), t && (i.removeClasses(), n && typeof n != "string" && n.removeAttribute("style"), o && o.removeAttribute("style"), a && a.length && a.forEach(l => {
            l.classList.remove(r.slideVisibleClass, r.slideFullyVisibleClass, r.slideActiveClass, r.slideNextClass, r.slidePrevClass), l.removeAttribute("style"), l.removeAttribute("data-swiper-slide-index")
        })), i.emit("destroy"), Object.keys(i.eventsListeners).forEach(l => {
            i.off(l)
        }), e !== !1 && (i.el && typeof i.el != "string" && (i.el.swiper = null), zp(i)), i.destroyed = !0), null
    }

    static extendDefaults(e) {
        Lt(zo, e)
    }

    static get extendedDefaults() {
        return zo
    }

    static get defaults() {
        return ac
    }

    static installModule(e) {
        pe.prototype.__modules__ || (pe.prototype.__modules__ = []);
        const t = pe.prototype.__modules__;
        typeof e == "function" && t.indexOf(e) < 0 && t.push(e)
    }

    static use(e) {
        return Array.isArray(e) ? (e.forEach(t => pe.installModule(t)), pe) : (pe.installModule(e), pe)
    }
}

Object.keys(qo).forEach(s => {
    Object.keys(qo[s]).forEach(e => {
        pe.prototype[e] = qo[s][e]
    })
});
pe.use([jp, Kp]);

function Zu(s, e, t, i) {
    return s.params.createElements && Object.keys(i).forEach(r => {
        if (!t[r] && t.auto === !0) {
            let n = Gt(s.el, `.${i[r]}`)[0];
            n || (n = Ks("div", i[r]), n.className = i[r], s.el.append(n)), t[r] = n, e[r] = n
        }
    }), t
}

function Ot(s) {
    let {swiper: e, extendParams: t, on: i, emit: r} = s;
    t({
        navigation: {
            nextEl: null,
            prevEl: null,
            hideOnClick: !1,
            disabledClass: "swiper-button-disabled",
            hiddenClass: "swiper-button-hidden",
            lockClass: "swiper-button-lock",
            navigationDisabledClass: "swiper-navigation-disabled"
        }
    }), e.navigation = {nextEl: null, prevEl: null};

    function n(m) {
        let h;
        return m && typeof m == "string" && e.isElement && (h = e.el.querySelector(m) || e.hostEl.querySelector(m), h) ? h : (m && (typeof m == "string" && (h = [...document.querySelectorAll(m)]), e.params.uniqueNavElements && typeof m == "string" && h && h.length > 1 && e.el.querySelectorAll(m).length === 1 ? h = e.el.querySelector(m) : h && h.length === 1 && (h = h[0])), m && !h ? m : h)
    }

    function o(m, h) {
        const g = e.params.navigation;
        m = Ve(m), m.forEach(y => {
            y && (y.classList[h ? "add" : "remove"](...g.disabledClass.split(" ")), y.tagName === "BUTTON" && (y.disabled = h), e.params.watchOverflow && e.enabled && y.classList[e.isLocked ? "add" : "remove"](g.lockClass))
        })
    }

    function a() {
        const {nextEl: m, prevEl: h} = e.navigation;
        if (e.params.loop) {
            o(h, !1), o(m, !1);
            return
        }
        o(h, e.isBeginning && !e.params.rewind), o(m, e.isEnd && !e.params.rewind)
    }

    function l(m) {
        m.preventDefault(), !(e.isBeginning && !e.params.loop && !e.params.rewind) && (e.slidePrev(), r("navigationPrev"))
    }

    function c(m) {
        m.preventDefault(), !(e.isEnd && !e.params.loop && !e.params.rewind) && (e.slideNext(), r("navigationNext"))
    }

    function u() {
        const m = e.params.navigation;
        if (e.params.navigation = Zu(e, e.originalParams.navigation, e.params.navigation, {
            nextEl: "swiper-button-next",
            prevEl: "swiper-button-prev"
        }), !(m.nextEl || m.prevEl)) return;
        let h = n(m.nextEl), g = n(m.prevEl);
        Object.assign(e.navigation, {nextEl: h, prevEl: g}), h = Ve(h), g = Ve(g);
        const y = (v, _) => {
            v && v.addEventListener("click", _ === "next" ? c : l), !e.enabled && v && v.classList.add(...m.lockClass.split(" "))
        };
        h.forEach(v => y(v, "next")), g.forEach(v => y(v, "prev"))
    }

    function d() {
        let {nextEl: m, prevEl: h} = e.navigation;
        m = Ve(m), h = Ve(h);
        const g = (y, v) => {
            y.removeEventListener("click", v === "next" ? c : l), y.classList.remove(...e.params.navigation.disabledClass.split(" "))
        };
        m.forEach(y => g(y, "next")), h.forEach(y => g(y, "prev"))
    }

    i("init", () => {
        e.params.navigation.enabled === !1 ? p() : (u(), a())
    }), i("toEdge fromEdge lock unlock", () => {
        a()
    }), i("destroy", () => {
        d()
    }), i("enable disable", () => {
        let {nextEl: m, prevEl: h} = e.navigation;
        if (m = Ve(m), h = Ve(h), e.enabled) {
            a();
            return
        }
        [...m, ...h].filter(g => !!g).forEach(g => g.classList.add(e.params.navigation.lockClass))
    }), i("click", (m, h) => {
        let {nextEl: g, prevEl: y} = e.navigation;
        g = Ve(g), y = Ve(y);
        const v = h.target;
        let _ = y.includes(v) || g.includes(v);
        if (e.isElement && !_) {
            const w = h.path || h.composedPath && h.composedPath();
            w && (_ = w.find(b => g.includes(b) || y.includes(b)))
        }
        if (e.params.navigation.hideOnClick && !_) {
            if (e.pagination && e.params.pagination && e.params.pagination.clickable && (e.pagination.el === v || e.pagination.el.contains(v))) return;
            let w;
            g.length ? w = g[0].classList.contains(e.params.navigation.hiddenClass) : y.length && (w = y[0].classList.contains(e.params.navigation.hiddenClass)), r(w === !0 ? "navigationShow" : "navigationHide"), [...g, ...y].filter(b => !!b).forEach(b => b.classList.toggle(e.params.navigation.hiddenClass))
        }
    });
    const f = () => {
        e.el.classList.remove(...e.params.navigation.navigationDisabledClass.split(" ")), u(), a()
    }, p = () => {
        e.el.classList.add(...e.params.navigation.navigationDisabledClass.split(" ")), d()
    };
    Object.assign(e.navigation, {enable: f, disable: p, update: a, init: u, destroy: d})
}

function _s(s) {
    return s === void 0 && (s = ""), `.${s.trim().replace(/([\.:!+\/])/g, "\\$1").replace(/ /g, ".")}`
}

function Jn(s) {
    let {swiper: e, extendParams: t, on: i, emit: r} = s;
    const n = "swiper-pagination";
    t({
        pagination: {
            el: null,
            bulletElement: "span",
            clickable: !1,
            hideOnClick: !1,
            renderBullet: null,
            renderProgressbar: null,
            renderFraction: null,
            renderCustom: null,
            progressbarOpposite: !1,
            type: "bullets",
            dynamicBullets: !1,
            dynamicMainBullets: 1,
            formatFractionCurrent: v => v,
            formatFractionTotal: v => v,
            bulletClass: `${n}-bullet`,
            bulletActiveClass: `${n}-bullet-active`,
            modifierClass: `${n}-`,
            currentClass: `${n}-current`,
            totalClass: `${n}-total`,
            hiddenClass: `${n}-hidden`,
            progressbarFillClass: `${n}-progressbar-fill`,
            progressbarOppositeClass: `${n}-progressbar-opposite`,
            clickableClass: `${n}-clickable`,
            lockClass: `${n}-lock`,
            horizontalClass: `${n}-horizontal`,
            verticalClass: `${n}-vertical`,
            paginationDisabledClass: `${n}-disabled`
        }
    }), e.pagination = {el: null, bullets: []};
    let o, a = 0;

    function l() {
        return !e.params.pagination.el || !e.pagination.el || Array.isArray(e.pagination.el) && e.pagination.el.length === 0
    }

    function c(v, _) {
        const {bulletActiveClass: w} = e.params.pagination;
        v && (v = v[`${_ === "prev" ? "previous" : "next"}ElementSibling`], v && (v.classList.add(`${w}-${_}`), v = v[`${_ === "prev" ? "previous" : "next"}ElementSibling`], v && v.classList.add(`${w}-${_}-${_}`)))
    }

    function u(v, _, w) {
        if (v = v % w, _ = _ % w, _ === v + 1) return "next";
        if (_ === v - 1) return "previous"
    }

    function d(v) {
        const _ = v.target.closest(_s(e.params.pagination.bulletClass));
        if (!_) return;
        v.preventDefault();
        const w = Qn(_) * e.params.slidesPerGroup;
        if (e.params.loop) {
            if (e.realIndex === w) return;
            const b = u(e.realIndex, w, e.slides.length);
            b === "next" ? e.slideNext() : b === "previous" ? e.slidePrev() : e.slideToLoop(w)
        } else e.slideTo(w)
    }

    function f() {
        const v = e.rtl, _ = e.params.pagination;
        if (l()) return;
        let w = e.pagination.el;
        w = Ve(w);
        let b, T;
        const x = e.virtual && e.params.virtual.enabled ? e.virtual.slides.length : e.slides.length,
            C = e.params.loop ? Math.ceil(x / e.params.slidesPerGroup) : e.snapGrid.length;
        if (e.params.loop ? (T = e.previousRealIndex || 0, b = e.params.slidesPerGroup > 1 ? Math.floor(e.realIndex / e.params.slidesPerGroup) : e.realIndex) : typeof e.snapIndex < "u" ? (b = e.snapIndex, T = e.previousSnapIndex) : (T = e.previousIndex || 0, b = e.activeIndex || 0), _.type === "bullets" && e.pagination.bullets && e.pagination.bullets.length > 0) {
            const P = e.pagination.bullets;
            let E, A, L;
            if (_.dynamicBullets && (o = ya(P[0], e.isHorizontal() ? "width" : "height"), w.forEach(k => {
                k.style[e.isHorizontal() ? "width" : "height"] = `${o * (_.dynamicMainBullets + 4)}px`
            }), _.dynamicMainBullets > 1 && T !== void 0 && (a += b - (T || 0), a > _.dynamicMainBullets - 1 ? a = _.dynamicMainBullets - 1 : a < 0 && (a = 0)), E = Math.max(b - a, 0), A = E + (Math.min(P.length, _.dynamicMainBullets) - 1), L = (A + E) / 2), P.forEach(k => {
                const R = [...["", "-next", "-next-next", "-prev", "-prev-prev", "-main"].map(q => `${_.bulletActiveClass}${q}`)].map(q => typeof q == "string" && q.includes(" ") ? q.split(" ") : q).flat();
                k.classList.remove(...R)
            }), w.length > 1) P.forEach(k => {
                const R = Qn(k);
                R === b ? k.classList.add(..._.bulletActiveClass.split(" ")) : e.isElement && k.setAttribute("part", "bullet"), _.dynamicBullets && (R >= E && R <= A && k.classList.add(...`${_.bulletActiveClass}-main`.split(" ")), R === E && c(k, "prev"), R === A && c(k, "next"))
            }); else {
                const k = P[b];
                if (k && k.classList.add(..._.bulletActiveClass.split(" ")), e.isElement && P.forEach((R, q) => {
                    R.setAttribute("part", q === b ? "bullet-active" : "bullet")
                }), _.dynamicBullets) {
                    const R = P[E], q = P[A];
                    for (let I = E; I <= A; I += 1) P[I] && P[I].classList.add(...`${_.bulletActiveClass}-main`.split(" "));
                    c(R, "prev"), c(q, "next")
                }
            }
            if (_.dynamicBullets) {
                const k = Math.min(P.length, _.dynamicMainBullets + 4), R = (o * k - o) / 2 - L * o,
                    q = v ? "right" : "left";
                P.forEach(I => {
                    I.style[e.isHorizontal() ? q : "top"] = `${R}px`
                })
            }
        }
        w.forEach((P, E) => {
            if (_.type === "fraction" && (P.querySelectorAll(_s(_.currentClass)).forEach(A => {
                A.textContent = _.formatFractionCurrent(b + 1)
            }), P.querySelectorAll(_s(_.totalClass)).forEach(A => {
                A.textContent = _.formatFractionTotal(C)
            })), _.type === "progressbar") {
                let A;
                _.progressbarOpposite ? A = e.isHorizontal() ? "vertical" : "horizontal" : A = e.isHorizontal() ? "horizontal" : "vertical";
                const L = (b + 1) / C;
                let k = 1, R = 1;
                A === "horizontal" ? k = L : R = L, P.querySelectorAll(_s(_.progressbarFillClass)).forEach(q => {
                    q.style.transform = `translate3d(0,0,0) scaleX(${k}) scaleY(${R})`, q.style.transitionDuration = `${e.params.speed}ms`
                })
            }
            _.type === "custom" && _.renderCustom ? (ic(P, _.renderCustom(e, b + 1, C)), E === 0 && r("paginationRender", P)) : (E === 0 && r("paginationRender", P), r("paginationUpdate", P)), e.params.watchOverflow && e.enabled && P.classList[e.isLocked ? "add" : "remove"](_.lockClass)
        })
    }

    function p() {
        const v = e.params.pagination;
        if (l()) return;
        const _ = e.virtual && e.params.virtual.enabled ? e.virtual.slides.length : e.grid && e.params.grid.rows > 1 ? e.slides.length / Math.ceil(e.params.grid.rows) : e.slides.length;
        let w = e.pagination.el;
        w = Ve(w);
        let b = "";
        if (v.type === "bullets") {
            let T = e.params.loop ? Math.ceil(_ / e.params.slidesPerGroup) : e.snapGrid.length;
            e.params.freeMode && e.params.freeMode.enabled && T > _ && (T = _);
            for (let x = 0; x < T; x += 1) v.renderBullet ? b += v.renderBullet.call(e, x, v.bulletClass) : b += `<${v.bulletElement} ${e.isElement ? 'part="bullet"' : ""} class="${v.bulletClass}"></${v.bulletElement}>`
        }
        v.type === "fraction" && (v.renderFraction ? b = v.renderFraction.call(e, v.currentClass, v.totalClass) : b = `<span class="${v.currentClass}"></span> / <span class="${v.totalClass}"></span>`), v.type === "progressbar" && (v.renderProgressbar ? b = v.renderProgressbar.call(e, v.progressbarFillClass) : b = `<span class="${v.progressbarFillClass}"></span>`), e.pagination.bullets = [], w.forEach(T => {
            v.type !== "custom" && ic(T, b || ""), v.type === "bullets" && e.pagination.bullets.push(...T.querySelectorAll(_s(v.bulletClass)))
        }), v.type !== "custom" && r("paginationRender", w[0])
    }

    function m() {
        e.params.pagination = Zu(e, e.originalParams.pagination, e.params.pagination, {el: "swiper-pagination"});
        const v = e.params.pagination;
        if (!v.el) return;
        let _;
        typeof v.el == "string" && e.isElement && (_ = e.el.querySelector(v.el)), !_ && typeof v.el == "string" && (_ = [...document.querySelectorAll(v.el)]), _ || (_ = v.el), !(!_ || _.length === 0) && (e.params.uniqueNavElements && typeof v.el == "string" && Array.isArray(_) && _.length > 1 && (_ = [...e.el.querySelectorAll(v.el)], _.length > 1 && (_ = _.find(w => Xu(w, ".swiper")[0] === e.el))), Array.isArray(_) && _.length === 1 && (_ = _[0]), Object.assign(e.pagination, {el: _}), _ = Ve(_), _.forEach(w => {
            v.type === "bullets" && v.clickable && w.classList.add(...(v.clickableClass || "").split(" ")), w.classList.add(v.modifierClass + v.type), w.classList.add(e.isHorizontal() ? v.horizontalClass : v.verticalClass), v.type === "bullets" && v.dynamicBullets && (w.classList.add(`${v.modifierClass}${v.type}-dynamic`), a = 0, v.dynamicMainBullets < 1 && (v.dynamicMainBullets = 1)), v.type === "progressbar" && v.progressbarOpposite && w.classList.add(v.progressbarOppositeClass), v.clickable && w.addEventListener("click", d), e.enabled || w.classList.add(v.lockClass)
        }))
    }

    function h() {
        const v = e.params.pagination;
        if (l()) return;
        let _ = e.pagination.el;
        _ && (_ = Ve(_), _.forEach(w => {
            w.classList.remove(v.hiddenClass), w.classList.remove(v.modifierClass + v.type), w.classList.remove(e.isHorizontal() ? v.horizontalClass : v.verticalClass), v.clickable && (w.classList.remove(...(v.clickableClass || "").split(" ")), w.removeEventListener("click", d))
        })), e.pagination.bullets && e.pagination.bullets.forEach(w => w.classList.remove(...v.bulletActiveClass.split(" ")))
    }

    i("changeDirection", () => {
        if (!e.pagination || !e.pagination.el) return;
        const v = e.params.pagination;
        let {el: _} = e.pagination;
        _ = Ve(_), _.forEach(w => {
            w.classList.remove(v.horizontalClass, v.verticalClass), w.classList.add(e.isHorizontal() ? v.horizontalClass : v.verticalClass)
        })
    }), i("init", () => {
        e.params.pagination.enabled === !1 ? y() : (m(), p(), f())
    }), i("activeIndexChange", () => {
        typeof e.snapIndex > "u" && f()
    }), i("snapIndexChange", () => {
        f()
    }), i("snapGridLengthChange", () => {
        p(), f()
    }), i("destroy", () => {
        h()
    }), i("enable disable", () => {
        let {el: v} = e.pagination;
        v && (v = Ve(v), v.forEach(_ => _.classList[e.enabled ? "remove" : "add"](e.params.pagination.lockClass)))
    }), i("lock unlock", () => {
        f()
    }), i("click", (v, _) => {
        const w = _.target, b = Ve(e.pagination.el);
        if (e.params.pagination.el && e.params.pagination.hideOnClick && b && b.length > 0 && !w.classList.contains(e.params.pagination.bulletClass)) {
            if (e.navigation && (e.navigation.nextEl && w === e.navigation.nextEl || e.navigation.prevEl && w === e.navigation.prevEl)) return;
            const T = b[0].classList.contains(e.params.pagination.hiddenClass);
            r(T === !0 ? "paginationShow" : "paginationHide"), b.forEach(x => x.classList.toggle(e.params.pagination.hiddenClass))
        }
    });
    const g = () => {
        e.el.classList.remove(e.params.pagination.paginationDisabledClass);
        let {el: v} = e.pagination;
        v && (v = Ve(v), v.forEach(_ => _.classList.remove(e.params.pagination.paginationDisabledClass))), m(), p(), f()
    }, y = () => {
        e.el.classList.add(e.params.pagination.paginationDisabledClass);
        let {el: v} = e.pagination;
        v && (v = Ve(v), v.forEach(_ => _.classList.add(e.params.pagination.paginationDisabledClass))), h()
    };
    Object.assign(e.pagination, {enable: g, disable: y, render: p, update: f, init: m, destroy: h})
}

function Bo(s) {
    let {swiper: e, extendParams: t, on: i} = s;
    t({parallax: {enabled: !1}});
    const r = "[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]",
        n = (l, c) => {
            const {rtl: u} = e, d = u ? -1 : 1, f = l.getAttribute("data-swiper-parallax") || "0";
            let p = l.getAttribute("data-swiper-parallax-x"), m = l.getAttribute("data-swiper-parallax-y");
            const h = l.getAttribute("data-swiper-parallax-scale"), g = l.getAttribute("data-swiper-parallax-opacity"),
                y = l.getAttribute("data-swiper-parallax-rotate");
            if (p || m ? (p = p || "0", m = m || "0") : e.isHorizontal() ? (p = f, m = "0") : (m = f, p = "0"), p.indexOf("%") >= 0 ? p = `${parseInt(p, 10) * c * d}%` : p = `${p * c * d}px`, m.indexOf("%") >= 0 ? m = `${parseInt(m, 10) * c}%` : m = `${m * c}px`, typeof g < "u" && g !== null) {
                const _ = g - (g - 1) * (1 - Math.abs(c));
                l.style.opacity = _
            }
            let v = `translate3d(${p}, ${m}, 0px)`;
            if (typeof h < "u" && h !== null) {
                const _ = h - (h - 1) * (1 - Math.abs(c));
                v += ` scale(${_})`
            }
            if (y && typeof y < "u" && y !== null) {
                const _ = y * c * -1;
                v += ` rotate(${_}deg)`
            }
            l.style.transform = v
        }, o = () => {
            const {el: l, slides: c, progress: u, snapGrid: d, isElement: f} = e, p = Gt(l, r);
            e.isElement && p.push(...Gt(e.hostEl, r)), p.forEach(m => {
                n(m, u)
            }), c.forEach((m, h) => {
                let g = m.progress;
                e.params.slidesPerGroup > 1 && e.params.slidesPerView !== "auto" && (g += Math.ceil(h / 2) - u * (d.length - 1)), g = Math.min(Math.max(g, -1), 1), m.querySelectorAll(`${r}, [data-swiper-parallax-rotate]`).forEach(y => {
                    n(y, g)
                })
            })
        }, a = function (l) {
            l === void 0 && (l = e.params.speed);
            const {el: c, hostEl: u} = e, d = [...c.querySelectorAll(r)];
            e.isElement && d.push(...u.querySelectorAll(r)), d.forEach(f => {
                let p = parseInt(f.getAttribute("data-swiper-parallax-duration"), 10) || l;
                l === 0 && (p = 0), f.style.transitionDuration = `${p}ms`
            })
        };
    i("beforeInit", () => {
        e.params.parallax.enabled && (e.params.watchSlidesProgress = !0, e.originalParams.watchSlidesProgress = !0)
    }), i("init", () => {
        e.params.parallax.enabled && o()
    }), i("setTranslate", () => {
        e.params.parallax.enabled && o()
    }), i("setTransition", (l, c) => {
        e.params.parallax.enabled && a(c)
    })
}

function lc(s) {
    let {swiper: e, extendParams: t, on: i} = s;
    t({controller: {control: void 0, inverse: !1, by: "slide"}}), e.controller = {control: void 0};

    function r(c, u) {
        const d = function () {
            let h, g, y;
            return (v, _) => {
                for (g = -1, h = v.length; h - g > 1;) y = h + g >> 1, v[y] <= _ ? g = y : h = y;
                return h
            }
        }();
        this.x = c, this.y = u, this.lastIndex = c.length - 1;
        let f, p;
        return this.interpolate = function (h) {
            return h ? (p = d(this.x, h), f = p - 1, (h - this.x[f]) * (this.y[p] - this.y[f]) / (this.x[p] - this.x[f]) + this.y[f]) : 0
        }, this
    }

    function n(c) {
        e.controller.spline = e.params.loop ? new r(e.slidesGrid, c.slidesGrid) : new r(e.snapGrid, c.snapGrid)
    }

    function o(c, u) {
        const d = e.controller.control;
        let f, p;
        const m = e.constructor;

        function h(g) {
            if (g.destroyed) return;
            const y = e.rtlTranslate ? -e.translate : e.translate;
            e.params.controller.by === "slide" && (n(g), p = -e.controller.spline.interpolate(-y)), (!p || e.params.controller.by === "container") && (f = (g.maxTranslate() - g.minTranslate()) / (e.maxTranslate() - e.minTranslate()), (Number.isNaN(f) || !Number.isFinite(f)) && (f = 1), p = (y - e.minTranslate()) * f + g.minTranslate()), e.params.controller.inverse && (p = g.maxTranslate() - p), g.updateProgress(p), g.setTranslate(p, e), g.updateActiveIndex(), g.updateSlidesClasses()
        }

        if (Array.isArray(d)) for (let g = 0; g < d.length; g += 1) d[g] !== u && d[g] instanceof m && h(d[g]); else d instanceof m && u !== d && h(d)
    }

    function a(c, u) {
        const d = e.constructor, f = e.controller.control;
        let p;

        function m(h) {
            h.destroyed || (h.setTransition(c, e), c !== 0 && (h.transitionStart(), h.params.autoHeight && jn(() => {
                h.updateAutoHeight()
            }), Vs(h.wrapperEl, () => {
                f && h.transitionEnd()
            })))
        }

        if (Array.isArray(f)) for (p = 0; p < f.length; p += 1) f[p] !== u && f[p] instanceof d && m(f[p]); else f instanceof d && u !== f && m(f)
    }

    function l() {
        e.controller.control && e.controller.spline && (e.controller.spline = void 0, delete e.controller.spline)
    }

    i("beforeInit", () => {
        if (typeof window < "u" && (typeof e.params.controller.control == "string" || e.params.controller.control instanceof HTMLElement)) {
            (typeof e.params.controller.control == "string" ? [...document.querySelectorAll(e.params.controller.control)] : [e.params.controller.control]).forEach(u => {
                if (e.controller.control || (e.controller.control = []), u && u.swiper) e.controller.control.push(u.swiper); else if (u) {
                    const d = `${e.params.eventsPrefix}init`, f = p => {
                        e.controller.control.push(p.detail[0]), e.update(), u.removeEventListener(d, f)
                    };
                    u.addEventListener(d, f)
                }
            });
            return
        }
        e.controller.control = e.params.controller.control
    }), i("update", () => {
        l()
    }), i("resize", () => {
        l()
    }), i("observerUpdate", () => {
        l()
    }), i("setTranslate", (c, u, d) => {
        !e.controller.control || e.controller.control.destroyed || e.controller.setTranslate(u, d)
    }), i("setTransition", (c, u, d) => {
        !e.controller.control || e.controller.control.destroyed || e.controller.setTransition(u, d)
    }), Object.assign(e.controller, {setTranslate: o, setTransition: a})
}

function ed(s) {
    let {swiper: e, extendParams: t, on: i, emit: r, params: n} = s;
    e.autoplay = {running: !1, paused: !1, timeLeft: 0}, t({
        autoplay: {
            enabled: !1,
            delay: 3e3,
            waitForTransition: !0,
            disableOnInteraction: !1,
            stopOnLastSlide: !1,
            reverseDirection: !1,
            pauseOnMouseEnter: !1
        }
    });
    let o, a, l = n && n.autoplay ? n.autoplay.delay : 3e3, c = n && n.autoplay ? n.autoplay.delay : 3e3, u,
        d = new Date().getTime(), f, p, m, h, g, y, v;

    function _(D) {
        !e || e.destroyed || !e.wrapperEl || D.target === e.wrapperEl && (e.wrapperEl.removeEventListener("transitionend", _), !(v || D.detail && D.detail.bySwiperTouchMove) && E())
    }

    const w = () => {
        if (e.destroyed || !e.autoplay.running) return;
        e.autoplay.paused ? f = !0 : f && (c = u, f = !1);
        const D = e.autoplay.paused ? u : d + c - new Date().getTime();
        e.autoplay.timeLeft = D, r("autoplayTimeLeft", D, D / l), a = requestAnimationFrame(() => {
            w()
        })
    }, b = () => {
        let D;
        return e.virtual && e.params.virtual.enabled ? D = e.slides.find(S => S.classList.contains("swiper-slide-active")) : D = e.slides[e.activeIndex], D ? parseInt(D.getAttribute("data-swiper-autoplay"), 10) : void 0
    }, T = D => {
        if (e.destroyed || !e.autoplay.running) return;
        cancelAnimationFrame(a), w();
        let H = typeof D > "u" ? e.params.autoplay.delay : D;
        l = e.params.autoplay.delay, c = e.params.autoplay.delay;
        const S = b();
        !Number.isNaN(S) && S > 0 && typeof D > "u" && (H = S, l = S, c = S), u = H;
        const Y = e.params.speed, re = () => {
            !e || e.destroyed || (e.params.autoplay.reverseDirection ? !e.isBeginning || e.params.loop || e.params.rewind ? (e.slidePrev(Y, !0, !0), r("autoplay")) : e.params.autoplay.stopOnLastSlide || (e.slideTo(e.slides.length - 1, Y, !0, !0), r("autoplay")) : !e.isEnd || e.params.loop || e.params.rewind ? (e.slideNext(Y, !0, !0), r("autoplay")) : e.params.autoplay.stopOnLastSlide || (e.slideTo(0, Y, !0, !0), r("autoplay")), e.params.cssMode && (d = new Date().getTime(), requestAnimationFrame(() => {
                T()
            })))
        };
        return H > 0 ? (clearTimeout(o), o = setTimeout(() => {
            re()
        }, H)) : requestAnimationFrame(() => {
            re()
        }), H
    }, x = () => {
        d = new Date().getTime(), e.autoplay.running = !0, T(), r("autoplayStart")
    }, C = () => {
        e.autoplay.running = !1, clearTimeout(o), cancelAnimationFrame(a), r("autoplayStop")
    }, P = (D, H) => {
        if (e.destroyed || !e.autoplay.running) return;
        clearTimeout(o), D || (y = !0);
        const S = () => {
            r("autoplayPause"), e.params.autoplay.waitForTransition ? e.wrapperEl.addEventListener("transitionend", _) : E()
        };
        if (e.autoplay.paused = !0, H) {
            g && (u = e.params.autoplay.delay), g = !1, S();
            return
        }
        u = (u || e.params.autoplay.delay) - (new Date().getTime() - d), !(e.isEnd && u < 0 && !e.params.loop) && (u < 0 && (u = 0), S())
    }, E = () => {
        e.isEnd && u < 0 && !e.params.loop || e.destroyed || !e.autoplay.running || (d = new Date().getTime(), y ? (y = !1, T(u)) : T(), e.autoplay.paused = !1, r("autoplayResume"))
    }, A = () => {
        if (e.destroyed || !e.autoplay.running) return;
        const D = pi();
        D.visibilityState === "hidden" && (y = !0, P(!0)), D.visibilityState === "visible" && E()
    }, L = D => {
        D.pointerType === "mouse" && (y = !0, v = !0, !(e.animating || e.autoplay.paused) && P(!0))
    }, k = D => {
        D.pointerType === "mouse" && (v = !1, e.autoplay.paused && E())
    }, R = () => {
        e.params.autoplay.pauseOnMouseEnter && (e.el.addEventListener("pointerenter", L), e.el.addEventListener("pointerleave", k))
    }, q = () => {
        e.el && typeof e.el != "string" && (e.el.removeEventListener("pointerenter", L), e.el.removeEventListener("pointerleave", k))
    }, I = () => {
        pi().addEventListener("visibilitychange", A)
    }, z = () => {
        pi().removeEventListener("visibilitychange", A)
    };
    i("init", () => {
        e.params.autoplay.enabled && (R(), I(), x())
    }), i("destroy", () => {
        q(), z(), e.autoplay.running && C()
    }), i("_freeModeStaticRelease", () => {
        (m || y) && E()
    }), i("_freeModeNoMomentumRelease", () => {
        e.params.autoplay.disableOnInteraction ? C() : P(!0, !0)
    }), i("beforeTransitionStart", (D, H, S) => {
        e.destroyed || !e.autoplay.running || (S || !e.params.autoplay.disableOnInteraction ? P(!0, !0) : C())
    }), i("sliderFirstMove", () => {
        if (!(e.destroyed || !e.autoplay.running)) {
            if (e.params.autoplay.disableOnInteraction) {
                C();
                return
            }
            p = !0, m = !1, y = !1, h = setTimeout(() => {
                y = !0, m = !0, P(!0)
            }, 200)
        }
    }), i("touchEnd", () => {
        if (!(e.destroyed || !e.autoplay.running || !p)) {
            if (clearTimeout(h), clearTimeout(o), e.params.autoplay.disableOnInteraction) {
                m = !1, p = !1;
                return
            }
            m && e.params.cssMode && E(), m = !1, p = !1
        }
    }), i("slideChange", () => {
        e.destroyed || !e.autoplay.running || (g = !0)
    }), Object.assign(e.autoplay, {start: x, stop: C, pause: P, resume: E})
}

function td(s) {
    let {swiper: e, extendParams: t, emit: i, once: r} = s;
    t({
        freeMode: {
            enabled: !1,
            momentum: !0,
            momentumRatio: 1,
            momentumBounce: !0,
            momentumBounceRatio: 1,
            momentumVelocityRatio: 1,
            sticky: !1,
            minimumVelocity: .02
        }
    });

    function n() {
        if (e.params.cssMode) return;
        const l = e.getTranslate();
        e.setTranslate(l), e.setTransition(0), e.touchEventsData.velocities.length = 0, e.freeMode.onTouchEnd({currentPos: e.rtl ? e.translate : -e.translate})
    }

    function o() {
        if (e.params.cssMode) return;
        const {touchEventsData: l, touches: c} = e;
        l.velocities.length === 0 && l.velocities.push({
            position: c[e.isHorizontal() ? "startX" : "startY"],
            time: l.touchStartTime
        }), l.velocities.push({position: c[e.isHorizontal() ? "currentX" : "currentY"], time: br()})
    }

    function a(l) {
        let {currentPos: c} = l;
        if (e.params.cssMode) return;
        const {params: u, wrapperEl: d, rtlTranslate: f, snapGrid: p, touchEventsData: m} = e,
            g = br() - m.touchStartTime;
        if (c < -e.minTranslate()) {
            e.slideTo(e.activeIndex);
            return
        }
        if (c > -e.maxTranslate()) {
            e.slides.length < p.length ? e.slideTo(p.length - 1) : e.slideTo(e.slides.length - 1);
            return
        }
        if (u.freeMode.momentum) {
            if (m.velocities.length > 1) {
                const C = m.velocities.pop(), P = m.velocities.pop(), E = C.position - P.position, A = C.time - P.time;
                e.velocity = E / A, e.velocity /= 2, Math.abs(e.velocity) < u.freeMode.minimumVelocity && (e.velocity = 0), (A > 150 || br() - C.time > 300) && (e.velocity = 0)
            } else e.velocity = 0;
            e.velocity *= u.freeMode.momentumVelocityRatio, m.velocities.length = 0;
            let y = 1e3 * u.freeMode.momentumRatio;
            const v = e.velocity * y;
            let _ = e.translate + v;
            f && (_ = -_);
            let w = !1, b;
            const T = Math.abs(e.velocity) * 20 * u.freeMode.momentumBounceRatio;
            let x;
            if (_ < e.maxTranslate()) u.freeMode.momentumBounce ? (_ + e.maxTranslate() < -T && (_ = e.maxTranslate() - T), b = e.maxTranslate(), w = !0, m.allowMomentumBounce = !0) : _ = e.maxTranslate(), u.loop && u.centeredSlides && (x = !0); else if (_ > e.minTranslate()) u.freeMode.momentumBounce ? (_ - e.minTranslate() > T && (_ = e.minTranslate() + T), b = e.minTranslate(), w = !0, m.allowMomentumBounce = !0) : _ = e.minTranslate(), u.loop && u.centeredSlides && (x = !0); else if (u.freeMode.sticky) {
                let C;
                for (let P = 0; P < p.length; P += 1) if (p[P] > -_) {
                    C = P;
                    break
                }
                Math.abs(p[C] - _) < Math.abs(p[C - 1] - _) || e.swipeDirection === "next" ? _ = p[C] : _ = p[C - 1], _ = -_
            }
            if (x && r("transitionEnd", () => {
                e.loopFix()
            }), e.velocity !== 0) {
                if (f ? y = Math.abs((-_ - e.translate) / e.velocity) : y = Math.abs((_ - e.translate) / e.velocity), u.freeMode.sticky) {
                    const C = Math.abs((f ? -_ : _) - e.translate), P = e.slidesSizesGrid[e.activeIndex];
                    C < P ? y = u.speed : C < 2 * P ? y = u.speed * 1.5 : y = u.speed * 2.5
                }
            } else if (u.freeMode.sticky) {
                e.slideToClosest();
                return
            }
            u.freeMode.momentumBounce && w ? (e.updateProgress(b), e.setTransition(y), e.setTranslate(_), e.transitionStart(!0, e.swipeDirection), e.animating = !0, Vs(d, () => {
                !e || e.destroyed || !m.allowMomentumBounce || (i("momentumBounce"), e.setTransition(u.speed), setTimeout(() => {
                    e.setTranslate(b), Vs(d, () => {
                        !e || e.destroyed || e.transitionEnd()
                    })
                }, 0))
            })) : e.velocity ? (i("_freeModeNoMomentumRelease"), e.updateProgress(_), e.setTransition(y), e.setTranslate(_), e.transitionStart(!0, e.swipeDirection), e.animating || (e.animating = !0, Vs(d, () => {
                !e || e.destroyed || e.transitionEnd()
            }))) : e.updateProgress(_), e.updateActiveIndex(), e.updateSlidesClasses()
        } else if (u.freeMode.sticky) {
            e.slideToClosest();
            return
        } else u.freeMode && i("_freeModeNoMomentumRelease");
        (!u.freeMode.momentum || g >= u.longSwipesMs) && (i("_freeModeStaticRelease"), e.updateProgress(), e.updateActiveIndex(), e.updateSlidesClasses())
    }

    Object.assign(e, {freeMode: {onTouchStart: n, onTouchMove: o, onTouchEnd: a}})
}

function id(s) {
    const {
        effect: e,
        swiper: t,
        on: i,
        setTranslate: r,
        setTransition: n,
        overwriteParams: o,
        perspective: a,
        recreateShadows: l,
        getEffectParams: c
    } = s;
    i("beforeInit", () => {
        if (t.params.effect !== e) return;
        t.classNames.push(`${t.params.containerModifierClass}${e}`), a && a() && t.classNames.push(`${t.params.containerModifierClass}3d`);
        const d = o ? o() : {};
        Object.assign(t.params, d), Object.assign(t.originalParams, d)
    }), i("setTranslate _virtualUpdated", () => {
        t.params.effect === e && r()
    }), i("setTransition", (d, f) => {
        t.params.effect === e && n(f)
    }), i("transitionEnd", () => {
        if (t.params.effect === e && l) {
            if (!c || !c().slideShadows) return;
            t.slides.forEach(d => {
                d.querySelectorAll(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").forEach(f => f.remove())
            }), l()
        }
    });
    let u;
    i("virtualUpdate", () => {
        t.params.effect === e && (t.slides.length || (u = !0), requestAnimationFrame(() => {
            u && t.slides && t.slides.length && (r(), u = !1)
        }))
    })
}

function rd(s, e) {
    const t = co(e);
    return t !== e && (t.style.backfaceVisibility = "hidden", t.style["-webkit-backface-visibility"] = "hidden"), t
}

function sd(s) {
    let {swiper: e, duration: t, transformElements: i, allSlides: r} = s;
    const {activeIndex: n} = e,
        o = a => a.parentElement ? a.parentElement : e.slides.find(c => c.shadowRoot && c.shadowRoot === a.parentNode);
    if (e.params.virtualTranslate && t !== 0) {
        let a = !1, l;
        r ? l = i : l = i.filter(c => {
            const u = c.classList.contains("swiper-slide-transform") ? o(c) : c;
            return e.getSlideIndex(u) === n
        }), l.forEach(c => {
            Vs(c, () => {
                if (a || !e || e.destroyed) return;
                a = !0, e.animating = !1;
                const u = new window.CustomEvent("transitionend", {bubbles: !0, cancelable: !0});
                e.wrapperEl.dispatchEvent(u)
            })
        })
    }
}

function nd(s) {
    let {swiper: e, extendParams: t, on: i} = s;
    t({fadeEffect: {crossFade: !1}}), id({
        effect: "fade",
        swiper: e,
        on: i,
        setTranslate: () => {
            const {slides: o} = e, a = e.params.fadeEffect;
            for (let l = 0; l < o.length; l += 1) {
                const c = e.slides[l];
                let d = -c.swiperSlideOffset;
                e.params.virtualTranslate || (d -= e.translate);
                let f = 0;
                e.isHorizontal() || (f = d, d = 0);
                const p = e.params.fadeEffect.crossFade ? Math.max(1 - Math.abs(c.progress), 0) : 1 + Math.min(Math.max(c.progress, -1), 0),
                    m = rd(a, c);
                m.style.opacity = p, m.style.transform = `translate3d(${d}px, ${f}px, 0px)`
            }
        },
        setTransition: o => {
            const a = e.slides.map(l => co(l));
            a.forEach(l => {
                l.style.transitionDuration = `${o}ms`
            }), sd({swiper: e, duration: o, transformElements: a, allSlides: !0})
        },
        overwriteParams: () => ({
            slidesPerView: 1,
            slidesPerGroup: 1,
            watchSlidesProgress: !0,
            spaceBetween: 0,
            virtualTranslate: !e.params.cssMode
        })
    })
}

function tm(s, e, t) {
    const i = `swiper-slide-shadow${` swiper-slide-shadow-${s}`}`, r = co(e);
    let n = r.querySelector(`.${i.split(" ").join(".")}`);
    return n || (n = Ks("div", i.split(" ")), r.append(n)), n
}

function Zn(s) {
    let {swiper: e, extendParams: t, on: i} = s;
    t({
        creativeEffect: {
            limitProgress: 1,
            shadowPerProgress: !1,
            progressMultiplier: 1,
            perspective: !0,
            prev: {translate: [0, 0, 0], rotate: [0, 0, 0], opacity: 1, scale: 1},
            next: {translate: [0, 0, 0], rotate: [0, 0, 0], opacity: 1, scale: 1}
        }
    });
    const r = a => typeof a == "string" ? a : `${a}px`;
    id({
        effect: "creative",
        swiper: e,
        on: i,
        setTranslate: () => {
            const {slides: a, wrapperEl: l, slidesSizesGrid: c} = e,
                u = e.params.creativeEffect, {progressMultiplier: d} = u, f = e.params.centeredSlides, p = Wp(e);
            if (f) {
                const m = c[0] / 2 - e.params.slidesOffsetBefore || 0;
                l.style.transform = `translateX(calc(50% - ${m}px))`
            }
            for (let m = 0; m < a.length; m += 1) {
                const h = a[m], g = h.progress, y = Math.min(Math.max(h.progress, -u.limitProgress), u.limitProgress);
                let v = y;
                f || (v = Math.min(Math.max(h.originalProgress, -u.limitProgress), u.limitProgress));
                const _ = h.swiperSlideOffset, w = [e.params.cssMode ? -_ - e.translate : -_, 0, 0], b = [0, 0, 0];
                let T = !1;
                e.isHorizontal() || (w[1] = w[0], w[0] = 0);
                let x = {translate: [0, 0, 0], rotate: [0, 0, 0], scale: 1, opacity: 1};
                y < 0 ? (x = u.next, T = !0) : y > 0 && (x = u.prev, T = !0), w.forEach((R, q) => {
                    w[q] = `calc(${R}px + (${r(x.translate[q])} * ${Math.abs(y * d)}))`
                }), b.forEach((R, q) => {
                    let I = x.rotate[q] * Math.abs(y * d);
                    b[q] = I
                }), h.style.zIndex = -Math.abs(Math.round(g)) + a.length;
                const C = w.join(", "), P = `rotateX(${p(b[0])}deg) rotateY(${p(b[1])}deg) rotateZ(${p(b[2])}deg)`,
                    E = v < 0 ? `scale(${1 + (1 - x.scale) * v * d})` : `scale(${1 - (1 - x.scale) * v * d})`,
                    A = v < 0 ? 1 + (1 - x.opacity) * v * d : 1 - (1 - x.opacity) * v * d,
                    L = `translate3d(${C}) ${P} ${E}`;
                if (T && x.shadow || !T) {
                    let R = h.querySelector(".swiper-slide-shadow");
                    if (!R && x.shadow && (R = tm("creative", h)), R) {
                        const q = u.shadowPerProgress ? y * (1 / u.limitProgress) : y;
                        R.style.opacity = Math.min(Math.max(Math.abs(q), 0), 1)
                    }
                }
                const k = rd(u, h);
                k.style.transform = L, k.style.opacity = A, x.origin && (k.style.transformOrigin = x.origin)
            }
        },
        setTransition: a => {
            const l = e.slides.map(c => co(c));
            l.forEach(c => {
                c.style.transitionDuration = `${a}ms`, c.querySelectorAll(".swiper-slide-shadow").forEach(u => {
                    u.style.transitionDuration = `${a}ms`
                })
            }), sd({swiper: e, duration: a, transformElements: l, allSlides: !0})
        },
        perspective: () => e.params.creativeEffect.perspective,
        overwriteParams: () => ({watchSlidesProgress: !0, virtualTranslate: !e.params.cssMode})
    })
}

O.registerPlugin(B);

function im() {
    const s = document.querySelectorAll(".breadcrumbs__carousel"), e = document.querySelectorAll(".cardCarousel"),
        t = document.querySelectorAll(".reviewsCarousel"), i = document.querySelectorAll(".articleGallery"),
        r = document.querySelectorAll(".accommodationGallery"), n = document.querySelectorAll(".galleryCarousel");
    s.forEach(o => {
        new pe(o, {modules: [td], slidesPerView: "auto", freeMode: !0})
    }), e.forEach(o => {
        const a = o.id;
        o.dataset.slides;
        const l = document.querySelector(`.cardCarousel__prev[data-carousel="${a}"]`),
            c = document.querySelector(`.cardCarousel__next[data-carousel="${a}"]`);
        let d = new pe(o, {
            modules: [Ot],
            maxBackfaceHiddenSlides: 10,
            spaceBetween: 12,
            slidesPerView: 1.1,
            navigation: {prevEl: l, nextEl: c}
        }).params;

        function f() {
            o.classList.contains("cardCarousel--with-sidebar") ? d.breakpoints = {
                600: {
                    spaceBetween: 14,
                    slidesPerView: 1.5
                },
                800: {spaceBetween: 16, slidesPerView: 1.8},
                1e3: {spaceBetween: 18, slidesPerView: 2.1},
                1200: {spaceBetween: 20, slidesPerView: 1.9},
                1400: {spaceBetween: 22, slidesPerView: 2},
                1600: {spaceBetween: 24, slidesPerView: 2.1},
                1800: {spaceBetween: 26, slidesPerView: 2.2},
                2e3: {spaceBetween: 28, slidesPerView: 2.3},
                2200: {spaceBetween: 30, slidesPerView: 2.4},
                2400: {spaceBetween: 32, slidesPerView: 2.5}
            } : o.classList.contains("cardCarousel--experiences") ? d.breakpoints = {
                500: {
                    spaceBetween: 12,
                    slidesPerView: 1.3
                },
                600: {spaceBetween: 14, slidesPerView: 1.5},
                700: {spaceBetween: 14, slidesPerView: 2},
                800: {spaceBetween: 16, slidesPerView: 2.5},
                1e3: {spaceBetween: 18, slidesPerView: 3},
                1200: {spaceBetween: 20, slidesPerView: 3.5},
                1400: {spaceBetween: 22, slidesPerView: 4},
                1600: {spaceBetween: 24, slidesPerView: 4},
                1800: {spaceBetween: 26, slidesPerView: 4},
                2e3: {spaceBetween: 28, slidesPerView: 4},
                2200: {spaceBetween: 30, slidesPerView: 4},
                2400: {spaceBetween: 32, slidesPerView: 4}
            } : o.classList.contains("cardCarousel--subpages") ? d.breakpoints = {
                600: {
                    spaceBetween: 14,
                    slidesPerView: 1.5
                },
                800: {spaceBetween: 16, slidesPerView: 2},
                1e3: {spaceBetween: 18, slidesPerView: 2.5},
                1200: {spaceBetween: 20, slidesPerView: 3},
                1400: {spaceBetween: 22, slidesPerView: 3},
                1600: {spaceBetween: 24, slidesPerView: 3},
                1800: {spaceBetween: 26, slidesPerView: 3},
                2e3: {spaceBetween: 28, slidesPerView: 3},
                2200: {spaceBetween: 30, slidesPerView: 3},
                2400: {spaceBetween: 32, slidesPerView: 3}
            } : o.classList.contains("cardCarousel--team") ? (d.centerInsufficientSlides = !0, d.breakpoints = {
                600: {
                    spaceBetween: 14,
                    slidesPerView: 1.5
                },
                800: {spaceBetween: 16, slidesPerView: 2},
                1e3: {spaceBetween: 18, slidesPerView: 2.5},
                1200: {spaceBetween: 20, slidesPerView: 3},
                1400: {spaceBetween: 22, slidesPerView: 3},
                1600: {spaceBetween: 24, slidesPerView: 3},
                1800: {spaceBetween: 26, slidesPerView: 4},
                2e3: {spaceBetween: 28, slidesPerView: 4},
                2200: {spaceBetween: 30, slidesPerView: 4},
                2400: {spaceBetween: 32, slidesPerView: 4}
            }) : d.slidesPerView = 3
        }

        f(), window.addEventListener("resize", f)
    }), t.forEach(o => {
        const a = o.querySelector(".reviewsCarousel__container"), l = o.querySelector(".reviewsCarousel__prev"),
            c = o.querySelector(".reviewsCarousel__next");
        new pe(a, {
            modules: [Zn, Ot],
            loop: !0,
            speed: 500,
            effect: "creative",
            creativeEffect: {prev: {translate: [0, -80, 0], opacity: 0}, next: {translate: [0, 80, 0], opacity: 0}},
            navigation: {prevEl: l, nextEl: c}
        })
    }), n.forEach(o => {
        const a = o.querySelector(".galleryCarousel__prev"), l = o.querySelector(".galleryCarousel__next");
        o.querySelectorAll(".swiper-slide").forEach(c => {
            const u = c.cloneNode(!0);
            u.classList.add("swiper-slide-duplicated"), o.querySelector(".swiper-wrapper").appendChild(u)
        });
        const c = new pe(o, {
            modules: [ed, Ot],
            maxBackfaceHiddenSlides: 10,
            loop: !0,
            slidesPerView: "auto",
            spaceBetween: 12,
            centeredSlides: !0,
            slideToClickedSlide: !0,
            observer: !0,
            observeParents: !0,
            resizeObserver: !0,
            autoplay: {delay: 1500, disableOnInteraction: !1},
            navigation: {prevEl: a, nextEl: l},
            breakpoints: {
                600: {spaceBetween: 14},
                800: {spaceBetween: 16},
                1e3: {spaceBetween: 18},
                1200: {spaceBetween: 20},
                1400: {spaceBetween: 22},
                1600: {spaceBetween: 24},
                1800: {spaceBetween: 26},
                2e3: {spaceBetween: 28},
                2200: {spaceBetween: 30},
                2400: {spaceBetween: 32}
            }
        });

        function u() {
            requestAnimationFrame(() => {
                c.update(), c.loopFix(), B.refresh()
            })
        }

        const d = o.querySelectorAll("img"), f = Array.from(d).filter(p => !p.complete);
        f.length === 0 ? u() : f.forEach(p => {
            p.addEventListener("load", u, {once: !0}), p.addEventListener("error", u, {once: !0})
        }), window.addEventListener("load", u, {once: !0}), setTimeout(u, 250), setTimeout(u, 1e3)
    }), i.forEach(o => {
        const a = o.querySelector(".articleGallery__carousel"), l = o.querySelector(".articleGallery__prev"),
            c = o.querySelector(".articleGallery__next"), u = o.querySelector(".articleGallery__pagination");
        new pe(a, {
            modules: [nd, Ot, Jn],
            autoHeight: !0,
            loop: !0,
            effect: "fade",
            fadeEffect: {crossFade: !0},
            navigation: {prevEl: l, nextEl: c},
            pagination: {el: u, clickable: !0},
            on: {
                slideChange: function () {
                    B.refresh()
                }
            }
        })
    }), r.forEach(o => {
        const a = o.querySelector(".accommodationGallery__prev"), l = o.querySelector(".accommodationGallery__next");
        new pe(o, {
            modules: [Zn, Ot, Jn],
            effect: "creative",
            creativeEffect: {
                prev: {translate: ["-25%", 0, 0], scale: .8, shadow: !0},
                next: {translate: ["25%", 0, 0], scale: .8, shadow: !0}
            },
            grabCursor: !0,
            navigation: {prevEl: a, nextEl: l}
        })
    })
}

O.registerPlugin(B);

function rm() {
    document.querySelectorAll(".collapse").forEach(e => {
        const t = e.dataset.collapse, i = document.querySelector(`.collapse__btn[data-collapse="${t}"]`),
            r = i.querySelector(".btn__label"), n = e.querySelector(".collapse__container");
        let o = n.offsetHeight, a;
        i.addEventListener("click", () => {
            o = n.offsetHeight, a = !a, a ? (r.innerHTML = "View less", e.classList.add("is-open"), e.style.height = `${o}px`, B.refresh()) : (r.innerHTML = "View more", e.classList.remove("is-open"), e.style.height = "250px", B.refresh())
        })
    })
}

function sm() {
    let s = document.querySelector(".cursor"), e = s.querySelector("p"), t = document.querySelectorAll("[data-cursor]"),
        i = 0, r = 0, n = null, o = "";
    O.set(s, {xPercent: i, yPercent: r});
    let a = O.quickTo(s, "x", {ease: "power3"}), l = O.quickTo(s, "y", {ease: "power3"});
    const c = () => s.offsetWidth + 16;
    window.addEventListener("mousemove", u => {
        let d = window.innerWidth, f = window.innerHeight, p = window.scrollY, m = u.clientX, h = u.clientY + p, g = i,
            y = r, v = c();
        if (m > d - v && (g = -100), h > p + f * .9 && (y = -120), n) {
            let _ = n.getAttribute("data-cursor");
            _ !== o && (e.innerHTML = _, o = _, v = c())
        }
        O.to(s, {xPercent: g, yPercent: y, duration: .9, ease: "power3"}), a(m), l(h - p)
    }), t.forEach(u => {
        u.addEventListener("mouseenter", () => {
            n = u;
            let d = u.getAttribute("data-cursor");
            d !== o && (e.innerHTML = d, o = d, c())
        })
    })
}

function nm() {
    document.querySelectorAll(".dropdown-container").forEach(e => {
        const t = e.querySelector(".dropdown-button"), i = e.querySelector(".dropdown-button-label"),
            r = e.querySelector(".dropdown-list"), n = document.querySelector("body");

        function o(u) {
            u.stopPropagation(), e.classList.toggle("is-open"), a()
        }

        function a() {
            const u = r.clientHeight, d = window.innerHeight, f = t.getBoundingClientRect().top;
            d - f < u + 50 ? (r.classList.remove("position-bottom"), r.classList.add("position-top")) : (r.classList.remove("position-top"), r.classList.add("position-bottom"))
        }

        function l(u) {
            e.classList.toggle("is-open"), i.innerText = u.target.innerText
        }

        function c(u) {
            !r.contains(u.target) && e.classList.contains("is-open") && e.classList.remove("is-open")
        }

        t.addEventListener("click", o), window.addEventListener("scroll", a), r.addEventListener("click", l), r.addEventListener("click", l), n.addEventListener("click", c)
    })
}

O.registerPlugin(B);

function om() {
    document.querySelectorAll(".filterSidebar--fixed").forEach(e => {
        const t = e.closest(".filterSidebar--fixed-container");
        O.matchMedia().add("(max-width: 1199px)", () => {
            B.create({
                trigger: t,
                start: "top 25%",
                end: "bottom top",
                onToggle: r => console.log("toggled, isActive:", r.isActive),
                toggleClass: {targets: e, className: "is-active"}
            })
        })
    })
}

function am() {
    document.querySelectorAll(".processForm__hidden-toggle").forEach(t => {
        const i = t.dataset.toggle, r = t.querySelector("input"), n = document.getElementById(i);

        function o() {
            r.checked ? n.classList.add("is-revealed") : n.classList.remove("is-revealed")
        }

        o(), document.addEventListener("click", o)
    }), document.querySelectorAll("[data-autoresize]").forEach(t => {
        t.style.boxSizing = "border-box";
        let i = t.offsetHeight - t.clientHeight;
        t.addEventListener("input", r => {
            r.target.style.height = "auto", r.target.style.height = r.target.scrollHeight + i + "px"
        }), t.removeAttribute("data-autoresize")
    }), document.querySelectorAll(".processForm__range").forEach(t => {
        const i = t.querySelector(".processForm__range-track-inner"),
            r = t.querySelector(".processForm__range-mininput"), n = t.querySelector(".processForm__range-maxinput"),
            o = t.querySelector(".processForm__range-minvalue"), a = t.querySelector(".processForm__range-maxvalue"),
            l = 1e3;
        let c, u;
        const d = () => {
            let h = parseInt(r.min), y = parseInt(r.max) - h, v = parseInt(r.value), _ = 100 / (y / (v - h)) + "%";
            i.style.left = _, o.style.left = _;
            let b = window.getComputedStyle(i).getPropertyValue("left");
            t.querySelector(".processForm__range-track").style.setProperty("--left-value", b)
        }, f = () => {
            let h = parseInt(n.min), y = parseInt(n.max) - h, v = parseInt(n.value),
                _ = 100 - 100 / (y / (v - h)) + "%";
            i.style.right = _, a.style.right = _;
            let b = window.getComputedStyle(i).getPropertyValue("right");
            t.querySelector(".processForm__range-track").style.setProperty("--right-value", b)
        }, p = () => {
            c = parseInt(r.value), o.innerHTML = c.toLocaleString("en-US")
        }, m = () => {
            u = parseInt(n.value), a.innerHTML = u.toLocaleString("en-US")
        };
        p(), m(), d(), f(), r.addEventListener("input", h => {
            p(), d(), r.style.zIndex = "2", n.style.zIndex = "0", o.style.zIndex = "2", a.style.zIndex = "0", u - c < l && (r.value = u - l, p(), d())
        }), n.addEventListener("input", h => {
            m(), f(), r.style.zIndex = "0", n.style.zIndex = "2", o.style.zIndex = "0", a.style.zIndex = "2", u - c < l && (n.value = c + l, m(), f())
        })
    })
}

O.registerPlugin(B);

function lm() {
    let s;
    const e = document.querySelector(".siteHeader");
    if (!e || e.dataset.headerInitialized === "true") return;
    window.siteHeaderCleanup?.(), e.dataset.headerInitialized = "true";
    const t = new AbortController;

    function i() {
        s = e.offsetHeight, document.body.style.setProperty("--header-height", `${s}px`)
    }

    const r = B.create({
        trigger: "body",
        start: "top+=100px top",
        end: "max",
        toggleClass: {targets: e, className: "siteHeader--scrolled"}
    });
    i(), window.addEventListener("resize", i, {signal: t.signal}), document.querySelectorAll(".siteSearch__toggle").forEach(a => {
        a.addEventListener("click", () => {
            document.body.classList.toggle("siteSearch--is-open")
        }, {signal: t.signal})
    });
    const n = document.querySelectorAll(".siteHeaderDropdown__toggle"),
        o = document.querySelector(".siteHeaderDropdown__background");
    let l, c = !1, v = !1;

    function b() {
        document.body.classList.remove("siteHeaderDropdown--is-open"), n.forEach(a => a.classList.remove("is-active")), o?.style.setProperty("height", "0")
    }

    function T() {
        c = !0, v = !0, document.body.classList.add("is-scrolling"), b(), clearTimeout(l), l = setTimeout(() => {
            c = !1, document.body.classList.remove("is-scrolling")
        }, 250)
    }

    function u() {
        return !c && !v
    }

    function P(a) {
        v && (!(a?.target instanceof Element) || !e.contains(a.target)) && (v = !1)
    }

    window.addEventListener("scroll", T, {
        passive: !0,
        signal: t.signal
    }), window.addEventListener("wheel", T, {
        passive: !0,
        signal: t.signal
    }), window.addEventListener("touchmove", T, {
        passive: !0,
        signal: t.signal
    }), window.addEventListener("mousemove", P, {
        passive: !0,
        signal: t.signal
    }), e.addEventListener("mouseleave", P, {signal: t.signal}), n.forEach(a => {
        const p = a.dataset.dropdown, m = document.querySelector(`.siteHeaderDropdown#${p}`);
        if (!m) return;
        const h = a.querySelector(":scope > a, :scope > button") || a;
        let y = m.offsetHeight;

        function _() {
            u() && (y = m.scrollHeight, document.body.classList.add("siteHeaderDropdown--is-open"), n.forEach(C => {
                C !== a && C.classList.remove("is-active")
            }), a.classList.add("is-active"), o?.style.setProperty("height", `${y + s}px`))
        }

        function g() {
            p !== "destinationsDropdown" ? _() : _()
        }

        p === "destinationsDropdown" ? h.addEventListener("mousemove", g, {signal: t.signal}) : h.addEventListener("mouseenter", g, {signal: t.signal}), h.addEventListener("focus", _, {signal: t.signal}), a.addEventListener("mouseleave", () => {
            b()
        }, {signal: t.signal})
    }), window.siteHeaderCleanup = () => {
        clearTimeout(l), document.body.classList.remove("is-scrolling"), t.abort(), r.kill()
    }
}

function cm() {
    document.body.classList.remove("navMenu--is-open"), document.body.classList.remove("siteHeaderDropdown--is-open"), document.body.classList.remove("siteSearch--is-open"), document.querySelectorAll(".siteHeaderDropdown__toggle.is-active").forEach(s => {
        s.classList.remove("is-active")
    }), document.querySelector(".siteHeaderDropdown__background")?.style.setProperty("height", "0")
}

O.registerPlugin(B);

function um() {
    const s = document.querySelector(".hero:not(.destinationsHero)");
    if (s) {
        const i = s.querySelector(".hero__main"), r = s.querySelector(".hero__background");
        O.to(i, {
            y: 300,
            ease: "none",
            scrollTrigger: {trigger: s, start: "top top", end: "bottom top", scrub: !0}
        }), r && O.to(r, {
            y: 300,
            ease: "none",
            scrollTrigger: {trigger: s, start: "top top", end: "bottom top", scrub: !0}
        })
    }
    const e = document.querySelector(".processHero");
    if (e) {
        const i = e.querySelector(".processHero__background");
        O.to(i, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {trigger: e, start: "top top", end: "bottom top", scrub: !0}
        })
    }
    const t = document.querySelector(".destinationsHero");
    if (t) {
        const i = t.querySelector(".destinationsHero__images"), r = t.querySelector(".hero__main");
        O.to(t, {
            backgroundColor: "#efeeed",
            ease: "none",
            scrollTrigger: {trigger: t, start: "top top", end: "bottom top", scrub: !0}
        }), O.to(i, {
            yPercent: 100,
            autoAlpha: 0,
            scale: 1.5,
            filter: "blur(40px)",
            backgroundColor: "#efeeed",
            ease: "none",
            scrollTrigger: {trigger: t, start: "top top", end: "bottom top", scrub: !0}
        }), O.to(r, {
            yPercent: 50,
            autoAlpha: 0,
            scale: 1.1,
            filter: "blur(20px)",
            ease: "none",
            scrollTrigger: {trigger: t, start: "top top", end: "bottom 50%", scrub: !0}
        })
    }
}

function dm() {
    if (document.querySelector(".interactiveMap")) {
        let t = function () {
            const i = Array.from(document.querySelectorAll(".interactiveMap__content"));
            let r = Math.max(...i.map(n => n.getBoundingClientRect().height));
            document.querySelector(".interactiveMap__contents").style.setProperty("height", `${r}px`)
        };
        var s = t;
        const e = document.querySelectorAll(".interactiveMap__link");
        t(), window.addEventListener("resize", t), e.forEach(i => {
            const r = i.dataset.link, n = document.querySelector(`.interactiveMap__content[data-content="${r}"]`),
                o = document.querySelector(`.interactiveMap__region[data-map="${r}"]`);
            i.addEventListener("mouseenter", () => {
                document.querySelector(".interactiveMap__content.active").classList.remove("active"), document.querySelector(".interactiveMap__region.active").classList.remove("active"), n.classList.add("active"), o.classList.add("active")
            })
        })
    }
}

function fm() {
    document.querySelectorAll("[data-marquee-scroll-direction-target]").forEach(s => {
        const e = s.querySelector("[data-marquee-collection-target]"),
            t = s.querySelector("[data-marquee-scroll-target]");
        if (!e || !t) return;
        const {marqueeSpeed: i, marqueeDirection: r, marqueeDuplicate: n, marqueeScrollSpeed: o} = s.dataset,
            a = parseFloat(i), l = r === "right" ? 1 : -1, c = parseInt(n || 0), u = parseFloat(o),
            d = window.innerWidth < 479 ? .25 : window.innerWidth < 991 ? .5 : 1;
        let f = a * (e.offsetWidth / window.innerWidth) * d;
        if (t.style.marginLeft = `${u * -1}%`, t.style.width = `${u * 2 + 100}%`, c > 0) {
            const v = document.createDocumentFragment();
            for (let _ = 0; _ < c; _++) v.appendChild(e.cloneNode(!0));
            t.appendChild(v)
        }
        const p = s.querySelectorAll("[data-marquee-collection-target]"),
            m = O.to(p, {xPercent: -100, repeat: -1, duration: f, ease: "linear"}).totalProgress(.5);
        O.set(p, {xPercent: l === 1 ? 100 : -100}), m.timeScale(l), m.play(), s.setAttribute("data-marquee-status", "normal"), B.create({
            trigger: s,
            start: "top bottom",
            end: "bottom top",
            onUpdate: v => {
                const _ = v.direction === 1, w = _ ? -l : l;
                m.timeScale(w), s.setAttribute("data-marquee-status", _ ? "normal" : "inverted")
            }
        });
        const h = O.timeline({scrollTrigger: {trigger: s, start: "0% 100%", end: "100% 0%", scrub: 0}}),
            g = l === -1 ? u : -u, y = -g;
        h.fromTo(t, {x: `${g}vw`}, {x: `${y}vw`, ease: "none"})
    })
}

/**
 * VenoBox 2.1.8
 * Copyright 2013-2024 Nicola Franchini
 * @license:
 */let od, In, ci, Sr, ad, eo, $, oe, ys, Fo, cc, ba, Qs, ld, Zr, ws, Br, Jt, Pr, gi, Vo, fr, pr, ce, cd, ud, Sa, dd,
    $r, xa, fd, pd, Wt, ei, hd, uc, Ta, es;
const Za = '<svg xmlns="" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">', el = "</svg>",
    pm = Za + '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>' + el,
    hm = Za + '<path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/>' + el,
    mm = Za + '<path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>' + el;
let tl = 0, to = 0, wn = 0, gm = 50, io = !1, ro = !1, so = !1, Bi, md = !1;
const vm = {
    bounce: ["sk-bounce", "sk-bounce-dot", 2],
    chase: ["sk-chase", "sk-chase-dot", 6],
    circle: ["sk-circle", "sk-circle-dot", 12],
    "circle-fade": ["sk-circle-fade", "sk-circle-fade-dot", 12],
    flow: ["sk-flow", "sk-flow-dot", 3],
    fold: ["sk-fold", "sk-fold-cube", 4],
    grid: ["sk-grid", "sk-grid-cube", 9],
    plane: ["sk-plane", "", 0],
    pulse: ["sk-pulse", "", 5],
    swing: ["sk-swing", "sk-swing-dot", 2],
    wander: ["sk-wander", "sk-wander-cube", 3],
    wave: ["sk-wave", "sk-wave-rect", 5]
}, _m = {
    selector: ".venobox",
    autoplay: !1,
    bgcolor: "#fff",
    border: "0",
    customClass: !1,
    infinigall: !1,
    maxWidth: "100%",
    navigation: !0,
    navKeyboard: !0,
    navTouch: !0,
    navSpeed: 300,
    numeration: !1,
    overlayClose: !0,
    overlayColor: "rgba(23,23,23,0.95)",
    popup: !1,
    ratio: "16x9",
    share: !1,
    shareStyle: "pill",
    spinner: "bounce",
    spinColor: "#d2d2d2",
    titleattr: "title",
    titlePosition: "top",
    titleStyle: "bar",
    toolsBackground: "#1C1C1C",
    toolsColor: "#d2d2d2",
    onPreOpen: function () {
        return !0
    },
    onPostOpen: function () {
    },
    onPreClose: function () {
        return !0
    },
    onNavComplete: function () {
    },
    onContentLoaded: function () {
    },
    onInit: function () {
    },
    jQuerySelectors: !1,
    focusItem: !1,
    fitView: !1,
    initialScale: .9,
    transitionSpeed: 200
};

function ym(s) {
    if (!s) return "Loading...";
    let e = '<div class="sk-center ' + s[0] + '">', t = 0;
    for (t = 0; t < s[2]; t++) e += '<div class="' + s[1] + '"></div>';
    return e += "</div>", e
}

function Js(s, e, t) {
    if (Object.prototype.toString.call(s) === "[object Object]") {
        let i;
        for (i in s) Object.prototype.hasOwnProperty.call(s, i) && e.call(t, s[i], i, s)
    } else {
        let i = 0, r = s.length;
        for (i = 0; i < r; i++) e.call(t, s[i], i, s)
    }
}

function wm(s, e) {
    let t = {};
    return Js(s, function (i, r) {
        t[r] = s[r]
    }), Js(e, function (i, r) {
        t[r] = e[r]
    }), t
}

function uo(s) {
    return s
}

function fo({timing: s, draw: e, duration: t}) {
    let i = performance.now();
    requestAnimationFrame(function r(n) {
        let o = (n - i) / t;
        o > 1 && (o = 1);
        let a = s(o);
        e(a), o < 1 && requestAnimationFrame(r)
    })
}

function bm(s) {
    let e, t, i,
        r = /(https?:\/\/)?((www\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(v\/|v=|vi=|vi\/|e\/|embed\/|user\/.*\/u\/\d+\/)|youtu\.be\/)([_0-9a-z-]+)/i;
    if (t = s.match(r), t && t[7]) e = "youtube", i = t[7]; else {
        let n = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
        t = s.match(n), t && t[5] && (e = "vimeo", i = t[5])
    }
    return {type: e, id: i}
}

function Sm(s) {
    let e = "", i = decodeURIComponent(s).split("?");
    if (i[1] !== void 0) {
        let r = i[1].split("&"), n, o;
        for (o = 0; o < r.length; o++) n = r[o].split("="), e = e + "&" + n[0] + "=" + n[1]
    }
    return encodeURI(e)
}

function xm(s) {
    return ro.innerHTML = s, ro.querySelectorAll("img")
}

function gd(s) {
    if (!s) return !1;
    Pr = !0, oe = s, fr = !1, pr = !1, cd = s.getAttribute("data-maxwidth") || s.settings.maxWidth, ud = s.getAttribute("data-overlay") || s.settings.overlayColor, Sa = s.getAttribute("data-ratio") || s.settings.ratio, dd = s.hasAttribute("data-autoplay") || s.settings.autoplay, $r = s.getAttribute("data-href") || s.getAttribute("href"), xa = s.getAttribute("data-customclass") || s.settings.customClass, Ta = s.getAttribute(s.settings.titleattr) || "", hd = s.getAttribute("data-border") || s.settings.border, fd = s.hasAttribute("data-fitview") || s.settings.fitView
}

function il() {
    if (!oe || !document.body.classList.contains("vbox-open") || oe.settings.onPreClose && typeof oe.settings.onPreClose == "function" && oe.settings.onPreClose(oe, Zr, Wt, ei) === !1) return !1;
    document.body.removeEventListener("keydown", vd), document.body.classList.remove("vbox-open"), oe.settings.focusItem && oe.focus(), fo({
        duration: 200,
        timing: uo,
        draw: function (s) {
            ce.style.opacity = 1 - s, s === 1 && ce.remove()
        }
    })
}

function Tm() {
    Lr(Wt)
}

function Em() {
    Lr(ei)
}

function vd(s) {
    s.keyCode === 27 && il(), es || (s.keyCode == 37 && pr === !0 && Lr(ei), s.keyCode == 39 && fr === !0 && Lr(Wt), es = setTimeout(() => {
        es = null
    }, 100))
}

function Cm() {
    Pr = !1, $.style.opacity = 0, $.innerHTML = gi, Dm();
    let s = $.querySelector(":first-child");
    s.classList.add("vbox-child"), s.style.backgroundColor = oe.settings.bgcolor, s.style.transform = "scale(" + oe.settings.initialScale + ")", s.style.transition = "transform " + oe.settings.transitionSpeed + "ms";
    let e = $.querySelector(".vbox-child img");
    e && e.addEventListener("dragstart", function (t) {
        t.preventDefault()
    }), eo.scrollTo(0, 0), s.style.transform = "scale(1)", ce.style.setProperty("--vbox-padding", hd), ce.style.setProperty("--vbox-max-width", cd), Js(ce.classList, function (t) {
        t !== "vbox-overlay" && ce.classList.remove(t)
    }), xa && ce.classList.add(xa), fd ? $.classList.add("vbox-fit") : $.classList.remove("vbox-fit"), fo({
        duration: oe.settings.transitionSpeed,
        timing: uo,
        draw: function (t) {
            $.style.opacity = t, t === 1 && Qs.classList.add("vbox-hidden")
        }
    }), oe.settings.onContentLoaded && typeof oe.settings.onContentLoaded == "function" && oe.settings.onContentLoaded(gi)
}

function hi(s) {
    $.classList.contains("vbox-" + s) || Cm()
}

function Pm(s, e) {
    $.classList.add("vbox-loading"), gi = '<div class="venoratio venoratio-' + e + '"><iframe src="' + s + '"></iframe></div>', $.classList.remove("vbox-loading"), hi("animated")
}

function Lm(s, e, t) {
    $.classList.add("vbox-loading");
    let i, r = bm(s);
    if (r.type == "vimeo" || r.type == "youtube") {
        let n;
        i = t ? "?rel=0&autoplay=1" : "?rel=0";
        let o = i + Sm(s);
        r.type == "vimeo" ? n = "" : r.type == "youtube" && (n = ""), gi = '<div class="venoratio venoratio-' + e + '"><iframe webkitallowfullscreen mozallowfullscreen allowfullscreen allow="autoplay" frameborder="0" src="' + n + r.id + o + '"></iframe></div>'
    } else i = t ? " autoplay" : "", gi = '<div class="venoratio venoratio-' + e + '"><video src="' + s + '"' + i + " controls>Your browser does not support the video tag.</video></div>";
    $.classList.remove("vbox-loading"), hi("animated")
}

function Mm(s) {
    let e = document.querySelector(s);
    e && ($.classList.add("vbox-loading"), gi = '<div class="vbox-inline">' + e.innerHTML + "</div>", $.classList.remove("vbox-loading"), hi("animated"))
}

function Am() {
    if (ws = xm(gi), ws.length) {
        let s = 0;
        Js(ws, function (e) {
            let t = e.src;
            const i = new Image;
            i.onload = function () {
                s++, s == ws.length && ($.classList.remove("vbox-loading"), hi("animated"))
            }, i.onerror = function () {
                s++, s == ws.length && ($.classList.remove("vbox-loading"), hi("animated"))
            }, i.src = t
        })
    } else $.classList.remove("vbox-loading"), hi("animated")
}

function km(s) {
    $.classList.add("vbox-loading");
    let e = new XMLHttpRequest;
    e.open("GET", s, !0), e.onload = function () {
        gi = '<div class="vbox-inline">' + e.response + "</div>", Am()
    }, e.onerror = function () {
        gi = '<div class="vbox-inline"></div>', $.classList.remove("vbox-loading"), hi("animated")
    }, e.send()
}

function Om(s) {
    so.onload = function () {
        gi = '<div class="vbox-child"><img src="' + s + '"></div>', $.classList.remove("vbox-loading"), hi("animated")
    }, so.src = s
}

function bn(s) {
    if (!Pr) {
        let e = oe.settings.navSpeed * .84;
        $.style.transition = "margin " + e + "ms ease-out, opacity " + e + "ms ease-out", tl = to = s.type === "touchstart" ? s.touches[0].pageX : s.pageX, pd = ba = s.type === "touchstart" ? s.touches[0].pageY : s.pageY, io = !0
    }
}

function Fr(s) {
    if (io) {
        io = !1;
        let e = oe, t = !1;
        wn = to - tl, wn < 0 && fr && (e = Wt, t = !0), wn > 0 && pr && (e = ei, t = !0), Math.abs(wn) >= gm && t ? Lr(e) : ($.style.marginLeft = 0, $.style.opacity = 1)
    }
}

function Sn(s) {
    if (io && !Pr) {
        to = s.type === "touchmove" ? s.touches[0].pageX : s.pageX, ba = s.type === "touchmove" ? s.touches[0].pageY : s.pageY, Fo = to - tl, cc = ba - pd;
        let e = Math.abs(Fo), t = Math.abs(cc);
        if (e > t && e <= 180) {
            let i = (1 - e / 180) * 1.5;
            s.preventDefault(), $.style.marginLeft = Fo + "px", $.style.opacity = i
        }
    }
}

function Im(s) {
    if (navigator.canShare) {
        const t = {url: s};
        ci.insertAdjacentHTML("beforeend", '<div class="vbox-link-btn vbox-share-mobile">' + hm + "</div>"), ci.querySelector(".vbox-share-mobile").addEventListener("click", function (r) {
            r.preventDefault(), navigator.share(t)
        })
    }
    ci.insertAdjacentHTML("beforeend", '<a target="_blank" href="' + s + '" download>' + pm + "</a>"), ci.insertAdjacentHTML("beforeend", '<div class="vbox-tooltip"><div class="vbox-link-btn vbox-share-copy"><span class="vbox-tooltip-text" id="myTooltip"></span>' + mm + "</div ></div>"), ci.querySelector(".vbox-share-copy").addEventListener("click", function (t) {
        t.preventDefault();
        let i = document.getElementById("myTooltip");
        navigator.clipboard.writeText(s).then(function () {
            i.innerHTML = '<div class="vbox-tooltip-inner">Copied</div>'
        }, function () {
            console.log("copy failed")
        })
    })
}

function Dm() {
    md ? ($.classList.add("vbox-grab"), $.addEventListener("touchstart", bn, !1), $.addEventListener("touchend", Fr, !1), $.addEventListener("touchmove", Sn, !1), $.addEventListener("mousedown", bn, !1), $.addEventListener("mouseup", Fr, !1), $.addEventListener("mouseout", Fr, !1), $.addEventListener("mousemove", Sn, !1)) : ($.classList.remove("vbox-grab"), $.removeEventListener("touchstart", bn, !1), $.removeEventListener("touchend", Fr, !1), $.removeEventListener("touchmove", Sn, !1), $.removeEventListener("mousedown", bn, !1), $.removeEventListener("mouseup", Fr, !1), $.removeEventListener("mouseout", Fr, !1), $.removeEventListener("mousemove", Sn, !1))
}

function _d(s) {
    if (!s) return !1;
    uc = s.dataset.gall, Vo = s.settings.numeration, Br = s.settings.infinigall, ci.innerHTML = "";
    let e = s.dataset.vbtype;
    s.settings.share && e !== "iframe" && e !== "inline" && e !== "ajax" && Im(s.href), Jt = document.querySelectorAll('.vbox-item[data-gall="' + uc + '"]'), ys = Array.prototype.indexOf.call(Jt, s), Jt.length < 2 && (Vo = !1), Jt.length < 3 && (Br = !1), Wt = Jt[ys + 1], ei = Jt[ys - 1], !Wt && Br && (Wt = Jt[0]), !ei && Br && (ei = Jt[Jt.length - 1]), Jt.length >= 1 ? (Zr = ys + 1, In.innerHTML = Zr + " / " + Jt.length) : Zr = 1, Vo ? In.classList.remove("vbox-hidden") : In.classList.add("vbox-hidden"), Ta !== "" ? Sr.classList.remove("vbox-hidden") : Sr.classList.add("vbox-hidden"), Sr.innerHTML = Ta, pr = !1, fr = !1, (Wt || Br) && (fr = !0), (ys > 0 || Br) && (pr = !0), md = (pr || fr) && s.settings.navTouch;
    let t = ce.querySelector(".vbox-next"), i = ce.querySelector(".vbox-prev");
    pr ? i.classList.remove("vbox-hidden") : i.classList.add("vbox-hidden"), fr ? t.classList.remove("vbox-hidden") : t.classList.add("vbox-hidden"), s.settings.navigation || (t.classList.add("vbox-hidden"), i.classList.add("vbox-hidden"))
}

function yd(s) {
    if (!s) return !1;
    od.style.backgroundColor = ud, ld.innerHTML = ym(vm[s.settings.spinner]), ce.style.setProperty("--sk-color", s.settings.spinColor), Qs.classList.remove("vbox-hidden"), ci.classList.remove("vbox-top", "vbox-bottom"), Sr.classList.remove("vbox-top", "vbox-bottom"), s.settings.titlePosition == "top" ? (Sr.classList.add("vbox-top"), ci.classList.add("vbox-bottom")) : (Sr.classList.add("vbox-bottom"), ci.classList.add("vbox-top"));
    let e = s.settings.titleStyle === "bar" ? "100%" : "auto", t = s.settings.titleStyle === "pill" ? "5em" : "0",
        i = s.settings.shareStyle === "bar" ? "100%" : "auto", r = s.settings.shareStyle === "pill" ? "5em" : "0",
        n = s.settings.titleStyle === "transparent" ? "transparent" : s.settings.toolsBackground,
        o = s.settings.shareStyle === "transparent" ? "transparent" : s.settings.toolsBackground;
    ce.style.setProperty("--vbox-title-width", e), ce.style.setProperty("--vbox-title-radius", t), ce.style.setProperty("--vbox-share-width", i), ce.style.setProperty("--vbox-share-radius", r), ce.style.setProperty("--vbox-tools-color", s.settings.toolsColor), ce.style.setProperty("--vbox-title-background", n), ce.style.setProperty("--vbox-share-background", o)
}

function wd() {
    if (!oe) return !1;
    switch (oe.dataset.vbtype) {
        case"iframe":
            Pm($r, Sa);
            break;
        case"inline":
            Mm($r);
            break;
        case"ajax":
            km($r);
            break;
        case"video":
            Lm($r, Sa, dd);
            break;
        default:
            Om($r)
    }
}

function Lr(s) {
    if (!s || Pr || !document.body.classList.contains("vbox-open")) return !1;
    gd(s), yd(s);
    const e = oe.settings.navSpeed * .84;
    $.style.transition = "margin " + e + "ms ease-out, opacity " + e + "ms ease-out", s === ei && $.classList.add("swipe-right"), s === Wt && $.classList.add("swipe-left"), Qs.classList.remove("vbox-hidden");
    const t = $.style.opacity;
    $.classList.add("vbox-animated", "vbox-loading"), Bi = $.cloneNode(!1), Bi.classList.add("cloned"), Bi.classList.remove("swipe-left", "swipe-right"), Bi.style.opacity = 0, Bi.style.marginLeft = "0", Bi.style.marginRight = "0";
    const i = $;
    eo.append(Bi), $ = Bi, $.classList.remove("cloned"), _d(s), fo({
        duration: oe.settings.navSpeed,
        timing: uo,
        draw: function (r) {
            i.style.opacity = t - r / t, r === 1 && (i.remove(), $.classList.remove("vbox-animated"), hi("loading"), Pr = !1, oe.settings.onNavComplete && typeof oe.settings.onNavComplete == "function" && oe.settings.onNavComplete(oe, Zr, Wt, ei))
        }
    }), wd()
}

function Ea(s) {
    if (document.body.classList.contains("vbox-open") || !s || s.settings.onPreOpen && typeof s.settings.onPreOpen == "function" && s.settings.onPreOpen(s) === !1) return !1;
    gd(s), document.body.insertAdjacentHTML("beforeend", ad), document.body.classList.add("vbox-open"), ce = document.querySelector(".vbox-overlay"), od = ce.querySelector(".vbox-backdrop"), eo = ce.querySelector(".vbox-container"), $ = eo.querySelector(".vbox-content"), In = ce.querySelector(".vbox-num"), ci = ce.querySelector(".vbox-share"), Sr = ce.querySelector(".vbox-title"), Qs = ce.querySelector(".vbox-preloader"), ld = Qs.querySelector(".vbox-preloader-inner"), ce.style.opacity = 0, yd(s), _d(s), $.classList.add("vbox-animated", "vbox-loading"), fo({
        duration: 200,
        timing: uo,
        draw: function (e) {
            ce.style.opacity = e, e === 1 && ($.classList.remove("vbox-animated"), Pr = !1, hi("loading"), oe.settings.onPostOpen && typeof oe.settings.onPostOpen == "function" && oe.settings.onPostOpen(oe, Zr, Wt, ei))
        }
    }), wd(), s.settings.navKeyboard && (document.body.addEventListener("keydown", vd), document.body.addEventListener("keyup", () => {
        es && (clearTimeout(es), es = null)
    })), document.querySelector(".vbox-prev").addEventListener("click", function () {
        Lr(ei)
    }), document.querySelector(".vbox-next").addEventListener("click", function () {
        Lr(Wt)
    }), ce.addEventListener("click", function (e) {
        let t = document.querySelector(".vbox-close");
        t && (t.contains(e.target) || t === e.target || oe.settings.overlayClose && (e.target.classList.contains("vbox-overlay") || e.target.classList.contains("vbox-content") || e.target.classList.contains("vbox-backdrop") || e.target.classList.contains("vbox-close") || e.target.classList.contains("vbox-preloader") || e.target.classList.contains("vbox-container"))) && il()
    })
}

function Rm(s, e) {
    e.onInit && typeof e.onInit == "function" && e.onInit(s);
    let t = e.jQuerySelectors || document.querySelectorAll(e.selector);
    if (ad = '<div class="vbox-overlay"><div class="vbox-backdrop"></div>' + '<div class="vbox-preloader"><div class="vbox-preloader-inner"></div></div>' + '<div class="vbox-container"><div class="vbox-content"></div></div>' + '<div class="vbox-title"></div><div class="vbox-left-corner"><div class="vbox-num">0/0</div></div><div class="vbox-close"><svg xmlns="" width="1em" height="1em" fill="currentColor" class="vbox-close-icon" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/><path fill-rule="evenodd" d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/></svg></div>' + '<a class="vbox-next"><span>Next</span></a><a class="vbox-prev"><span>Prev</span></a>' + '<div class="vbox-share"></div>' + "</div>", ro = ro || document.createElement("div"), so = so || new Image, Js(t, function (a) {
        if (a instanceof Element) {
            if (a.classList.contains("vbox-item")) return !0;
            a.settings = e, a.classList.add("vbox-item"), a.addEventListener("click", function (l) {
                return l.preventDefault(), a.blur(), Ea(a), !1
            })
        }
    }), e.popup) {
        let a = document.querySelector(e.popup);
        a.settings = e, Ea(a)
    }
}

const bd = function (s) {
    const e = {};
    let t = wm(_m, s || {});
    return e.close = il, e.next = Tm, e.prev = Em, e.open = Ea, e.settings = t, Rm(e, t), e
};
typeof jQuery == "function" && function (s) {
    s.fn.extend({
        venobox: function (e) {
            const t = e || {};
            t.jQuerySelectors = this, new bd(t)
        }
    })
}(jQuery);

function qm() {
    new bd, document.querySelectorAll(".venobox").forEach(e => {
        e.addEventListener("click", () => {
            setTimeout(() => {
                document.querySelector(".vbox-overlay").setAttribute("data-lenis-prevent", "")
            }, 100)
        })
    })
}

var si = {}, No = {}, dc;

function zm() {
    return dc || (dc = 1, function (s) {
        Object.defineProperty(s, "__esModule", {value: !0}), s.getUniqId = function () {
            return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase()
        }, s.getWindowWidth = function () {
            return document && document.documentElement ? document.documentElement.clientWidth : window && window.innerWidth ? window.innerWidth : 0
        }, s.getWindowHeight = function () {
            return window.innerHeight || document.documentElement.clientHeight || 0
        }, s.hasClass = function (e, t) {
            return e.classList ? e.classList.contains(t) : new RegExp("(^| )" + t + "( |$)", "gi").test(e.className)
        }, s.addClass = function (e, t) {
            e.classList ? e.classList.add(t) : e.className += " " + t
        }, s.removeClass = function (e, t) {
            e.classList ? e.classList.remove(t) : e.className = e.className.replace(new RegExp("(^|\\b)" + t.split(" ").join("|") + "(\\b|$)", "gi"), " ")
        }, s.getScrollTop = function () {
            return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
        }, s.wrap = function (e, t) {
            e.parentNode.insertBefore(t, e), t.appendChild(e)
        }, s.after = function (e, t) {
            e.insertAdjacentHTML("afterend", t)
        }, s.isIE = function () {
            var e = window.navigator.userAgent.toLowerCase();
            return !!(e.match(/(msie|MSIE)/) || e.match(/(T|t)rident/))
        }, s.triggerEvent = function (e, t, i) {
            var r;
            window.CustomEvent ? r = new CustomEvent(t, {cancelable: !0}) : (r = document.createEvent("CustomEvent"), r.initCustomEvent(t, !1, !1, i)), e.dispatchEvent(r)
        }, s.append = function (e, t) {
            var i = document.createElement("div");
            for (i.innerHTML = t; i.children.length > 0;) e.appendChild(i.children[0])
        }, s.prepend = function (e, t) {
            var i = document.createElement("div");
            for (i.innerHTML = t; i.children.length > 0;) e.insertBefore(i.children[0], e.firstChild)
        }, s.matches = function (e, t) {
            for (var i = (e.document || e.ownerDocument).querySelectorAll(t), r = i.length; --r >= 0 && i.item(r) !== e;) ;
            return r > -1
        }, s.findAncestor = function (e, t) {
            if (typeof e.closest == "function") return e.closest(t) || null;
            for (; e && e !== document;) {
                if (s.matches(e, t)) return e;
                e = e.parentElement
            }
            return null
        }
    }(No)), No
}

var fc;

function Bm() {
    if (fc) return si;
    fc = 1;
    var s = si && si.__assign || function () {
        return s = Object.assign || function (o) {
            for (var a, l = 1, c = arguments.length; l < c; l++) {
                a = arguments[l];
                for (var u in a) Object.prototype.hasOwnProperty.call(a, u) && (o[u] = a[u])
            }
            return o
        }, s.apply(this, arguments)
    }, e = si && si.__awaiter || function (o, a, l, c) {
        function u(d) {
            return d instanceof l ? d : new l(function (f) {
                f(d)
            })
        }

        return new (l || (l = Promise))(function (d, f) {
            function p(g) {
                try {
                    h(c.next(g))
                } catch (y) {
                    f(y)
                }
            }

            function m(g) {
                try {
                    h(c.throw(g))
                } catch (y) {
                    f(y)
                }
            }

            function h(g) {
                g.done ? d(g.value) : u(g.value).then(p, m)
            }

            h((c = c.apply(o, a || [])).next())
        })
    }, t = si && si.__generator || function (o, a) {
        var l = {
            label: 0, sent: function () {
                if (d[0] & 1) throw d[1];
                return d[1]
            }, trys: [], ops: []
        }, c, u, d, f;
        return f = {
            next: p(0),
            throw: p(1),
            return: p(2)
        }, typeof Symbol == "function" && (f[Symbol.iterator] = function () {
            return this
        }), f;

        function p(h) {
            return function (g) {
                return m([h, g])
            }
        }

        function m(h) {
            if (c) throw new TypeError("Generator is already executing.");
            for (; l;) try {
                if (c = 1, u && (d = h[0] & 2 ? u.return : h[0] ? u.throw || ((d = u.return) && d.call(u), 0) : u.next) && !(d = d.call(u, h[1])).done) return d;
                switch (u = 0, d && (h = [h[0] & 2, d.value]), h[0]) {
                    case 0:
                    case 1:
                        d = h;
                        break;
                    case 4:
                        return l.label++, {value: h[1], done: !1};
                    case 5:
                        l.label++, u = h[1], h = [0];
                        continue;
                    case 7:
                        h = l.ops.pop(), l.trys.pop();
                        continue;
                    default:
                        if (d = l.trys, !(d = d.length > 0 && d[d.length - 1]) && (h[0] === 6 || h[0] === 2)) {
                            l = 0;
                            continue
                        }
                        if (h[0] === 3 && (!d || h[1] > d[0] && h[1] < d[3])) {
                            l.label = h[1];
                            break
                        }
                        if (h[0] === 6 && l.label < d[1]) {
                            l.label = d[1], d = h;
                            break
                        }
                        if (d && l.label < d[2]) {
                            l.label = d[2], l.ops.push(h);
                            break
                        }
                        d[2] && l.ops.pop(), l.trys.pop();
                        continue
                }
                h = a.call(o, l)
            } catch (g) {
                h = [6, g], u = 0
            } finally {
                c = d = 0
            }
            if (h[0] & 5) throw h[1];
            return {value: h[0] ? h[1] : void 0, done: !0}
        }
    };
    Object.defineProperty(si, "__esModule", {value: !0});
    var i = zm(), r = {
        backBtnClass: "js-menu-back-btn",
        disableMenuClass: "js-disable-menu",
        activeMenuClass: "active",
        flattenedClass: "flattened",
        collapseClass: "js-collapse",
        fetchAttribute: "data-fetch-url",
        linkOnToggle: !1,
        prependHTML: function (o) {
            return '<li><a href="#" class="js-menu-back-btn">&larr; Back </a></li>'
        },
        appendHTML: function (o) {
            return '<span class="multi-menu-arrow"></span>'
        },
        levelLimit: 1 / 0
    }, n = function () {
        function o(a, l) {
            l === void 0 && (l = {}), this.childCount = 0, this.multiMenu = typeof a == "string" ? document.querySelector(a) : a, this.opt = s(s({}, r), l), i.addClass(this.multiMenu, "multi-menu"), this.setMenu(this.multiMenu.querySelectorAll("ul")), this.setActiveMenu()
        }

        return o.prototype.setLevels = function (a, l) {
            var c = this;
            [].forEach.call(a, function (d) {
                if (!d.dataset.level) {
                    var f = 0, p = d, m = "ul ul", h = !1;
                    if (i.hasClass(d, c.opt.disableMenuClass)) {
                        var g = d.querySelectorAll("ul");
                        [].forEach.call(g, function (v) {
                            i.addClass(v, c.opt.disableMenuClass)
                        });
                        return
                    }
                    for (; p !== null;) {
                        if (f += 1, f > c.opt.levelLimit) {
                            h = !0;
                            break
                        }
                        p = i.findAncestor(p, m), m += " ul"
                    }
                    if (!h) {
                        var y = i.findAncestor(d.parentElement, "ul");
                        y && (d.dataset.parentId = y.dataset.id), d.dataset.id || (d.dataset.id = "" + c.childCount, c.childCount++), d.dataset.level = f + l
                    }
                }
            });
            var u = this.getMaxLevel();
            [].forEach.call(a, function (d) {
                d.style.zIndex = "" + (u - parseInt(d.dataset.level, 10))
            })
        }, o.prototype.getMaxLevel = function () {
            var a = 0;
            return [].forEach.call(this.multiMenu.querySelectorAll("ul"), function (l) {
                var c = parseInt(l.dataset.level, 10);
                c > a && (a = c)
            }), a
        }, o.prototype.flattenList = function (a) {
            var l = this;
            [].forEach.call(a, function (c) {
                if (!i.hasClass(c, l.opt.flattenedClass)) {
                    if (c.previousElementSibling && c.previousElementSibling.dataset && (c.previousElementSibling.dataset.ulId = c.dataset.id, i.append(c.previousElementSibling, l.opt.appendHTML(c.previousElementSibling))), l.opt.prependHTML) {
                        var u = l.multiMenu.querySelector('[data-ul-id="' + c.dataset.id + '"]');
                        u && i.prepend(c, l.opt.prependHTML(u))
                    }
                    l.multiMenu.appendChild(c), i.addClass(c, l.opt.flattenedClass)
                }
            })
        }, o.prototype.backLink = function (a) {
            var l = this, c = i.findAncestor(a, "ul"), u = c.dataset.parentId;
            if (u) {
                var d = this.multiMenu.querySelectorAll("ul");
                [].forEach.call(d, function (p) {
                    i.removeClass(p, l.opt.activeMenuClass)
                });
                var f = [].find.call(d, function (p) {
                    return p.dataset.id === u
                });
                f.style.display = "block", setTimeout(function () {
                    i.addClass(f, l.opt.activeMenuClass), f.style.transform = "translateX(0)"
                }, 100), this.fetchList(f)
            }
        }, o.prototype.fetchList = function (a) {
            var l = this, c = a.querySelectorAll("a");
            [].forEach.call(c, function (u) {
                return e(l, void 0, void 0, function () {
                    var d, f, p;
                    return t(this, function (m) {
                        switch (m.label) {
                            case 0:
                                return u ? (d = u.getAttribute(this.opt.fetchAttribute), d ? [4, fetch(d)] : [2]) : [2];
                            case 1:
                                return f = m.sent(), [4, f.text()];
                            case 2:
                                return p = m.sent(), u.removeAttribute(this.opt.fetchAttribute), u.insertAdjacentHTML("afterend", p), this.setMenu(this.multiMenu.querySelectorAll("ul"), parseInt(a.dataset.level, 10)), [2]
                        }
                    })
                })
            })
        }, o.prototype.forwardLink = function (a) {
            var l = this, c = i.findAncestor(a, "ul");
            c.style.transform = "translateX(-100%)";
            var u = this.multiMenu.querySelectorAll("ul");
            [].forEach.call(u, function (d) {
                if (i.removeClass(d, l.opt.activeMenuClass), a.dataset.ulId === d.dataset.id || d === c) {
                    d.style.display = "block", setTimeout(function () {
                        a.dataset.ulId === d.dataset.id && i.addClass(d, l.opt.activeMenuClass)
                    }, 100), l.fetchList(d);
                    return
                }
                i.hasClass(d, l.opt.disableMenuClass) || (d.style.display = "none")
            })
        }, o.prototype.setLink = function (a) {
            var l = this;
            i.hasClass(a, this.opt.backBtnClass) && (i.addClass(a, this.opt.collapseClass), a.addEventListener("click", function (c) {
                c.preventDefault(), l.backLink(a)
            })), a.dataset.ulId && (i.addClass(a, this.opt.collapseClass), a.addEventListener("click", function (c) {
                (!l.opt.linkOnToggle || !a.href || !c.target.dataset.ulId) && (c.preventDefault(), l.forwardLink(a))
            }))
        }, o.prototype.setActiveMenu = function () {
            var a = this, l = this.multiMenu.querySelectorAll("ul"), c = [].find.call(l, function (d) {
                return !!i.hasClass(d, a.opt.activeMenuClass)
            });
            if (!c) {
                l && l[0] && i.addClass(l[0], this.opt.activeMenuClass);
                return
            }
            var u = this.multiMenu.querySelectorAll("ul");
            [].forEach.call(u, function (d) {
                if (c === d) {
                    d.style.display = "block";
                    return
                }
                if (c.dataset.parentId === d.dataset.id) for (var f = d; f.style.transform = "translateX(-100%)", f.dataset.parentId;) f = a.multiMenu.querySelector('[data-id="' + f.dataset.parentId + '"]'); else d.style.display = "none"
            })
        }, o.prototype.setMenu = function (a, l) {
            var c = this;
            l === void 0 && (l = 0), this.setLevels(a, l), this.flattenList(a);
            var u = this.multiMenu.querySelectorAll("a:not(." + this.opt.collapseClass + ")");
            [].forEach.call(u, function (d) {
                c.setLink(d)
            })
        }, o
    }();
    return si.default = n, si
}

var Fm = Bm();
const Vm = Gu(Fm);

function Nm() {
    new Vm(".navMenu__nav", {prependHTML: e => `<li class="navMenu__title"><a href="#" class="js-menu-back-btn"><span class="btn__icon"><span class="btn__icon-stroke"><svg xmlns="" width="50" height="50" fill="none" viewBox="0 0 50 50"><circle vector-effect="non-scaling-stroke" cx="25" cy="25" r="24" stroke="currentColor" stroke-dasharray="1 3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><svg><use href="img/icons.svg#line-arrowLeft"/></svg></span></a><span class="label">${e.dataset.title}</span></li>`}), document.querySelector(".navMenu"), document.querySelectorAll(".navMenu__toggle").forEach(e => {
        e.addEventListener("click", () => {
            document.body.classList.toggle("navMenu--is-open")
        })
    })
}

O.registerPlugin(B);

function Hm() {
    const s = document.querySelectorAll(".pageNavLink"), e = document.querySelectorAll(".pageNavTarget"),
        t = document.querySelector(".pageNavCarousel");
    let i;
    if (t) {
        const o = t.querySelector(".pageNavCarousel__carousel"), a = t.querySelector(".pageNavCarousel__prev"),
            l = t.querySelector(".pageNavCarousel__next");
        i = new pe(o, {
            modules: [td, Ot],
            slidesPerView: "auto",
            spaceBetween: 4,
            freeMode: !0,
            centeredSlides: !0,
            centeredSlidesBounds: !0,
            focusableElements: "input, select, option, textarea, video, label",
            navigation: {prevEl: a, nextEl: l}
        });
        const c = document.querySelector(".hero"), u = document.querySelector(".siteFooter"),
            d = t.querySelector(".pageNavCarousel__container"), f = t.querySelector(".pageNavCarousel__container > *");
        O.set(d, {
            clipPath: "inset(0px 100% 0% 0px round 100px)",
            xPercent: 50
        }), O.set(f, {autoAlpha: 0}), B.create({
            trigger: c, start: "top top", end: "bottom 75%", onLeave: () => {
                let p = O.timeline({onStart: () => i.slideTo(0)});
                p.to(d, {
                    clipPath: "inset(0px 0% 0% 0px round 100px)",
                    xPercent: 0,
                    duration: .6,
                    ease: "power3.inOut"
                }), p.to(f, {autoAlpha: 1, duration: .6, ease: "power2.inOut"})
            }, onEnterBack: () => {
                let p = O.timeline();
                p.to(f, {
                    autoAlpha: 0,
                    duration: .4,
                    ease: "power2.inOut"
                }), p.to(d, {
                    clipPath: "inset(0px 100% 0% 0px round 100px)",
                    xPercent: 50,
                    duration: .4,
                    ease: "power3.inOut"
                })
            }
        }), B.create({
            trigger: u, onEnter: () => {
                let p = O.timeline();
                p.to(f, {
                    autoAlpha: 0,
                    duration: .4,
                    ease: "power2.inOut"
                }), p.to(d, {
                    clipPath: "inset(0px 100% 0% 0px round 100px)",
                    xPercent: 50,
                    duration: .4,
                    ease: "power3.inOut"
                })
            }, onLeaveBack: () => {
                let p = O.timeline();
                p.to(d, {
                    clipPath: "inset(0px 0% 0% 0px round 100px)",
                    xPercent: 0,
                    duration: .6,
                    ease: "power3.inOut"
                }), p.to(f, {autoAlpha: 1, duration: .6, ease: "power2.inOut"})
            }
        })
    }
    e.forEach((o, a) => {
        const l = o.id;
        B.create({
            trigger: o, start: "0% 50%", end: "100% 50%", onEnter: () => {
                let c = document.querySelectorAll(`.pageNavLink[data-target="${l}"`);
                c.forEach(d => d.classList.add("active")), t && i.slideTo(a), document.querySelectorAll(`.pageNavLink:not([data-target="${l}"])`).forEach(d => {
                    d !== c && d.classList.remove("active")
                })
            }, onEnterBack: () => {
                let c = document.querySelectorAll(`.pageNavLink[data-target="${l}"`);
                c.forEach(d => d.classList.add("active")), t && i.slideTo(a), document.querySelectorAll(`.pageNavLink:not([data-target="${l}"])`).forEach(d => {
                    d !== c && d.classList.remove("active")
                })
            }
        })
    }), s.forEach(o => {
        const a = document.querySelector(`#${o.dataset.target}`);
        o.addEventListener("click", () => {
            let l = document.querySelector(".siteHeader").offsetHeight, c = window.scrollY,
                u = window.scrollY + a.getBoundingClientRect().top, d = document.querySelector(".px-container"),
                f = window.getComputedStyle(d).getPropertyValue("padding-left");
            f = f.replace("px", ""), c > u ? window.scrollTo({
                top: u - l - f,
                behavior: "smooth"
            }) : window.scrollTo({top: u - f, behavior: "smooth"})
        })
    });
    const r = document.querySelector(".pageNavDropdown");
    if (r) {
        const o = r.querySelector(".pageNavDropdown__trigger");
        window.addEventListener("click", a => {
            r.classList.contains("is-open") ? r.classList.remove("is-open") : (a.target == o || o.contains(a.target)) && r.classList.add("is-open")
        })
    }
    document.querySelectorAll(".pageNavDropdown--fixed").forEach(o => {
        const a = o.closest(".pageNavDropdown--fixed-container");
        O.matchMedia().add("(max-width: 1199px)", () => {
            B.create({
                trigger: a,
                start: "top 25%",
                end: "bottom top",
                onToggle: c => console.log("toggled, isActive:", c.isActive),
                toggleClass: {targets: o, className: "is-active"}
            })
        })
    })
}

O.registerPlugin(B);

function $m() {
    document.querySelectorAll(".tabs__container").forEach(e => {
        if (e.querySelector(".tabs__nav-carousel")) {
            const o = e.querySelector(".tabs__nav-carousel"), a = e.querySelector(".tabs__nav-prev"),
                l = e.querySelector(".tabs__nav-next");
            e.classList.contains("weatherTabs") ? new pe(o, {
                modules: [Ot],
                spaceBetween: 4,
                slidesPerView: 4,
                navigation: {prevEl: a, nextEl: l},
                breakpoints: {
                    500: {spaceBetween: 4, slidesPerView: 5},
                    600: {spaceBetween: 5, slidesPerView: 6},
                    700: {spaceBetween: 5, slidesPerView: 7},
                    800: {spaceBetween: 6, slidesPerView: 8},
                    900: {spaceBetween: 6, slidesPerView: 9},
                    1e3: {spaceBetween: 7, slidesPerView: 10},
                    1100: {spaceBetween: 7, slidesPerView: 11},
                    1100: {spaceBetween: 8, slidesPerView: 12}
                }
            }) : e.classList.contains("tabs--stripped") ? new pe(o, {
                modules: [Ot],
                spaceBetween: 24,
                slidesPerView: "auto",
                navigation: {prevEl: a, nextEl: l},
                breakpoints: {
                    900: {spaceBetween: 27},
                    1400: {spaceBetween: 30},
                    1900: {spaceBetween: 33},
                    2400: {spaceBetween: 36}
                }
            }) : new pe(o, {modules: [Ot], spaceBetween: 4, slidesPerView: "auto", navigation: {prevEl: a, nextEl: l}})
        }
        const t = e.querySelector(":scope > .tabs__nav"), i = e.querySelector(":scope > .tabs__content"),
            r = t.querySelectorAll(".tabs__btn");

        function n(o) {
            for (var a = 0; a < r.length; a++) r[a].classList.remove("active");
            var l = o.currentTarget;
            l.classList.add("active"), o.preventDefault();
            var c = i.querySelectorAll(":scope > .tabs__pane");
            for (a = 0; a < c.length; a++) c[a].classList.remove("active");
            var u = o.currentTarget, d = u.dataset.tabPane, f = e.querySelector(`#${d}`);
            f.classList.add("active"), setTimeout(() => {
                B.refresh()
            }, 100)
        }

        r.forEach(o => {
            o.addEventListener("click", n)
        })
    })
}

function Gm() {
    document.querySelectorAll(".articleVideo").forEach(e => {
        const t = e.querySelector(".articleVideo__cover");
        if (e.querySelector("iframe")) {
            const i = e.querySelector("iframe"), r = i.src;
            t.addEventListener("click", () => {
                i.src = r + "?autoplay=1", t.classList.add("hidden")
            })
        } else if (e.querySelector("video")) {
            const i = e.querySelector("video");
            t.addEventListener("click", () => {
                i.play(), t.classList.add("hidden")
            })
        }
    })
}

O.registerPlugin(B);

function Wm() {
    const s = document.querySelector(".homeDestinations");
    if (s) {
        const t = s.querySelector(".homeDestinationsCarousel"), i = s.querySelector(".homeDestinationsBackground"),
            r = s.querySelector(".homeDestinations__prev"), n = s.querySelector(".homeDestinations__next"),
            o = s.querySelector(".homeDestinations__pagination"),
            a = s.querySelectorAll(".homeDestinationsCarousel__slide");
        let l = [];
        a.forEach(u => {
            l.push(u.dataset.slideTitle)
        });
        const c = new pe(i, {
            modules: [lc, Zn, Ot, Jn, Bo],
            loop: !0,
            followFinger: !1,
            parallax: !0,
            speed: 1500,
            effect: "creative",
            creativeEffect: {prev: {translate: ["-100%", 0, -1]}, next: {translate: ["100%", 0, 0]}}
        });
        new pe(t, {
            modules: [ed, lc, nd, Ot, Jn, Bo],
            loop: !0,
            followFinger: !1,
            parallax: !0,
            speed: 1500,
            effect: "fade",
            fadeEffect: {crossFade: !0},
            autoplay: {delay: 6e3, disableOnInteraction: !1, pauseOnMouseEnter: !0},
            navigation: {prevEl: r, nextEl: n},
            pagination: {
                el: o, clickable: !0, renderBullet: function (u, d) {
                    return '<button class="' + d + '"><span class="progress-indicator"></span><span class="label">' + l[u] + "</span></button>"
                }
            },
            controller: {control: c},
            on: {
                autoplayTimeLeft(u, d, f) {
                    o.style.setProperty("--progress", 1 - f)
                }
            }
        })
    }
    document.querySelector(".homeVideo") && (O.set(".homeVideo video", {clipPath: "inset(20%)"}), O.to(".homeVideo video", {
        clipPath: "inset(0%)",
        ease: "none",
        scrollTrigger: {trigger: ".homeVideo", start: "center bottom", end: "bottom bottom", scrub: !0}
    }), O.to(".homeVideo__container", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {trigger: ".homeVideo", start: "bottom bottom", end: "bottom top", scrub: !0}
    })), document.querySelector(".homeJourney") && document.querySelectorAll(".homeJourney__image").forEach(i => {
        const r = i.querySelectorAll("img");
        O.to(r, {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {trigger: i, start: "top bottom", end: "bottom top", scrub: !0}
        })
    });
    const e = document.querySelector(".homeAccommodation");
    if (e) {
        const t = e.querySelector(".homeAccommodation__main"), i = e.querySelector(".homeAccommodation__prev"),
            r = e.querySelector(".homeAccommodation__next");
        new pe(t, {
            modules: [Zn, Ot, Bo],
            slidesPerView: 1,
            centeredSlides: !0,
            loop: !0,
            parallax: !0,
            speed: 500,
            effect: "creative",
            creativeEffect: {
                limitProgress: 2,
                prev: {opacity: .5, translate: ["-100%", 0, 0]},
                next: {opacity: .5, translate: ["100%", 0, 0]}
            },
            navigation: {prevEl: i, nextEl: r},
            breakpoints: {720: {slidesPerView: 1.5}, 960: {slidesPerView: 2}, 1200: {slidesPerView: 3}}
        })
    }
    document.querySelector(".homeVideoReviews") && new pe(".homeVideoReviews", {
        modules: [Ot],
        slidesPerView: 1.5,
        spaceBetween: 12,
        centerInsufficientSlides: !0,
        navigation: {prevEl: ".homeVideoReviews__prev", nextEl: ".homeVideoReviews__next"},
        breakpoints: {
            600: {spaceBetween: 14, slidesPerView: 2},
            800: {spaceBetween: 16, slidesPerView: 3},
            1e3: {spaceBetween: 18, slidesPerView: 3.5},
            1200: {spaceBetween: 20, slidesPerView: 4},
            1400: {spaceBetween: 22, slidesPerView: 4},
            1600: {spaceBetween: 24, slidesPerView: 4},
            1800: {spaceBetween: 26, slidesPerView: 4},
            2e3: {spaceBetween: 28, slidesPerView: 4},
            2200: {spaceBetween: 30, slidesPerView: 4},
            2400: {spaceBetween: 32, slidesPerView: 4}
        }
    })
}

O.registerPlugin(B);

function Ym() {
    const s = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.setProperty("--body-scrollbar-width", `${s}px`);
    const e = new Yd;
    e.on("scroll", B.update), O.ticker.add(t => {
        e.raf(t * 1e3)
    }), O.ticker.lagSmoothing(0), kp()
}

function Xm() {
    if (cm(), Dp(), Ap(), im(), rm(), sm(), nm(), am(), om(), lm(), um(), dm(), fm(), qm(), Nm(), Hm(), $m(), Gm(), Wm(), window.location.hash.length) {
        const e = window.location.hash.split("&"), t = document.querySelector(`${e[0]}`);
        let i = window.scrollY + t.getBoundingClientRect().top;
        window.scrollTo({top: i, left: 0, behavior: "instant"})
    } else window.scrollTo({top: 0, left: 0, behavior: "instant"});
    B.refresh();
    var s = document.querySelectorAll("video[autoplay]");
    s.forEach(e => {
        var t = e.play();
        t !== void 0 && t.then(i => {
        }).catch(i => {
        })
    })
}

function Um() {
    window.scrollTo({top: 0, left: 0, behavior: "instant"})
}

class jm extends Go {
    initialLoad() {
        Ym(), this.onEnter(), this.onEnterCompleted()
    }

    onLeave() {
    }

    onLeaveCompleted() {
        Um()
    }

    onEnter() {
        Xm()
    }

    onEnterCompleted() {
    }
}

class Km extends Dn {
    onLeave({from: e, trigger: t, done: i}) {
        O.timeline({
            onStart: () => {
                document.body.classList.add("pageTransition--in-progress")
            }, onComplete: () => {
                i()
            }
        }).to(".pageTransition", {autoAlpha: 1, duration: .6, ease: "sine.inOut"})
    }

    onEnter({to: e, trigger: t, done: i}) {
        O.timeline({
            onStart: () => {
                document.body.classList.add("pageTransition--in-progress")
            }, onComplete: () => {
                document.body.classList.remove("pageTransition--in-progress"), Un(), i()
            }
        }).to(".pageTransition", {autoAlpha: 0, duration: .6, ease: "sine.inOut"})
    }
}

class Qm extends Dn {
    onLeave({from: e, trigger: t, done: i}) {
        O.timeline({
            onStart: () => {
                document.body.classList.add("pageTransition--in-progress")
            }, onComplete: () => {
                i()
            }
        }).to(".pageTransition", {autoAlpha: 1, duration: .6, ease: "sine.inOut"})
    }

    onEnter({to: e, trigger: t, done: i}) {
        let r = document.querySelector(".destinationsHero__image:nth-child(1)"),
            n = document.querySelector(".destinationsHero__image:nth-child(2)"),
            o = document.querySelector(".destinationsHero__image:nth-child(3)"),
            a = document.querySelector(".destinationsHero__image:nth-child(4)"), l = r.querySelector("img"),
            c = n.querySelector("img"), u = o.querySelector("img"), d = a.querySelector("img"), f = O.timeline({
                onStart: () => {
                    document.body.classList.add("pageTransition--in-progress")
                }, onComplete: () => {
                    document.body.classList.remove("pageTransition--in-progress"), Un(), i()
                }
            });
        f.to(".pageTransition", {
            autoAlpha: 0,
            duration: .6,
            ease: "sine.inOut"
        }), f.from(r, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }), f.from(l, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), f.from(n, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }, "<+0.3"), f.from(c, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), f.from(o, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }, "<+0.3"), f.from(u, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), f.from(a, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: .6,
            ease: "power2.inOut"
        }, "<+0.3"), f.from(d, {
            filter: "blur(20px)",
            scale: 1.1,
            duration: .8,
            ease: "power3.inOut"
        }, "<"), f.from(r, {left: "50%", top: "50%", duration: .6, ease: "power4.inOut"}), f.from(n, {
            left: "50%",
            top: "50%",
            duration: .6,
            ease: "power4.inOut"
        }, "<+0.1"), f.from(o, {
            right: "50%",
            top: "50%",
            duration: .6,
            ease: "power4.inOut"
        }, "<+0.1"), f.from(a, {right: "50%", top: "50%", duration: .6, ease: "power4.inOut"}, "<+0.1")
    }
}

function Sd() {
    const s = document.getElementById("inspirationMega");
    if (!s) return;
    const e = s.querySelector(".inspirationMega__level--1"), t = s.querySelector(".inspirationMega__level--2"),
        i = s.querySelector(".inspirationMega__level--3"), r = document.getElementById("inspirationDropdown"),
        n = document.querySelector('[data-dropdown="inspirationDropdown"]');

    function o() {
        const g = s.querySelectorAll(".inspirationMega__list");
        let y = 0;
        g.forEach(v => {
            const _ = v.offsetHeight;
            _ > y && (y = _)
        }), s.style.setProperty("min-height", y + "px"), e.style.setProperty("min-height", y + "px")
    }

    function a(g) {
        g && g.querySelectorAll(".inspirationMega__panel").forEach(y => {
            y.classList.remove("is-active")
        })
    }

    function l(g) {
        g && g.querySelectorAll("li").forEach(y => {
            y.classList.remove("is-active")
        })
    }

    function c(g) {
        g && (g.classList.add("is-empty"), a(g), l(g))
    }

    function u(g) {
        g && g.classList.remove("is-empty")
    }

    function d(g) {
        if (!g || !e) return;
        l(e);
        const y = g.closest("li");
        y && y.classList.add("is-active"), c(t), c(i);
        const v = g.dataset.target;
        if (!v) return;
        const _ = t ? t.querySelector("#" + v) : null;
        _ && (u(t), a(t), _.classList.add("is-active"))
    }

    function f(g) {
        if (!g || !i) return;
        const y = g.closest(".inspirationMega__panel");
        if (!y) return;
        l(y.querySelector(".inspirationMega__list"));
        const v = g.closest("li");
        v && v.classList.add("is-active"), c(i);
        const _ = g.dataset.target;
        if (!_) return;
        const w = i.querySelector("#" + _);
        w && (u(i), a(i), w.classList.add("is-active"))
    }

    c(t), c(i), s.querySelectorAll(".inspirationMega__level--1 .inspirationMega__trigger").forEach(g => {
        g.addEventListener("mouseenter", function () {
            window.innerWidth < 1200 || d(g)
        }), g.addEventListener("click", function (y) {
            y.preventDefault(), d(g)
        })
    }), s.querySelectorAll(".inspirationMega__level--1 > .inspirationMega__list > li > a").forEach(g => {
        g.addEventListener("mouseenter", function () {
            window.innerWidth < 1200 || d(g)
        })
    }), s.querySelectorAll(".inspirationMega__level--2 .inspirationMega__trigger").forEach(g => {
        g.addEventListener("mouseenter", function () {
            window.innerWidth < 1200 || f(g)
        }), g.addEventListener("click", function (y) {
            y.preventDefault(), f(g)
        })
    }), s.querySelectorAll(".inspirationMega__level--2 .inspirationMega__list > li > a").forEach(g => {
        g.addEventListener("mouseenter", function () {
            window.innerWidth < 1200 || f(g)
        })
    }), s.addEventListener("mouseleave", function () {
        l(e), c(t), c(i)
    });
    let p = window.scrollY, m = null;

    function h() {
        r && (r.classList.remove("is-active", "active", "open", "show"), r.style.pointerEvents = "none", requestAnimationFrame(() => {
            r.style.pointerEvents = ""
        })), n && n.classList.remove("is-active", "active", "open", "show", "hover"), document.activeElement && document.activeElement.blur(), l(e), c(t), c(i)
    }

    window.addEventListener("scroll", function () {
        const g = window.scrollY;
        Math.abs(g - p) > 2 && (document.body.classList.add("is-scrolling"), h()), clearTimeout(m), m = setTimeout(function () {
            document.body.classList.remove("is-scrolling")
        }, 180), p = g
    }, {passive: !0}), o(), window.addEventListener("resize", o)
}

const Jm = new zd({
    links: "a:not([target]):not([href^=\\#]):not([data-taxi-ignore]):not([data-dropdown]):not(.venobox)",
    renderers: {default: jm},
    transitions: {default: Km, destinations: Qm}
});
Sd();
Jm.on("NAVIGATE_END", () => {
    Sd()
});

;(() => {
    function initDestinationsMega() {
        document.querySelectorAll(".destinationsMega").forEach(mega => {
            if (mega.dataset.destinationsMegaInitialized === "true") return;
            mega.dataset.destinationsMegaInitialized = "true";
            const countries = Array.from(mega.querySelectorAll(".destinationsMega__country")),
                viewAll = mega.querySelector(".destinationsMega__view-all"),
                defaultCountry = countries.find(country => country.classList.contains("is-active")) || countries[0];

            function clearCountries() {
                countries.forEach(country => country.classList.remove("is-active"))
            }

            function activateCountry(country) {
                if (!country) return;
                clearCountries();
                country.classList.add("is-active")
            }

            countries.forEach(country => {
                country.addEventListener("mouseenter", () => {
                    if (window.innerWidth < 1200) return;
                    activateCountry(country)
                });
                country.addEventListener("focusin", () => {
                    activateCountry(country)
                })
            });
            viewAll?.addEventListener("mouseenter", () => {
                if (window.innerWidth < 1200) return;
                clearCountries()
            });
            viewAll?.addEventListener("focusin", clearCountries);
            mega.addEventListener("mouseleave", () => {
                activateCountry(defaultCountry)
            })
        })
    }
    document.addEventListener('DOMContentLoaded', function(){
        const parts = document.querySelectorAll('.callToAction__heading .heading-part');
        if (!parts.length) return;
        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries, o) => {
                entries.forEach(e => {
                    if (e.isIntersecting) { e.target.classList.add('is-visible'); o.unobserve(e.target); }
                });
            }, {threshold: 0.1});
            parts.forEach(p => obs.observe(p));
        } else {
            parts.forEach(p => p.classList.add('is-visible'));
        }
    });

    initDestinationsMega();
    document.addEventListener("DOMContentLoaded", initDestinationsMega);
    document.addEventListener("taxi:render", initDestinationsMega);
    window.initDestinationsMega = initDestinationsMega;
})();