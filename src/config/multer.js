const multer = require('multer')
const {resolve, extname} = require('path')
const crypto = require('crypto')

module.exports = {
    storage: multer.diskStorage({
        destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
        filename: (req, file, cb)=>{
            crypto.randomBytes(16, (err, res)=>{
                if(err) cb(null)

                return cb(null, res.toString('hex') + extname(file.originalname))
            })
        }
    })
}