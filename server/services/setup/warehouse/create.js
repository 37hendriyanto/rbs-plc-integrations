const { coreService, coreException } = require('../../../main/core')
const moment = require("moment")
const service = {
    transaction: true,
    input: function (request) {
        let input = request.body
        input.active = !['0', '1'].includes(input.active) ? input.active : '1'
        return input
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let check = await db.row(`SELECT*FROM rbs_plc_bin WHERE id = ? `, [input.plc_bin_id])
        if (!check) throw new coreException(`Data unavailable`)

        let checkDuplicate = await db.row(`SELECT*FROM rbs_warehouse WHERE plc_bin_id = ? AND uuid = ?`, [input.plc_bin_id, input.rbs_warehouse_id])
        if (checkDuplicate) throw new coreException(`Data duplicate`)

        input.name = input.name ? input.name : check.name
        await db.run_insert(`rbs_warehouse`, {
            uuid: input.rbs_warehouse_id,
            plc_bin_id: input.plc_bin_id,
            name: input.name,
            code: input.code,
            active: input.active,
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return {
            message: 'Data saved successfully',
            data: {
                id: input.rbs_warehouse_id,
                name: input.name
            }
        }
    },
    validation: {
        rbs_warehouse_id: 'required|uuid',
        plc_bin_id: "required|integer",
        active: 'required|accepted:0,1'
    }
}
module.exports = coreService(service)