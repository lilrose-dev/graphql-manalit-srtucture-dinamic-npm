
const fs = require('fs')
const process = require('process')

const prArgv = process.argv[2]
console.log(prArgv);




if (prArgv) {
     
   

    fs.mkdir(`src`, {recursive :true}, (err) => {
        if (err) throw err
       
        //server
        fs.open('src/server.js', 'w+', (err)=>{
            if (err) throw err

            const arr = `
            const { ApolloServer } = require('apollo-server')
            const modules = require('./modules')
            
            const server = new ApolloServer({
                modules,
                context: ({ req }) => {
                    return req.headers
                }
            })
            
            server.listen(5050, console.log(5050 + '/graphql'))
        
            `

            fs.writeFile('src/server.js', (arr),(err)  => {
                if (err) throw err
                console.log('ok');
            })

        })

        //config
        const config = ` 
        const connection = {
            connectionString: 'postgres://postgres:password@localhost:5432/databasename'
        }
        
        module.exports = {
            connection
        }
        `
        fs.appendFile('src/config.js', (config),(err) => {
            if (err) throw err
        })

        //utils
        const fetch = `
        const { Pool } = require("pg")
        const { connection } = require('../config')
        
        const pool = new Pool({
            connectionString : connection.connectionString
        })
        
        const fetch = async(SQL , ...params) =>{
            const client = await pool.connect()
        
            try{
                const { rows: [ row ] } = await client.query(SQL , params.length ? params : null)
                return row
            }finally{
                client.release()
            }
        }
        
        const fetchAll = async(SQL , ...params) =>{
            const client = await pool.connect()
        
            try{
                const { rows } = await client.query(SQL , params.length ? params : null)
                return rows
            }finally{
                client.release()
            }
        }
        
        module.exports = {
            fetch,
            fetchAll
        }
        `
        fs.mkdir('src/utils', {recursive: true}, (err) => {
            if (err) throw err
            fs.appendFile('src/utils/postgres.js',(fetch), (err) => {
                if (err) throw err
            })
        })

        //model
        const model = `
        CREATE DATABASE nameDataBase;
        CREATE TABLE table1 (
            table_ID uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            table1_name varchar(64) not null
        );
        
        CREATE TABLE table2 (
            table_ID uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            table2_name varchar(64) not null,
            table_ID uuid,
                FOREIGN KEY(table_ID)
                REFERENCES table1 (table1_ID)
                ON DELETE SET NULL
        );
        
        CREATE TABLE table3 (
            table3_ID uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            table3_name varchar(64) not null,
            table_ID uuid,
                FOREIGN KEY(table2_ID)
                REFERENCES table2(table2_ID)
                ON DELETE SET NULL
        );
        `
        fs.mkdir('src/model', {recursive: true}, (err) => {
            if (err) throw err
            fs.appendFile('src/model/model.sql',(model), (err) => {
                if (err) throw err
            })
        })

        //modules
        const index = `
        const typeDefs = require('./schema')
        const resolvers = require('./resolvers')
        
        module.exports = {
            typeDefs,
            resolvers
        }
        `
        const modelJs = `
        const { fetch, fetchAll } = require('../../utils/postgres')
        const getTable = 'SELECT * FROM table1'
        const createTable = 'INSERT INTO table1(table1_name, table1_ID) VALUES($1, $2) RETURNING table1_ID, table1_name'
        const getById = 'SELECT * FROM table1 WHERE table1_ID = $1'

        
        const getTableF = () => fetchAll(getTable)
        const newTable = (name, tableID) => fetch(createTable, name, tableID)
        const getByIdTable = (tableID) => fetchAll(getById, tableID)

        module.exports = {
            getTable,
            newTable,
            getByIdTable
        }

        `
        const resolver = `
        const model = require('./model')

        module.exports = {
            Query: {
                getTable: async(_, {}, { token }) => {
                    return await model.getTable()
                }
            },
            Mutation: {
                createTable: async(_, { name, tableID }) => {
                    return await model.newTable(name, tableID)
                }
            },
            Region: {
                id: global => global.table1_ID,
                name: global => global.table1_name
            }
        }
        `
        
        const schema = `
            const { gql } = require("apollo-server")

            module.exports = '
            type Table {
                id: ID!
                name: String!
                time: Time!
            }
    
            extend type Query {
                table: [ Table ]!
            }
    
            extend type Mutation {
                createTable(name: String! tableID: ID!): Table
            }
            '
        `
        fs.mkdir(`src/modules/${prArgv}`, {recursive: true}, (err) => {
            if (err) throw err
            fs.appendFile(`src/modules/${prArgv}/index.js`, (index), (err) => {
                if(err) throw err
            })

            fs.appendFile(`src/modules/${prArgv}/model.js`, (modelJs), (err) => {
                if(err) throw err
            })

            fs.appendFile(`src/modules/${prArgv}/resolver.js`, (resolver), (err) => {
                if(err) throw err
            })

            fs.appendFile(`src/modules/${prArgv}/schema.js`, (schema), (err) => {
                if(err) throw err
            })
        })
    })
    
}


