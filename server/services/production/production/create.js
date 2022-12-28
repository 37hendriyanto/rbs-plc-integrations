const { coreService, coreException } = require('../../../main/core')
const rbs = require('../../../rbsIntegrate')

const service = {
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        // CHECK DUPLICATE
        let check = await db.row(`SELECT*FROM rbs_production WHERE ticket_number = ? `, [input.ticket_number])
        if (check) throw new coreException(`Duplicate ticket number`)
        // CHECK DUPLICATE
        let checkProduction = await db.row(`SELECT*FROM laporan_produksi WHERE REPLACE(no_tiket,'-','') = REPLACE(?,'-','')`, [input.ticket_number])
        if (!checkProduction) throw new coreException(`ticket number unavailable`)
        let body = {
            production_schedule_id: input.production_schedule_id,
            ticket_number: input.ticket_number,
            vehicle_id: input.vehicle_id,
            driver_id: input.driver_id,
            quantity: input.quantity,
            start_production: input.start_production,
            end_production: input.end_production,
            notes: input.notes,
            material_consumption: []
        }

        for (let item of input.material_consumption) {
            if (item.actual_quantity > 0) {
                body.material_consumption.push(item)
            }
        }
        let success = false
        await rbs.post(input.session.rbs_token, 'transaction/production', body, true)
            .then((res) => { success = true })
            .catch((err) => {
                success = false
                if (err) throw new coreException(err.error_message)
                else throw new coreException(`Sync data failed`)
            })

        await db.row(`UPDATE laporan_produksi SET uuid = ? WHERE id_laporan = ? `, [input.production_schedule_id, checkProduction.id_laporan])
        await db.run_insert(`rbs_production`, {
            plc_production_id: checkProduction.id_laporan,
            ticket_number: input.ticket_number,
            data: JSON.stringify(body),
            sync: success ? '1' : '0',
        })
        return {
            message: "data saved successfully",
            data: input
        }
    },
    validation: {
        ticket_number: "required",
        production_schedule_id: "required|uuid",
        vehicle_id: "required|uuid",
        driver_id: "required|uuid",
        start_production: "required|datetime",
        end_production: "required|datetime",
        quantity: "required|decimal|min:0.01",
        material_consumption: "required|array",
        "material_consumption.*.material_id": "required|uuid",
        "material_consumption.*.warehouse_id": "required|uuid",
        "material_consumption.*.actual_quantity": "required|decimal|min:0",
    }
}
module.exports = coreService(service)