from flask import Flask, render_template, request
from flask_sslify import SSLify
from flask_socketio import SocketIO, emit, join_room, leave_room
import webbrowser 
import copy
from time import sleep, time

app = Flask(__name__, static_folder='static')
app.debug = True
sslify = SSLify(app)
socketio = SocketIO(app)
visits = 0

streamers = dict()
watchers = dict()

@socketio.on('addStreamer')
def addStreamer(data):
  if ("streamerId" in data):
    streamers[data["streamerId"]] = time()
    join_room(data["streamerId"])

@socketio.on('isStreamer')
def isStreamer(data):
  if ("streamerId" in data):
    emit("isStreamer", {"streamerId": data["streamerId"], "streamerExists": data["streamerId"] in streamers})

@socketio.on('askForOffer')
def askForOffer(data):
  join_room(data["watcherId"])
  watchers[data["watcherId"]] = time()
  emit('askingForOffer', {"watcherId": data["watcherId"]}, to=data["streamerId"])

@socketio.on('sendOffer')
def sendOffer(data):
  emit('gotOffer', {"streamerId": data["streamerId"], "offer": data["offer"]}, to=data["watcherId"])
  
@socketio.on('sendAnswer')
def sendOffer(data):
  emit('gotAnswer', {"watcherId": data["watcherId"], "answer": data["answer"]}, to=data["streamerId"])

@socketio.on('removeStreamerOrWatcher')
def removeStreamer(data):
  if ("clientId" in data):
    id = data["clientId"]
    leave_room(id)
    if id in streamers:
      del streamers[id]
    elif id in watchers:
      del watchers[id]
    else:
      print("Tried to remove an unknown id:", id)

@socketio.on('sendIceCandidate')
def sendIceCandidate(data):
  emit('gotIceCandidate', {"fromStreamer": data["fromStreamer"], "candidate": data["candidate"], "senderId": data["senderId"]}, to=data["targetId"])

@socketio.on('streamerPong')
def streamerPong(data):
  streamers[data["id"]] = time()
  
@socketio.on('watcherPong')
def watcherPong(data):
  watchers[data["id"]] = time()

def sendPings():
  global app, streamers, watchers, socketio
  
  timeOutLimit = 25
  waitBetweenIterations = 10

  while True:
    streamersCopy = copy.deepcopy(streamers)
    watchersCopy = copy.deepcopy(watchers)
    
    for streamerId in streamersCopy:
      if (time() - streamersCopy[streamerId] > timeOutLimit):
        del streamers[streamerId]
      elif (streamerId in streamers): 
        socketio.emit("streamerPing", to=streamerId)
    for watcherId in watchersCopy:
      if (time() - watchersCopy[watcherId] > timeOutLimit):
        del watchers[watcherId]
      elif (watcherId in watchers):
        socketio.emit("watcherPing", to=watcherId)

    if (app.debug):
      print("Streamers:", streamers)
      print("Watchers:", watchers)
    sleep(waitBetweenIterations)

backgroundTaskStarted = False
@app.route('/')
def main():
  global visits, backgroundTaskStarted
  visits += 1
  if not backgroundTaskStarted:
    print("Starting background task...")
    backgroundTaskStarted = True
    socketio.start_background_task(sendPings)
  
  return render_template('main.html', clientId=request.remote_addr.replace(".","") + str(visits))

if __name__ == '__main__':
  webbrowser.open('https://localhost:8080')
  socketio.run(app, host="0.0.0.0", port=8080, ssl_context="adhoc")