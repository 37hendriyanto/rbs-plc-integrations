const { coreService, coreException } = require('../../../main/core')
const moment = require("moment")
const service = {
    transaction: true,
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let check = await db.row(`SELECT*FROM rbs_plc_bin WHERE id = ? `, [input.plc_bin_id])
        if (!check) throw new coreException(`Data Bin unavailable`)

        let material = await db.row(`SELECT*FROM rbs_material WHERE uuid = ?`, [input.rbs_material_id])
        if (!material) throw new coreException(`Data matarial unavailable`)

        let checkDuplicate = await db.row(`SELECT*FROM rbs_material_bin WHERE rbs_material_id = ? AND plc_bin_id = ?`, [material.id, input.plc_bin_id])
        if (checkDuplicate) throw new coreException(`Data duplicate`)

        let newData = await db.run_insert(`rbs_material_bin`, {
            rbs_material_id: material.id,
            plc_bin_id: input.plc_bin_id,
            active: '1',
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return {
            message: 'Data saved successfully',
            data: {
                id: newData
            }
        }
    },
    validation: {
        rbs_material_id: 'required|uuid',
        plc_bin_id: "required|integer"
    }
}
module.exports = coreService(service)