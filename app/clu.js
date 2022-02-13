class App {
    nextInitStateId = 0;
    initStates = {};
    component(componentName, componentClass) {
        window.customElements.define(componentName, componentClass);
    }
    start(rootName, id) {
        window.cluApp = this;
        window.addEventListener("popstate", function (event) {
            var routerRoutes = document.getElementsByTagName("router-route");
            for (var routerRoute of routerRoutes) {
                routerRoute.reRender();
            }
        });
        this.component("router-route", RouterRoute);
        this.component("router-link", RouterLink);
        var rootElement = document.createElement(rootName);
        if (id) {
            rootElement.id = id;
        }
        document.body.prepend(rootElement);
    }
}
class Component extends HTMLElement {
    updateState(state) {
        for (var key in state) {
            this.state[key] = state[key];
        }
        this.reRender();
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
                                if (attr.name.slice(0, 3) != "on-") {
                                    child.setAttribute(attr.name, attr.value);
                                }
                            }
                        }
                    }
                    if (!child.initStateId && !child2.hasAttribute("state")) {
                        continue;
                    } else if (!child.initStateId && child2.hasAttribute("state")) {
                        child.setAttribute("state", child2.getAttribute("state"));
                        child.reRender();
                    } else if (child.initStateId && !child2.hasAttribute("state")) {
                        delete window.cluApp.initStates[child.initStateId];
                        child.removeAttribute("state");
                        child.reRender();
                    } else if (child.initStateId && child2.hasAttribute("state")) {
                        if (objectsEqual(window.cluApp.initStates[child.initStateId], window.cluApp.initStates[child2.getAttribute("state")])) {
                            delete window.cluApp.initStates[child2.getAttribute("state")];
                        } else {
                            delete window.cluApp.initStates[child.initStateId];
                            child.setAttribute("state", child2.getAttribute("state"));
                            child.reRender();
                        }
                    }
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
                                if (attr.name.slice(0, 3) != "on-") {
                                    child.setAttribute(attr.name, attr.value);
                                }
                            }
                        }
                    }
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
                        element.addEventListener(attr.name.slice(3), function (event) {
                            this[eventHandler](event);
                        }.bind(this));
                        element.removeAttribute(attr.name);
                    }
                }
            }
        }
        loopThruChildren = loopThruChildren.bind(this);
        setDeclarativeEvents = setDeclarativeEvents.bind(this);
        var clone = this.cloneNode();
        clone.innerHTML = this.render();
        loopThruChildren(this, clone);
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
        for (var event in this.events) {
            this.addEventListener(event, function (e) {
                this.events[event].bind(this)(e);
            });
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
    styles = ``;
    state = {
        html: this.innerHTML
    };
    events = {};
    render() {
        if (this.getAttribute("path") == window.location.pathname.slice(0, this.getAttribute("path").length)) {
            this.removeAttribute("hidden");
            return `${this.state.html}`;
        } else {
            this.setAttribute("hidden", "");
            return ``;
        }
    }
}
class RouterLink extends Component {
    styles = ``;
    state = {};
    events = {
        click: function (event) {
            event.preventDefault();
            window.history.pushState({}, "", this.getAttribute("path"));
            var routerRoutes = document.getElementsByTagName("router-route");
            for (var routerRoute of routerRoutes) {
                routerRoute.reRender();
            }
        }
    };
    render() {
        return `${this.innerHTML}`;
    }
}
export { App, Component };