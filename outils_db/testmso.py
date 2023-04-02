# insert data
mso = {
    "SSO": "Stratégie de synthèse organique",
    "CO2": "Chimie Organometallique 2, approche orbitalaire",
    "IM": "Ingénierie Macromoléculaire",
    "SSP": "Simulation stationnaire des procédés",
    "CMH": "Chimie médicinale et hétérocycles",
    "GRCA": "Génie de la réaction chimique avancée",
    "TE": "Transition énergétique",
    "AL": "Analyses en lignes",
    "SM": "Synthèse Macromoléculaire",
    "SMB": "Synthèse de molécules bioactives",
    "NN": "Nanochimie, nanomatériaux",
    "CN": "Chimie nucléaire",
    "ADNSC": "Analyse de données - le numérique au service de la chimie",
    "CAM": "Conception et application du médicament",
    "TSA": "Techniques séparatives avancées",
    "CDD": "Catalyse et développement durable",
    "GP": "Génie de la polymérisation",
    "RMN": "RMN appliquée à la chimie moléculaire",
    "MN": "Méthodes Numériques"
}
print(mso.keys())
# create dict of name_mso: id_mso
msod = {i: list(mso.keys())[i] for i in range(len(mso.values()))}
print(msod)