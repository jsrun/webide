FROM ubuntu:latest
MAINTAINER Andre Ferreira <andrehrf@gmail.com>

ENV HOME=/home/app
COPY package.json $HOME
WORKDIR $HOME
RUN npm install --progress=false
COPY . $HOME
RUN echo fs.inotify.max_user_watches=582222 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

RUN apt-get update -qq && apt-get install -qqy curl git ssh sshpass \
    apt-transport-https ca-certificates lxc iptables

RUN npm install -g bower
RUN bower install --allow-root
RUN node $HOME/.bin/install.js

CMD ["npm", "start"]