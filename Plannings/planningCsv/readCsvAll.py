#/bin/python3

import multiprocessing
import os
import sys

## use this script from the root of the project : CPE_Planning

path = 'Plannings/planningCsv/'
scripts = [path + '4ETI/ReadCsv4ETI.py', path + '4CGP/ReadCsv4CGP.py', path + '3CGP/ReadCsv3CGP.py' , path + '3ETI/ReadCsv3ETI.py']

def run_script(script):
    os.system('python3 ' + script)

def not_main():
    date = sys.argv[1]
    for i in range(len(scripts)):
        scripts[i] += ' ' + date
    pool = multiprocessing.Pool(processes=4)
    pool.map(run_script, scripts)

if __name__ == '__main__':
    date = input("Entrez la date du planning csv (ex: 01_04) : ")
    # give the date to the scripts as argument
    for i in range(len(scripts)):
        scripts[i] += ' ' + date
    pool = multiprocessing.Pool(processes=4)
    pool.map(run_script, scripts)

    