
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
    res.send('Item with SKUID:'+req.params.SKUId+'\n XHz Milk chocolate 100g 032022');
});

//get items array
app.get('/items', (req, res) => {
    console.log('/items');
    console.log('No items in inventory');
    res.send('No items in inventory');
});

//insert item
app.post('/item', (req, res) => {
    console.log('/item insert');
    //TODO: get body params, send and print
    console.log('Item created');
    res.send('Item created');
});


//update item
app.put('/item', (req, res) => {
    console.log('/item update');
    console.log('Item updated');
    res.send('Item updated');
});

//delete item
app.delete('/item', (req, res) => {
    console.log('/item delete');
    console.log('Item deleted');
    res.send('Item deleted');
});

//app start
app.listen(8501, () => console.log('Inventory service on 8501!'));
