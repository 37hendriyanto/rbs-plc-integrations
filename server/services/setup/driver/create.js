const { coreService, coreException } = require('../../../main/core')
const moment = require("moment")
const service = {
    transaction: true,
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let check = await db.row(`SELECT*FROM master_driver WHERE id_driver = ? `, [input.plc_driver_id])
        if (!check) throw new coreException(`Data unavailable`)

        let checkDuplicate = await db.row(`SELECT*FROM master_driver WHERE uuid = ?`, [input.rbs_driver_id])
        if (checkDuplicate) throw new coreException(`Data duplicate`)

        let checkRbsDuplicate = await db.row(`SELECT*FROM rbs_driver WHERE uuid = ?`, [input.rbs_driver_id])
        if (checkRbsDuplicate) throw new coreException('Data diplicate')
        input.name = input.name ? input.name : check.nama_supir

        await db.run_insert(`rbs_driver`, {
            uuid: input.rbs_driver_id,
            name: input.name,
            active: '1',
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        await db.row(`UPDATE master_driver SET uuid = ?  WHERE id_driver = ?`, [input.rbs_driver_id, input.plc_driver_id])

        return {
            message: 'Data saved successfully',
            data: {
                id: input.plc_driver_id,
                name: input.name
            }
        }
    },
    validation: {
        rbs_driver_id: 'required|uuid',
        plc_driver_id: "required|integer"
    }
}
module.exports = coreService(service)