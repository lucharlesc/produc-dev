const clu = require("clujs");

class GetItems extends clu.Route {
    async respond(req, res) {
        var reqData = await this.receiveData(req);
        var col = global.db.db("main").collection("col");
        var findResult = await col.find({
            user: reqData.user
        }).toArray();
        var resData = {
            items: findResult
        };
        this.sendData(res, resData);
    }
}
module.exports = GetItems;