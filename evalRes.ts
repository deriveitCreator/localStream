import { ServerResponse } from "node:http";
import { readFile } from "node:fs";
import { IncomingMessage } from "http";

var idDict: {[id:string]: JSON | null} = {};

export function writeRes(htmlName: string, res: ServerResponse, replaceText?: [string, string]){
  readFile(`./htmls/${htmlName}`, (err,html)=>{
    if (err) writeErrorRes(500, res);
    else{
      let outputHTML: string | Buffer;
      if(replaceText)
        outputHTML = html.toString('utf-8').replaceAll(replaceText[0], replaceText[1]);
      else outputHTML = html;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.write(outputHTML);
      res.end();
    }
  });
}

export function writeErrorRes(statusCode: number, res: ServerResponse){
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html');
  res.write(`<p>There was a ${statusCode} error.</p>`);
  res.end();
}

export function evalPOST(req: IncomingMessage, res: ServerResponse){
  let body = "";
  req.on('data', (chunk) => body += chunk);
  req.on('end', () => {
    try{
      let dataArr = body.split("=");
      if (dataArr[0] === "video_id_input"){
        idDict[dataArr[1]] = null;
        writeRes("startStream.html", res, ["VIDEO_ID", dataArr[1]]);
      }
      else writeErrorRes(500, res);
    }
    catch{ writeErrorRes(500, res); }
  });
}

export function deleteId(req: IncomingMessage, res: ServerResponse){
  let body = "";
  req.on('data', (chunk) => body += chunk);
  req.on('end', () => {
    try{
      res.statusCode = 200;
      let dataArr = body.split("=");
      if (dataArr[1] in idDict)
        delete idDict[dataArr[1]];
    }
    catch{ res.statusCode = 500; }
    res.end();
  });
}

export function evalWatchRes(url: string, res: ServerResponse){
  let paramsArr = url.substring(url.indexOf("?")+1).split("=");
  if ((paramsArr[0] === "video_id_input") && (paramsArr[1] in idDict))
    writeRes("watchStream.html", res);
  else writeErrorRes(500, res);
}

export function getImgDataFromVidId(vidId: string){
  if (vidId in idDict)
    return JSON.stringify(idDict[vidId]);
  return "Invalid_ID";
}

export function setImageDataAndVideoId(data: string){
  let json = JSON.parse(data);
  idDict[json["id"]] = json;
}