const { coreService, coreException } = require('../../../main/core')
const moment = require("moment")
const service = {
    transaction: true,
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let check = await db.row(`SELECT*FROM master_truck WHERE id_truck = ? `, [input.plc_vehicle_id])
        if (!check) throw new coreException(`Data unavailable`)

        let checkDuplicate = await db.row(`SELECT*FROM master_truck WHERE uuid = ?`, [input.rbs_vehicle_id])
        if (checkDuplicate) throw new coreException(`Data duplicate`)

        input.name = input.name ? input.name : check.no_polisi
        await db.run_insert(`rbs_vehicle`, {
            uuid: input.rbs_vehicle_id,
            name: input.name,
            police_number: input.police_number,
            active: '1',
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })
        await db.row(`UPDATE master_truck SET uuid = ?  WHERE id_truck = ?`, [input.rbs_vehicle_id, input.plc_vehicle_id])
        return {
            message: 'Data saved successfully',
            data: {
                id: input.rbs_vehicle_id,
                name: input.name
            }
        }
    },
    validation: {
        rbs_vehicle_id: 'required|uuid',
        plc_vehicle_id: "required|integer",
        police_number: "required"
    }
}
module.exports = coreService(service)