const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.prod' });

// Create a connection
const connection = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
}).promise();


const newRecord = async (myUUID, subDomain) => {
    const query = 'INSERT INTO deployment (id, subdomain, status) VALUES (?, ?, ?)';
    const values = [myUUID, subDomain, 'PENDING'];
    const [results] = await connection.query(query, values);
    return results;
};

const updateRecord = async(myUUID,status) =>{
    const query = 'UPDATE deployment set status=? where id=?';
    const values= [status,myUUID]
    const [results] = await connection.query(query,values);
    return results;
}

const getRecord = async(myUUID)=>{
   const query='SELECT * FROM deployment where id=?';
   const values = [myUUID]
   const [result] = await connection.query(query,values);
   return result;
}


module.exports={
    newRecord,getRecord,updateRecord
};