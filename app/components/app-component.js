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
    foobar(event) {
        console.log("foober")
    }
    render() {
        // if (this.state.items.length == 0) {
        //     return `<p>no items</p>`;
        // }
        return `
            <router-link path="/foo"><a href="/foo">link to foo</a></router-link>
            <router-route path="/">this is root</router-route>
            <router-route path="/foo">this is foo</router-route>
            <p><span><span data-foo="${this.state.counter}">counter</span> ${this.state.counter}</span></p>
            <header-component data-foo="${this.state.counter}" on-click="foobar" state="${this.initState({ myarr: [0, 1, 2] })}"></header-component>
            <item-input data-foo="${this.state.counter}" state="${this.initState({ handleKeydown: this.getItems })}"></item-input>
            <item-list data-foo="${this.state.counter}" state="${this.initState({ items: this.state.items })}"></item-list>`;
    }
}