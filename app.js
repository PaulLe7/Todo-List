//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect("mongodb+srv://admin-paul:" + process.env.PASSWORD + "@cluster0.ozpan.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true })


const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your new to-do list"
});

const item2 = new Item({
  name: "Press + to add a new item"
});

const item3 = new Item({
  name: "<< Hit this to mark a task as done!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  // const day = date.getDate();

  Item.find(function (err, items) {
    if (err) {
      console.log(err);
    } else if (items.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to database");
          res.redirect("/");
        }
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });

  if (listName != "Today") {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  } else {
    newItem.save();
    res.redirect("/");
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName

  if (listName == "Today") {
    Item.deleteOne({ _id: checkedItemId }, function (err) {
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    // find and update the condition, where we then delete from the item the item with the checkedItemID
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:custom_list_name", function (req, res) {
  const customListName = _.capitalize(req.params.custom_list_name);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
