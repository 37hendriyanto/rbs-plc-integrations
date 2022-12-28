const { Validator, extend } = require("node-input-validator")
const { validate } = require('uuid')
const Store = require('electron-store');
const store = new Store();

const confStore = {
    set: function (name, value) {
        return store.set(name, value);
    },
    get: function (name) {
        return store.get(name)
    },
    delete: function (name) {
        return store.delete(name)
    }
}

const database = async function (conf = "") {
    if (!conf) {
        let cnf = store.get('cnfdbs')
        conf = cnf ? JSON.parse(cnf) : null
        if (!conf) throw new coreException('Please setup configuration first', 450)
    }
    if (!conf) throw new coreException('Database Configuration error')
    if (!conf.connected) throw new coreException('Database disconnected')

    let db = require('knex')({
        client: 'mysql',
        connection: {
            host: conf.host,
            port: conf.port,
            user: conf.user,
            password: conf.password,
            database: conf.database
        }, pool: { min: 0, max: 120 }
    })

    db.run_select = async function (sql, params = []) {
        return await db.raw(sql, params)
            .then(rows => {
                return rows[0]
            }).catch(err => {
                console.log(err)
                throw new coreException("Ooops, something went wrong", 422);
            });
    }
    db.row = async function (sql, params = []) {
        return await db.raw(sql, params)
            .then(rows => {
                return rows[0][0]
            }).catch(err => {
                console.log(err)
                throw new coreException("Ooops, something went wrong", 422);
            });
    }
    db.run_insert = async function (table, values, multiple = false) {
        return await db(table).insert(values)
            .then(rows => {
                if (multiple) return rows
                else {
                    let val = values
                    val.id = rows[0]
                    return val
                }
            })
            .catch(err => {
                console.log(err)
                throw new coreException("Ooops, something went wrong", 422);
            })
    }
    return db
};

class coreException {
    constructor(errorMessage = "", errorCode = 422) {
        this.errorMessage = errorMessage
        this.errorCode = errorCode
    }
}
var coreResponse = {
    fail: function (res, message, statusCode = 422) {
        return res.status(statusCode).json({ success: false, message: message, error_message: message })
    },
    ok: function (res, data) {
        return res.status(200).json({ success: true, data: data })
    }
}
var coreService = function (service) {
    return {
        exec: async function (req, res) {
            return await executeService(req, service, res)
        },
    }
}
const executeService = async function (req, service, res) {
    let db = null
    try {
        let input = service.input(req)
        input.session = req.session || {}
        db = await database()
        if (!db) return coreResponse.fail(res, "failed")
        if (service.transaction) await db.raw(`BEGIN`)

        extend('uuid', (field, value) => {
            return validate(field.value)
        })
        // VALIDATION
        const validator = new Validator(input, service.validation)
        const matched = await validator.check()
        if (!matched) {
            let error = {}
            if (validator.errors) {
                for (let item in validator.errors) {
                    error = validator.errors[item].message
                    return coreResponse.fail(res, error, 422)
                }
            }
            return coreResponse.fail(res, validator.errors, 422)
        }
        const result = await service.process(input, db)
        if (service.transaction) await db.raw(`COMMIT`)
        await db.destroy()
            .then((res) => { console.log("SUCCESS", res) })
            .catch((err) => { console.log(err) })
        return coreResponse.ok(res, result)
    }
    catch (err) {
        if (service.transaction) await db.raw("ROLLBACK")
        if (db) await db.destroy()
        if (err instanceof coreException) return coreResponse.fail(res, err.errorMessage, err.errorCode)
        return coreResponse.fail(res, err.message, 422)
    }
}

module.exports = { coreResponse, coreService, coreException, database, confStore }