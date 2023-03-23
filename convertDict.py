
def htmlEntities(str):
    return str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'",'&#39');

import sys
if len(sys.argv) < 2:
    print('Thieu data')
    exit()


dictFile=sys.argv[1]
dictName=dictFile.split('.')[0].encode()
quote = b'"'
stored = b'const ' + dictName + b' = {\n'
endstored = b'};\n'

f = open(dictFile, 'rb').read()
lines = f.splitlines()
for line in lines:
    stored += quote + line.split(b'=', 1)[0] + quote + b': ' + quote + line.split(b'=', 1)[-1] + quote + b','
stored = stored.strip(b',') #loại bỏ dấu phẩy cuối cùng để không phá vỡ quy tắc của object trong JS
final = stored + endstored

fw=open(dictFile+'.pyjs','wb')
fw.write(final)
fw.close()

