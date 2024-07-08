const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient ( {
});


const particularproject = async(req,res) => {
    const projectId = req.params.projectId
    const project = await prisma.project.findUnique({
        where: {
           id:projectId
        },
        include: { user: true } // Include the user relationship   
   })
   if(!project){
      res.status(404).json({
        message:"no resource found such"
      });
   }
   else{
         res.status(201).json({
               name: project.name,
               gitUrl: project.gitUrl,
               subDomain:project.subDomain,
               user:{
                  username:project.user.username,
                  email:project.user.email
               }

         })
   }
}


module.exports={particularproject};