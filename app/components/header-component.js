import * as clu from "../clu.js";

export default class HeaderComponent extends clu.Component {
    state = {};
    render() {
        return `<header-component><p>${this.props.headerText}</p></header-component>`;
    }
}