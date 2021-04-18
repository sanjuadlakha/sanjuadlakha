//api client

const http = require('https');

var url = "https://api.nasa.gov/planetary/apod?api_key=HeSj3w6WSaDFhzNCsA80lM1Oqt9DZ0ZI1QMrR7ZR";
var method = "GET";

var options = {
  method: method
};

console.log("url is "+url);
console.log("method is "+method);

//make the request
http.request(url, options, (resp) => {

    let data = '';

  // get the response
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // response has been received
  resp.on('end', () => {
    console.log(data);
  });

}).end();
