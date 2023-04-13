#!/bin/python3
import sqlite3
from sqlite3 import Error
import pandas as pd
conn = sqlite3.connect("users.db")

choix = input("quelle table (user : 1  liaison : 2  mso : 3 profile : 4)  ?")

if choix == "1":
    df = pd.read_sql_query("SELECT * from user", conn)
    print(df.to_string())
elif choix == "2":
    df = pd.read_sql_query("SELECT * FROM tj_user_mso", conn)
    print(df.to_string())
elif choix == "3":
    df = pd.read_sql_query("SELECT * from mso", conn)
    print(df.to_string())
elif choix == "4":
    df = pd.read_sql_query("SELECT * from profile", conn)
    print(df.to_string())
else:
    print("erreur")

