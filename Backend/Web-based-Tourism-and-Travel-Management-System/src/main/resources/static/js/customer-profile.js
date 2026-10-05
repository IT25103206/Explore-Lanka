(function () {
  "use strict";
  var form = document.getElementById("customerProfileForm");
  if (!form) return;
  var status = document.getElementById("profileStatus");
  var fields = ["name","username","email","phone","nic","address"];

  fetch("/api/auth/profile", {credentials:"same-origin"}).then(read).then(fill)
    .catch(function (error) { show(error.message, true); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var body = {};
    fields.forEach(function (key) { body[key] = document.getElementById("profile-" + key).value.trim(); });
    if (!body.name || !body.email) { show("Name and email are required.", true); return; }
    show("Saving profile…");
    fetch("/api/auth/profile", {method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      .then(read).then(function (data) {
        fill(data);
        sessionStorage.setItem("userName", data.name || "");
        sessionStorage.setItem("userEmail", data.email || "");
        document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = data.name || "Traveler"; });
        show("Profile updated successfully.");
      }).catch(function (error) { show(error.message, true); });
  });

  function fill(data) {
    fields.forEach(function (key) { document.getElementById("profile-" + key).value = data[key] || ""; });
    document.getElementById("profile-account-status").value = data.status || "ACTIVE";
    var initials = (data.name || "Traveler").split(/\s+/).slice(0,2).map(function (part) { return part.charAt(0); }).join("").toUpperCase();
    document.getElementById("profileInitials").textContent = initials || "TR";
  }
  function read(response) { return response.json().catch(function(){return {};}).then(function(data){if(!response.ok)throw new Error(data.message||"Request failed.");return data;}); }
  function show(message,bad){status.textContent=message||"";status.className="form-status"+(bad?" is-error":"");}
}());
