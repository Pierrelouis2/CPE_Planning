import pandas as pd
import json
from numpyencoder import NumpyEncoder

# Read csv file
date = input("Entrez la date du planning csv (ex: 01_04): ")
Df = pd.read_csv(f'./{date}.csv', sep=';')
# Filter columns and rows
Df.reset_index()
Df.fillna(0, inplace=True)
# on ne garde que les 5 premieres columns
Df = Df.iloc[:, 0:5]
#Df #Decommenter pour voir le tableau

# ----------------------------------------------------------------
# On récupère la liste de toutes les matière/prof/majeurs dans LstSemaine
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
                if value in {'13h-14h30','13h30-17h45','13h10-18h', '13h30-15h30', '15h45-17h45', '13h30 - 14h30','13h30 - 17h45','13h30 - 17h30'} :
                  IsAprem = True
                elif value in {'8h-12h15','8h - 12h15', '8h30 - 10h00', '8h-10h', '10h15-12h15','10h15 - 12h15', '8h- 10h'}:
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
df_semaine = pd.DataFrame( LstSemaine)
#df_semaine #Decommenter pour voir le tableau

# ----------------------------------------------------------------
# On filtres les majeurs de chaque jours
import copy
def filtreMaj(pLstSemaine):
    Semaine =  {}
    lstMajeursinit = ['CONCEP.LOGICIELLE/BIG DATA','ROBOTIQUE','ELECTRONIQUE ET SYST EMB','INFRA DES RESEAUX','IMAGE','Pour tous']
    
    # creation dico {majeur: {grp: [], ...}, ...}
    dicMajinit = {}
    for maj in lstMajeursinit:
        dicMajinit[maj] = []    

    # parcours des jours de la semaine
    for jour in pLstSemaine :
        dicMaj = copy.deepcopy(dicMajinit)
        print(f'{jour["jour"]=}')
        Majeur = "Pour tous" #on initialise le majeur à tous
        Semaine[jour["jour"]] = {}

        # parcours de la matinée et on les ajoute au majeur correspondant 
        for Case in jour["Matin"]:
            # print(f'{Case=}')
            if Case in lstMajeursinit:
                Majeur = Case
            # print(f'{Majeur} - {grp} - {Case}')
            dicMaj[Majeur].append(Case)
        Semaine[jour["jour"]]["Matin"] = copy.deepcopy(dicMaj)

        # parcours de l'aprem et on les ajoute au majeur correspondant
        dicMaj = copy.deepcopy(dicMajinit)
        Majeur = "Pour tous" #on initialise le majeur à tous
        for Case in jour["Aprem"]:
            if Case in lstMajeursinit:
                Majeur = Case
            dicMaj[Majeur].append(Case)
        Semaine[jour["jour"]]["Aprem"] = copy.deepcopy(dicMaj)

    print('fin')
    return Semaine

PlanningMajeur = filtreMaj(copy.deepcopy(LstSemaine)) # KK
df_planningMaj = pd.DataFrame(PlanningMajeur)
#df_planningMaj #   #Decommenter pour voir le tableau

# ----------------------------------------------------------------
# on envoyer le planning au format json
with open(f"../../../Output_Json/testPlanning{date}.json", 'w+') as f:
    json.dump(PlanningMajeur, f, indent=4, cls=NumpyEncoder)
