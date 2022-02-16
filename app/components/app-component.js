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
    appclick(event) {
        console.log("appclick")
    }
    render() {
        return this.html`
            <app-component id="appid" on-click="${this.appclick}">
                <router-link state="${{ path: "/foo" }}"><a href="/foo">link to foo</a></router-link>
                <router-route state="${{ path: "/" }}">this is root</router-route>
                <router-route state="${{ path: "/foo" }}">this is foo</router-route>
                <p><span><span on-click="${this.foobar}">counter</span> ${this.state.counter}</span></p>
                <header-component state="${{ myarr: [0, 1, 2] }}"></header-component>
                <item-input state="${{ handleKeydown: this.getItems }}"></item-input>
                <item-list state="${{ items: this.state.items }}"></item-list>
            </app-component>
            `;
    }
}