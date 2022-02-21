import * as clu from "../clu.js";

export default class ItemInput extends clu.Component {
    state = {};
    async handleKeydown(event) {
        if (event.key == "Enter") {
            var item = {
                user: "charles",
                text: event.target.value
            };
            var reqData = {
                item: item
            };
            var resData = await this.fetchData("/add-item", reqData);
            this.props.handleKeydown();
            event.target.value = "";
        }
    }
    render() {
        return this.html`<item-input><input type="text" on-keydown=${this.handleKeydown}></item-input>`;
    }
}