echo "installing npm ..."
sudo curl http://npmjs.org/install.sh | sudo sh

echo "installing node.js packages ..."
sudo npm install socket.io@0.7.7
sudo npm install http-proxy@0.5.11
sudo npm install ejs@0.4.3
sudo npm install ejs@0.4.3
sudo npm install -g supervisor

echo "copying new.inet.ip flags to /etc/sysctl.conf to allow transparent-proxying ..."
sudo touch /etc/sysctl.conf
sudo cp /etc/sysctl.conf __sysctl.conf
sudo cat _sysctl.conf>>__sysctl.conf
sudo cp __sysctl.conf /etc/sysctl.conf

kernelflags="net.inet.ip.scopedroute=0"

currentflags=`sudo defaults read /Library/Preferences/SystemConfiguration/com.apple.Boot "Kernel Flags"`
echo $currentflags

if [[ "$currentflags" == "$kernelflags" ]]; then
	echo "You're already set for scoped routing."
else
	sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.Boot "Kernel Flags" $kernelflags
	echo "To use shim, you'll need to reboot just this once for the kernel flags change to take effect."
fi

sudo plutil -convert xml1 /Library/Preferences/SystemConfiguration/com.apple.Boot.plist

./configure_proxy.sh

