const { coreService, coreException, confStore } = require('../../main/core')
const service = {
    input: function (request) {
        return request.query
    },
    process: async function (input, db) {
        // return { connected: false, locked: false, server: false }
        let conf = { connected: false, locked: false }
        let check = await db.raw(`SELECT*FROM rbs_config LIMIT 1`)
            .then((res) => { return res[0][0] })
            .catch((err) => { return })
        if (!check) return { connected: false, locked: false, server: false }

        let cnf = confStore.get('cnfdbs')
        if (!cnf) return { connected: false, locked: false, server: false }

        conf = JSON.parse(cnf)
        let baseUrl = confStore.get('BASEURL')
        return {
            connected: conf.connected,
            locked: conf.locked,
            server: baseUrl ? true : false
        }
    },
    validation: {}
}
module.exports = coreService(service)