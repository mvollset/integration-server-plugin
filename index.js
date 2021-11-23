
'use strict';
const Boom = require('@hapi/boom');
const Joi = require('joi');
const optionsModel = Joi.object({
    root:Joi.string().required()
})
exports.plugin = {
    name: "SamplePlugin",
    pkg: require('./package.json'),
    register: async function (server, options) {

     
            const { error, value } = optionsModel.validate(options);
            if(error){
                console.error(error.message);
                throw error
            }
                
            server.route([
                {
                    method: "GET",
                    path: `/${options.root}/hello`,
                    handler: async () => {
                        return "Hello, Ed - the standard plugin";
    
                    },
                    config:{
                        auth:false
                    }
                },
                {
                    method: "GET",
                    path: `/${options.root}/restricted`,
                    config:{
                        auth:{
                            scope: ['example-scope']
                        }
                    },
                    handler:async(request,h)=>{
                        return `Hello, ${request.auth.credentials.username} - the standard plugin`
                    }
                }
            ]);
            server.addUsers([
                {
                username: 'john',
                passwordhash: 'secret', /*'$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',  -> 'secret'*/
                name: 'John Doe',
                id: '2133d32a',
                scope:['example-scope']
                }
            ])
       
    }
};