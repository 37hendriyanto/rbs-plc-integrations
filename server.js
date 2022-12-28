var express = require('express')
var cors = require('cors')
var app = express()
app.use(cors())
app.use(express.json())
var path = require('path')
const port = '9500'
var http = require('http')
var server = http.createServer(app)
const routing = require("./server/router")
const middleware = require('./server/main/middleware')

// server.listen(port, 'localhost')
// app.use('/compiler', express.static(path.join(__dirname, 'compiler')))

server.listen(port, '0.0.0.0')
app.use('/dist', express.static(path.join(__dirname, 'dist')))

// app.use('',function(res,res){
//     return res.sendFile('index.html', { root: `${__dirname}/compiler/` })
// })

app.post('/setup/prepare', async function (req, res) {
    const prepare = require('./server/services/_init/prepare')
    return await prepare(req, res)
})

// ROUTING
routing.forEach(item => {
    if (item.type == 'GET') {
        app.get(item.endPoint, middleware(item), async function (req, res) {
            const service = require("./server/services" + item.service)
            return service.exec(req, res)
        })
    } else if (item.type == 'POST') {
        app.post(item.endPoint, middleware(item), async function (req, res) {
            const service = require("./server/services" + item.service)
            return service.exec(req, res)
        })
    }else if (item.type == 'PATCH') {
        app.patch(item.endPoint, middleware(item), async function (req, res) {
            const service = require("./server/services" + item.service)
            return service.exec(req, res)
        })
    }else if (item.type == 'DELETE') {
        app.delete(item.endPoint, middleware(item), async function (req, res) {
            const service = require("./server/services" + item.service)
            return service.exec(req, res)
        })
    }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    return res.status(404).json({ success: false, message: 'Route not found' })
})

// error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}
    return res.status(500).json({ success: false, message: err.message })
})
// END ROUTING

server.on('error', (onError) => { })
server.on('listening', (resp) => {
    console.log(`Server is running on port ${port}`)
})