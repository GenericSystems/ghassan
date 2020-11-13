const Net = require('net');
const nodemailer = require('nodemailer');
const http = require('http');
let storage=require('./storage');

// The port on which the server is listening.

const port = 1212;

var clients = [];

// Use net.createServer() in your code. This is just for illustration purpose.

// Create a new TCP server.

const server = new Net.Server();

// The server listens to a socket for a client to make a connection request.

// Think of a socket as an end point.
function sendSmsToContacts(obj, message){
    storage.getContacts('SmsContacts',obj.device_id).then((res)=>{
        console.log(res);
        res.forEach(element => {
            console.log(element.phone);
            sendSms(element.phone, message);
        });    
    });
}
function sendSms(number, message)
{
    let urlsms = `http://78.108.164.69:8080/websmpp/websms?user=userlogin&pass=userpasswordMM&sid=keyinhands&mno=961${number}&text=${message}&type=1&esm=0&dcs=8`;
    http.get(urlsms, (resp) => {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            console.log(data);
        });
    })
    .on("error", (err) => {
        console.log("Error: " + err.message);
    });
}
function sendmail(subject,obj, message) {
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.googlemail.com', // Gmail Host
            port: 465, // Port
            secure: true, // this is true as port is 465
            auth: {
                user: 'useraccount@mydomain.com', //Gmail username
                pass: '' // Gmail password
            }
        });
        let recipients = '';
        storage.getContacts('EmailContacts',obj.device_id).then((res)=>{
            console.log(res);
            res.forEach(element => {
                console.log(element.email);
                if (recipients.length > 0)
                    recipients += ',';
                recipients += element.email;
            });    
        

            let mailOptions = {
                from: '"Company Mailer" <useraccount@mydomain.com>',
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
    });
}

////

server.listen(port, function() {
    console.log(`Server listening for connection requests on socket localhost:${port}`);
});

