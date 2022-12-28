const { coreResponse, database, coreException, confStore } = require('../../main/core')
const { Validator } = require("node-input-validator")

const prepare = async function (req, res) {
    let input = req.body
    let validation = {
        host: "required",
        user: "required",
        password: "required",
        port: "required|integer",
        database: "required"
    }
    if (!input.host) input.host = "localhost"
    if (!input.port) input.port = 3306

    // VALIDATION
    const validator = new Validator(input, validation)
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
    let db = null
    let conf = {
        host: input.host,
        port: input.port,
        user: input.user,
        password: input.password,
        database: input.database,
        connected: true,
    }
    try {
        db = await database(conf)
        await db.raw("BEGIN")
    }
    catch (err) {
        console.log(err)
        return coreResponse.fail(res, "Database Connection error", 422)
    }
    try {
        let result = await process(input, db)
        await db.raw(`COMMIT`)
        await db.destroy()
        return coreResponse.ok(res, result)
    }
    catch (err) {
        console.log("ROLEBACK")
        await db.raw("ROLLBACK")
            .then((res) => { console.log(res) })
            .catch((err) => { console.log(err) })
        await db.destroy()
        return coreResponse.fail(res, err.errorMessage, 422)
    }
}

const process = async function (input, db) {
    let conf = null
    confStore.delete('cnfdbs')
    // CHECK EXIST DATABASE
    let check = await db.raw(`SELECT*FROM rbs_config`)
        .then((res) => {
            return res
        })
        .catch((err) => {
            console.log('UNREADY')
            return false
        })
    if (check) {
        conf = {
            host: input.host ? input.host : conf.host,
            port: input.port ? input.port : conf.port,
            user: input.user ? input.user : conf.user,
            password: input.password ? input.password : conf.password,
            database: input.database ? input.database : conf.database,
            connected: true,
            locked: true
        }
        check = check[0][0]
        confStore.set('cnfdbs', JSON.stringify(conf))
        return {
            message: `Init configuration successfully`,
            connected: true,
            register_key: check ? true : false
        }
    }

    let query = [
        `CREATE TABLE IF NOT EXISTS rbs_plc_bin (
             id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
             code VARCHAR(255) NULL,
             name VARCHAR(255) NULL,
             active VARCHAR(1) NULL DEFAULT '1',
             created_by INT(11) NULL DEFAULT '-1',
             updated_by INT(11) NULL,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_warehouse (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            plc_bin_id INT(11) NULL,
            code VARCHAR(255) NULL,
            name VARCHAR(255) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       )`,
        `CREATE TABLE IF NOT EXISTS rbs_driver (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            name VARCHAR(255) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       )`,
        `CREATE TABLE IF NOT EXISTS rbs_vehicle (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            name VARCHAR(255) NULL,
            code VARCHAR(255) NULL,
            police_number VARCHAR(255) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_material (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            code VARCHAR(255) NULL,
            name VARCHAR(255) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_material_bin (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            plc_bin_id INT(11) NULL,
            rbs_warehouse_id INT(11) NULL,
            rbs_material_id INT(11) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_customer_project (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            customer_id VARCHAR(255) NULL,
            customer_name VARCHAR(255) NULL,
            code VARCHAR(255) NULL,
            name VARCHAR(255) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_mix (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            code VARCHAR(255) NULL,
            name VARCHAR(255) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_mix_detail (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            rbs_mix_id INT(11) NULL,
            plc_bin_id INT(11) NULL,
            rbs_material_id INT(11) NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_config (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            secret_key VARCHAR(255) NULL,
            locked VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_token (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT(11) NULL,
            token VARCHAR(255) NULL,
            rbs_token TEXT NULL,
            active VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS rbs_production (
            id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NULL,
            plc_production_id INT(11) NULL,
            ticket_number VARCHAR(255) NULL,
            data TEXT NULL,
            sync VARCHAR(1) NULL DEFAULT '1',
            created_by INT(11) NULL DEFAULT '-1',
            updated_by INT(11) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX indexkey ON rbs_config (secret_key,locked)`,
        `CREATE INDEX indexkey ON rbs_token (user_id,token)`,
        `CREATE INDEX index_uuid ON rbs_material (uuid,code,name)`,
        `CREATE INDEX index_uuid ON rbs_vehicle (uuid,code,name)`,
        `CREATE INDEX index_uuid ON rbs_driver (uuid,name)`,
        `CREATE INDEX index_uuid ON rbs_warehouse (uuid,code,name)`,
        `CREATE INDEX index_uuid ON rbs_customer_project (uuid,code,name)`,

        `ALTER TABLE laporan_produksi ADD COLUMN uuid varchar(255) NULL`,
        `ALTER TABLE master_customer ADD COLUMN uuid varchar(255) NULL`,
        `ALTER TABLE master_driver ADD COLUMN uuid varchar(255) NULL`,
        `ALTER TABLE master_truck ADD COLUMN uuid varchar(255) NULL`,
        `ALTER TABLE master_material ADD COLUMN uuid varchar(255) NULL`,
        `ALTER TABLE mix_design ADD COLUMN uuid varchar(255) NULL`,
        `INSERT INTO rbs_plc_bin (code,name,active) VALUES 
            ('material_bin_1','BIN 1','1'),
            ('material_bin_2','BIN 2','1'),
            ('material_bin_3','BIN 3','1'),
            ('material_bin_4','BIN 4','1'),
            ('material_semen','CEMENT','1'),
            ('material_air','WATER','1'),
            ('material_additive_1','ADD 1','1'),
            ('material_additive_2','ADD 2','1')`,
        'ALTER TABLE master_driver DROP INDEX nama_supir',
        'ALTER TABLE master_truck DROP INDEX no_polisi',
        'ALTER TABLE master_material DROP INDEX nama_material',
        `CREATE INDEX index_uuid ON laporan_produksi (uuid)`,
        `CREATE INDEX index_uuid ON master_driver (uuid)`,
        `CREATE INDEX index_uuid ON master_truck (uuid)`,
        `CREATE INDEX index_uuid ON master_material (uuid)`,
        `CREATE INDEX index_uuid ON mix_design (uuid)`,
        `CREATE INDEX index_uuid ON master_customer (uuid)`,
    ]
    if (!conf) {
        let dbs = confStore.get('cnfdbs')
        if (dbs) throw new coreException(`connection has been made before`)
        conf = {
            host: input.host ? input.host : conf.host,
            port: input.port ? input.port : conf.port,
            user: input.user ? input.user : conf.user,
            password: input.password ? input.password : conf.password,
            database: input.database ? input.database : conf.database,
            connected: true,
            locked: true
        }
        confStore.set('cnfdbs', JSON.stringify(conf))
    }

    for (let item of query) {
        await db.raw(item)
            .then((res) => { })
            .catch((err) => {
                console.log(err)
                throw new coreException(`init configuration failed`)
            })
    }
    return {
        message: 'Init configuration successfully',
        data: {
            connected: true,
            register_key: false
        }
    }
}

module.exports = prepare

