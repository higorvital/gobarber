const Yup = require('yup')

const User = require('../models/User')
const File = require('../models/File')

class UserController{
    async store(req, res){
        const schema = Yup.object().shape({
            name: Yup
                .string()
                .required(),
            email: Yup
                .string()
                .email()
                .required(),
            password: Yup
                .string()
                .min(6)
                .required(),
            provider: Yup
                .boolean()
        })

        if(!(await schema.isValid(req.body))){
            return res.status(400).json({error: "Invalid data"})
        }

        const userExists = await User.findOne({where: {
            email: req.body.email
        }})

        if(userExists){
            return res.status(401).json({error: "User already exists"})
        }

        const {id, name, email, provider} = await User.create(req.body)

        return res.json({
            id,
            name,
            email,
            provider
        })        
    }

    async update(req, res){
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup
                .string()
                .email(),
            oldPassword: Yup
                .string()
                .min(6),
            password: Yup
                .string()
                .min(6)
                .when('oldPassword', (oldPassword, field)=> oldPassword ? field.required() : field),
            confirmPassword: Yup
                .string()
                .min(6)
                .when('password', (password, field)=> password ? field.required().oneOf([Yup.ref('password')]): field),
            avatar_id: Yup
                .number()
                .integer()
                .positive(),
        })

        if(!await schema.isValid(req.body)){
            return res.status(400).json({error: "Invalid data"})
        }

        const user = await User.findByPk(req.userId)

        const {email, oldPassword, avatar_id} = req.body

        if(email !== user.email){
            const userExists = await User.findOne({where: {
                email
            }})

            if(userExists){
                return res.status(401).json({error: "User already exists"})
            }
        }

        if(oldPassword && !(await user.checkPassword(oldPassword))){
            return res.status(401).json({error: "Wrong password"})
        }

        if(avatar_id){
            const fileExists = await File.findByPk(avatar_id)

            if(!fileExists){
                return res.status(401).json({error: "File does not exists"})
            }
        }

        const {id, name, provider} = await user.update(req.body)

        console.log(user.avatar_id)

        return res.json({
            id,
            name,
            email,
            provider
        })
    }
}

module.exports = new UserController()