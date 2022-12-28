const { coreService, coreException } = require('../../../main/core')
const moment = require("moment")
const service = {
    transaction: true,
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        input.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let check = await db.row(`SELECT*FROM master_customer WHERE id_customer = ? `, [input.plc_customer_id])
        if (!check) throw new coreException(`Data unavailable`)

        let checkDuplicate = await db.row(`SELECT*FROM master_customer WHERE uuid = ?`, [input.rbs_customer_project_id])
        if (checkDuplicate) throw new coreException(`Data duplicate`)

        let checkRbsDuplicate = await db.row(`SELECT*FROM rbs_customer_project WHERE uuid = ?`, [input.rbs_customer_project_id])
        if (checkRbsDuplicate) throw new coreException('Data diplicate')
        input.name = input.name ? input.name : check.nama_supir

        await db.run_insert(`rbs_customer_project`, {
            uuid: input.rbs_customer_project_id,
            code: input.code,
            name: input.name,
            customer_name: input.customer_name,
            active: '1',
            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        await db.row(`UPDATE master_driver SET uuid = ?  WHERE id_driver = ?`, [input.rbs_customer_project_id, input.plc_customer_id])

        return {
            message: 'Data saved successfully',
            data: {
                id: input.plc_customer_id,
                name: input.name
            }
        }
    },
    validation: {
        customer_id: "uuid",
        rbs_customer_project_id: 'required|uuid',
        plc_customer_id: "required|integer"
    }
}
module.exports = coreService(service)