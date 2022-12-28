const moment = require('moment')

module.exports = function filterBuilder(input, filter) {
    if (!Array.isArray(filter)) return input

    if (!input.filter) input.filter = []
    if (!input.filterValue) input.filterValue = []
    if (!input.searchField) input.searchField = []
    if (!input.searchValue) input.searchValue = []

    // CONFIG
    // let filter = [
    // { field: 'production_unit_id', alias: 'A', search: false, order: false, filter: true },
    // { field: 'start_production', alias: 'A', search: false, order: true, filter: true, type: 'range-date' },
    // { field: 'status_code', param: 'status_code', alias: 'C', search: false, order: true, filter: true,type:"multiple"  },
    // ]

    for (let item of filter) {
        let a = item.param ? item.param : item.field
        let fielAlias = item.alias ? `${item.alias}.${item.field}` : item.field
        if (input[a] && item.filter) {
            if (item.type == 'range-date') {
                input.filter.push(`DATE(${fielAlias}) BETWEEN ? AND ?`)
                let val = input[a]
                input.filterValue.push(val[0])
                input.filterValue.push(val[1] ? val[1] : val[0])
            } else if (item.type == 'date') {
                input.filter.push(`DATE(${fielAlias}) = ? `)
                input.filterValue.push(input[a])
            } else if (item.type == 'month') {
                input.filter.push(`DATE(${fielAlias},'YYYY-MM') = ? `)
                input.filterValue.push(moment(input[a]).format('YYYY-MM'))
            } else if (item.type == 'multiple') {
                if (Array.isArray(input[a])) {
                    let val = []
                    for (let i of input[a]) { val.push(`${fielAlias} = '${i}'`) }
                    if (val.length > 0) input.filter.push(` (${val.join(' OR ')}) `)
                } else if (input[a]) {
                    input.filter.push(`${fielAlias} = ?`)
                    input.filterValue.push(input[a])
                }
            } else {
                input.filter.push(`${fielAlias} = ?`)
                input.filterValue.push(input[a])
            }
        }
        // SET ORDER
        if (input.order == a && item.order) input.orderBy = item.alias ? `${fielAlias}` : item.field

        // SET SEARCH
        if (input.search && item.search) {
            input.searchField.push(`${fielAlias} LIKE ?`)
            input.searchValue.push(`%${input.search}%`)
        }
    }

    // PUSH SEARCH TO FILTER
    if (input.searchField.length > 0) { input.filter.push(` ( ${input.searchField.join(' OR ')})`) }
    for (let i of input.searchValue) { input.filterValue.push(i) }

    // INIT VALUE
    input.limit = input.limit ? input.limit > 500 ? 500 : input.limit : 25
    input.offset = input.offset ? input.offset : 0
    input.sort = input.sort ? input.sort.toUpperCase() == "ASC" || input.sort.toUpperCase() == "DESC" ? input.sort.toUpperCase() : "DESC" : "DESC"

    return input
}