import pandas as pd
import sys
import os

print('start python script xls2csv.py')
df = pd.read_excel(sys.argv[1])
if 'CGP' in sys.argv[1]:
    df = df.drop(df.columns[0], axis=1)
    df = df.drop(df.index[0:5])
if 'ETI' in sys.argv[1]:
    pass

df.to_csv(f'{sys.argv[2]}', index=False, header=False, sep=';')
print('end')