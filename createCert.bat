@ECHO OFF
mkdir "certificate_files"
cd "certificate_files"
openssl genpkey -algorithm RSA -out localhost.key
openssl req -new -key localhost.key -out localhost.csr
openssl x509 -req -in localhost.csr -signkey localhost.key -out localhost.crt
cd ..