import * as clu from "../clu.js";

export default class ItemList extends clu.Component {
    styles = ``;
    state = {};
    events = {};
    clickHandler(event) {
        console.log("click")
    }
    render() {
        return `${this.state.items.reduce((prev, cur) => prev + `<p on-click="clickHandler">` + cur.text + "</p>", "")}`;
    }
}