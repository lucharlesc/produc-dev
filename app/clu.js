class App {
    nextPropsId = 0;
    props = {};
    nextHandlerId = 0;
    handlers = {};
    nextStylesId = 0;
    styles = {};
    component(componentName, componentClass) {
        window.customElements.define(componentName, componentClass);
    }
    start(rootTagName) {
        window.cluApp = this;
        window.addEventListener("popstate", function (event) {
            var routerRoutes = document.getElementsByTagName("router-route");
            for (var routerRoute of routerRoutes) {
                routerRoute.reRender();
            }
        });
        this.component("router-route", RouterRoute);
        this.component("router-link", RouterLink);
        var rootElement = document.createElement(rootTagName);
        document.body.prepend(rootElement);
    }
}
class Component extends HTMLElement {
    props = {};
    state = {};
    handlers = [];
    styles = [];
    html(strings, ...exps) {
        var output = "";
        for (var i = 0; i < strings.length; i++) {
            if (strings[i].slice(-6) == `props=`) {
                output += strings[i] + this.initProps(exps[i]);
            } else if (strings[i].slice(-7) == `styles=`) {
                output += strings[i] + this.initStyles(exps[i]);
            } else if (/on-\w+=$/.test(strings[i])) {
                output += strings[i] + this.initHandler(exps[i]);
            } else if (exps[i]) {
                output += strings[i] + exps[i];
            } else {
                output += strings[i];
            }
        }
        return output.trim();
    }
    initProps(props) {
        var propsId = window.cluApp.nextPropsId++;
        for (var key in props) {
            if (typeof props[key] == "function") {
                props[key] = props[key].bind(this);
            }
        }
        window.cluApp.props[propsId] = props;
        return "\"" + propsId + "\"";
    }
    initStyles(styles) {
        var stylesId = window.cluApp.nextStylesId++;
        window.cluApp.styles[stylesId] = {
            orig: this,
            styles: styles
        };
        return "\"" + stylesId + "\"";
    }
    initHandler(handler) {
        var handlerId = window.cluApp.nextHandlerId++;
        window.cluApp.handlers[handlerId] = handler.bind(this);
        return "\"" + handlerId + "\"";
    }
    reRender() {

        // bind functions
        loopThruChildren = loopThruChildren.bind(this);
        setHandlers = setHandlers.bind(this);
        setStyles = setStyles.bind(this);

        // remove event listeners
        for (var handler of this.handlers) {
            handler[0].removeEventListener(handler[1], window.cluApp.handlers[handler[2]]);
            delete window.cluApp.handlers[handler[2]];
        }
        this.handlers = [];

        // remove styles
        for (var style of this.styles) {
            style.parentNode.removeChild(style);
        }
        this.styles = [];

        // update this.props with passed in propsId from props attribute
        if (this.hasAttribute("props")) {
            var propsId = this.getAttribute("props");
            this.props = window.cluApp.props[propsId];
            delete window.cluApp.props[propsId];
            this.removeAttribute("props");
        }

        var clone = cloneComponent(this);
        setAttributes(this, clone); // update this attributes to reflect clone attributes
        setHandlers(this);
        setStyles(this);
        loopThruChildren(this, clone);

        function loopThruChildren(node1, node2) {

            var childrenToRemove = [];
            var childrenToReplace = [];
            var childrenToAppend = [];

            for (var i = 0; i < node1.childNodes.length; i++) {

                var child1 = node1.childNodes[i];
                var child2 = node2.childNodes[i];

                // no child2
                if (!child2) {
                    childrenToRemove.push(child1); // mark child1 for removal

                // child2 exists, different type
                } else if (child1.nodeName != child2.nodeName) {
                    childrenToReplace.push([child2, child1]); // mark child1 for replacement by child2

                // child2 exists, same type, component
                } else if (Object.getPrototypeOf(child1) instanceof Component) {
                    setAttributes(child1, child2); // update child1 attributes to reflect child2 attributes
                    setHandlers(child1);
                    setStyles(child1);
                    child1.reRender();

                // child2 exists, same type, not component, text and different value
                } else if (child1.nodeType == 3 && child1.nodeValue != child2.nodeValue) {
                    childrenToReplace.push([child2, child1]); // mark child1 for replacement by child2

                // child2 exists, same type, not component, not text
                } else {
                    setAttributes(child1, child2); // update child1 attributes to reflect child2 attributes
                    setHandlers(child1);
                    setStyles(child1);
                    loopThruChildren(child1, child2);
                }
            }

            // mark extra node2 children for appendment
            for (var i = node1.childNodes.length; i < node2.childNodes.length; i++) {
                childrenToAppend.push(node2.childNodes[i]);
            }

            // remove marked nodes
            for (var c of childrenToRemove) {
                c.parentNode.removeChild(c);
            }

            // replace marked nodes
            for (var c of childrenToReplace) {
                setHandlers(c[0]);
                c[1].parentNode.replaceChild(c[0], c[1]);
                setStyles(c[0]);
            }

            // append marked nodes
            for (var c of childrenToAppend) {
                setHandlers(c);
                node1.appendChild(c);
                setStyles(c);
            }
            
        }
        function cloneComponent(component) {
            var clone = component.cloneNode();
            clone.props = component.props;
            clone.state = component.state;
            clone.html = clone.html.bind(component);
            var div = document.createElement("div");
            div.appendChild(clone);
            clone.outerHTML = clone.render();
            return div.childNodes[0];
        }
        function setStyles(node) {
            if (node.nodeType == 1 && node.hasAttribute("styles")) {
                var stylesId = node.getAttribute("styles");
                var orig = window.cluApp.styles[stylesId].orig;
                var styles = window.cluApp.styles[stylesId].styles;
                var stylesText = "";
                for (var selector in styles) {
                    stylesText += getSelector(node, selector, orig) + "{" + styles[selector] + "}";
                }
                var styleElement = document.createElement("style");
                styleElement.textContent = stylesText;
                document.head.append(styleElement);
                this.styles.push(styleElement);
                delete window.cluApp.styles[stylesId];
                node.removeAttribute("styles");
            }
            for (var i = 0; i < node.childNodes.length; i++) {
                setStyles(node.childNodes[i]);
            }
        }
        function setHandlers(node) {
            if (node.nodeType == 1) {
                for (var attr of node.attributes) {
                    if (attr.name.slice(0, 3) == "on-") {
                        node.addEventListener(attr.name.slice(3), window.cluApp.handlers[attr.value]);
                        this.handlers.push([node, attr.name.slice(3), attr.value]);
                        node.removeAttribute(attr.name);
                    }
                }
            }
            for (var i = 0; i < node.childNodes.length; i++) {
                setHandlers(node.childNodes[i]);
            }
        }
        function setAttributes(node1, node2) {
            if (node1.nodeType == 1 && node2.nodeType == 1) {
                for (var attr of node1.attributes) {
                    if (node2.hasAttribute(attr.name)) {
                        if (attr.value != node2.getAttribute(attr.name)) {
                            node1.setAttribute(attr.name, node2.getAttribute(attr.name));
                        }
                    } else {
                        node1.removeAttribute(attr.name)
                    }
                }
                for (var attr of node2.attributes) {
                    if (!node1.hasAttribute(attr.name)) {
                        node1.setAttribute(attr.name, attr.value);
                    }
                }
            }
        }
        function getSelector(node, initSelector, orig) {
            var selector = node.tagName + ":nth-child(" + getElementIndex(node) + ")" + initSelector;
            if (node == orig) {
                return selector;
            }
            while (node.parentNode) {
                selector = node.parentNode.tagName + ":nth-child(" + getElementIndex(node.parentNode) + ")" + ">" + selector;
                node = node.parentNode;
                if (node == orig) {
                    break;
                }
            }
            return selector;
        }
        function getElementIndex(node) {
            var index = 1;
            while (node.previousElementSibling) {
                index++;
                node = node.previousElementSibling;
            }
            return index;
        }
    }
    init() {}
    connectedCallback() {
        this.init();
        this.reRender();
    }
    updateState(state) {
        for (var key in state) {
            this.state[key] = state[key];
        }
        this.reRender();
    }
    async fetchData(url, data) {
        try {
            var res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            return res.json();
        } catch (err) {
            return false;
        }
    }
}
class RouterRoute extends Component {
    state = {
        html: this.innerHTML
    };
    render() {
        return this.html`
            <router-route 
                path="${this.props.path}" 
                ${this.props.path == window.location.pathname ? "" : "hidden"}
            >${this.props.path == window.location.pathname ? this.state.html : ""}</router-route>
            `;
    }
}
class RouterLink extends Component {
    state = {
        html: this.innerHTML
    };
    handleClick(event) {
        event.preventDefault();
        window.history.pushState({}, "", this.props.path);
        var routerRoutes = document.getElementsByTagName("router-route");
        for (var routerRoute of routerRoutes) {
            routerRoute.reRender();
        }
    }
    render() {
        return this.html`
            <router-link 
                path="${this.props.path}" 
                on-click=${this.handleClick}
            >${this.state.html}</router-link>
            `;
    }
}
export { App, Component };