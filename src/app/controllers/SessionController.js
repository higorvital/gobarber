const jwt = require('jsonwebtoken')
const Yup = require('yup')

const authConfig = require('../../config/auth')
const User = require('../models/User')

class SessionController{
    async store(req, res){
        const schema = Yup.object().shape({
            email: Yup
                .string()
                .email()
                .required(),
            password: Yup
                .string()
                .required()
        })

        if(!(await schema.isValid(req.body))){
            return res.status(400).json({error: "Invalid data"})
        }

        const {email, password} = req.body

        const user = await User.findOne({where: {
            email
        }})

        if(!user){
            return res.status(401).json({error: "User does not exists"})
        }

        if(!(await user.checkPassword(password))){
            return res.status(401).json({error: "Wrong password"})
        }

        const {id, name, provider} = user

        return res.json({
            user: {
                id,
                name,
                email,
                provider
            },
            token: jwt.sign({id}, authConfig.secret, {expiresIn: authConfig.expiresIn})
        })
    }
}

module.exports = new SessionController()