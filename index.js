const http = require("http");
const fs = require("fs");
const rateLimiter = require("./rateLimiter");

const pages = `
Pages to try:
    1. /about
    2. /blogs
    3. /logs
    4. /errorlogs
    5. /*error*
    6. /*crash*  

`;

const getMessage = ({ ip, date, time, statusCode, url }) => {
  return `[IP: ${ip}] [${date}] [${time}] [statusCode - ${statusCode}]: ${url}\n`;
};

const server = http.createServer((req, res) => {
  const url = req.url !== "/favicon.ico" && req.url;
  const date = new Date().toDateString();
  const time = new Date().toTimeString();
  const ip = req.socket.remoteAddress;

  if (rateLimiter(ip)) {
    res.writeHead(429, { "Content-Type": "text/plain" });
    return res.end(`Too many request, try again after sometime`);
  }

  try {
    if (url) {
      if (url.includes("crash")) {
        fs.writeFileSyync("error.txt", "crashed");
        return;
      }
      if (url.includes("error")) {
        if (url === "/errorlogs") {
          const logs = fs.readFileSync("error.txt", "utf-8");
          res.writeHead(200, { "Content-Type": "text/plain" });
          return res.end(`${pages}            
                ${logs}`);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          fs.appendFileSync(
            "error.txt",
            getMessage({
              ip,
              date,
              time,
              statusCode: res.statusCode,
              url: req.url,
            })
          );
        }
        return res.end(`Caught in error page
${pages}`);
      }
      if (url === "/logs") {
        const logs = fs.readFileSync("logs.txt", "utf-8");
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end(`${pages}            
            ${logs}`);
      }

      if (["/", "/about", "/blogs", "/logs"].includes(req.url)) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        fs.appendFileSync(
          "logs.txt",
          getMessage({
            ip,
            date,
            time,
            statusCode: res.statusCode,
            url: req.url,
          })
        );
        return res.end(`Welcome ${req.url}

${pages}
            `);
      } else {
        res.writeHead(300, { "Content-Type": "text/plain" });
        fs.appendFileSync(
          "logs.txt",
          getMessage({
            ip,
            date,
            time,
            statusCode: res.statusCode,
            url: req.url,
          })
        );
        return res.end(`This page has been redirected

${pages}           
            `);
      }
    } else {
      fs.appendFileSync(
        "logs.txt",
        getMessage({ ip, date, time, statusCode: res.statusCode, url: req.url })
      );

      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end(`Page not found

${pages}

        `);
    }
  } catch (err) {
    fs.appendFileSync(
      "error.txt",
      getMessage({ ip, date, time, statusCode: res.statusCode, url: req.url })
    );

    res.writeHead(500, { "Content-Type": "text/plain" });
    return res.end(`Sorry I'm crashed, It's your fault. I hate you >:-(

${pages}`);
  }
});

server.listen(8000, () =>
  console.log(`server is running on http://localhost:8000/`)
);
