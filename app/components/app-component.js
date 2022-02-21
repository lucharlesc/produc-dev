import * as clu from "../clu.js";

export default class AppComponent extends clu.Component {
    state = {
        counter: 0,
        items: []
    };
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
            <app-component 
                id="appid" 
                on-click=${this.appclick}
                styles=${{
                    "": `display: block; background: ${this.state.counter % 2 == 0 ? "red" : "blue"}`
                }}
            >
                <router-link 
                    props=${{ path: "/foo" }}
                    styles=${{
                        "": `background: blue;`
                    }}
                >
                    <a href="/foo">link to foo</a>
                </router-link>
                <router-route props=${{ path: "/" }}><p>this is root</p></router-route>
                <router-route props=${{ path: "/foo" }}><p>this is foo</p></router-route>
                <p><span><span styles=${{
                    "": `color: orange;`
                }}>counter</span> ${this.state.counter}</span></p>
                <header-component on-click=${this.foobar} props=${{ headerText: "headerText" }}></header-component>
                <item-input props=${{ handleKeydown: this.getItems }}></item-input>
                <item-list 
                    props=${{ items: this.state.items }}
                    styles=${{
                        "": `display:block; background: green;`
                    }}
                ></item-list>
            </app-component>
            `;
    }
}