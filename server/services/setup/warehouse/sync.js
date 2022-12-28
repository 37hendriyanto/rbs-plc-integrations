const { coreService, coreException } = require('../../../main/core')
const rbs = require('../../../rbsIntegrate')
const moment = require("moment")

const service = {
    transaction: true,
    input: function (request) {
        return request.query
    },
    process: async function (input, db) {
        input.currentDate = moment().format('YYYY-MM-DD')
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let data = await db.run_select(`SELECT*FROM rbs_warehouse`)
        let validate = {}

        input.newDataRbs = []

        for (let item of data) {
            validate[item.uuid] = item
        }
        let lookup = await rbs.get(input.session.rbs_token, `list/warehouse`, { limit: 500, offset: 0 })
        if (!lookup) throw new coreException(`unable to connect to server`)
        lookup = lookup.data.data

        for (let item of lookup) {
            if (!validate[item.id]) {
                input.newDataRbs.push({
                    uuid: item.id,
                    name: item.name,
                    code: item.code,
                    active: item.active ? '1' : 0,
                    created_at: input.currentDateTime,
                })
            }
        }
        if (input.newDataRbs.length > 0) await db.run_insert(`rbs_warehouse`, input.newDataRbs, true)

        return {
            message: 'Data saved successfully',
        }
    },
    validation: {}
}
module.exports = coreService(service)