const Yup = require('yup')
const {isBefore, subHours, startOfHour, parseISO, format} = require('date-fns')
const pt = require('date-fns/locale/pt')

const Appointment = require('../models/Appointment')
const User = require('../models/User')
const File = require('../models/File')
const Notification = require('../schemas/Notification')
const Mail = require('../../lib/Mail')
const Queue = require('../../lib/Queue')
const CancelationMail = require('../jobs/CancelationMail')

class AppointmentController{
    async index(req, res){

        const {page=1} = req.query


        const appointments = await Appointment.findAll({
            where: {
                user_id: req.userId,
                cancelled_at: null
            },
            order: ['date'],
            limit: 20,
            offset: (page-1)*20,
            attributes: ['id','date','past','cancellable'],
            include: [
                {
                    model: User,
                    as: 'provider',
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

        return res.json(appointments)
    }


    async store(req, res){

        const schema = Yup.object().shape({
            date: Yup
                .date()
                .required(),
            provider_id: Yup
                .number()
                .integer()
                .positive()
                .required(),            
        })

        if(!(await schema.isValid(req.body))){
            return res.status(400).json({error: "Invalid data"})
        }

        const {provider_id, date} = req.body
        const isProvider = await User.findOne({where: {
            id: provider_id,
            provider: true,
        }})

        if(!isProvider){
            return res.status(401).json({error: "User is not a provider"})
        }

        if(req.userId === provider_id){
            return res.json(401).json({error: "Can't create appointment with yourself"})
        }

        const hourStart = startOfHour(parseISO(date))

        if(isBefore(subHours(hourStart, 2), new Date())){
            return res.status(401).json({error: "You can only schedule a appointment two hours in advance"})
        }

        const notAvailable = await Appointment.findOne({where:{
            provider_id,
            cancelled_at: null,
            date: hourStart
        }})

        if(notAvailable){
            return res.status(401).json({error: "Date not available"})
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date: hourStart
        })

        const user = await User.findByPk(req.userId)

        const formattedDate = format(hourStart,
            "'dia' dd 'de' MMMM 'de' yyyy', às' HH:mm'h'",
            {locale: pt})

        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formattedDate}`,
            user: provider_id
        })

        return res.json(appointment)

    }

    async delete(req, res){
        
        const appointment = await Appointment.findByPk(req.params.id,{
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name','email']
                },
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name','email']
                }
            ]
        })

        if(req.userId!==appointment.user_id){
            return res.status(401).json({error: "You don't have permission to delete this appointment"})
        }

        if(isBefore(subHours(appointment.date, 2), new Date())){
            return res.status(401).json({error: "You can only delete a appointment two hours in advance"})
        }

        appointment.cancelled_at = new Date()

        await appointment.save()

        Queue.add(CancelationMail.key, {
            appointment
        })

        return res.json(appointment)
    }
}

module.exports = new AppointmentController()