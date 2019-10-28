const User = require('../models/User')
const File = require('../models/File')

class ProviderController{
    async index(req, res){

        const {page=1} = req.query

        const providers = await User.findAll({
            where: {
                provider: true
            },
            limit: 20,
            offset: (page-1)*20,
            attributes: ['id', 'name', 'email', 'avatar_id'],
            include: [
                {
                    model: File,
                    as: 'avatar',
                    attributes: ['name', 'path', 'url']
                }
            ]
        })

        return res.json(providers)
    }

}

module.exports = new ProviderController()