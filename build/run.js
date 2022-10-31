const childProcess = require('child_process')
const path = require('path')

const joinDir = pathName => path.join(__dirname, `../${pathName}`)

const filePath = {
    vue2: joinDir("vue2"),
    vue3: joinDir("vue3"),
    react16: joinDir("react16"),
}

function runChild() {
    Object.values(filePath).forEach(item => {
        childProcess.spawn(`cd ${item} && npm start`, {stdio: "inherit", shell: true})
    })
}

runChild()