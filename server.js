const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const shortid = require('shortid-36')

const app = express()

app.use(express.json())
app.use(cors())

const db = mysql.createConnection({
  user: "root",
  password: "207055Ff",
  host: "34.70.147.174",
  port: "3306",
  database: "LuckyUsers",
})




app.post('/checkreferralcode', (req,res) => {

  const referralCode = req.body.referrer

  db.query("SELECT * FROM users WHERE referralcode = ?",[referralCode],
       (err,result) => { 

     if(err){
    console.log("Error occured while executing query: ",err)
    res.send({message: "Error occured while executing query"})
}else{
    if (result.length === 0) {
      res.send({message: "Invalid referral link!"})
    } else {
      res.send({message: "available"})
    }
}
  })
})





const cas = "WHEN groupsales >= 1501 THEN '43' WHEN groupsales >= 501 THEN '42' WHEN groupsales >= 101 THEN '40' WHEN groupsales >= 51 THEN '35' WHEN groupsales >= 11 THEN '30' WHEN groupsales >= 0 THEN '25'";




app.post('/crossmintwebhook', (req,res) => {

  
 console.log("receiving data")
 console.log("req", req.body)


  const Args = req.body.passThroughArgs;
  console.log("str args", Args)

  const args = JSON.parse(Args);
  console.log("obj args", args)

  const referralCode = args.referrer
  const price = args.price

  console.log(price)
  console.log(referralCode)

  let rulesArray = [25, 30, 35, 40, 42, 43]
  let txArray = []


     //plus upline group sales & referrer's
    db.query(`UPDATE users SET groupsales = groupsales + 1 WHERE referralcode IN (SELECT upline FROM ${referrer}upline)`)
    db.query("UPDATE users SET groupsales = groupsales + 1 WHERE referralcode = ?", [referrer])
    //select referrer %
    db.query(`SELECT groupsales, CASE ${cas} END AS percent FROM users WHERE referralcode = ?`, [referrer],
    (err,result) => {

      if(err){
    console.log(err)
    
     }else{

    const referrerPercent = result[0].percent  
    const claimable =  price * referrerPercent /100

    //plus referrer's mintreferrals +1
    db.query("UPDATE users SET mintreferrals = mintreferrals + 1 WHERE referralcode = ?",
    [referrer])

    //plus direct sales claimable amount
    db.query("UPDATE users SET claimable = claimable + ? WHERE referralcode = ?",
    [claimable, referrer])

  const updateClaimable = () => {
  
      let actualPercentageArr = [25,   5,    5,     5,     2,     1]
      let percentageArr       = [25,   30,   35,    40,    42,   43]

      let bonus = 0


     let start = percentageArr.indexOf(Number(referrerPercent))
     
    for(var i = start+1; i < txArray.length; i++) {

    if(txArray[i] == 'x') {

      bonus += actualPercentageArr[i]
    } else {

     const claimable = (price * (actualPercentageArr[i] + bonus) /100)
      db.query("UPDATE users SET claimable = claimable + ? WHERE referralcode = ?",
        [claimable, txArray[i]])
          if (bonus > 0) {
          bonus = 0        
        }

      }

    }}


const getArr = async () => {
  const promises = [];

  for (var i = 0; i < rulesArray.length; i++) {
    await position(i);
  }
  await Promise.all(promises).then(() => {
      // this .then() handler is only here to we can log the final result
      updateClaimable();
      console.log(txArray)
     
  });;
}

const position = async (i) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT MIN(groupsales) AS salesz FROM (
      SELECT referralcode, groupsales, CASE ${cas} END AS percentage FROM (SELECT referralcode, groupsales FROM users
      join ${referrer}upline on users.referralcode = ${referrer}upline.upline) getpercent)abc WHERE percentage = ${rulesArray[i]}`,
      (err, result) => {

        if (err) {
          reject(err);
        }

        if (result[0].salesz == null) {
          txArray.push("x");
          resolve();
        } else {
          const sales = result[0].salesz;
          db.query(
            `SELECT referralcode, groupsales FROM users join ${referrer}upline ON users.referralcode =  ${referrer}upline.upline WHERE groupsales = ?
            ORDER BY id DESC limit 1`,
            [sales],
            async (err, result) => {
              if (err) {
                reject(err);
              }
              txArray.push(result[0].referralcode);
              
              resolve();
            }
          );
        }
      }
    );
  });
};



getArr()
   
    
   }
})
 })





//main
app.post('/addClaimable', (req,res) => {

  const referrer = req.body.referrer
  const price = req.body.price

  let rulesArray = [25, 30, 35, 40, 42, 43]
  let txArray = []


     //plus upline group sales & referrer's
    db.query(`UPDATE users SET groupsales = groupsales + 1 WHERE referralcode IN (SELECT upline FROM ${referrer}upline)`)
    db.query("UPDATE users SET groupsales = groupsales + 1 WHERE referralcode = ?", [referrer])
    //select referrer %
    db.query(`SELECT groupsales, CASE ${cas} END AS percent FROM users WHERE referralcode = ?`, [referrer],
    (err,result) => {

      if(err){
    console.log(err)
    
     }else{

    const referrerPercent = result[0].percent  
    const claimable =  price * referrerPercent /100

    //plus referrer's mintreferrals +1
    db.query("UPDATE users SET mintreferrals = mintreferrals + 1 WHERE referralcode = ?",
    [referrer])

    //plus direct sales claimable amount
    db.query("UPDATE users SET claimable = claimable + ? WHERE referralcode = ?",
    [claimable, referrer])

  const updateClaimable = () => {
  
      let actualPercentageArr = [25,   5,    5,     5,     2,     1]
      let percentageArr       = [25,   30,   35,    40,    42,   43]

      let bonus = 0


     let start = percentageArr.indexOf(Number(referrerPercent))
     
    for(var i = start+1; i < txArray.length; i++) {

    if(txArray[i] == 'x') {

      bonus += actualPercentageArr[i]
    } else {

     const claimable = (price * (actualPercentageArr[i] + bonus) /100)
      db.query("UPDATE users SET claimable = claimable + ? WHERE referralcode = ?",
        [claimable, txArray[i]])
          if (bonus > 0) {
          bonus = 0        
        }

      }

    }}


const getArr = async () => {
  const promises = [];

  for (var i = 0; i < rulesArray.length; i++) {
    await position(i);
  }
  await Promise.all(promises).then(() => {
      // this .then() handler is only here to we can log the final result
      updateClaimable();
      console.log(txArray)
     
  });;
}

const position = async (i) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT MIN(groupsales) AS salesz FROM (
      SELECT referralcode, groupsales, CASE ${cas} END AS percentage FROM (SELECT referralcode, groupsales FROM users
      join ${referrer}upline on users.referralcode = ${referrer}upline.upline) getpercent)abc WHERE percentage = ${rulesArray[i]}`,
      (err, result) => {

        if (err) {
          reject(err);
        }

        if (result[0].salesz == null) {
          txArray.push("x");
          resolve();
        } else {
          const sales = result[0].salesz;
          db.query(
            `SELECT referralcode, groupsales FROM users join ${referrer}upline ON users.referralcode =  ${referrer}upline.upline WHERE groupsales = ?
            ORDER BY id DESC limit 1`,
            [sales],
            async (err, result) => {
              if (err) {
                reject(err);
              }
              txArray.push(result[0].referralcode);
              
              resolve();
            }
          );
        }
      }
    );
  });
};



getArr()
   
    
   }
})
 })







