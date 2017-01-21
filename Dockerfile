FROM ubuntu:latest
MAINTAINER Andre Ferreira <andrehrf@gmail.com>

RUN id -u app &>/dev/null || useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app

COPY package.json $HOME
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME
RUN npm install --progress=false

USER root
COPY . $HOME
RUN chown -R app:app $HOME/*

RUN apt-get update -qq && apt-get install -qqy curl git ssh sshpass \
    apt-transport-https ca-certificates lxc iptables

RUN npm install -g bower
RUN bower install --allow-root

USER app
RUN node $HOME/.bin/webide.js install

CMD ["npm", "start"]