import * as clu from "../clu.js";

export default class AppComponent extends clu.Component {
    styles = ``;
    state = {
        items: []
    };
    events = {};
    constructor() {
        super();
        this.getItems();
    }
    async getItems() {
        var reqData = {
            user: "charles"
        };
        var resData = await this.fetchData("/get-items", reqData);
        this.updateState({
            items: resData.items
        });
    }
    async handleKeydown() {
        this.getItems();
    }
    render() {
        return `
            <item-input state="${this.initState({ handleKeydown: this.handleKeydown })}"></item-input>
            <item-list state="${this.initState({ items: this.state.items })}"></item-list>`;
    }
}