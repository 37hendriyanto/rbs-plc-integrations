const axios = require('axios')
const { confStore } = require('./main/core')
let BASEURL = null
const rbs = {
    get: async function (token, endPoint, params) {
        if (!BASEURL) BASEURL = confStore.get('BASEURL')
        if (!BASEURL) return
        let header = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            params: params
        }
        return await axios.get(`${BASEURL}${endPoint}`, header)
            .then((res) => {
                return res.data
            })
            .catch((err) => {
                // console.log(err.response ? err.response.data : null)
                return
            })
    },
    post: async function (token, endPoint, body, error = false) {
        if (!BASEURL) BASEURL = confStore.get('BASEURL')
        if (!BASEURL) return
        let header = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
        }
        return await axios.post(`${BASEURL}${endPoint}`, body, header)
            .then((res) => {
                return res.data
            })
            .catch((err) => {
                console.log(err.response ? err.response.data : null)
                if (error) throw err.response ? err.response.data : null
                return
            })
    }
}

module.exports = rbs