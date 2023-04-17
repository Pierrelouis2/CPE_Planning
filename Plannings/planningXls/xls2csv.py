import pandas as pd
# import dataframe_image as dfi
import excel2image as ex2img
import sys
import os

print('start python script xls2csv.py')
df = pd.read_excel(sys.argv[1])
if 'CGP' in sys.argv[1]:
    df = df.drop(df.columns[0], axis=1)
    df = df.drop(df.index[0:6])
if 'ETI' in sys.argv[1]:
    pass

ex2img.export_img(sys.argv[1],sys.argv[3])
# dfi.export(df, f'{sys.argv[3]}')
df.to_csv(f'{sys.argv[2]}', index=False, header=False, sep=';')
print('end')