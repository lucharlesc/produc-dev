import * as clu from "../clu.js";

export default class HeaderComponent extends clu.Component {
    styles = ``;
    state = {};
    events = {
        click: function (event) {
            console.log("barfoo")
        }
    };
    render() {
        return `<p>header</p>`;
    }
}