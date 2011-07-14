sudo chgrp admin /dev/bpf*
sudo chmod g+rw /dev/bpf*

sudo ipfw -q add 02000 fwd 127.0.0.1,3128 tcp from any to any dst-port 80 in recv en1
sudo sysctl -w net.inet.ip.forwarding=1
sudo sysctl -w net.inet.ip.fw.enable=1
sudo sysctl -w net.inet.ip.fw.verbose=1
sudo sysctl -w net.inet.ip.scopedroute=0
