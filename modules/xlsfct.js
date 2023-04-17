// This code requires Node.js. Do not run this code directly in a web browser.

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const config = require('config')

function xls2png(nameFileXls, nameFilePng){
  const formData = new FormData()
  formData.append('instructions', JSON.stringify({
    parts: [
      {
        file: "document"
      }
    ],
    output: {
      type: "image",
      format: "png",
      dpi: 150
    }
  }))
  formData.append('document', fs.createReadStream(nameFileXls))

  ;(async () => {
    try {
      const response = await axios.post('https://api.pspdfkit.com/build', formData, {
        headers: formData.getHeaders({
            'Authorization': `Bearer ${config.get('pspdfkit.key')}`
        }),
        responseType: "stream"
      })

      response.data.pipe(fs.createWriteStream(nameFilePng))
    } catch (e) {
      console.log(e)
      const errorString = await streamToString(e.response.data)
      console.log(errorString)
    }
  })()

  function streamToString(stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on("error", (err) => reject(err))
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    })
  }
}

module.exports = {
  xls2png
};
