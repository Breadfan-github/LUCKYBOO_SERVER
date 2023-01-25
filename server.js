const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const shortid = require('shortid-36')
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({credentials: true, origin: ['https://app.lucky.boo', 'http://localhost:3000']}));

const db = mysql.createConnection({
  user: "root",
  password: "207055Ff",
  host: "34.27.116.143",
  port: "3306",
  database: "LuckyUsers",
})







// These id's and secrets should come from .env file.
const CLIENT_ID = '756289747704-uupaqil634c9jqtan712qcop0upjbjni.apps.googleusercontent.com';
const CLEINT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//041b509lXSPNfCgYIARAAGAQSNwF-L9IrEecZPl1Ljlbr_Cqg9iCG8C_JwuokQv2Bs5WM4rGo9T1P008JZ5ElFGPhJk6uEK8pkw4';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendVerifyMail(hash, email) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'luckyboonoreply@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'luckyboo-no-reply <luckyboonoreply@gmail.com>',
      to: email,
      subject: '[LUCKY] Verify your Lucky Affiliate Account.',
      text:  `Dear ${email},

Before you can start with us, you need to verify your email address. Click on the link below to verify your account.

http://localhost:3000/verifysignup/?token=${hash} 

Thanks, The Lucky Team`,
      html: `<h4> Dear ${email} </h4>,

<p> Before you can start with us, you need to verify your email address. <p/>
<p>  Click on the link below to verify your account. <p/>

<p>http://localhost:3000/verifysignup/?token=${hash} <p/>

<p> Thanks, The Lucky Team <p/>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

async function sendPasswordMail(hash, email) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'luckyboonoreply@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'luckyboo-no-reply <luckyboonoreply@gmail.com>',
      to: email,
      subject: '[LUCKY] Reset Password for Lucky Affiliate Account.',
      text:  `Dear ${email},

You have requested to reset your password. Please click on the link below to proceed.

http://localhost:3000/resetpassword/?token=${hash} 

Thanks, The Lucky Team`,
      html: `<h4> Dear ${email} </h4>,

<p> You have requested to reset your password.  <p/>
<p>  Please click on the link below to proceed. <p/>

<p>http://localhost:3000/resetpassword/?token=${hash} <p/>

<p> Thanks, The Lucky Team <p/>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}




app.post('/set-refcookie', (req,res) => {

  const ref = req.body.ref
  res.cookie('LuckyRef', ref)
  res.send(req.cookie)

})


app.get('/get-refcookie', (req,res)=> {
  res.send(req.cookies)
})


app.post('/resetclaimable', (req,res) => {
  console.log("reset claim api called")
  const email = req.body.referrer
  db.query("UPDATE users SET claimable = 0 WHERE email = ?", [email], 
    (err, result) => {
      if(err) {
        console.log(err)
      }
    })

})

