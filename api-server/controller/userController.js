const bcrypt = require('bcryptjs');
const jwt= require('jsonwebtoken');
const {z} = require('zod');
const {generateSlug} = require('random-word-slugs');

const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient ( {
});
const SECRET_KEY='MICKY'

const signup=async(req,res) => {
    
    const schema = z.object({
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6) // Ensure password has a minimum length
      });
    
      const safeParseResult = schema.safeParse(req.body);
      if (!safeParseResult.success) { // Check if validation failed
        return res.status(400).json({
          error: safeParseResult.error.errors // Return the validation errors
        });
      }
    try{
       const {username,email,password} = safeParseResult.data;
       const extistingUser = await prisma.user.findUnique({
           where: {
              email: email
           }
      })
      if(extistingUser != null){
        return res.status(409).json({
           message: "user already exist try choose different email id"
        });
       }
       const hashedpassword=await bcrypt.hash(password,10);
       const user = await prisma.user.create ( {
           data: {
                username:username,
                email:email,
                password_hash:hashedpassword
           }
        });
       const token = jwt.sign({
           email:user.email,
           id:user.id
       },SECRET_KEY);
       
       return res.status(201).json({
          message: "user successfully register",
          token:token
       })
    }catch(error)
    {
      return res.status(404).json({
         message:`${error}`
      })
    }
}

const signin = async(req,res)=>{
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6) // Ensure password has a minimum length
      });
      const safeParseResult = schema.safeParse(req.body);
      if (!safeParseResult.success) { // Check if validation failed
        return res.status(400).json({
          error: safeParseResult.error.errors // Return the validation errors
        });
       }
        try{
           const {email,password} = safeParseResult.data;
    
           const extistingUser = await prisma.user.findUnique({
               where: {
                  email: email
               }
          })
          if(extistingUser){
            const passwordMatch = await comparePasswords(password,extistingUser.password_hash);
            if(passwordMatch){
              const token = jwt.sign({
                 email:extistingUser.email,
                 id:extistingUser.id
              },SECRET_KEY);
              return res.status(201).json({
                message: "user successfully logged in",
                data: {
                    email:extistingUser.email,
                    username:extistingUser.username,
                    id:extistingUser.id,
                    token: token
                }
             })
            }
            else{
                return res.status(404).json({
                    message: "invalid creds",
                 })
            }
          
        }
        else{
            return res.status(404).json({
                message: "user not found",
             })
        }
        }
        catch(error)
        {
          return res.status(404).json({
             message: `${error}`
          })
        }
}


const createproject = async(req,res)=>{
    // validation part 
      const schema = z.object({
          name: z.string(),
          gitUrl: z.string()
      })
      const safeParseResult = schema.safeParse(req.body)
      const userId =req.user_id;
  
 
      if(safeParseResult.error) return res.status(400).json({
         error:safeParseResult.error
      })
      const {name,gitUrl} = safeParseResult.data
 
      // creating new project
      const project = await prisma.project.create ( {
         data: {
             name,gitUrl,subDomain:generateSlug(),userId
         }
      })
 
       return res.json({
         status:'success',data:{ project}
       });
 }
 



async function comparePasswords(password, hashedPassword) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hashedPassword, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  

  module.exports = {
    signin,
    signup,
    createproject
  }