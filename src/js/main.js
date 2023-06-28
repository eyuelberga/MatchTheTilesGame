function toggleMainNavbar() {
    var x = document.getElementById("mainNavbar");
    if (x.className === "navbar-main") {
      x.className += " responsive";
    } else {
      x.className = "navbar-main";
    }
  }