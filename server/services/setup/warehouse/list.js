const { coreService, coreException } = require('../../../main/core')
const filterBuilder = require('../../../filterBuilder')

const service = {
    input: function (request) {
        return request.query
    },
    process: async function (input, db) {
        input.filter = []
        input.filterValue = []

        input.searchField = []
        input.searchValue = []

        // // CONFIG
        let filter = [
            { field: 'name', alias: 'A', search: true, order: true, filter: false },
            { field: 'bin_code', alias: 'A', search: true, order: true, filter: false },
            { field: 'bin_name', alias: 'A', search: true, order: true, filter: false },
            { field: 'sync', alias: 'A', search: false, order: false, filter: true },
        ]

        input = filterBuilder(input, filter)

        // INIT VALUE
        input.orderBy = input.orderBy ? input.orderBy : 'A.id'
        input.limit = input.limit ? input.limit > 500 ? 500 : input.limit : 50
        input.offset = input.offset ? input.offset : 0
        input.sort = input.sort ? input.sort.toUpperCase() == "ASC" || input.sort.toUpperCase() == "DESC" ? input.sort.toUpperCase() : "ASC" : "ASC"
        input.filter = input.filter.length > 0 ? ` WHERE ${input.filter.join(' AND ')}` : ''

        var sql = `SELECT A.* FROM (
                        SELECT A.uuid AS id, A.code, A.name, B.code AS bin_code, B.name AS bin_name, 
                        CASE WHEN B.id IS NOT NULL THEN '1' ELSE '0' END AS sync, A.active
                        FROM rbs_warehouse A
                        LEFT JOIN rbs_plc_bin B ON B.id = A.plc_bin_id
                    ) A ${input.filter}  ORDER BY ${input.orderBy} ${input.sort} LIMIT ${input.limit} OFFSET ${input.offset}`
        let data = await db.run_select(sql, input.filterValue)

        var sql2 = `SELECT COUNT(A.id) AS record
                    FROM (
                        SELECT A.uuid AS id, A.code, A.name, B.code AS bin_code, B.name AS bin_name, 
                        CASE WHEN B.id IS NOT NULL THEN '1' ELSE '0' END AS sync
                        FROM rbs_warehouse A
                        LEFT JOIN rbs_plc_bin B ON B.id = A.plc_bin_id
                    ) A ${input.filter}`
        let record = await db.row(sql2, input.filterValue)
        return {
            data: data,
            record: record ? record.record : 0
        }
    },
    validation: {
        limit: "integer",
        offset: "integer"
    }
}
module.exports = coreService(service)