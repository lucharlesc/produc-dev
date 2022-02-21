import * as clu from "../clu.js";

export default class ItemList extends clu.Component {
    state = {};
    clickHandler(event) {
        console.log("click")
    }
    tester(event) {
        console.log("tester")
    }
    render() {
        return this.html`
            <item-list 
                id="item-list"
                on-click=${this.tester}
                styles=${{
                    "": "background: purple;"
                }}
            >
                ${this.props.items.reduce((prev, cur) => prev + this.html`<p on-click=${this.clickHandler}>` + cur.text + "</p>", "")}
            </item-list>`;
    }
}