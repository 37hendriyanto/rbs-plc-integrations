const { coreService, coreException } = require('../../../main/core')
const moment = require("moment")
const service = {
    transaction: true,
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let check = await db.row(`SELECT*FROM master_material WHERE id_material = ? `, [input.plc_material_id])
        if (!check) throw new coreException(`Data unavailable`)

        let checkDuplicate = await db.row(`SELECT*FROM master_material WHERE uuid = ? `, [input.rbs_material_id])
        if (checkDuplicate) throw new coreException(`Data duplicate`)

        input.name = input.name ? input.name : check.nama_material
        await db.run_insert(`rbs_material`, {
            uuid: input.rbs_material_id,
            name: input.name,
            code: input.code,
            active: '1',
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })
        await db.row(`UPDATE master_material SET uuid = ?  WHERE id_material = ?`, [input.rbs_material_id, input.plc_material_id])
        return {
            message: 'Data saved successfully',
            data: {
                id: input.rbs_material_id,
                name: input.name
            }
        }
    },
    validation: {
        rbs_material_id: 'required|uuid',
        plc_material_id: "required|integer",
    }
}
module.exports = coreService(service)