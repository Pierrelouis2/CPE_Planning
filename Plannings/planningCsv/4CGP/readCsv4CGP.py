import pandas as pd
import json
from numpyencoder import NumpyEncoder
import copy

# Read csv file
date = input("Entrez la date du planning csv (ex: 01_04) : ")
Df = pd.read_csv(f'./{date}.csv', sep=';')
# Filter columns and rows
Df.reset_index()
Df.fillna(0, inplace=True)
# on ne garde que les 5 premieres columns
Df = Df.iloc[:, 0:5]

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
                if value in {'13h-14h30','13h30-17h45','13h10-18h', '13h30-15h30', '15h45-17h45', '13h30 - 14h30','13h30 - 17h45','13h30 - 17h30','13h30-15h45','13h30 - 15h30', '13h10 - 18h', '13h10 - 18h00', '13h10-18h00'} :
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

def filtre4CGP(LstSemaine) :
    # init variables 
    Semaine =  {}
    currentGrp = "Pour tous" 
    demi_jour =("Matin", "Aprem") 
    GRP = ( "Groupe A", "Groupe B", "Groupe C", "Pour tous" )
    MSO = (
        "Stratégie de Synthèse Organique",
        "Ingéniérie Macromoléculaire",
        "Spectrométries RMN et Masse Avancées",
        "Introduction aux Biotechnologies et Bioprocédés",
        "Simulation des Procédés",
        "Chimie Organométallique et Approche Orbitalaire",
        "Conception et Application du Médicament",
        "Techniques Séparatives avancées et Spéciation",
        "Catalyse et Développement Durable",
        "Génie de la Polymérisation",
        "Méthodes Spectroscopiques pour la Synthèse Organique",
        "Méthodes Numériques",
        "Synthèse de molécules bioactives",
        "De la molécule aux nanomatériaux",
        "Chimie nucléaire, mesure, analyse et cycle du combustible",
        "Chimie et Numérique",
        "Microbiologie, Immunologie, Eléments de génie génétique",
        "Pour tous"
    )
    
    # init dictionnaries
    dicMsoinit = {mso : [] for mso in MSO}
    dicGrpinit = {grp : [] for grp in GRP}

    # loop on the days of the week
    for jour in LstSemaine :
        print(jour["jour"])
        Semaine[jour["jour"]] = {}
        # loop on each cells of the half days (cells because it is an xls file at the beginning)
        for dj in demi_jour :
            # init variables for the half day
            Semaine[jour["jour"]][dj] = {}
            dicMso = copy.deepcopy(dicMsoinit)
            dicGrp = copy.deepcopy(dicGrpinit)
            dicPT = {"Pour tous" : []}
            GrpOrMso = None
            currentGrp = "Pour tous"
            for i,Case in enumerate(jour[dj]):
                try :
                    concatMSO = (Case + " " + jour[dj][i+1])
                except IndexError :
                    concatMSO = None
                # switch case when they are separated by grp or by mso
                if Case in GRP: 
                    currentGrp = Case
                    GrpOrMso = "Grp"
                elif Case in MSO :
                    currentGrp = Case
                    GrpOrMso = "Mso"
                elif concatMSO in MSO :
                    currentGrp = concatMSO
                    GrpOrMso = "Mso"
                # add the case to the right dictionnary
                if GrpOrMso == "Grp":
                    dicGrp[currentGrp].append(Case)
                elif GrpOrMso == "Mso":
                    dicMso[currentGrp].append(Case)
                else :
                    dicPT["Pour tous"].append(Case)
                
            # add the right dictionnary to the right day
            if GrpOrMso == "Grp":
                Semaine[jour["jour"]][dj] = copy.deepcopy(dicGrp)
            elif GrpOrMso == "Mso":
                Semaine[jour["jour"]][dj] = copy.deepcopy(dicMso)
            
            Semaine[jour["jour"]][dj]["Pour tous"] = copy.deepcopy(dicPT["Pour tous"])
    
    print('fin')
    print(Semaine)
    return Semaine

        
PlanningGroupe = filtre4CGP(LstSemaine)

with open(f'../../../Output_Json/Planning4CGP{date}.json', 'w+') as f:
    json.dump(PlanningGroupe, f, indent=4, cls=NumpyEncoder)