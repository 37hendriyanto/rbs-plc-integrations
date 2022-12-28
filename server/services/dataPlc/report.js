const { coreService, coreException } = require('../../main/core')

const service = {
    input: function (request) {
        return request.query
    },
    process: async function (input, db) {
        var sql = `SELECT A.id_laporan AS id, REPLACE(no_tiket,'-','') AS docket_number,
                    A.mix_design AS mix_code,A.total_kubikasi AS production_volume, A.uuid, A.nama_customer AS customer_name, A.nama_proyek AS site_name
                    FROM laporan_produksi A WHERE A.uuid IS NULL ORDER BY A.id_laporan DESC LIMIT 3`
        let data = await db.run_select(sql)
        for (let item of data) {
            item.allow_production = item.uuid ? false : true
        }
        return data
    },
    validation: {
        limit: "integer",
        offset: "integer"
    }
}
module.exports = coreService(service)