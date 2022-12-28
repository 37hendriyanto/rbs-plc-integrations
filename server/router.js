const router = [
    // INIT
    { type: "POST", endPoint: "/setup/key", service: "/_init/initKey", auth: false },

    // AUTHENTICATION
    { type: "GET", endPoint: "/config", service: "/_config/config", auth: false },
    { type: "POST", endPoint: "/login", service: "/auth/login", auth: false },

    // DATA MASTER
    // LOOKUP RBS
    { type: "GET", endPoint: "/lookup/customer-project", service: "/lookupRbs/customerProject", auth: true },
    { type: "GET", endPoint: "/lookup/material", service: "/lookupRbs/material", auth: true },
    { type: "GET", endPoint: "/lookup/vehicle", service: "/lookupRbs/vehicle", auth: true },
    { type: "GET", endPoint: "/lookup/driver", service: "/lookupRbs/driver", auth: true },
    { type: "GET", endPoint: "/lookup/warehouse", service: "/lookupRbs/warehouse", auth: true },
    { type: "GET", endPoint: "/lookup/production-schedule", service: "/lookupRbs/schedule", auth: true },
    { type: "GET", endPoint: "/view/production-schedule/:id", service: "/lookupRbs/viewSchedule", auth: true },

    // DATA PLC
    { type: "GET", endPoint: "/list/plc/customer", service: "/dataPlc/customerList", auth: true },
    { type: "GET", endPoint: "/list/plc/vehicle", service: "/dataPlc/vehicleList", auth: true },
    { type: "GET", endPoint: "/list/plc/material", service: "/dataPlc/materialList", auth: true },
    { type: "GET", endPoint: "/list/plc/driver", service: "/dataPlc/driverList", auth: true },

    // LAST PRODUCTION
    { type: "GET", endPoint: "/list/plc/report", service: "/dataPlc/report", auth: true },


    // SETUP MASTER DATA
    // PLC BIN 
    { type: "GET", endPoint: "/list/data/bin-plc", service: "/setup/plcBin/list", auth: true },
    // DRIVER
    { type: "POST", endPoint: "/setup/data/driver", service: "/setup/driver/create", auth: true },
    { type: "DELETE", endPoint: "/setup/data/driver/:id", service: "/setup/driver/delete", auth: true },
    { type: "GET", endPoint: "/sync/data/driver", service: "/setup/driver/sync", auth: true },
    { type: "GET", endPoint: "/list/data/driver", service: "/setup/driver/list", auth: true },

    // CUSTOMER PROJECT
    { type: "POST", endPoint: "/setup/data/customer-project", service: "/setup/customerProject/create", auth: true },
    { type: "DELETE", endPoint: "/setup/data/customer-project/:id", service: "/setup/customerProject/delete", auth: true },
    { type: "GET", endPoint: "/sync/data/customer-project", service: "/setup/customerProject/sync", auth: true },
    { type: "GET", endPoint: "/list/data/customer-project", service: "/setup/customerProject/list", auth: true },

    // VEHICLE
    { type: "POST", endPoint: "/setup/data/vehicle", service: "/setup/vehicle/create", auth: true },
    { type: "DELETE", endPoint: "/setup/data/vehicle/:id", service: "/setup/vehicle/delete", auth: true },
    { type: "GET", endPoint: "/sync/data/vehicle", service: "/setup/vehicle/sync", auth: true },
    { type: "GET", endPoint: "/list/data/vehicle", service: "/setup/vehicle/list", auth: true },

    // WAREHOUSE
    { type: "POST", endPoint: "/setup/data/warehouse", service: "/setup/warehouse/create", auth: true },
    { type: "DELETE", endPoint: "/setup/data/warehouse/:id", service: "/setup/warehouse/delete", auth: true },
    { type: "GET", endPoint: "/sync/data/warehouse", service: "/setup/warehouse/sync", auth: true },
    { type: "GET", endPoint: "/list/data/warehouse", service: "/setup/warehouse/list", auth: true },
    { type: "GET", endPoint: "/view/data/warehouse/:id", service: "/setup/warehouse/view", auth: true },
    { type: "PATCH", endPoint: "/setup/data/warehouse", service: "/setup/warehouse/update", auth: true },

    // MATERIAL
    { type: "POST", endPoint: "/setup/data/material", service: "/setup/material/create", auth: true },
    { type: "DELETE", endPoint: "/setup/data/material/:id", service: "/setup/material/delete", auth: true },
    { type: "GET", endPoint: "/sync/data/material", service: "/setup/material/sync", auth: true },
    { type: "GET", endPoint: "/list/data/material", service: "/setup/material/list", auth: true },

    // BIN MATERIAL
    { type: "POST", endPoint: "/setup/data/bin-material", service: "/setup/binMaterial/create", auth: true },
    { type: "DELETE", endPoint: "/setup/data/bin-material/:id", service: "/setup/binMaterial/delete", auth: true },
    { type: "GET", endPoint: "/list/data/bin-material", service: "/setup/binMaterial/list", auth: true },


    // TRANSACTION
    // SCHEDULE 
    { type: "GET", endPoint: "/list/production-schedule", service: "/lookupRbs/schedule", auth: true },
    { type: "POST", endPoint: "/convert/production-schedule", service: "/production/schedule/convert", auth: true },
    // PRODUCTION
    { type: "POST", endPoint: "/create/production", service: "/production/production/create", auth: true },

]

module.exports = router