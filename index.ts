import { createServer } from "node:https";
import { writeRes, writeErrorRes, evalPOST, deleteId, evalWatchRes, getImgDataFromVidId, setImageDataAndVideoId } from "./evalRes";
import { readFileSync, existsSync } from "node:fs";
import { WebSocketServer } from "ws";

const keyFile = "./certificate_files/localhost.key";
const crtFile = "./certificate_files/localhost.crt"
if (!(existsSync(keyFile) || existsSync(crtFile))) {
  console.log(`Check if "${keyFile}" and "${crtFile}" exists.\nDid you run createCert.bat?\n`);
  process.exit();
}

const port = 8000;
const options = {
  key: readFileSync('./certificate_files/localhost.key'),
  cert: readFileSync('./certificate_files/localhost.crt')
};

const server = createServer(options, (req, res) => {
  if(!req.url) writeErrorRes(404, res);
  else {
    let qIndex = req.url.indexOf("?");
    let curUrl;
    if (qIndex>=0) curUrl = req.url.substring(0, qIndex);
    else curUrl = req.url;
    switch (curUrl.split("/").slice(-1)[0]) {
      case "":
        writeRes("index.html", res);
        break;
      case "startStream":
        if (req.method!.toUpperCase() === "POST") evalPOST(req, res);
        else if(req.method!.toUpperCase() === "GET") writeRes("startStreamForm.html", res);
        else writeErrorRes(500, res);
        break;
      case "watchStream": 
        if (qIndex>=0) evalWatchRes(req.url, res)
        else writeRes("watchStreamForm.html", res);
        break;
      case "deleteId": 
        deleteId(req, res);
        break;
      default:
        writeErrorRes(404, res);
    }
  };
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  ws.on('error', console.error);
  ws.on('message', (data) => {
    if (req.url === "/getImageData")
      ws.send(getImgDataFromVidId(data.toString()));
    if (req.url === "/setImageData")
      setImageDataAndVideoId(data.toString());
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running at port:${port}`);
});