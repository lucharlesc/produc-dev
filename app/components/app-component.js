import * as clu from "../clu.js";

export default class AppComponent extends clu.Component {
    styles = ``;
    state = {
        counter: 0,
        items: []
    };
    events = {};
    init() {
        this.getItems();
    }
    async getItems() {
        var reqData = {
            user: "charles"
        };
        var resData = await this.fetchData("/get-items", reqData);
        this.updateState({
            counter: this.state.counter + 1,
            items: resData.items
        });
    }
    render() {
        // if (this.state.items.length == 0) {
        //     return `<p>no items</p>`;
        // }
        return `
            <p><span>counter</span> ${this.state.counter}</p>
            <item-input state="${this.initState({ handleKeydown: this.getItems })}"></item-input>
            <item-list state="${this.initState({ items: this.state.items })}"></item-list>`;
    }
}