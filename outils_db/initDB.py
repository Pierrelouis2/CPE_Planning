#!/bin/python3
import sqlite3
from sqlite3 import Error
import pandas as pd

def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
    :param db_file: database file
    :return: Connection object or None
    """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)

    return conn


def create_table(conn, create_table_sql):
    """ create a table from the create_table_sql statement
    :param conn: Connection object
    :param create_table_sql: a CREATE TABLE statement
    :return:
    """
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)



def main():
    database = "users.db"

    sql_create_user_table = """ CREATE TABLE IF NOT EXISTS user (
                                        id_user integer PRIMARY KEY,
                                        promo text,
                                        filliere text,
                                        groupe text,
                                        majeur text,
                                        status text
                                    ); """

    sql_create_tj_user_mso_table = """CREATE TABLE IF NOT EXISTS tj_user_mso (
                                    id_user integer,
                                    id_mso integer,
                                    PRIMARY KEY (id_user, id_mso)
                                );"""
    sql_create_mso_table = """CREATE TABLE IF NOT EXISTS mso (
                                    id_mso integer PRIMARY KEY,
                                    name_mso text
                                );"""
    sql_create_profile_table = """CREATE TABLE IF NOT EXISTS profile (
                                    prenom text,
                                    nom text,
                                    email varchar(254),
                                    password varchar(254),
                                    rights text,
                                    psid integer PRIMARY KEY
                                    );"""
    sql_create_langue_table = """CREATE TABLE IF NOT EXISTS langue (
                                    id_langue integer PRIMARY KEY,
                                    Nom text,
                                    Prenom text,
                                    LV1 text,
                                    LV2 text,
                                    LV3 text,
                                    );"""
    sql_insert_langue_table = """INSERT INTO langue (id_langue, Nom, Prenom, LV1, LV2, LV3) VALUES (?, ?, ?, ?, ?, ?)"""

    sql_delete_mso_table = """DROP TABLE mso;"""
    # create a database connection
    conn = create_connection(database)
    # create tables
    if conn is not None:
        # create projects table
        # create_table(conn, sql_create_user_table)
        # create tasks table
        # create_table(conn, sql_create_tj_user_mso_table)
        #delete mso table
        create_table(conn, sql_delete_mso_table)
        # create tasks table
        create_table(conn, sql_create_mso_table)
        # create tasks table
        # create_table(conn, sql_create_profile_table)
        # # insert data
        # create_table(conn, sql_create_langue_table)
        mso = {
            "SSO": "Stratégie de Synthèse Organique",
            "IM": "Ingéniérie Macromoléculaire",
            "SMA": "Spectrométries RMN et Masse Avancées",
            "IBB": "Introduction aux Biotechnologies et Bioprocédés",
            "SP": "Simulation des Procédés",
            "COO": "Chimie Organométallique et Approche Orbitalaire",
            "CAM": "Conception et Application du Médicament",
            "TSS": "Techniques Séparatives avancées et Spéciation",
            "CDD": "Catalyse et Développement Durable",
            "GP": "Génie de la Polymérisation",
            "MSSO": "Méthodes Spectroscopiques pour la Synthèse Organique",
            "MN": "Méthodes Numériques",
            "SMB": "Synthèse de molécules bioactives",
            "MNM": "De la molécule aux nanomatériaux",
            "CNMACC": "Chimie nucléaire, mesure, analyse et cycle du combustible",
            "CN": "Chimie et Numérique",
            "MIE": "Microbiologie, Immunologie, Eléments de génie génétique",
        }
        # create dict of name_mso: id_mso
        msod = {i: list(mso.values())[i] for i in range(len(mso.values()))}

        c = conn.cursor()
        sql_add_mso = "INSERT INTO mso (id_mso, name_mso) VALUES (?, ?)"
        for key, value in msod.items():
            print(key, value)
            try:
                c.execute(sql_add_mso, [key, value])
            except sqlite3.IntegrityError as e:
                print("Value already exists")
                pass
        
        # insert data

        # df = pd.read_json("./Langues/lst_salles.json", sep=";")

        conn.commit()
    else:
        print("Error! cannot create the database connection.")
    
if __name__ == '__main__':
    main()
