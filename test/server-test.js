const assert = require('chai').assert;
const plugin = require('../index');
const integrationServer = require('@mvollset/jira-integration-server');
let server;
const validate = async (request, username, password, h) => {
    
    //Incredibly stupid password implementations Requires 
    const user = request.server.getUser(username);
    if (!user) {
        return { credentials: null, isValid: false };
    }
    
    const isValid = ((password&&typeof password==String))? (password.localeCompare(user.passwordhash)==0):false;
    const credentials = { id: user.id, username: user.username,scope:user.scope };
 
    return { isValid, credentials };
};
const pluginroot='testing';
describe('Plugin Testing', function () {
    
    before(async()=>{
        //Before tests load the server -set auth options and plugins
        server = integrationServer({
            host: '0.0.0.0',
            port: process.env.PORT?process.env.PORT:8080
        });
        await server.register(require('hapi-auth-basic'));
        server.auth.strategy('simple', 'basic', { validate });
        server.auth.default('simple');
        await server.register({
            plugin:plugin,
            options:{
                root:`${pluginroot}`
            }
        });
        await server.start();
        console.log("Server started");

    });
    it('It should return hello', async function () {
       const result = await server.inject(`/testing/hello`);
       assert.equal(result.result,'Hello, Ed - the standard plugin',"Standard reply")
    });
    it('It should return unauthenticated', async function () {
        const result = await server.inject(`/testing/restricted`);
        assert.equal(result.result.statusCode,401,"Should return unauthenticated")
     });
     it('It should return missing scope', async function () {
        const result = await server.inject({
            url:`/testing/restricted`,
            auth:{
                strategy:'basic',
                credentials:{
                    username:"john",
                    scope:["123"],
                    password:'secret'
                }
            }
            
        });
        assert.equal(result.result.statusCode,403,"Should return forbidden, missing scope")
     });
     it('It should return with my username', async function () {
        const result = await server.inject({
            url:`/testing/restricted`,
            auth:{
                strategy:'basic',
                credentials:{
                    username:"Martin",
                    scope:["example-scope","jalla"],
                    password:'secret'
                }
            }
            
        });
        assert.equal(result.result,'Hello, Martin - the standard plugin',"Should be fine")
     });
    it("It should not be possible to start a server without a root", async()=>{
        try{
        let server2 = integrationServer({
            host: '0.0.0.0',
            port: process.env.PORT?process.env.PORT:8081
        });
       
        await server2.register({
            plugin:plugin,
            options:{
                dummy:123
            }
        });
        assert.isTrue(false,'Should throw before this')
    }
    catch(err){
        assert.equal(err.message,'"root" is required',"Should tell you that you need to have a root in your options");
    }
        

    });
    after(async()=>{
        //Stop server
        await server.stop();
    })
    
});
