echo "installing npm ..."
sudo curl http://npmjs.org/install.sh | sudo sh

echo "installing node.js packages ..."
sudo npm install socket.io@0.7.7
sudo npm install http-proxy@0.5.11
sudo npm install ejs@0.4.3

echo "copying new.inet.ip flags to /etc/sysctl.conf to allow transparent-proxying ..."
sudo touch /etc/sysctl.conf
sudo cp /etc/sysctl.conf __sysctl.conf
sudo cat _sysctl.conf>>__sysctl.conf
sudo cp __sysctl.conf /etc/sysctl.conf

./configure_proxy.sh
