FROM ubuntu:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    make git fasm nodejs clang npm

# Code of the game
WORKDIR /app
RUN git clone https://github.com/alexjercan/cool-compiler.git
WORKDIR /app/cool-compiler
RUN make examples
RUN cp build/coin-server ../server

# Server proxy
WORKDIR /app
COPY package.json /app/package.json
RUN npm install
COPY server.js /app/server.js

COPY entrypoint.sh /app/entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["sh", "entrypoint.sh"]
