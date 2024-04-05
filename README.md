# Coin Chase UI

The coin chase client made in JavaScript. This is meant to be used for a demo.
This is really scuffed. It is a proxy node server that will connect to a Unix
socket running on `localhost:6969` and will send the messages as defined in the
coin game from the COOL compiler project. The ui client will connect to this
server using websockets and will display the game state and take input from
user. It does not always work so yeah. Scuffed. In the UI you have to provide
the IP:PORT of the server. The server will be probably running on port 3000 on
some VM.

## Quickstart

```console
docker build -t coin-game .
docker run --rm -it -p 3000:3000 coin-game:latest
```
This will start the server on port 3000. Then you have to start the UI from the
`app` folder with

(sure you can also run it with `npm install` and then run the `entrypoint.sh`
file, but this is easier)

```console
cd app
python3 -m http.server 8080
```

Then you can open the browser and go to `localhost:8080` and you will see the
UI. The controls are the same as in the original client `wasd`, there are less
UI effect though since this is a scuffed demo.
