const express = require('express')
const {resolve} = require('path')
const Sentry = require('@sentry/node')
const Youch = require('youch')

require('express-async-errors')

const routes = require('./routes')
const sentryConfig = require('./config/sentry')

require('./database')
require('dotenv/config')

class App{
    constructor(){
        this.server = express()

        Sentry.init(sentryConfig)

        this.middlewares()
        this.routes()
        this.exceptionHandler()
    }

    middlewares(){
        this.server.use(Sentry.Handlers.requestHandler());
        this.server.use(express.json())
        this.server.use('/files', express.static(resolve(__dirname, '..', 'tmp', 'uploads')))
    }

    routes(){
        this.server.use(routes)
        this.server.use(Sentry.Handlers.errorHandler());
    }

    exceptionHandler(){
        this.server.use(async (err, req, res, next)=>{

            if(process.env.NODE_ENV === 'development'){
                const errors = await new Youch(err, req).toJSON()
                return res.status(500).json(errors)
            }

            return res.status(500).json({error: "Internal server error"})
        })
    }

}

module.exports = new App().server