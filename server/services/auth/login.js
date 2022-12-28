const { coreService, coreException } = require('../../main/core')
const rbs = require('../../rbsIntegrate')
var sha1 = require('sha1')
var jwt = require('jsonwebtoken')
const moment = require("moment")

const service = {
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        var sql = `SELECT*FROM rbs_config LIMIT 1`
        let conf = await db.row(sql)
        if (!conf) throw new coreException(`please set the configuration first`)

        let auth = await rbs.post('', `login`, { secret_key: conf.secret_key, username: input.username, password: input.password })
        if (!auth) throw new coreException(`Username or password incorrect`)
        auth = auth.data

        // GENERATE API TOKEN 
        var api_token = sha1(Math.random(100000, 999999))
        var token = jwt.sign({
            token: api_token,
            secret_key: input.secret_key
        }, 'RBSPRODUCTIONINTEGRATION')

        await db.run_insert(`rbs_token`, {
            token: api_token,
            rbs_token: auth.token,
            active: '1',
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return {
            profile: auth.profile,
            corporate: auth.corporate,
            production_unit: auth.production_unit,
            device: auth.device,
            token: token
        }
    },
    validation: {
        username: "required",
        password: "required"
    }
}
module.exports = coreService(service)