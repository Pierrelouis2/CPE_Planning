import sqlite3

conn = sqlite3.connect('users.db')
cur = conn.cursor()

init = input("delete inscription 1 ou user 2 : ")
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

