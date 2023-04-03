#!/bin/python3
import sqlite3
from sqlite3 import Error
import pandas as pd
conn = sqlite3.connect("users.db")

choix = input("quelle table (user : 1  liaison : 2  mso : 3) ?")

df = pd.read_sql_query("SELECT * from user", conn)
print(df.to_string())
# df = pd.read_sql_query("SELECT * from mso", conn)
# print(df.to_string())
# df = pd.read_sql_query("SELECT * FROM tj_user_mso", conn)
# print(df.to_string())

# id = 111
# df = pd.read_sql_query("SELECT mso.name_mso FROM mso INNER JOIN tj_user_mso ON tj_user_mso.id_mso = mso.id_mso WHERE tj_user_mso.id_user=? ", conn, params=(id, ))
# print(df.to_string())