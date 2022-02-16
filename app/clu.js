class App {
    nextInitStateId = 0;
    initStates = {};
    nextHandlerId = 0;
    handlers = {};
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
    initStateId = undefined;
    handlers = [];
    html(strings, ...exps) {
        var output = "";
        for (var i = 0; i < strings.length; i++) {
            if (strings[i].slice(-7) == `state="` || strings[i].slice(-7) == `state='`) {
                output += strings[i] + this.initState(exps[i]);
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
    initHandler(handler) {
        var handlerId = window.cluApp.nextHandlerId++;
        window.cluApp.handlers[handlerId] = handler.bind(this);
        return handlerId;
    }
    initState(initState) {
        var initStateId = window.cluApp.nextInitStateId++;
        for (var key in initState) {
            if (typeof initState[key] == "function") {
                initState[key] = {
                    type: "boundedFunction",
                    unbounded: initState[key],
                    bounded: initState[key].bind(this)
                };
            }
        }
        window.cluApp.initStates[initStateId] = initState;
        return initStateId;
    }
    reRender() {
        if (this.hasAttribute("state")) {
            this.initStateId = this.getAttribute("state");
            this.removeAttribute("state");
            var initState = window.cluApp.initStates[this.initStateId];
            for (var key in initState) {
                if (typeof initState[key] == "object" && initState[key].type == "boundedFunction") {
                    this.state[key] = initState[key].bounded;
                } else {
                    this.state[key] = initState[key];
                }
            }
        }
        function loopThruChildren(element, element2) {
            var childrenToRemove = [];
            var childrenToReplace = [];
            var childrenToAppend = [];
            for (var i = 0; i < element.childNodes.length; i++) {
                var child = element.childNodes[i];
                var child2 = element2.childNodes[i];
                if (!child2) {
                    childrenToRemove.push(child);
                } else if (child.nodeName != child2.nodeName) {
                    childrenToReplace.push([child2, child]);
                } else if (Object.getPrototypeOf(child) instanceof Component) {
                    for (var attr of child.attributes) {
                        if (attr.name != "state") {
                            if (child2.hasAttribute(attr.name)) {
                                if (attr.value != child2.getAttribute(attr.name)) {
                                    child.setAttribute(attr.name, child2.getAttribute(attr.name));
                                }
                            } else {
                                child.removeAttribute(attr.name)
                            }
                        }
                    }
                    for (var attr of child2.attributes) {
                        if (attr.name != "state") {
                            if (!child.hasAttribute(attr.name)) {
                                // if (attr.name.slice(0, 3) != "on-") {
                                    child.setAttribute(attr.name, attr.value);
                                // }
                            }
                        }
                    }
                    if (!child.initStateId && !child2.hasAttribute("state")) {
                    } else if (!child.initStateId && child2.hasAttribute("state")) {
                        child.setAttribute("state", child2.getAttribute("state"));
                    } else if (child.initStateId && !child2.hasAttribute("state")) {
                        delete window.cluApp.initStates[child.initStateId];
                        child.removeAttribute("state");
                    } else if (child.initStateId && child2.hasAttribute("state")) {
                        if (objectsEqual(window.cluApp.initStates[child.initStateId], window.cluApp.initStates[child2.getAttribute("state")])) {
                            delete window.cluApp.initStates[child2.getAttribute("state")];
                        } else {
                            delete window.cluApp.initStates[child.initStateId];
                            child.setAttribute("state", child2.getAttribute("state"));
                        }
                    }
                    child.reRender();
                } else if (child.nodeType == 3 && child.nodeValue != child2.nodeValue) {
                    childrenToReplace.push([child2, child]);
                } else {
                    if (child.nodeType == 1) {
                        for (var attr of child.attributes) {
                            if (child2.hasAttribute(attr.name)) {
                                if (attr.value != child2.getAttribute(attr.name)) {
                                    child.setAttribute(attr.name, child2.getAttribute(attr.name));
                                }
                            } else {
                                child.removeAttribute(attr.name)
                            }
                        }
                        for (var attr of child2.attributes) {
                            if (!child.hasAttribute(attr.name)) {
                                // if (attr.name.slice(0, 3) != "on-") {
                                    child.setAttribute(attr.name, attr.value);
                                // }
                            }
                        }
                    }
                    setDeclarativeEvents(child);
                    loopThruChildren(child, child2);
                }
            }
            for (var i = element.childNodes.length; i < element2.childNodes.length; i++) {
                childrenToAppend.push(element2.childNodes[i]);
            }
            for (var c of childrenToRemove) {
                c.parentNode.removeChild(c);
            }
            for (var c of childrenToReplace) {
                setDeclarativeEvents(c[1]);
                c[1].parentNode.replaceChild(c[0], c[1]);
            }
            for (var c of childrenToAppend) {
                setDeclarativeEvents(c);
                element.appendChild(c);
            }
        }
        function objectsEqual(a, b) {
            if (!a || !b) {
                return false;
            }
            for (var key in a) {
                if (typeof a[key] == "object" && a[key].type == "boundedFunction" && typeof b[key] == "object" && b[key].type == "boundedFunction") {
                    if (a[key].unbounded != b[key].unbounded) {
                        return false;
                    }
                } else if (a[key] != b[key]) {
                    return false;
                }
            }
            return true;
        }
        function setDeclarativeEvents(element) {
            if (element.nodeType == 1) {
                for (var attr of element.attributes) {
                    if (attr.name.slice(0, 3) == "on-") {
                        let eventHandler = attr.value;
                        // element.removeEventListener(attr.name.slice(3), window.cluApp.handlers[this.handlers[attr.name.slice(3)]]);
                        element.addEventListener(attr.name.slice(3), window.cluApp.handlers[eventHandler]);
                        this.handlers.push([element, attr.name.slice(3), window.cluApp.handlers[eventHandler]]);
                        element.removeAttribute(attr.name);
                    }
                }
            }
            for (var i = 0; i < element.childNodes.length; i++) {
                setDeclarativeEvents(element.childNodes[i]);
            }
        }
        loopThruChildren = loopThruChildren.bind(this);
        setDeclarativeEvents = setDeclarativeEvents.bind(this);
        var div = document.createElement("div");
        var clone = this.cloneNode();
        div.appendChild(clone);
        clone.state = this.state;
        clone.initState = clone.initState.bind(this);
        clone.initHandler = clone.initHandler.bind(this);
        clone.outerHTML = clone.render();
        if (this.nodeType == 1) {
            for (var attr of this.attributes) {
                if (div.childNodes[0].hasAttribute(attr.name)) {
                    if (attr.value != div.childNodes[0].getAttribute(attr.name)) {
                        this.setAttribute(attr.name, div.childNodes[0].getAttribute(attr.name));
                    }
                } else {
                    this.removeAttribute(attr.name)
                }
            }
            for (var attr of div.childNodes[0].attributes) {
                if (!this.hasAttribute(attr.name)) {
                    // if (attr.name.slice(0, 3) != "on-") {
                        this.setAttribute(attr.name, attr.value);
                    // }
                }
            }
        }
        for (var handler of this.handlers) {
            handler[0].removeEventListener(handler[1], handler[2]);
        }
        this.handlers = [];
        setDeclarativeEvents(this);
        loopThruChildren(this, div.childNodes[0]);
    }
    init() {}
    connectedCallback() {
        this.init();
        if (!Object.getPrototypeOf(this).isStyled) {
            var styleElement = document.createElement("style");
            styleElement.innerHTML = this.styles;
            document.head.append(styleElement);
            Object.getPrototypeOf(this).isStyled = true;
        }
        // for (var event in this.events) {
        //     this.addEventListener(event, function (e) {
        //         this.events[event].bind(this)(e);
        //     });
        // }
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