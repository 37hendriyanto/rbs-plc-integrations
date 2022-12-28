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

        let data = await db.run_select(`SELECT*FROM rbs_material`)
        let validate = {}

        input.newDataRbs = []
        input.newDataPlc = []

        for (let item of data) {
            validate[item.uuid] = item
        }
        let lookup = await rbs.get(input.session.rbs_token, `list/material`, { limit: 500, offset: 0 })
        if (!lookup) throw new coreException(`unable to connect to server`)
        lookup = lookup.data.data

        for (let item of lookup) {
            if (!validate[item.id]) {
                input.newDataPlc.push({
                    uuid: item.id,
                    nama_material: item.name,
                    created_date: input.currentDate,
                    created_by: 'SYNC-DATA'
                })

                input.newDataRbs.push({
                    uuid: item.id,
                    code: item.code,
                    name: item.name,
                    active: '1',
                    created_at: input.currentDateTime,
                })
            }
        }

        if (input.newDataPlc.length > 0) await db.run_insert(`master_material`, input.newDataPlc, true)
        if (input.newDataRbs.length > 0) await db.run_insert(`rbs_material`, input.newDataRbs, true)
        // await db.row(`UPDATE rbs_material A , master_material B SET B.nama_material = A.name WHERE A.uuid = B.uuid`)

        return {
            message: 'Data saved successfully',
        }
    },
    validation: {}
}
module.exports = coreService(service)