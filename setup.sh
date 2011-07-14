echo "installing npm ..."
sudo curl http://npmjs.org/install.sh | sh

echo "installing node.js packages ..."
sudo npm install http-proxy
sudo npm install socket-io
sudo npm install ejs

./configure_proxy.sh 

