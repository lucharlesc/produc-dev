const clu = require("clujs");

class AddItem extends clu.Route {
    async respond(req, res) {
        var reqData = await this.receiveData(req);
        var col = global.db.db("main").collection("col");
        var insertResult = await col.insertOne(reqData.item);
        var resData = {};
        this.sendData(res, resData);
    }
}
module.exports = AddItem;