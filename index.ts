import { createServer } from "node:http";
import { writeRes, writeErrorRes, evalPOST, deleteId } from "./evalRes";

const port = 8000;

createServer((req, res) => {
  if(!req.url) writeErrorRes(404, res);
  else switch(req.url!.split("/").slice(-1)[0]) {
    case "":
      writeRes("index", res);
      break;
    case "startStream":
      if(req.method!.toUpperCase() === "POST") evalPOST(req, res);
      else if(req.method!.toUpperCase() === "GET") writeRes("startStreamForm", res);
      else writeErrorRes(500, res);
      break;
    case "watchStream": 
      writeRes("watchStream", res);
      break;
    case "deleteId": 
      deleteId(req, res);
      break;
    default:
      writeErrorRes(404, res);
  }
})
.listen(port, "0.0.0.0", () => {
  console.log(`Server running at port:${port}`);
});