(function () {
  "use strict";

  var path = window.location.pathname;
  var app = document.querySelector(".app");
  var isAdmin = path.indexOf("/ui/admin-") === 0;
  var isCustomer = path.indexOf("/ui/customer-") === 0 && path !== "/ui/customer-login";

  if (!app) {
    if (document.querySelector(".page-container")) document.body.classList.add("el-auth");
    return;
  }

  document.body.classList.add(isAdmin ? "el-management" : "el-customer");
  addSkipLink();
  enhanceSidebar();
  enhanceTopbar();
  addWorkflowContext();
  synchronizeIdentity();

  function addSkipLink() {
    var main = document.querySelector("main.main");
    if (!main) return;
    main.id = main.id || "main-content";
    var skip = document.createElement("a");
    skip.className = "el-skip";
    skip.href = "#" + main.id;
    skip.textContent = "Skip to main content";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function enhanceSidebar() {
    var sidebar = document.querySelector(".sidebar");
    var nav = sidebar && sidebar.querySelector(".nav");
    if (!nav) return;

    if (isAdmin && !nav.querySelector('[href="/ui/admin-staff"]')) {
      var staff = document.createElement("a");
      staff.href = "/ui/admin-staff";
      staff.dataset.ownerOnly = "true";
      staff.innerHTML = "<i>♙</i><span>Staff</span>";
      if (path === staff.getAttribute("href")) staff.classList.add("active");
      nav.appendChild(staff);
    }

    var groups = isAdmin ? [
      ["Overview", ["admin-dashboard"]],
      ["Core operations", ["admin-packages", "admin-bookings", "admin-resources"]],
      ["Growth & partners", ["admin-events", "admin-promotions", "admin-partners"]],
      ["Finance & experience", ["admin-payments", "admin-feedback", "admin-reports", "admin-notifications"]],
      ["Access & roles", ["admin-users", "admin-staff"]]
    ] : [
      ["Discover", ["customer-dashboard", "customer-destinations", "customer-tour-packages", "customer-events", "customer-offers"]],
      ["Plan & book", ["customer-hotels", "customer-transport", "customer-tour-guides", "customer-custom-tour", "customer-travel-planner"]],
      ["My journey", ["customer-my-trips", "customer-bookings", "customer-saved-trips", "customer-wishlist", "customer-payment-history", "customer-reviews"]],
      ["Help & account", ["customer-messages", "customer-support", "customer-refunds", "customer-faq", "customer-emergency", "customer-notifications", "customer-profile"]]
    ];

    groups.forEach(function (group) {
      var first = Array.prototype.find.call(nav.querySelectorAll("a"), function (a) {
        return group[1].some(function (key) { return (a.getAttribute("href") || "").indexOf(key) > -1; });
      });
      if (!first) return;
      var label = document.createElement("div");
      label.className = "el-nav-group";
      label.textContent = group[0];
      nav.insertBefore(label, first);
    });

    var backdrop = document.createElement("button");
    backdrop.className = "el-sidebar-backdrop";
    backdrop.type = "button";
    backdrop.setAttribute("aria-label", "Close menu");
    document.body.appendChild(backdrop);
    document.querySelectorAll("[data-menu]").forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", function () {
        setTimeout(function () {
          var open = sidebar.classList.contains("open");
          backdrop.classList.toggle("show", open);
          button.setAttribute("aria-expanded", String(open));
        }, 0);
      });
    });
    backdrop.addEventListener("click", function () {
      sidebar.classList.remove("open");
      backdrop.classList.remove("show");
      document.querySelectorAll("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    });
  }

  function enhanceTopbar() {
    var actions = document.querySelector(".top-actions");
    if (!actions || actions.querySelector(".el-role-chip")) return;
    var chip = document.createElement("span");
    chip.className = "el-role-chip";
    chip.textContent = isAdmin ? "Management" : "Customer";
    actions.insertBefore(chip, actions.firstChild);

    var notification = actions.querySelector('.icon-btn:not([data-menu]):not([data-logout])');
    if (notification && notification.tagName === "BUTTON") {
      notification.addEventListener("click", function () {
        window.location.href = isAdmin ? "/ui/admin-notifications" : "/ui/customer-notifications";
      });
      notification.setAttribute("aria-label", "Open notifications");
    }
  }

  function addWorkflowContext() {
    var content = document.querySelector(".content");
    if (!content || content.querySelector(".el-workflow")) return;
    var module = moduleFor(path);
    var bar = document.createElement("section");
    bar.className = "el-workflow";
    bar.setAttribute("aria-label", "Current module");
    bar.innerHTML = '<div class="el-workflow-copy"><span class="el-workflow-icon">' + module.icon + '</span><div><h2>' + module.title + '</h2><p>' + module.description + '</p></div></div>' +
      '<div class="el-workflow-tags"><span>' + module.tags[0] + '</span><span>' + module.tags[1] + '</span></div>';
    content.insertBefore(bar, content.firstChild);
  }

  function moduleFor(p) {
    var items = [
      ["packages", "Tour package & experience management", "Create, compare, price and book curated Sri Lankan travel experiences.", "🎒", ["Packages", "Experiences"]],
      ["booking", "Smart booking & reservation management", "Manage travelers, dates, confirmations, cancellations and trip details.", "📅", ["Reservations", "Itineraries"]],
      ["resources", "Resource availability & allocation", "Coordinate hotels, vehicles, guides and availability for confirmed journeys.", "◆", ["Availability", "Allocation"]],
      ["hotels", "Accommodation services", "Browse travel partners and choose accommodation for each stay.", "🏨", ["Partners", "Availability"]],
      ["transport", "Transport services", "Choose vehicles and transfers that fit the journey schedule.", "🚐", ["Vehicles", "Schedules"]],
      ["tour-guides", "Tour guide services", "Connect with knowledgeable guides for local experiences.", "🧭", ["Guides", "Availability"]],
      ["events", "Event & festival information", "Discover Sri Lankan festivals, cultural events and regional experiences.", "🎉", ["Events", "Regions"]],
      ["promotions", "Promotion & offer management", "Manage campaigns, seasonal offers and customer travel savings.", "%", ["Campaigns", "Offers"]],
      ["offers", "Offers & seasonal deals", "Find active promotions and travel offers for your next journey.", "🎁", ["Discounts", "Seasonal"]],
      ["partners", "Partner & supplier management", "Coordinate hotels, transport providers, guides and service partners.", "◎", ["Suppliers", "Contracts"]],
      ["payments", "Payment management", "Track payments, receipts, refunds and booking finance.", "💳", ["Payments", "Receipts"]],
      ["payment", "Payment management", "Track payments, receipts, refunds and booking finance.", "💳", ["Payments", "Receipts"]],
      ["feedback", "Feedback collection", "Review traveler feedback and improve service quality.", "★", ["Reviews", "Quality"]],
      ["reviews", "Feedback collection", "Share verified trip feedback and review your past experiences.", "⭐", ["Ratings", "Feedback"]],
      ["reports", "Reports & analytics", "Monitor bookings, revenue, utilization and customer experience.", "↗", ["Insights", "Performance"]],
      ["users", "User & role management", "Manage customer access, account status and platform roles.", "◉", ["Users", "Roles"]],
      ["staff", "Management staff access", "Owner-only administration of management service accounts.", "♙", ["Owner", "Staff"]],
      ["notifications", "Notification center", "Keep track of booking, payment and operational updates.", "🔔", ["Alerts", "Updates"]],
      ["destinations", "Destination explorer", "Explore Sri Lanka by region, interest and travel style.", "🗺", ["Regions", "Highlights"]],
      ["profile", "Customer profile management", "Keep traveler and contact details ready for smoother bookings.", "👤", ["Profile", "Preferences"]],
      ["dashboard", isAdmin ? "Operations command center" : "Your Explore Lanka dashboard", isAdmin ? "Monitor the six core travel-management functions from one workspace." : "Discover, book and manage every part of your Sri Lankan journey.", "▦", [isAdmin ? "Operations" : "Travel", "Overview"]]
    ];
    for (var i = 0; i < items.length; i++) {
      if (p.indexOf(items[i][0]) > -1) return {title:items[i][1],description:items[i][2],icon:items[i][3],tags:items[i][4]};
    }
    return {title:isAdmin ? "Explore Lanka management" : "Explore Lanka traveler services",description:"One connected workspace for travel planning and operations.",icon:"🌴",tags:["Explore Lanka","Service"]};
  }

  function synchronizeIdentity() {
    fetch("/api/auth/session", {credentials:"same-origin"}).then(function (response) {
      if (!response.ok) return null;
      return response.json();
    }).then(function (data) {
      if (!data) return;
      var name = data.name || (isAdmin ? "Administrator" : "Traveler");
      var role = String(data.role || "").toUpperCase();
      var initial = name.trim().charAt(0).toUpperCase() || "E";
      document.querySelectorAll(".avatar,.admin-mini-avatar,[data-user-initial]").forEach(function (el) { el.textContent = initial; });
      document.querySelectorAll(".admin-mini-profile strong").forEach(function (el) { el.textContent = name; });
      var roleChip = document.querySelector(".el-role-chip");
      if (roleChip) roleChip.textContent = role === "MANAGEMENT_SERVICE" ? "Management staff" : role === "OWNER" ? "Owner" : "Customer";
      document.querySelectorAll("[data-owner-only]").forEach(function (el) { el.hidden = role !== "OWNER"; });
    }).catch(function () {});
  }
}());