app.post('/checkreferralcode', (req,res) => {

  const referralCode = req.body.referrer


  db.query("SELECT * FROM users WHERE referralcode = ?",[referralCode],
       (err,result) => { 

     if(err){
    console.log("Error occured while executing query: ",err)
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


  const Args = req.body.passThroughArgs;
  const parsedArg = JSON.parse(JSON.parse(Args));


  const referrer = parsedArg.referrer
  const price = parsedArg.price

  let rulesArray = [25, 30, 35, 40, 42, 43]
  let txArray = []


     //plus upline group sales & referrer's
    db.query(`UPDATE users SET groupsales = groupsales + 1 WHERE referralcode IN (SELECT upline FROM ${referrer}upline)`)
    db.query("UPDATE users SET groupsales = groupsales + 1 WHERE referralcode = ?", [referrer])

     db.query("SELECT CURRENT_TIMESTAMP", (err,result)=>{
      const _date = result[0].CURRENT_TIMESTAMP

      db.query("INSERT INTO globalsales (referrercode, price, date) VALUES (?,?,?)", [referrer, price, _date], (err, result)=> {
        if(err){
          console.log(err)
        }
      })
    })
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
     db.query(`INSERT INTO ${referrer}sales (referralcode, percentage, claimable) VALUES(?,?,?)`, [referrer, referrerPercent, claimable])

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
      db.query(`INSERT INTO ${txArray[i]}sales (referralcode, percentage, claimable) VALUES(?,?,?)`, [referrer, actualPercentageArr[1]+bonus, claimable])
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

        db.query("SELECT CURRENT_TIMESTAMP", (err,result)=>{
      const _date = result[0].CURRENT_TIMESTAMP

      db.query("INSERT INTO globalsales (referrercode, price, date) VALUES (?,?,?)", [referrer, price, _date], (err, result)=> {
        if(err){
          console.log(err)
        }
      })
    })

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

     db.query(`INSERT INTO ${referrer}sales (referralcode, percentage, claimable) VALUES(?,?,?)`, [referrer, referrerPercent, claimable])




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
      db.query(`INSERT INTO ${txArray[i]}sales (referralcode, percentage, claimable) VALUES(?,?,?)`, [referrer, actualPercentageArr[1]+bonus, claimable])
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

app.post('/getsales', (req,res)=> {
 const referralCode = req.body.referralcode

 db.query(`SELECT * FROM ${referralCode}sales`, (err, result) => {
  if(err) {
    console.log(err)
  } else {
     if (result.length == 0) {
        res.send({message: "no sales"})
      } else {
        res.send(result)
      }
  }
 })
})

app.post('/forgetpassword', (req,res)=> {

  const email = req.body.email 

  let hash1 = shortid.generate()
  let hash2 = shortid.generate()
  let hash3 = shortid.generate()
  const verifyHash = hash1.concat(hash2, hash3)

  db.query(
    "SELECT * FROM users WHERE email = ? ",
    [email], (err, result) => {

       if(err){
    console.log(err)
    
     }else{

      if(result.length == 0) {
        res.send({message: "User does not exist. Please create an account!"})
      } else if (result[0].status !== 'active') {
        res.send({message: "Please verify your email first."})
      } else {

        db.query("SELECT * FROM verifyresetpassword WHERE email = ?", [email], (err,result) => {
          if(result.length == 0) {
             db.query("INSERT INTO verifyresetpassword (hash, email) VALUES (?,?)", [verifyHash, email], (err, result) => {
          if (err) {
            console.log(err)
          } else {
            sendPasswordMail(verifyHash, email)
            res.send({message: "success"})
          }

        })

          }else {
             db.query("UPDATE verifyresetpassword SET hash = ? WHERE email = ?", [verifyHash, email], (err, result) => {
          if (err) {
            console.log(err)
          } else {
            sendPasswordMail(verifyHash, email)
            res.send({message: "success"})
          }

        })

          }
        })
       
      }
    }
  })
})

app.post('/verify-resetpassword', (req,res) => {
  const verifyHash = req.body.verifyHash

  db.query("SELECT * FROM verifyresetpassword WHERE hash = ?", [verifyHash], (err,result) => {
    if(err) {
      console.log(err)
    } else {

      if(result.length == 0) {
        res.send({message:"User does not exist / already used token."})
      } else {
        res.send(result)

      }
      

    }
  })

})

app.post('/resetpassword', (req,res) => {
  const email = req.body.email
  const password = req.body.password

  db.query("UPDATE users SET password = ? WHERE email = ?", [password, email], (err,result) => {
    if(err) {
      console.log(err)
    } else {
      if(result.length === 0) {
        res.send({message:"User does not exist"})
      } else {
        db.query("DELETE FROM verifyresetpassword WHERE email = ?", [email], (err,result) => {
          if(err) {
            console.log(err)
          } else {
            res.send({message: "success"})
          }
          
        })
        
      }
    }
  })

})



app.post('/register', (req,res) => {

  const email = req.body.email 
  const password = req.body.password
  const referrer = req.body.referrer
  const referralCode = shortid.generate()

  let hash1 = shortid.generate()
  let hash2 = shortid.generate()
  let hash3 = shortid.generate()
  const verifyHash = hash1.concat(hash2, hash3)


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
                          //createuplinetable and populate with upline's upline table + downline
                          db.query(`CREATE TABLE ${referralCode}upline (upline varchar(255))`) 

                          db.query(`CREATE TABLE ${referralCode}downline (downline varchar(255))`) 
                          db.query(`CREATE TABLE ${referralCode}sales (id INT AUTO_INCREMENT NOT NULL, referralcode varchar(255) not null, percentage INT not null, claimable FLOAT not null, PRIMARY KEY(id))`) 

                           db.query(`SELECT * FROM ${referrer}upline`, (err, result)=> {
                            if (err) {
                              console.log(err)

                            } else {    
                            

                              for(var i = 0; i < result.length; i++) {

                                db.query(`INSERT INTO ${result[i].upline}downline (downline) VALUES(?)`, [referralCode]) 
                              }
                            } 
                           }) 
                           
                           db.query(`INSERT INTO ${referrer}downline (downline) VALUES(?)`, [referralCode]) 

                          // loop?
                          // db.query(`INSERT INTO (select * from ${referrer}upline) downline`)  

                          db.query(`INSERT INTO ${referralCode}upline SELECT * FROM ${referrer}upline`)
                           //add upline referralcode into your upline table
                          db.query(`INSERT INTO ${referralCode}upline (upline) VALUES(?)`, [referrer]) 

                          db.query("INSERT INTO verifysignup (hash, email) VALUES(?,?)", [verifyHash, email], (err, result) => {
                            sendVerifyMail(verifyHash, email)
                            res.send({message: "success"})

                          })                        
                       } 
          }) }else {
        res.send({message: "User already exists. Please login."})
      }

     }
      
    })
        
      })

