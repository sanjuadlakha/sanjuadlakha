//rest client

const http = require('http');

//get the url, method from the command line
var inputs = process.argv.slice(2);

if(inputs.length !=2)
{
    console.log('usage: node restclient url method \n e.g. node restclient http://localhost:8501/item/1 GET');
    process.exit(-1);

} 

var url = inputs[0];
var method = inputs[1];

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