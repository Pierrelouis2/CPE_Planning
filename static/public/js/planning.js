const btn = document.querySelector("button");
const dropdown = document.querySelector(".dropdown-options");
const optionInput = document.querySelectorAll(".option input");
const inputPayload = document.querySelectorAll(".input-payload");


btn.addEventListener("click", function(e) {
   e.preventDefault();
   dropdown.classList.toggle("open");
   dropdown.style.display = "block";
});

var clickFn = function(e) {
   e.preventDefault();
   dropdown.classList.remove("open");
   btn.innerHTML = this.value;
   var activeInput = document.querySelector(".option .active")
   if (activeInput) {
      activeInput.classList.remove("active");
   }
   this.classList.add("active");
   // submit the form which is the parent of the parameter e
   e.target.parentNode.submit();
   dropdown.style.display = "none";
}

for (var i = 0; i < optionInput.length; i++) {
   optionInput[i].addEventListener("mousedown", clickFn, false);
}

function leaveFct() {
   dropdown.classList.remove("open");
   dropdown.style.display = "none";
}