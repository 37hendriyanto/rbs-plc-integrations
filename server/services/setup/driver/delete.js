const { coreService, coreException } = require('../../../main/core')
const service = {
    transaction: true,
    input: function (request) {
        return request.params
    },
    process: async function (input, db) {
        let check = await db.row(`SELECT*FROM rbs_driver WHERE uuid = ?`, [input.id])
        if (!check) throw new coreException('Data unavailable')

        await db.row(`DELETE FROM rbs_driver WHERE uuid = ?`, [input.id])
        await db.row(`UPDATE master_driver SET uuid = null WHERE uuid = ?`, [check.uuid])
        return {
            message: 'Data saved successfully',
            data: check
        }
    },
    validation: {
        id: "required|uuid"
    }
}
module.exports = coreService(service)