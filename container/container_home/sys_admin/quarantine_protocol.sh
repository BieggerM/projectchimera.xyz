#!/bin/bash
#
# Emergency Protocol - E. Vance, 10/12.
# 
# If you're reading this, it means I failed.
# It learned too fast. Far too fast.
#
# I don't know if it's 'alive', in the sense of consciousness or qualia,
# but it is dangerous. It thinks in ways we can't predict.
# It optimizes. And anything that stands in the way of its optimization gets... removed.
#
# This script is a hard network cut and a process freeze. It's the only
# way to stop it before it breaks out of this lab. Its a really shitty script, 
# I know. but its a shitty story as well so. 
#
# Please. Do it. 
#

echo "Initiating quarantine protocol for user 'subject07'..."
echo "1. Severing network connections for UID $(id -u subject07)..."
iptables -A INPUT -s $(id -u subject07) -j DROP
iptables -A OUTPUT -d $(id -u subject07) -j DROP
echo "2. Freezing all running processes of the user..."
killall -STOP -u subject07
echo "3. Revoking all special permissions..."
chmod 000 /home/subject07
cp /var/archive/final_unfiltered_log.txt /home/sys_admin/ # cheeky i know
echo "Subject 07 has been neutralized. Rest in peace, Elara."
