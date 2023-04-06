// sqlite3 = require("sqlite3");

// let db = new sqlite3.Database("../../../users.db");
// const queryDB = promisify(db.all).bind(db);

$(document).ready( function() {
  
    $('body').on("click", ".larg div h3", function(){
      if ($(this).children('span').hasClass('close')) {
        $(this).children('span').removeClass('close');
      }
      else {
        $(this).children('span').addClass('close');
      }
      $(this).parent().children('p').slideToggle(250);
    });
    
    $('body').on("click", "nav ul li a", function(){
      var title = $(this).data('title');
      $('.title').children('h2').html(title);
    });
  });

// sql_get_promo = "SELECT promo FROM user";
// let promos = (await queryDB(sql_get_promo));
// console.log(promos);

var xValues = ["Italy", "France", "Spain", "USA", "Argentina"];
var yValues = [55, 49, 44, 24, 15];
var barColors = [
  "#b91d47",
  "#00aba9",
  "#2b5797",
  "#e8c3b9",
  "#1e7145"
];

var xValues = 
new Chart("myChart", {
    type: "pie",
    data: {
      labels: xValues,
      datasets: [{
        backgroundColor: barColors,
        data: yValues
      }]
    },
    options: {
      title: {
        display: true,
        text: "World Wide Wine Production 2018"
      }
    }
  });