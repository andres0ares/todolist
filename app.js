//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_API, {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = mongoose.Schema({
  name: String,
});

const Items = new mongoose.model('Item', itemsSchema);

const item1 = new Items({
  name: 'Welcome to your to do list!'
});
const item2 = new Items({
  name: 'Hit the + button to add a new Item.'
});
const item3 = new Items({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {
  
  const day = date.getDate();

  Items.find((err, items) => {
    if(items.length === 0){

      Items.insertMany([item1, item2, item3], (err) => {

        if(err){console.log(err)}
        else{
          console.log("Added new items successfully!");
        }

      });

      res.redirect("/");

    }else{
      res.render("list", {listTitle: day, newListItems: items});
    }        
  });
  

});

app.get('/:listName', (req, res) => {

  const customListName = _.capitalize(req.params.listName); 
  
  List.findOne({name: customListName}, (err, list) => {
    if(err) return console.error(err);
    if(list){ 
      res.render('list', {listTitle: customListName, newListItems: list.items});
    }else{
      const newList = new List({
        name: customListName,
        items: defaultItems
      });
    
      newList.save();
      res.redirect(`/${customListName}`);
    }
  });  
  
});

app.post("/", function(req, res){

  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Items({
    name: itemName
  });


  if(listName === day){
    newItem.save();
    res.redirect('/');
  }else{
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
  
  

});

app.post("/delete", (req, res) => {

  const day = date.getDate();
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === day){
    Items.deleteOne({_id: checkedItemId}, (err) => {
      if(err) return console.error(err);
      console.log('Successfully deleted.');
    });
    res.redirect('/');
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(!err){
        res.redirect(`/${listName}`);
      }
    });
  }

  
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
