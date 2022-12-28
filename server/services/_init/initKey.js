const { coreService, coreException, confStore } = require('../../main/core')
const moment = require("moment")
const rbs = require('../../rbsIntegrate')
const service = {
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')
        var sql = `SELECT*FROM rbs_config LIMIT 1`
        let conf = await db.row(sql)
        if (conf) throw new coreException(`the device is connected to the server`)

        await confStore.set('BASEURL', input.base_url)
        let validate = await rbs.post('', `validation/key`, { secret_key: input.secret_key, type: "PRODUCTION" })
        if (!validate) throw new coreException(`failed to connect to server`)
        if (!validate.data.valid) throw new coreException(`Secret key invalid`)

        await db.run_insert(`rbs_config`, {
            secret_key: input.secret_key,
            locked: '1',
            created_at: input.currentDateTime
        })
        return {
            secret_key: input.secret_key,
            valid: true
        }
    },
    validation: {
        secret_key: "required",
        base_url: "required"
    }
}
module.exports = coreService(service)