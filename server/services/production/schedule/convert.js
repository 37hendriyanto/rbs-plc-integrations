const { coreService, coreException } = require('../../../main/core')
const rbs = require('../../../rbsIntegrate')

const service = {
    input: function (request) {
        return request.body
    },
    process: async function (input, db) {
        let resp = {
            info: {},
            plc: {},
            composition: [],
            exclude_composition: [],
            undefined_composition: []
        }

        // CHECK DUPLICATE
        let check = await db.row(`SELECT*FROM rbs_production WHERE ticket_number = ? `, [input.ticket_number])
        if (check) throw new coreException(`Duplicate ticket number`)
        let scheduleInfo = await rbs.get(input.session.rbs_token, `view/production/schedule/${input.production_schedule_id}`)
        if (!scheduleInfo) throw new coreException('production schedule unavailable')
        scheduleInfo = scheduleInfo.data

        resp.info = {
            production_schedule_id: scheduleInfo.id,
            order_number: scheduleInfo.order_number,
            customer_name: scheduleInfo.customer_name,
            site_project_code: scheduleInfo.site_project_code,
            site_project_name: scheduleInfo.site_project_name,
            product_code: scheduleInfo.product_code,
            product_name: scheduleInfo.product_name,
            schedule_quantity: scheduleInfo.quantity,
            remaining_quantity: scheduleInfo.remaining_quantity,
            quantity_actual: scheduleInfo.actual_production,
            status_code: scheduleInfo.status_code,
        }

        // CHECK PRODUCTION
        var sql = ` SELECT A.id_laporan AS id,B.id_mix, C.nama_material, 
                    C.uuid AS material_id_1,D.uuid AS material_id_2, E.uuid AS material_id_3,F.uuid AS material_id_4, 
                    G.uuid AS material_semen_id, H.uuid AS material_air_id, 
                    I.uuid AS material_additive_id_1,J.uuid AS material_additive_id_2,
                    A.aktual_bin_1,A.aktual_bin_2, A.aktual_bin_3, A.aktual_bin_4, A.aktual_semen, A.aktual_air, A.aktual_additive_1, A.aktual_additive_2,
                    K.uuid AS driver_id, L.uuid AS vehicle_id, K.nama_supir AS driver_name, L.no_polisi AS police_number, A.total_kubikasi AS production_volume, A.total_aktual AS actual_quantity,
                    B.material_bin_1,B.material_bin_2,B.material_bin_3,B.material_bin_4,B.material_semen,B.material_air, B.material_additive_1, B.material_additive_2,
                    DATE_FORMAT(A.tanggal_produksi,'%Y-%m-%d') AS production_date, A.jam_mulai AS start_time, A.jam_selesai AS end_time
                    FROM laporan_produksi A
                    LEFT JOIN mix_design B ON B.mix_design = A.mix_design
                    LEFT JOIN master_material C ON  C.nama_material =  B.material_bin_1
                    LEFT JOIN master_material D ON  D.nama_material = B.material_bin_2
                    LEFT JOIN master_material E ON  E.nama_material = B.material_bin_3
                    LEFT JOIN master_material F ON  F.nama_material = B.material_bin_4
                    LEFT JOIN master_material G ON  G.nama_material = B.material_semen
                    LEFT JOIN master_material H ON  H.nama_material = B.material_air
                    LEFT JOIN master_material I ON  I.nama_material = B.material_additive_1
                    LEFT JOIN master_material J ON  J.nama_material = B.material_additive_2
                    LEFT JOIN master_driver K ON K.nama_supir = A.nama_supir
                    LEFT JOIN master_truck L ON L.no_polisi = A.no_polisi
                    WHERE REPLACE(A.no_tiket,'-','') = REPLACE(?,'-','') LIMIT 1`
        let plcProduction = await db.row(sql, [input.ticket_number])
        if (!plcProduction) throw new coreException(`Production unavailable`)

        let composition = []
        let actualMixDesign = []
        let totalTarget = 0
        let totalLab = 0
        let materialBinConf = {}
        let validateCompostionByMaterial = {}
        // var sql2 = `SELECT  D.code AS bin_code, D.name AS bin_name, B.uuid AS material_id, C.uuid AS warehouse_id, 
        //             C.code AS warehouse_code, C.name AS warehouse_name, B.code AS material_code, B.name AS material_name
        //             FROM rbs_material_bin A
        //             INNER JOIN rbs_material B ON B.id = A.rbs_material_id
        //             INNER JOIN rbs_warehouse C ON C.id =A.rbs_warehouse_id 
        //             INNER JOIN rbs_plc_bin D ON D.id = C.plc_bin_id
        //             WHERE A.active ='1' ORDER BY B.id ASC`

        var sql2 = `SELECT  B.code AS bin_code, B.name AS bin_name, C.uuid AS material_id, D.uuid AS warehouse_id, 
                    D.code AS warehouse_code, D.name AS warehouse_name, C.code AS material_code, C.name AS material_name
                    FROM rbs_material_bin A
                    INNER JOIN rbs_plc_bin B ON B.id = A.plc_bin_id
                    INNER JOIN rbs_material C ON C.id = A.rbs_material_id
                    INNER JOIN rbs_warehouse D ON D.plc_bin_id =A.plc_bin_id AND D.active ='1' WHERE A.active ='1' ORDER BY B.id ASC`
        let dataWarehouse = await db.run_select(sql2)
        // INITITAL WAREHOUSE MATERIAL
        for (let item of dataWarehouse) {
            if (materialBinConf[item.material_id]) {
                materialBinConf[item.material_id].data.push({
                    warehouse_id: item.warehouse_id,
                    code: item.warehouse_code,
                    name: item.warehouse_name,
                    bin_code: item.bin_code,
                    bin_name: item.bin_name,
                })
            } else {
                materialBinConf[item.material_id] = {
                    material_id: item.material_id,
                    code: item.material_code,
                    name: item.material_name,
                    data: [
                        {
                            warehouse_id: item.warehouse_id,
                            code: item.warehouse_code,
                            name: item.warehouse_name,
                            bin_code: item.bin_code,
                            bin_name: item.bin_name,
                        }
                    ]
                }
            }
        }

        // CALCULATE MIX DESIGN & VOLUME PRODUCTION
        for (let item of scheduleInfo.mix_design.composition) {
            validateCompostionByMaterial[item.material_id] = true
            let productionVolume = plcProduction.production_volume
            item.actual_quantity = 0
            item.lab_quantity = parseFloat((item.lab_quantity * productionVolume).toFixed(2))
            item.mc = item.mc
            item.target_quantity = parseFloat((item.target_quantity * productionVolume).toFixed(2))
            totalTarget = parseFloat((parseFloat(totalTarget) + parseFloat(item.target_quantity)).toFixed(2))
            totalLab = parseFloat((parseFloat(totalLab) + parseFloat(item.lab_quantity)).toFixed(2))
            composition.push(item)
        }

        // PLC PRODUCTION INIT
        let conf = [
            { material_id: 'material_id_1', quantity: 'aktual_bin_1', bin_code: 'material_bin_1', bin_name: 'BIN 1' },
            { material_id: 'material_id_2', quantity: 'aktual_bin_2', bin_code: 'material_bin_2', bin_name: 'BIN 2' },
            { material_id: 'material_id_3', quantity: 'aktual_bin_3', bin_code: 'material_bin_3', bin_name: 'BIN 3' },
            { material_id: 'material_id_4', quantity: 'aktual_bin_4', bin_code: 'material_bin_4', bin_name: 'BIN 4' },
            { material_id: 'material_semen_id', quantity: 'aktual_semen', bin_code: 'material_semen', bin_name: 'CEMENT' },
            { material_id: 'material_air_id', quantity: 'aktual_air', bin_code: 'material_air', bin_name: 'WATER' },
            { material_id: 'material_additive_id_1', quantity: 'aktual_additive_1', bin_code: 'material_additive_1', bin_name: 'ADD 1' },
            { material_id: 'material_additive_id_2', quantity: 'aktual_additive_2', bin_code: 'material_additive_2', bin_name: 'ADD 2' },
        ]

        // FIND DATA PRODUCTION BY MATERIAL
        let calculateByMaterial = {}
        for (let item of conf) {
            if (plcProduction[item.quantity] > 0 && plcProduction[item.material_id]) {
                let actMix = {
                    material_id: plcProduction[item.material_id],
                    material_code: '',
                    material_name: '',
                    actual_quantity: plcProduction[item.quantity],
                    warehouse_id: null,
                    warehouse_option: []
                }
                let materialBin = materialBinConf[plcProduction[item.material_id]]
                if (materialBin) {
                    actMix.material_code = materialBin.code
                    actMix.material_name = materialBin.name
                    actMix.warehouse_option = materialBin.data.filter(r => r.bin_code == item.bin_code)
                    if (actMix.warehouse_option.length == 1) actMix.warehouse_id = actMix.warehouse_option[0].warehouse_id
                } else {
                    actMix.material_name = plcProduction[item.bin_code]
                }
                // CALCULATE PER MATERIAL || HANDLE DOUBLE MATERIAL
                if (calculateByMaterial[actMix.material_id]) calculateByMaterial[actMix.material_id].value += parseFloat(actMix.actual_quantity)
                else calculateByMaterial[actMix.material_id] = { value: actMix.actual_quantity, id: actMix.material_id }
                // CHECK INCLUDE OR EXCLUDE MIX DESIGN COMPOSITION
                if (validateCompostionByMaterial[plcProduction[item.material_id]]) actualMixDesign.push(actMix)
                else resp.exclude_composition.push(actMix)
            } else {
                // UNDEFINED COMPOSITION || ONLY QUANTITY > 0
                if (plcProduction[item.quantity] > 0) {
                    resp.undefined_composition.push({
                        material_name: plcProduction[item.bin_code],
                        actual_quantity: plcProduction[item.quantity],
                        bin_name: item.bin_name
                    })
                }
            }
        }

        // FINISH ACTUAL COMPOSITION
        for (let item of composition) {
            let actMixPlc = actualMixDesign.filter(r => r.material_id == item.material_id)
            if (actMixPlc.length == 0) {
                let whOption = materialBinConf[item.material_id]
                actMixPlc = [{
                    material: item.material_id,
                    material_code: item.material_code,
                    material_name: item.material_name,
                    actual_quantity: 0,
                    warehouse_id: null,
                    warehouse_option: whOption ? whOption.data : []
                }]
            }
            item.material_data = actMixPlc
            item.actual_quantity = calculateByMaterial[item.material_id] ? parseFloat((calculateByMaterial[item.material_id].value).toFixed(2)) : 0
            resp.composition.push(item)
        }

        resp.plc = {
            ticket_number: input.ticket_number,
            driver_id: plcProduction.driver_id,
            vehicle_id: plcProduction.vehicle_id,
            driver_name: plcProduction.driver_name,
            police_number: plcProduction.police_number,
            volume: plcProduction.production_volume,
            total_actual: plcProduction.actual_quantity,
            total_lab: totalLab,
            total_target: totalTarget,
            production_date: plcProduction.production_date,
            start_time: plcProduction.start_time,
            end_time: plcProduction.end_time,
        }
        return resp
    },
    validation: {
        production_schedule_id: "required|uuid",
        ticket_number: "required"
    }
}
module.exports = coreService(service)