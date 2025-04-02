import { ServerResponse } from "node:http";
import { readFile } from "node:fs";
import { IncomingMessage } from "http";

var idSet = new Set();

export function writeRes(htmlName: string, res: ServerResponse, replaceText?: [string, string]){
  console.log(idSet);
  readFile(`./htmls/${htmlName}.html`, (err,html)=>{
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
  let curId: string;
  req.on('data', (chunk) => {
    try{
      let chunkArr = chunk.toString('utf-8').split("=");
      if ((chunkArr[0] === "video_id_input") && (!idSet.has(chunkArr[1]))){
        curId = chunkArr[1];
        idSet.add(curId);
      }else writeErrorRes(500, res);
    }
    catch{ writeErrorRes(500, res); }
  });
  req.on('end', () => writeRes("startStream", res, ["VIDEO_ID", curId]));
}

export function deleteId(req: IncomingMessage, res: ServerResponse){
  req.on('data', (chunk) => {
    try{
      let chunkArr = chunk.toString('utf-8').split("=");
      if (idSet.has(chunkArr[1])) idSet.delete(chunkArr[1]);
    }
    catch{ console.log("Internal Error when deleting id.") }
  });
}