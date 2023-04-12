const btn = document.querySelector("button");
const dropdown = document.querySelector(".dropdown-options");
const optionInput = document.querySelectorAll(".option input");


btn.addEventListener("click", function(e) {
   e.preventDefault();
   dropdown.classList.toggle("open");
});

var clickFn = function(e) {
   e.preventDefault();
   dropdown.classList.remove("open");
   btn.innerHTML = this.value;
   var activeLink = document.querySelector(".option .active")
   if (activeLink) {
      activeLink.classList.remove("active");
   }
   this.classList.add("active");
}

for (var i = 0; i < optionInput.length; i++) {
   optionInput[i].addEventListener("mousedown", clickFn, false);
}

function hoverFct() {
   dropdown.classList.add("open");
}

function leaveFct() {
    dropdown.classList.remove("open");
}