
//imports and dependencies
const express = require('express');
const app = express();

//for cors
app.use(function (req, res, next){
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

//main method 
app.get('/', (req, res) => {
    //TODO: serve the inventory open api yaml here
    res.send('Inventory service will serve Open API YAML soon');
});

//get single item
app.get('/item/:SKUId', (req, res) => {
    console.log('/item');
    console.log('SKUID:'+req.params.SKUId);
    var item = {'SKUID':req.params.SKUId ,'Name':'BrandX','Type':'Milk chocolate', 'Weight':'100g','ExpiryDate': '032022'};
    res.send(JSON.stringify(item));
});

//get items array
app.get('/items', (req, res) => {
    console.log('/items');
    var status = {'status':'No items in inventory'};
    console.log(JSON.stringify(status));
    res.send(JSON.stringify(status));
});

//insert item
app.post('/item', (req, res) => {
    console.log('/item insert');
    var status = {'status':'Item created'};
    console.log(JSON.stringify(status));
    res.send(JSON.stringify(status));   
});


//update item
app.put('/item', (req, res) => {
    console.log('/item update');
    var status = {'status':'Item updated'};
    console.log(JSON.stringify(status));
    res.send(JSON.stringify(status));   
});

//delete item
app.delete('/item', (req, res) => {
    console.log('/item delete');
    var status = {'status':'Item deleted'};
    console.log(JSON.stringify(status));
    res.send(JSON.stringify(status));   
});

//app start
app.listen(8501, () => console.log('Inventory service on 8501!'));
