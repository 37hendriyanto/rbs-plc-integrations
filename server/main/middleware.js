const jwt = require('jsonwebtoken')
const { database, coreResponse, confStore } = require('./core')
module.exports = function middleware(service) {
    return async (req, res, next) => {
        console.log(service.endPoint)
        let headers = req.headers.authorization
        let decodedToken = jwt.verify(headers, 'RBSPRODUCTIONINTEGRATION', (err, decoded) => {
            if (err) return null
            return decoded
        })
        if (!service.auth) return next()
        if (!decodedToken) return coreResponse.fail(res, `unauthorized`, 401)
        if (!confStore.get('cnfdbs')) return coreResponse.fail(res, `Please setup configuration first`, 450)
        let db = await database()
        let check = await db.row(`SELECT*FROM rbs_token WHERE token =  ?`, [decodedToken.token])
        if (!check) return coreResponse.fail(res, `unauthorized`, 401)

        req.session = {
            token: decodedToken.token,
            rbs_token: check.rbs_token,
        }
        return next()
    }
}