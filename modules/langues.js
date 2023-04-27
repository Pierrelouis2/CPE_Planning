let sqlite3 = require("sqlite3");

let db = new sqlite3.Database("users.db");
const queryDB = promisify(db.all).bind(db);

async function recup_data(dir) {
    //renvoi une liste avec tout (dico)
    const response = await fetch(dir);
    const  donnee = await response.json();
    return donnee
} 

async function filtre(psid){

    let sql_get_name = "select name,last_name from profile where psid = ?"; //on recup le nom et le prenom de la personne
    let ID = (await queryDB(sql_get_name, psid))[0]; //on recup l'id de la personne
    let lst_donnee = await recup_data("../Langues/lst_personne.json"); //on recup la liste de data des personnes 
    let lst_salles = await recup_data("../Langues/lst_salles.json"); //on recup la liste de data des salles
    
    let nom = ID.last_name. toUpperCase();
    let prenom = ID.name.toUpperCase();
    let lst_salles_ren =""; //on crée la liste des salles
    let id_nom;
    let tag;
    console.log(nom) 
    console.log(prenom)
    for(id_nom in lst_donnee){
        if(lst_donnee[id_nom].NOM == nom && lst_donnee[id_nom].Prénom == prenom){ //si le nom et le prenom sont dans la liste
          console.log(ID)
          for(tag in lst_salles){ //oncherche la salle avec le TAG
                
                if(lst_salles[tag].TAG == lst_donnee[id_nom].LV1){  //on compare le tag de la salle avec le tag de la personne LV1
                    lst_salles_ren += lst_salles[tag] + '\n'; //on  ajoute le cour dans la liste des cours
                }
                if(lst_salles[tag].TAG == lst_donnee[id_nom].LV2){  //on compare le tag de la salle avec le tag de la personne LV2
                    lst_salles_ren += lst_salles[tag] + '\n'
                }
                console.log("fin lv2")
                if(lst_salles[tag].TAG == lst_donnee[id_nom].LV3){  //on compare le tag de la salle avec le tag de la personne LV3
                    lst_salles_ren += lst_salles[tag] + '\n'
                    console.log("LV3");
              }
        }
        console.log("test fct display")
        display(lst_salles_ren) //on affiche la liste des salles si il est dans la liste
    }

  }
}

async function display(lst_salles){
  console.log("test display")
    document.getElementById("display").style.visibility = "visible"; //on affiche la div
    let div = document.getElementById("display") //on recup le div par l'id
    div.innerHTML = "" //on vide le div
 
    let i,key;
    for(i in lst_salles){ 
        for(key in lst_salles[i]){ 
           if (key == "TAG"){} //on affiche tout sauf le TAG
            else if (key == "HORAIRE"){ //si c'est l'horaire
                div.innerHTML += key  + " : " + lst_salles[i][key] + "<br>" +"<br>"+"<br>"//on ajoute la salle dans le div
            }
            else{
                  console.log("test")
                div.innerHTML += key  + " : " + lst_salles[i][key] + "<br>"//on ajoute la salle dans le div
            }
        }
    }
}

module.exports = {filtre}