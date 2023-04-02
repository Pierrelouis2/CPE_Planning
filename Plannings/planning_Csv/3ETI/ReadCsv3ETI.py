import pandas as pd
import json
from numpyencoder import NumpyEncoder

# Read csv file
date = input("Entrez la date du planning csv (ex: 01_04) : ")
Df = pd.read_csv(f'./{date}.csv', sep=';')
# Filter columns and rows
Df.reset_index()
Df.fillna(0, inplace=True)
# on ne garde que les 5 premieres columns
Df = Df.iloc[:, 0:5]
#Df #Decommenter pour voir le tableau

def createSchedule(Df):
    DicoJour = {}
    IsAprem = False
    LstSemaine = []
    # parcour des jours pour séparer matin et aprem
    for obj in Df :
        LstMatin = []
        LstAprem = []
        LstTemp = []
        # parcour des cases non nulles 
        for case in Df[obj] :
            if case != 0 :
                LstTemp.append(case.strip())

        # parcour des cases non nulles d'une journée pour la séparation
        for index,value in enumerate(LstTemp) :
            if index == 0 :
                # on ajoute le jour
                DicoJour["jour"] = obj +"-" + value
            else :
                if value in {'13h-14h30','13h30-17h45','13h10-18h', '13h30-15h30', '15h45-17h45', '13h30 - 14h30','13h30 - 17h45','13h30 - 17h30','13h30-15h45','13h30 - 15h30'} :
                  IsAprem = True
                elif value in {'8h-12h15','8h - 12h15', '8h30 - 10h00', '8h-10h', '10h15-12h15','10h15 - 12h15','8h00 - 10h00', '8h- 10h','8h - 10h','8h00 - 12h15'}:
                    IsAprem = False
                if "\n" in value :
                    # on ajoute les cours
                    if IsAprem :
                        LstAprem.append(value.split("\n")[0])
                        LstAprem.append(value.split("\n")[1])
                    else :
                        LstMatin.append(value.split("\n")[0])
                        LstMatin.append(value.split("\n")[1])
                    continue
                if IsAprem :
                    LstAprem.append(value)
                else :
                    LstMatin.append(value)

        DicoJour["Matin"] = LstMatin.copy()
        DicoJour["Aprem"] = LstAprem.copy()
        LstSemaine.append(DicoJour.copy())
    return LstSemaine

LstSemaine = createSchedule(Df)

import copy
def filtreMaj(pLstSemaine):
    Semaine =  {}
    lstGroupesinit = ['GROUPE A','GROUPE B','GROUPE C','GROUPE D','Pour tous']
    
    # creation dico {majeur: {grp: [], ...}, ...}
    dicGrpinit = {}
    for grp in lstGroupesinit:
        dicGrpinit[grp] = []    

    # parcours des jours de la semaine
    for jour in pLstSemaine :

        print(f'{jour["jour"]=}')
        Semaine[jour["jour"]] = {}
        demi_jour = "Matin", "Aprem"
        # parcours de la matinée et on les ajoute au majeur correspondant 

        for dj in demi_jour:
            isGroupe = False
            count = 0
            dicGrp = copy.deepcopy(dicGrpinit)
            Groupe = "Pour tous"

            for i,Case in enumerate(jour[dj]):
                # print(f'{Case=}')
                if Case in lstGroupesinit:
                    Groupe = Case
                    isGroupe = True
                    dicGrp[Groupe].append(jour[dj][i-1])
                    dicGrp["Pour tous"].pop(-1)
                elif count == 3:
                    isGroupe = False
                    count = 0
                    Groupe = "Pour tous"
                elif isGroupe:
                    count += 1
                # print(f'{Majeur} - {grp} - {Case}')
                dicGrp[Groupe].append(Case)
            Semaine[jour["jour"]][dj] = copy.deepcopy(dicGrp)
    print('fin')
    return Semaine

PlanningGroupe = filtreMaj(copy.deepcopy(LstSemaine)) # KK

with open(f'../../Output_Json/Planning3ETI{date}.json', 'w+') as f:
    json.dump(PlanningGroupe, f, indent=4, cls=NumpyEncoder)