server.on('connection', function(socket) {
    //console.log('A new connection has been established.');
    socket.name = socket.remoteAddress + ":" + socket.remotePort
    socket.Date = new Date();
    console.log(`Connection incoming from ${socket.name}`);
    socket.on('data', function(data) {
        let d = "'" + data.toString() + "'";
        d = data.toString();
        console.log(d);
        if (d.length > 4)
        {
            let obji = JSON.parse(data.toString());
            obji.time = new Date();
           storage.insert('Log',obji).then((ob)=>{
               console.log(ob);
            }).catch((err)=>{
                console.log('exception %s',err);});
// Check the values to decide from the mongo Db 
            storage.queryConfig('Params').then((res)=>{
                let tempthreshold = res.tempthreshold;
                let humidthreshold = res.humidthreshold;
                let timeNotif = res.timeNotif;
                let obj = JSON.parse(data.toString());
                let temp = obj.data.Temperature;
                let humid = obj.data.Humidity;
                let tempflag = (temp >= tempthreshold);
                let humidflag = (humid >= humidthreshold);
                let m2temp = ((new Date()).getTime() - res.temptimeNotif)/1000;
                let m2humid = ((new Date()).getTime() - res.humidtimeNotif)/1000;
                let tempnotifFlag = (m2temp > res.NbSecNotif);

                console.log(tempflag);
                if (tempflag)
                {
                    console.log(tempnotifFlag);
                    if (tempnotifFlag)
                    {
                        // then five minutes have elapsed .. Re-Notify !!
                        let message = `temperature =${obj.data.Temperature} / ${res.tempthreshold}\n
                        humidity is = ${obj.data.Humidity} / ${res.humidthreshold}`
                        console.log(message);
                        let subject = `Message from ${obj.device_id}`;
                        console.log('Sending Notif >>>>....');
                        sendmail(subject,obj, message);
                        let smsmessage = `${subject}\n${message}`;
                        // get the list of phones from database .. and loop over them
                        storage.getContacts('SmsContacts',obj.device_id).then((res)=>{
                            console.log(res);
                            res.forEach(element => {
                                console.log(element.phone);
                            });    
                        });
                        sendSmsToContacts(obj,smsmessage);
                        let values = {sensor: obj.device_id, 
                            temptimeNotif: (new Date()).getTime(),
                            tempNotif:obj.data.Temperature,
                            temphigh: 1
                         };
                        console.log (values);
                        storage.updateConfig(obj.device_id, values);
                    }
                    else
                    {
                        console.log(`reading temperature = ${obj.data.Temperature} \nhumidity is = ${obj.data.Humidity}\nCenter is = ${obj.device_id}`);
                    }
                }
                else {
                    // if already notified .. notify again that it is OK !!
                    if (res.temphigh)
                    {
                        let message = `temperature is = ${obj.data.Temperature} / ${res.tempthreshold}\nhumidity is = ${obj.data.Humidity} / ${res.humidthreshold}`
                        let subject = `Message from ${obj.device_id}`;
                        console.log('Sending Notif >>>>....');
                        sendmail(subject, obj, message);
                        let smsmessage = `${subject}\n${message}`;
                        // get the list of phones from database .. and loop over them
                        storage.getContacts('SmsContacts',obj.device_id).then((res)=>{
                            console.log(res);    
                        });
                        sendSmsToContacts(obj,smsmessage);
                        
                        let values = {sensor: obj.device_id, 
                            temptimeNotif: (new Date()).getTime(),
                            tempNotif:obj.data.Temperature,
                            temphigh: 0
                         };
                        console.log (values);
                        storage.updateConfig(obj.device_id, values);
                    }
                }
                // Humid
                if (humidflag)
                {
                    if (humidnotifFlag)
                    {
                        // then five minutes have elapsed .. Re-Notify !!
                        let message = `temperature = ${obj.data.Temperature} / ${res.tempthreshold}\nhumidity = ${obj.data.Humidity} / ${res.humidthreshold}`
                        let subject = `Message from ${obj.device_id}`;
                        console.log('Sending Notif >>>>....');
                        sendmail(subject, obj, message);
                        let smsmessage = `${subject}\n${message}`;
                        // get the list of phones from database .. and loop over them
                        storage.getContacts('SmsContacts',obj.device_id).then((res)=>{
                            console.log(res);    
                        });
                        sendSmsToContacts(obj,smsmessage);
                        
                        let values = {sensor: obj.device_id, 
                            humidtimeNotif: (new Date()).getTime(),
                            humidNotif:obj.data.Humidity,
                            humidhigh: 1
                         };
                        console.log (values);
                        storage.updateConfig(obj.device_id, values);
                    }
                    else
                    {
                        console.log(`reading temperature = ${obj.data.Temperature} \nhumidity is = ${obj.data.Humidity}\nCenter is = ${obj.device_id}`);
                    }
                }
                else {
                    // if already notified .. notify again that it is OK !!
                    if (res.humidhigh)
                    {
                        let message = `temperature = ${obj.data.Temperature} / ${res.tempthreshold}\nhumidity = ${obj.data.Humidity} / ${res.humidthreshold}`
                        let subject = `Message from ${obj.device_id}`;
                        console.log('Sending Notif >>>>....');
                        sendmail(subject, obj, message);
                        let smsmessage = `${subject}\n${message}`;
                        // get the list of phones from database .. and loop over them
                        storage.getContacts('SmsContacts',obj.device_id).then((res)=>{
                            console.log(res);    
                        });
                        sendSmsToContacts(obj,smsmessage);
                        
                        let values = {sensor: obj.device_id, 
                            humidtimeNotif: (new Date()).getTime(),
                            humidNotif:obj.data.Temperature,
                            humidhigh: 0
                         };
                        console.log (values);
                        storage.updateConfig(obj.device_id, values);
                    }
                }
                //
            }).catch(
                (err)=>{console.log("error");}
            );
           
        }
    });

    socket.on('end', function() {
        //console.log('Closing connection with the client');
    });
    socket.on('error', function(err) {
        console.log(`Error: ${err}`); 
    });
});