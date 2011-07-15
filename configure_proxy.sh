echo "setting network interface privileges ..."
sudo chgrp admin /dev/bpf*
sudo chmod g+rw /dev/bpf*

echo "Adding firewall rule to forward all port-80 WiFi passthrough traffic to localhost:3128 ..."
sudo ipfw delete 02000 
sudo ipfw -q add 02000 fwd 127.0.0.1,3128 tcp from any to any dst-port 80 in recv en1

echo "Setting new.inet.ip flags to allow transparent-proxying ..."
sudo sysctl -w net.inet.ip.forwarding=1
sudo sysctl -w net.inet.ip.fw.enable=1
sudo sysctl -w net.inet.ip.fw.verbose=1
sudo sysctl -w net.inet.ip.scopedroute=0
