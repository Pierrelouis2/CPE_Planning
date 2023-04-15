#/bin/python3

import multiprocessing
import os

path = 'Plannings/planningCsv/'
# create a script using 4 fork ti run the scripts 4ETI/ReadCsv4ETI.py and 4CGP/ReadCsv4CGP.py and 3ETI/ReadCsv3ETI.py and 3CGP/ReadCsv3CGP.py
# the script will be run in parallel

def run_script(script):
    os.system('python3 ' + script)

if __name__ == '__main__':
    date = input("Entrez la date du planning csv (ex: 01_04) : ")
    scripts = [path + '4ETI/ReadCsv4ETI.py', path + '4CGP/ReadCsv4CGP.py', path + '3CGP/ReadCsv3CGP.py'] # , path + '3ETI/ReadCsv3ETI.py'
    # give the date to the scripts as argument
    for i in range(len(scripts)):
        scripts[i] += ' ' + date
    pool = multiprocessing.Pool(processes=4)
    pool.map(run_script, scripts)

    