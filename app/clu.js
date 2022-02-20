class App {
    nextInitStateId = 0;
    initStates = {};
    nextHandlerId = 0;
    handlers = {};
    nextStyleId = 0;
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
    handlers = [];
    styles = [];
    html(strings, ...exps) {
        var output = "";
        for (var i = 0; i < strings.length; i++) {
            if (strings[i].slice(-7) == `state="` || strings[i].slice(-7) == `state='`) {
                output += strings[i] + this.initState(exps[i]);
            } else if (strings[i].slice(-8) == `styles="` || strings[i].slice(-8) == `styles='`) {
                output += strings[i] + this.initStyle(exps[i]);
            } else if (/on-\w+=["']$/.test(strings[i])) {
                output += strings[i] + this.initHandler(exps[i]);
            } else if (exps[i]) {
                output += strings[i] + exps[i];
            } else {
                output += strings[i];
            }
        }
        return output.trim();
    }
    updateState(state) {
        for (var key in state) {
            this.state[key] = state[key];
        }
        this.reRender();
    }
    initStyle(style) {
        var styleId = window.cluApp.nextStyleId++;
        window.cluApp.styles[styleId] = {
            orig: this,
            style: style
        };
        return styleId;
    }
    initHandler(handler) {
        var handlerId = window.cluApp.nextHandlerId++;
        window.cluApp.handlers[handlerId] = handler.bind(this);
        return handlerId;
    }
    initState(initState) {
        var initStateId = window.cluApp.nextInitStateId++;
        for (var key in initState) {
            if (typeof initState[key] == "function") {
                initState[key] = initState[key].bind(this);
            }
        }
        window.cluApp.initStates[initStateId] = initState;
        return initStateId;
    }
    reRender() {

        // bind functions
        loopThruChildren = loopThruChildren.bind(this);
        setDeclarativeEvents = setDeclarativeEvents.bind(this);
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

        // update this.state with passed in initStateId from state attribute
        if (this.hasAttribute("state")) {
            var initStateId = this.getAttribute("state");
            var initState = window.cluApp.initStates[initStateId];
            for (var key in initState) {
                this.state[key] = initState[key];
            }
            delete window.cluApp.initStates[initStateId];
            this.removeAttribute("state");
        }

        // set styles with passed in styleId from styles attribute
        setStyles(this);

        // clone this
        var clone = this.cloneNode();
        clone.state = this.state;
        clone.html = clone.html.bind(this);
        var div = document.createElement("div");
        div.appendChild(clone);
        clone.outerHTML = clone.render();
        var thisClone = div.childNodes[0];

        // update this attributes to reflect thisClone attributes
        updateAttributes(this, thisClone);

        // set event listeners
        setDeclarativeEvents(this);

        // set styles with styleId from styles attribute
        setStyles(this);

        // loop thru children
        loopThruChildren(this, thisClone);

        function loopThruChildren(node1, node2) {

            var childrenToRemove = [];
            var childrenToReplace = [];
            var childrenToAppend = [];

            for (var i = 0; i < node1.childNodes.length; i++) {

                var child1 = node1.childNodes[i];
                var child2 = node2.childNodes[i];

                // if no child2
                if (!child2) {

                    // mark child1 for removal
                    childrenToRemove.push(child1);

                // child2 exists, if different type
                } else if (child1.nodeName != child2.nodeName) {

                    // mark child1 for replacement by child2
                    childrenToReplace.push([child2, child1]);

                // child2 exists, same type, if component
                } else if (Object.getPrototypeOf(child1) instanceof Component) {

                    // update child1 attributes to reflect child2 attributes
                    updateAttributes(child1, child2);

                    // set event listeners
                    setDeclarativeEvents(child1);

                    // set styles
                    setStyles(child1);

                    // rerender child1
                    child1.reRender();

                // child2 exists, same type, not component, if text and different value
                } else if (child1.nodeType == 3 && child1.nodeValue != child2.nodeValue) {

                    // mark child1 for replacement by child2
                    childrenToReplace.push([child2, child1]);

                // child2 exists, same type, not component, not text
                } else {

                    // update child1 attributes to reflect child2 attributes
                    updateAttributes(child1, child2);

                    // set event listeners
                    setDeclarativeEvents(child1);

                    // set styles
                    setStyles(child1);

                    // loop thru children
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
                setDeclarativeEvents(c[0]);
                c[1].parentNode.replaceChild(c[0], c[1]);
                setStyles(c[0]);
            }

            // append marked nodes
            for (var c of childrenToAppend) {
                setDeclarativeEvents(c);
                node1.appendChild(c);
                setStyles(c);
            }
            
        }
        function setStyles(element) {
            if (element.nodeType == 1 && element.hasAttribute("styles")) {
                var styleId = element.getAttribute("styles");
                var orig = window.cluApp.styles[styleId].orig;
                var style = window.cluApp.styles[styleId].style;
                var styleText = "";
                for (var selector in style) {
                    styleText += getSelector(element, selector, orig) + "{" + style[selector] + "}";
                }
                var styleElement = document.createElement("style");
                styleElement.textContent = styleText;
                document.head.append(styleElement);
                delete window.cluApp.styles[styleId];
                this.styles.push(styleElement);
                element.removeAttribute("styles");
            }
            for (var i = 0; i < element.childNodes.length; i++) {
                setStyles(element.childNodes[i]);
            }
        }
        function setDeclarativeEvents(element) {
            if (element.nodeType == 1) {
                for (var attr of element.attributes) {
                    if (attr.name.slice(0, 3) == "on-") {
                        element.addEventListener(attr.name.slice(3), window.cluApp.handlers[attr.value]);
                        this.handlers.push([element, attr.name.slice(3), attr.value]);
                        element.removeAttribute(attr.name);
                    }
                }
            }
            for (var i = 0; i < element.childNodes.length; i++) {
                setDeclarativeEvents(element.childNodes[i]);
            }
        }
        function updateAttributes(node1, node2) {
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
        function getSelector(element, initSelector, orig) {
            var selector = element.tagName + initSelector;
            if (element == orig) {
                return selector;
            }
            while (element.parentNode) {
                selector = element.parentNode.tagName + ">" + selector;
                element = element.parentNode;
                if (element == orig) {
                    break;
                }
            }
            return selector;
        }
    }
    init() {}
    connectedCallback() {
        this.init();
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
    styles = ``;
    state = {
        html: this.innerHTML
    };
    render() {
        return this.html`<router-route path="${this.state.path}" ${this.state.path == window.location.pathname ? "" : "hidden"}>${this.state.path == window.location.pathname ? this.state.html : ""}</router-route>`;
    }
}
class RouterLink extends Component {
    styles = ``;
    state = {
        html: this.innerHTML
    };
    handleClick(event) {
        event.preventDefault();
        window.history.pushState({}, "", this.state.path);
        var routerRoutes = document.getElementsByTagName("router-route");
        for (var routerRoute of routerRoutes) {
            routerRoute.reRender();
        }
    }
    render() {
        return this.html`<router-link path="${this.state.path}" on-click="${this.handleClick}">${this.state.html}</router-link>`;
    }
}
export { App, Component };