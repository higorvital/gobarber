const Sequelize = require('sequelize')
const {Model} = require('sequelize')
const {isBefore, subHours} = require('date-fns')


class Appointment extends Model{
    static init(sequelize){
        super.init({
            date: Sequelize.DATE,
            cancelled_at: Sequelize.DATE,
            past: {
                type: Sequelize.VIRTUAL,
                get(){
                    return isBefore(this.date, new Date())
                }
            },
            cancellable: {
                type: Sequelize.VIRTUAL,
                get(){
                    return isBefore(new Date(),subHours(this.date, 2))
                }
            }
        },
        {
            sequelize
        })

        return this
    }

    static associate(models){
        this.belongsTo(models.User, {foreignKey: 'user_id', as: 'user'})
        this.belongsTo(models.User, {foreignKey: 'provider_id', as: 'provider'})
    }
}

module.exports = Appointment