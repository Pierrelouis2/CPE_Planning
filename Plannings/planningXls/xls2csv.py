import pandas as pd
import sys

print(sys.argv[1])
df = pd.read_excel(sys.argv[1])
df = df.drop(df.columns[0], axis=1)
df = df.drop(df.index[0:6])
df.to_csv(f'{sys.argv[2]}', index=False, header=False, sep=';')
print('end')