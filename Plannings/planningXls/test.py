import pandas as pd

df = pd.read_excel('PLANNING_3CGP_DU_17_AU_21_AVRIL_2023.xls')
# delete the first column
df = df.drop(df.columns[0], axis=1)
# delete the six first rows
df = df.drop(df.index[0:6])

df.to_csv('testpy.csv', index=False, header=False, sep=';')

print('python: end')