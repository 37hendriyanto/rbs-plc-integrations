const { coreService, coreException } = require('../../main/core')
const rbs = require('../../rbsIntegrate')
const service = {
    input: function (request) {
        return request.params
    },
    process: async function (input, db) {
        let data = await rbs.get(input.session.rbs_token, `view/production/schedule/${input.id}`)
        if (!data) data = { data: {} }
        return data.data
    },
    validation: {
        id: 'required|uuid',
    }
}
module.exports = coreService(service)