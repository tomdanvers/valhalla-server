./node_modules/forever/bin/forever stop -al forever.log -ao out.log -ae err.log valhalla-server.js
git pull origin master
./node_modules/forever/bin/forever start -al forever.log -ao out.log -ae err.log valhalla-server.js
