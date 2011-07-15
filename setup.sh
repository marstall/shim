echo "installing npm ..."
sudo curl http://npmjs.org/install.sh | sudo sh

echo "installing node.js packages ..."
sudo npm install socket.io
sudo npm install http-proxy
sudo npm install ejs

./configure_proxy.sh 

