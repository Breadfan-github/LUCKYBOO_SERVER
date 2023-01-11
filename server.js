const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const shortid = require('shortid')

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


app.post('/webhook', (req,res) => {
  const whPassThroughArgs = req.body.whPassThroughArgs
  const args = JSON.parse(whPassThroughArgs);
  const referralCode = args.referral
  const amount = args.amount

  console.log(args)

  db.query(
    "INSERT INTO crossmintusers (referralcode, amount) VALUES (?,?)", 
    [referralCode, amount], 
    (err, result) => {
      if(err) {
        console.log(err)
      } else {
        console.log(result)
      }
      
    })
})



const mailformat = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

app.post('/register', (req,res) => {

  const email = req.body.email 
  const password = req.body.password
  const referrer = req.body.referrerCode
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
      if (result.length == 0) {

      db.query("SELECT * FROM users WHERE referralCode = ?",[referrer],
       (err,result) => { 
          if (result.length == 0) {
          res.send({message: "Referral code does not exist."})
          } else {
               db.query(
                    "INSERT INTO users (email, password, referrercode, referralcode) VALUES(?,?,?,?)", 
                    [email, password, referrer, referralCode],
                    (err, result)=> {
                      if(err) {
                          console.log(err)
                        } else {
                          db.query(
                            "UPDATE users SET signupreferralcount = signupreferralcount + 1 WHERE referralcode = ?",
                            [referrer]
                            )
                          res.send({message: "Registration successful. Please Login."})
                          }
                        })} 
          }
   ) }else {
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

app.post('/mintref', (req,res) => {
  const refCode = req.body.referralCode
  const amount = req.body.mintAmount

  db.query(
    "UPDATE users SET signupreferralcount = mintreferralcount + ? WHERE referralcode = ?",
    [amount, refCode]
    )
})


app.post('/refData', (req,res) => {
  const referralCode = req.body.refCode

  db.query(
    "SELECT DISTINCT * FROM logindatabase.users AS u INNER JOIN logindatabase.users AS s on s.referrercode = u.referralcode WHERE s.referrercode = ?",
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
