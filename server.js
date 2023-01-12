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


// app.post('/webhook', (req,res) => {
//   const whPassThroughArgs = req.body.whPassThroughArgs
//   const args = JSON.parse(whPassThroughArgs);
//   const referralCode = args.referral
//   const amount = args.amount
// 
//   console.log(args)
// 
//   db.query(
//     "INSERT INTO users (referralcode, amount) VALUES (?,?)", 
//     [referralCode, amount], 
//     (err, result) => {
//       if(err) {
//         console.log(err)
//       } else {
//         console.log(result)
//       }
//       
//     })
// })

app.post('/checkreferralcode', (req,res) => {
  const referralCode = req.body.referrer

  db.query("SELECT * FROM users WHERE referralCode = ?",[referralCode],
       (err,result) => { 
          if (result.length === 0) {
          res.send({message: "Invalid referral link!"})
          } else {
            res.send({message: "available"})
          }
  })
})

const cas = "WHEN groupsales >= 1501 THEN '43' WHEN groupsales >= 501 THEN '42' WHEN groupsales >= 101 THEN '40' WHEN groupsales >= 51 THEN '35' WHEN groupsales >= 11 THEN '30' WHEN groupsales >= 0 THEN '25'";



app.post('/checkreferrerDIRECTpercent', (req,res) => {
  req.connection.setTimeout( 1000 * 60 * 10 ); // ten minutes
  const referrer = req.body.referrer
  const amount = req.body.amount
  const price = req.body.price


  db.query(`SELECT groupsales, CASE ${cas} END AS percent FROM users WHERE referralcode = ?`, [referrer],
    (err,result) => {


    let data = JSON.stringify(result[0].percent)
    let numData = data.replace(/"/g, "");

    console.log("amount", amount)
    console.log("price", price)
    console.log("numData", numData)
    
    
    const claimable = amount * price * numData /100
    console.log(claimable)



    //plus upline group sales and sendiri amount all +1, maybe return as an array and loop? or 

    // plus mintreferrals +1
    db.query(
    "UPDATE users SET mintreferrals = mintreferrals + ? WHERE referralcode = ?",
    [amount, referrer]
    )


    //plus direct sales claimable amount
    db.query(
    "UPDATE users SET claimable = claimable + ? WHERE referralcode = ?",
    [claimable, referrer]
    )

    //return upline's referralcode / percentage
    db.query(
     `SELECT referralcode, CASE ${cas} END AS percentage FROM ( 
          SELECT referralcode, groupsales FROM users
          JOIN ${referrer}upline ON users.referralcode = ${referrer}upline.upline) getpercent;`, 
          (err, result) => {
            console.log(result)
          }
    )

     


    //select referrer upline branch, descending by mint referrals and sorting/join by rank and percent. 

    //



    })
})


app.post('/addclaimable', (req,res) => {
  const claimable = req.body.claimable
  const referrer = req.body.refCode

  db.query("UPDATE users SET claimable = claimable + ? WHERE referralcode = ?", [claimable, referrer],
    (err,result) => {

      if(result.length > 0) {
        res.send(result)   
      } else {
        res.send({message: "no user"})
      }
    })
  
})










const mailformat = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

app.post('/register', (req,res) => {
  console.log("register call")

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
console.log("register call2")
    db.query("SELECT * FROM users WHERE email = ?",[email],
    (err,result) => {
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

  )
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

      if(result.length == 0) {
        res.send({message: "No such user!"})
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
    })
  }})


// app.post('/referral', (req,res) => {
//   const referralCode = req.body.referralCode
// 
//   db.query(
//     "SELECT walletaddress FROM users WHERE referralcode = ?",
//     [referralCode],
//     (err, result) => {
//       if(err) {
//         res.send({err: err})
//       }
// 
//       if(result.length > 0) {
//         res.send(result)
//       } else {
//         res.send({message: "fetch wallet fail"})
//       }
//     })
// })



app.post('/refData', (req,res) => {
  const referralCode = req.body.refCode

  db.query(
    "SELECT DISTINCT * FROM LuckyUsers.users AS u INNER JOIN LuckyUsers.users AS s on s.referrer = u.referralcode WHERE s.referrer = ?",
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
