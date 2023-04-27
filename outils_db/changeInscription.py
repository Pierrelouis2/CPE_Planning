#!/bin/python3

import sqlite3

conn = sqlite3.connect('users.db')
cur = conn.cursor()

init = input("delete all inscription status 1 \ndelete user 2 \nchange from inscription to inscrit 3 \ndelete profile database 4 \nchange rigths pl jo 5 \ninscription secreataires 6 :")
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
    psid = input("Id user a supprimer : ")
    sql_inscription_profile = "DELETE FROM profile WHERE psid=?"
    cur.execute(sql_inscription_profile,[psid])
    conn.commit()
    print("Inscription changé en inscrit")
elif init == "5":
    import json
    with open('./config/default.json') as json_file:
        data = json.load(json_file)
    sql_change_pl_rights = f"UPDATE profile SET rights = 'A' WHERE psid={data['id']['jo']} OR psid = {data['id']['pl']}"
    cur.execute(sql_change_pl_rights)
    conn.commit()
    print("Inscription changé en inscrit")
elif init == "6" :
    sql_set_sec = "INSERT INTO user  VALUES (11001,3,'ETI','S','None','Inscrit'), (11002,3,'CGP','S','None','Inscrit'),(11003,4,'ETI','S','None','Inscrit'),(11004,4,'CGP','S','None','Inscrit')"
    cur.execute(sql_set_sec)
    conn.commit()
    print("Secretaire added")
elif init == "7" :
    sql_change_sec_status = "UPDATE profile SET rights = 'B' WHERE psid=11001 OR psid=11002 OR psid=11003 OR psid=11004"
    cur.execute(sql_change_sec_status)
    conn.commit()
    print("rigths sec change to B")
else:
    print("erreur")


