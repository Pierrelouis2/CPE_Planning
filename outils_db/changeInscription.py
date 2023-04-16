#!/bin/python3

import sqlite3

conn = sqlite3.connect('users.db')
cur = conn.cursor()

init = input("delete all inscription status 1 \n delete user 2 \nchange from inscription to inscrit 3 \n insert pl into profile database 4 \n change rigths pl jo 5 \n :")
if init == "1":
    sql_delete_iscriptions = 'DELETE FROM user where status = "Inscription"'
    cur.execute(sql_delete_iscriptions)
    conn.commit()
    print("Inscriptions supprimées")
elif init == "2":
    user_id = input("Id user a supprimer : ")
    sql_delete_user = "DELETE FROM user WHERE id_user=?"
    cur.execute(sql_delete_user,[user_id])
    conn.commit()
    print("User supprimé")
elif init == "3":
    sql_update_inscription = "UPDATE user SET status = 'Inscrit' WHERE status = 'Inscription' and majeur != 'None'"
    cur.execute(sql_update_inscription)
    conn.commit()
    print("Inscription changé en inscrit")
elif init == "4":
    sql_inscription_profile = "INSERT INTO profile VALUES ('Pierre-Louis', 'TELEP', 'pl.telep@cpe.fr', 'password','S', 1)"
    cur.execute(sql_inscription_profile)
    conn.commit()
    print("Inscription changé en inscrit")
elif init == "5":
    sql_change_pl_rights = "UPDATE profile SET rights = 'A' WHERE psid=5810016312430121 OR psid = 6271457816218293"
    cur.execute(sql_change_pl_rights)
    conn.commit()
    print("Inscription changé en inscrit")
else:
    print("erreur")


