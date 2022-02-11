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
    initRender = true;
    initStatesCache = {};
    updateState(state) {
        for (var key in state) {
            this.state[key] = state[key];
        }
        this.reRender();
    }
    initState(initState) {
        function objectsEqual(a, b) {
            if (!a || !b) {
                return false;
            }
            for (var key in a) {
                if (a[key] != b[key]) {
                    return false;
                }
            }
            return true;
        }
        var deepCopy = {};
        for (var key in initState) {
            deepCopy[key] = initState[key];
        }
        for (var key in this.initStatesCache) {
            if (objectsEqual(this.initStatesCache[key], deepCopy)) {
                return key;
            }
        }
        var initStateId = window.cluApp.nextInitStateId++;
        for (var key in initState) {
            if (typeof initState[key] == "function") {
                initState[key] = initState[key].bind(this);
            }
        }
        window.cluApp.initStates[initStateId] = initState;
        this.initStatesCache[initStateId] = deepCopy;
        return initStateId;
    }
    reRender() {
        var initStateId = this.getAttribute("state");
        var initState = window.cluApp.initStates[initStateId];
        for (var key in initState) {
            this.state[key] = initState[key];
        }
        if (this.initRender) {
            this.innerHTML = this.render();
            function loopThruNonComponentChildren(element, func) {
                for (var child of element.children) {
                    if (!(Object.getPrototypeOf(child) instanceof Component)) {
                        func(child);
                        loopThruNonComponentChildren(child, func);
                    }
                }
            }
            function setDeclarativeEvents(element) {
                for (var attr of element.attributes) {
                    if (attr.name.slice(0, 3) == "on-") {
                        let eventHandler = attr.value;
                        element.addEventListener(attr.name.slice(3), function (event) {
                            this[eventHandler](event);
                        }.bind(this));
                        // element.removeAttribute(attr.name);
                    }
                }
            }
            setDeclarativeEvents = setDeclarativeEvents.bind(this);
            loopThruNonComponentChildren(this, setDeclarativeEvents);
            this.initRender = false;
            return;
        }
        function loopThruChildren(element, element2, func) {
            for (var i = 0; i < element.children.length; i++) {
                if (Object.getPrototypeOf(element.children[i]) instanceof Component) {
                    func(element.children[i], element2.children[i]);
                } else {
                    func(element.children[i], element2.children[i]);
                    loopThruChildren(element.children[i], element2.children[i], func);
                }
            }
            var childrenToAppend = [];
            if (element2.children.length > element.children.length) {
                for (var i = element.children.length; i < element2.children.length; i++) {
                    childrenToAppend.push(element2.children[i]);
                }
            }
            for (var c of childrenToAppend) {
                element.append(c);
            }
        }
        function checkReRender(element, element2) {
            if (Object.getPrototypeOf(element) instanceof Component) {
                if (element.getAttribute("state") != element2.getAttribute("state")) {
                    element.setAttribute("state", element2.getAttribute("state"));
                    element.reRender();
                }
            } else if (element.children.length == 0) {
                if (element.innerHTML != element2.innerHTML) {
                    element.innerHTML = element2.innerHTML;
                }
            }
        }
        var div = document.createElement("div");
        div.innerHTML = this.render();
        loopThruChildren(this, div, checkReRender);
    }
    connectedCallback() {
        if (!Object.getPrototypeOf(this).isStyled) {
            var styleElement = document.createElement("style");
            styleElement.innerHTML = this.styles;
            document.head.append(styleElement);
            Object.getPrototypeOf(this).isStyled = true;
        }
        // delete window.cluApp.initStates[initStateId];
        // this.removeAttribute("state");
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