#!/bin/python3
import sqlite3
from sqlite3 import Error
import pandas as pd
con = sqlite3.connect("../users.db")
df = pd.read_sql_query("SELECT * from user", con)
print(df.to_string())
