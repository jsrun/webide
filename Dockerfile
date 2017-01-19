FROM node
MAINTAINER Andre Ferreira <andrehrf@gmail.com>

RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app

COPY package.json $HOME
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME
RUN npm install --silent --progress=false

USER root
COPY . $HOME
RUN chown -R app:app $HOME/*
RUN apt-get install git
RUN npm install -g bower
USER app
RUN bower install
RUN webide isntall

CMD ["npm", "start"]