//api client

const http = require('https');

var url = "https://api.nasa.gov/planetary/apod?api_key=ccbqz2yxl739eSMIO5fXjOSUJmvd8BXNUuXbKc3Z";
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
