# insert in tj_user_mso: user 1, mso 1
import sqlite3
database = "users.db"
sql_insert_tj_user_mso = "INSERT INTO tj_user_mso (id_user, id_mso) VALUES(?, ?)"
values = [121, 5]
conn = sqlite3.connect(database)
c = conn.cursor()
c.execute(sql_insert_tj_user_mso, values)
conn.commit()

# verify
import pandas as pd
df = pd.read_sql_query("SELECT * FROM tj_user_mso", conn)
print(df.to_string())
