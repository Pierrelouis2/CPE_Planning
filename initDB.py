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
                                        majeur text
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

    # create a database connection
    conn = create_connection(database)

    # create tables
    if conn is not None:
        # create projects table
        create_table(conn, sql_create_user_table)

        # create tasks table
        create_table(conn, sql_create_tj_user_mso_table)

        # create tasks table
        create_table(conn, sql_create_mso_table)
    else:
        print("Error! cannot create the database connection.")
    
if __name__ == '__main__':
    main()
