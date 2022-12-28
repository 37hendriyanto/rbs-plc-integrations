const { coreService, coreException } = require('../../../main/core')
const service = {
    transaction: true,
    input: function (request) {
        return request.params
    },
    process: async function (input, db) {
        let check = await db.row(`SELECT*FROM rbs_material_bin WHERE id = ?`, [input.id])
        if (!check) throw new coreException('Data unavailable')
        await db.row(`DELETE FROM rbs_material_bin WHERE id = ?`, [input.id])
        return {
            message: 'Data saved successfully',
            data: check
        }
    },
    validation: {
        id: "required|integer"
    }
}
module.exports = coreService(service)