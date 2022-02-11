import * as clu from "../clu.js";

export default class ItemList extends clu.Component {
    styles = ``;
    state = {};
    events = {};
    render() {
        return `${this.state.items.reduce((prev, cur) => prev + "<p>" + cur.text + "</p>", "")}`;
    }
}