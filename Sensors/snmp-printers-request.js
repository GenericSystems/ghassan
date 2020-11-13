var snmp = require('net-snmp');
const nodemailer = require('nodemailer');

//var oids = [".3.6.1.2.1.43.8.2.1.12.1.1"];
var oids = ["1.3.6.1.2.1.43.8.2.1.12.1.1"];
oids = ["1.3.6.1.2.1.43.10.2.1.4.1.1", 
"1.3.6.1.2.1.43.5.1.1.17.1",
"1.3.6.1.2.1.43.11.1.1.9.1.1"
]; // Number of Copies + SERIAL
var msessions = [
    "192.168.2.10",
    "192.168.2.110",
    "192.168.2.111",
    "192.168.2.112",
    "192.168.4.5",
    "192.168.3.5",
    "192.168.5.7",
    "192.168.5.145",
    "192.168.6.7",
    "192.168.6.8",
    "192.168.7.4",
    "192.168.8.5",
    "192.168.9.7",
    "192.168.9.9",
    "192.168.10.5",
    "192.168.10.171"
];

var getSessionParams = function (Ip)
{
    console.log('Getting IP ', Ip);
    var session = snmp.createSession (Ip, "public");
    return new Promise(function(resolve, reject) {
        let obj = {
            serial: '',
            ip: Ip,
            counter: 0,
            blackInk: 0,
            error: ''
        };
        session.get (oids, function (error, varbinds) {
        
	    if (error) {
		console.log(error);
                reject (error);
                obj.error = error;
                responses.push(obj);
            } else {
                    obj.blackInk =  varbinds[2].value;
                    obj.serial = "" + varbinds[1].value;
                    obj.counter = varbinds[0].value;
                    responses.push(obj);
                    resolve (obj);
                }
	        });
		session.trap (snmp.TrapType.LinkDown, function (error) {
		if (error){
				console.log(error);
				obj.error = error;
                		responses.push(obj);
				console.log (error);
				reject (error);
                }
		});

    });
}

var sendmail = function(subject,obj, message) {
    console.log('Sending email ....');
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.googlemail.com', // Gmail Host
            port: 465, // Port
            secure: true, // this is true as port is 465
            auth: {
                user: 'ghassan.elnemr@ibdaalebanon.com', //Gmail username
                pass: 'g1y2k3h4c5elnemr' // Gmail password
            }
        });
        let recipients = 'itofficer@ibdaalebanon.com; servicesoperationscenter@ats.com.lb';
        // recipients = 'itofficer@ibdaalebanon.com';
        let mailOptions = {
            from: '"Ibdaa Mailer" <ghassan.elnemr@ibdaalebanon.com>',
            to: recipients, // Recepient email address. Multiple emails can send separated by commas
            subject: subject,
            text: message
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s to %s', info.messageId,recipients);
        });
    });
}
/*
for (var i = 0; i < msessions.length; i++)

    getSessionParams (msessions[i]).then((res)=>{
        console.log(res);
    }).catch((err)=>{
        console.log (`error getting ${msessions[i]}`);
    });
*/
let promises = [];
let responses = [];
for (var i = 0; i < msessions.length; i++){
    getSessionParams (msessions[i]).then(()=>
    {
       let responsesSorted = responses.sort(function (a, b) {
            return a.ip > b.ip;
          });
       var myJSON = JSON.stringify(responsesSorted);
	   console.log(myJSON);
       sendmail('testCounters',myJSON,myJSON);
    }
    ).catch((err)=>{
    	console.log('Error Getting ', msessions[i]);
    });
    //promises.push(getSessionParams (msessions[i]));
}
/*
Promise.all(promises).then(()=>
    {
       let responsesSorted = responses.sort(function (a, b) {
            return a.ip > b.ip;
          });
       var myJSON = JSON.stringify(responsesSorted);
	   console.log(myJSON);
       sendmail('testCounters',myJSON,myJSON);
    }
).catch((err)=>{
    console.log(err);
})
*/