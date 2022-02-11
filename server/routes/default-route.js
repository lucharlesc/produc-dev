const clu = require("clujs");

class DefaultRoute extends clu.Route {
    async respond(req, res) {
        await this.serveFile("/app.html", res);
    }
}
module.exports = DefaultRoute;