const mailformat = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

app.post('/register', (req,res) => {

  const email = req.body.email 
  const password = req.body.password
  const referrer = req.body.referrer
  const referralCode = shortid.generate()
  let loginResult



  if(email == '') {
    res.send({message: "Missing email"})
  }  else if (password == '') {
    res.send({message: "Missing password"})
  } else if(referrer == '') {
    res.send({message: "Missing referral code"})
  } else if (email.match(mailformat) == null){
    res.send({message: "Invalid email format"})
  }else {
    db.query("SELECT * FROM users WHERE email = ?",[email],
    (err,result) => {
      if(err){
    console.log(err)
    
     }else{
      if (result.length == 0) {

      db.query("SELECT * FROM users WHERE referralcode = ?", [referrer],
       (err,result) => { 
        

          if (result.length == 0) {
          res.send({message: "Referral code does not exist."})
          } 

          else {
               db.query("INSERT INTO users (email, password, referrercode, referralcode) VALUES(?,?,?,?)", 
                          [email, password, referrer, referralCode])
                          //+1 referral sign up to upline's 
                          db.query("UPDATE users SET signupreferrals = signupreferrals + 1 WHERE referralcode = ?",
                            [referrer])
                          //createuplinetable and populate with upline's upline table
                          db.query(`CREATE TABLE ${referralCode}upline (upline varchar(255))`)                  
                          db.query(`INSERT INTO ${referralCode}upline SELECT * FROM ${referrer}upline`)
                           //add upline referralcode into your upline table
                          db.query(`INSERT INTO ${referralCode}upline (upline) VALUES(?)`, [referrer], () => {
                            res.send({message: "Registration successful. Please Login."})
                          })                         
                          
                       } 
          }) }else {
        res.send({message: "User already exists. Please login."})
      }

     }
      
    })
        }

      })


app.post('/login', (req,res) => {
  const email = req.body.email 
  const password = req.body.password

  if(email == '') {
    res.send({message: "Missing email"})
  } else if (password == '') {
    res.send({message: "Missing password"})
  }  else if (email.match(mailformat) == null) {
    res.send({message: "Invalid email format"})
  } else {
  db.query(
    "SELECT * FROM users WHERE email = ? ",
    [email], (err, result) => {

       if(err){
    console.log(err)
    
     }else{

      if(result.length == 0) {
        res.send({message: "Invalid user"})
      } else {

        db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
      if(err) {
        console.log(err)
      }

      if(result.length == 0) {
        res.send({message: "Wrong email / password combination"}) 
      } else {
        res.send(result)       
      }
    })     
      }
     }     
    })
  }})



app.post('/refData', (req,res) => {
  const referralCode = req.body.refCode

//view tree

  db.query(
    "SELECT * FROM LuckyUsers.users AS u LEFT JOIN LuckyUsers.users AS s on s.referrercode = u.referralcode WHERE s.referrercode = ?",
    [referralCode],
    (err, result) => {
      if(err) {
        res.send({err: err})
      }

      if(result.length > 0) {
        res.send(result)
      } else {
        res.send({message: "no Referral signups yet"})
      }
    })
})







db.connect(function(err){

if(!err) {
    console.log("Database is connected ... ");    
} else {
    console.log(err);    
}})



app.listen(3306, ()=> console.log('api running on 3306'))
