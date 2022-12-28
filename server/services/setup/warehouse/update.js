const { coreService, coreException } = require('../../../main/core')
const service = {
    transaction: true,
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        let check = await db.row(`SELECT*FROM rbs_warehouse WHERE uuid = ?`, [input.id])
        if (!check) throw new coreException('Data unavailable')
        // let checkBin = await db.row(`SELECT*FROM rbs_plc_bin WHERE id = ?`, [input.plc_bin_id])
        // if (!checkBin) throw new coreException('Bin plc unavailable')
        // if (check.plc_bin_id) throw new coreException(`Data locked, can't update`)
        await db.row(`UPDATE rbs_warehouse SET active= ? WHERE id = ?`, [input.active, check.id])
        check.plc_bin_id = input.plc_bin_id
        return {
            message: 'Data saved successfully',
            data: check
        }
    },
    validation: {
        id: "required|uuid",
        active: "required|accepted:0,1"
    }
}
module.exports = coreService(service)