const clu = require("clujs");
const mongodb = require("mongodb");

// @beginRouteRequires
const DefaultRoute = require("./routes/default-route.js");
const AddItem = require("./routes/add-item.js");
const GetItems = require("./routes/get-items.js");
// @endRouteRequires

var server = new clu.Server;

global.db = new mongodb.MongoClient("mongodb://localhost:27017");
global.db.connect();

// @beginRouteDeclares
server.route("/*", DefaultRoute);
server.route("/add-item", AddItem);
server.route("/get-items", GetItems);
// @endRouteDeclares

server.serve(3000);