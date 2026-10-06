(function () {
  "use strict";
  var form = document.getElementById("feedbackForm");
  if (!form) return;
  var booking = document.getElementById("feedbackBooking");
  var rating = document.getElementById("feedbackRating");
  var comment = document.getElementById("feedbackComment");
  var status = document.getElementById("feedbackStatus");
  var list = document.getElementById("customerFeedbackList");
  var userId = sessionStorage.getItem("userId");

  if (!userId) {
    window.location.replace("/ui/customer-login");
    return;
  }

  Promise.all([
    request("/api/bookings/customer/" + encodeURIComponent(userId)),
    request("/api/feedback/customer/" + encodeURIComponent(userId))
  ]).then(function (data) {
    renderBookings(data[0] || []);
    renderReviews(data[1] || []);
  }).catch(function (error) {
    show(error.message || "Could not load your feedback information.", true);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    show("Submitting review…");
    fetch("/api/feedback", {
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({bookingId:Number(booking.value),rating:Number(rating.value),comment:comment.value.trim()})
    }).then(read).then(function () {
      show("Thank you—your review has been saved.");
      comment.value = "";
      return request("/api/feedback/customer/" + encodeURIComponent(userId));
    }).then(renderReviews).catch(function (error) { show(error.message, true); });
  });

  function request(url) {
    return fetch(url, {credentials:"same-origin"}).then(read);
  }
  function read(response) {
    return response.json().catch(function () { return {}; }).then(function (data) {
      if (!response.ok) throw new Error(data.message || "Request failed.");
      return data;
    });
  }
  function renderBookings(rows) {
    var eligible = rows.filter(function (row) { return String(row.status || "").toUpperCase() !== "CANCELLED"; });
    booking.innerHTML = eligible.length ? eligible.map(function (row) {
      var name = row.tourPackage && row.tourPackage.packageName || "Booking #" + row.bookingId;
      return '<option value="' + row.bookingId + '">' + escapeHtml(name) + " — #BK-" + String(row.bookingId).padStart(4,"0") + "</option>";
    }).join("") : '<option value="">No eligible bookings</option>';
    form.querySelector('button[type="submit"]').disabled = !eligible.length;
  }
  function renderReviews(rows) {
    if (!rows.length) {
      list.innerHTML = '<div class="customer-package-state">No reviews yet. Complete a journey and share your experience.</div>';
      return;
    }
    list.innerHTML = rows.map(function (row) {
      var name = row.booking && row.booking.tourPackage && row.booking.tourPackage.packageName || "Explore Lanka journey";
      var stars = "★★★★★".slice(0, Number(row.rating) || 0) + "☆☆☆☆☆".slice(0, 5 - (Number(row.rating) || 0));
      return '<div class="timeline-item"><span class="dot"></span><div><h4>' + stars + " " + escapeHtml(name) + '</h4><p>' + escapeHtml(row.comment || "") + "</p></div></div>";
    }).join("");
  }
  function show(message, bad) { status.textContent = message || ""; status.className = "form-status" + (bad ? " is-error" : ""); }
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
}());
