import * as clu from "./clu.js";

// @beginComponentImports
import AppComponent from "./components/app-component.js";
import ItemInput from "./components/item-input.js";
import ItemList from "./components/item-list.js";
// @endComponentImports

var app = new clu.App;

// @beginComponentDeclares
app.component("app-component", AppComponent);
app.component("item-input", ItemInput);
app.component("item-list", ItemList);
// @endComponentDeclares

app.start("app-component");