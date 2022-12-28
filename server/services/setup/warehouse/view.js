const { coreService, coreException } = require('../../../main/core')

const service = {
    input: function (request) {
        console.log(request.params)
        return request.params
    },
    process: async function (input, db) {
        var sql = `SELECT A.* FROM (
                        SELECT A.uuid AS id, A.code, A.name, B.code AS bin_code,A.plc_bin_id,B.name AS plc_bin_id_name, B.name AS bin_name, 
                        CASE WHEN B.id IS NOT NULL THEN '1' ELSE '0' END AS sync, A.active
                        FROM rbs_warehouse A
                        LEFT JOIN rbs_plc_bin B ON B.id = A.plc_bin_id
                    ) A WHERE A.id = ?`
        let data = await db.row(sql, [input.id])
        return data
    },
    validation: {
        id: "required|uuid",
    }
}
module.exports = coreService(service)