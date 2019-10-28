const {startOfDay, endOfDay, parseISO} = require('date-fns')
const {Op} = require('sequelize')

const Appointment = require('../models/Appointment')
const User = require('../models/User')
const File = require('../models/File')

class ScheduleController{
    async index(req, res){
        const {page=1, date} = req.query

        const isProvider = await User.findOne({
            where:{
                id: req.userId,
                provider: true
            }
        })

        if(!isProvider){
            return res.status(401).json({error: "User is not a provider"})
        }

        const parsedDate = parseISO(date)

        const schedule = await Appointment.findAll({
            where: {
                provider_id: req.userId,
                date: {
                    [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
                }
            },
            order: ['date'],
            limit: 20,
            offset: (page-1)*20,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id','name','email','avatar_id'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['name','path','url']
                        }
                    ]
                }
            ]
        })

        return res.json(schedule)
    }
}

module.exports = new ScheduleController()