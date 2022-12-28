const { coreService, coreException } = require('../../main/core')
const rbs = require('../../rbsIntegrate')
const service = {
    input: function (request) {
        let input = request.query
        input.query = JSON.parse(JSON.stringify(request.query))
        return input
    },
    process: async function (input, db) {
        let data = await rbs.get(input.session.rbs_token, `list/vehicle`, input.query)
        if (!data) data = { data: [], record: 0 }
        return data.data
    },
    validation: {
        limit: 'integer',
        offset: 'integer',
    }
}
module.exports = coreService(service)