app.post('/verify-signup', (req,res) => {
  const verifyHash = req.body.verifyHash

  db.query("SELECT * FROM verifysignup WHERE hash = ?", [verifyHash], (err,result) => {
    if(err) {
      console.log(err)
    } else {

      if(result.length === 0) {
        res.send({message:"Token has expired / already verified."})
      } else {
        const email = result[0].email
       db.query(
    "UPDATE users SET status = 'active' WHERE email = ?", [email], (err, result) => {
      if(err) {
        console.log(err)
      } else {
        db.query("DELETE FROM verifysignup WHERE email = ?", [email], (err, result) => {

          if(err) {
            console.log(err)
          } else {
            res.send({message: "verify successful."})   
          }
        })
       
      }
    })

      }
      

    }
  })

})


app.post('/resend-verifysignup', (req, res) => {
  const email = req.body.email

  let hash1 = shortid.generate()
  let hash2 = shortid.generate()
  let hash3 = shortid.generate()
  const verifyHash = hash1.concat(hash2, hash3)

  db.query("UPDATE verifysignup SET hash = ? WHERE email = ?", [verifyHash, email], (err, result) => {
    if(err) {
      console.log(err)
    } else {
      sendVerifyMail(verifyHash, email)
      res.send({message: "sent"})
      
    }
  })
})

app.get('/get-logincookie', (req,res)=> {
  res.send(req.cookies)
})

app.post('/cookie-login', (req,res) => {
  const sessionID = req.body.sessionID

  db.query("SELECT * FROM loginsessions WHERE sessionid = ?", [sessionID], (err,result) => {
    if(err) {
      console.log(err)
    } else {
      const id = result[0].accountid
       db.query(
    "SELECT id, email, referralcode, referrercode, signupreferrals, mintreferrals, groupsales, claimable FROM users WHERE id = ?",
    [id], (err, result) => {
      if(err) {
        console.log(err)
      } else {
        res.send(result)   
      }
    })

    }
  })
})

app.get('/del-login', (req,res) => {
  res.clearCookie('LuckySession')
  res.send("cookie deleted")
})

// app.get('/del-ref', (req,res) => {
//   res.clearCookie('LuckyRef')
//   res.send("cookie deleted")
// })

app.post('/login', (req,res) => {
  const email = req.body.email 
  const password = req.body.password
  const rememberLogin = req.body.rememberLogin

  db.query(
    "SELECT * FROM users WHERE email = ? ",
    [email], (err, result) => {

       if(err){
    console.log(err)
    
     }else{

      if(result.length == 0) {
        res.send({message: "User does not exist. Please create an account!"})
      } else if (result[0].status !== 'active') {
        res.send({message: "Please verify your email first."})
      } else {
        db.query(
    "SELECT id, email, referralcode, referrercode, signupreferrals, mintreferrals, groupsales, claimable FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
      if(err) {
        console.log(err)
      } else {

        if(result.length == 0) {
        res.send({message: "Wrong email / password combination"}) 
      } else {

        if (rememberLogin) {

          const loginData = result
          const id = result[0].id
          const id1 = shortid.generate()
          const id2 = shortid.generate()
          const sessionID = id1.concat(id2)
         

          
          db.query("INSERT INTO loginsessions (accountid, sessionid) VALUES(?,?)", [id, sessionID], (err, result)=> {
            if(err) {
              console.log(err)
            } else {
              
              
              res.cookie('LuckySession', sessionID)
              res.send(loginData)
              
            }
          })
         
        }
         else {
          res.send(result)   
        }
            
      }

      }

     
    })     
      }
     }     
    })
  })



// app.post('/refData', (req,res) => {
//   const referralCode = req.body.refCode
// 
// //view tree
// 
//   db.query(
//     "SELECT * FROM LuckyUsers.users AS u LEFT JOIN LuckyUsers.users AS s on s.referrercode = u.referralcode WHERE s.referrercode = ?",
//     [referralCode],
//     (err, result) => {
//       if(err) {
//         res.send({err: err})
//       }
// 
//       if(result.length > 0) {
//         res.send(result)
//       } else {
//         res.send({message: "no Referral signups yet"})
//       }
//     })
// })

app.post('/getgroup', (req, res) => {
  const referralCode = req.body.referralCode

  db.query(`SELECT id, referralcode, signupreferrals, mintreferrals, groupsales FROM users WHERE referralcode IN (select * from ${referralCode}downline)`, (err, result)=> {
    if(err) {
       console.log(err)
    } else { 
      if (result.length == 0) {
        res.send({message: "no group"})
      } else {
        res.send(result)
      }
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
