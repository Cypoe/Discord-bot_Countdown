const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json');

var deadline; //Due-Date!
const interval = 5 * 60000; //Change first number, there are in minutes!
let id; //Chanel ID to change!
let role1 = config.role1; //ID-Roles
let role2 =  config.role2;
let clockChannel;
let newmessage;
let prevName;

let t;
let timeinterval;

client.login(config.token);
client.on('debug',  console.log);

client.once('ready', () => {
    console.log('<3 logged in');
    
});

client.on('message', async message => {
    if (message.author.bot) return;//exit on bots own message
    //if( message.member.roles.cache.has(role1) || message.member.roles.cache.has(role2) ) {
    if(message.member.hasPermission('VIEW_AUDIT_LOG')) {
    // has one of the roles
        clockChannel = client.channels.cache.get(id);
        newmessage = message;
        //update channel, according to id;

        try {
            if (message.content.startsWith('!help')   ) { 
                // Instructions for setup
                message.channel.send("*Commands you can use*" + 
                "\n!ping                             |to see if the Bot is awake. " + 
                "\n!setid *channel-id*        |change which channel you want to be edited " + 
                "\n!settime *your date*     |to set your date (e.g. November 21 2020 09:00:00 PST)" + 
                "\n!timeleft                       |to see the remaining time " +
                "\n!reset                            |to reset the channel to it's original name and stop the clock." +
                "\n!weekly                        |stop the clock and change the channel name to WEEKLY-CHALLENGE." +
                "\n!rename                       |to rename the channel to a specific name" +
                "\n" + "\n Made by Cypoe")
                .catch(console.error);
            }


            if(message.content.startsWith("!setid")   ) {
                var oldId = id;

                id = message.content.slice(7);
                if(id == "") {
                    message.channel.send(   `ID can't be empty`   ).catch(console.error);
                    id = oldId;
                    return;
                }
                
                clockChannel = client.channels.cache.get(id);

                if (clockChannel != undefined) {
                    message.channel.send(   `Channel ${clockChannel.name} is now set as the timer`   ).catch(console.error);
                    prevName = clockChannel.name;
                } else {
                    message.channel.send(   `Channel not found, reverted back to old channel if there was one.`   ).catch(console.error);
                    id = oldId;
                    clockChannel = client.channels.cache.get(id);
                }
                deadline = undefined;
                clearInterval(timeinterval);
            }


            if ( message.content.startsWith('!settime')   ) {
                
                if (clockChannel != undefined) {
                    deadline = message.content.slice(9);
                    t = getTimeRemaining(deadline);
                    
                    if( isNaN(t.total) || t.days > 10000000 || deadline.length < 22) {
                        message.channel.send("Wups, something went wrong! Check your formatting, refer to !help \n(e.g. November 21 2020 09:00:00 PST) \n You typed: \n" + "```"+deadline+"```")
                        .catch(console.error);
                        console.log("Is invalid");
                        console.log(t);
                        clearInterval(timeinterval);
                        deadline;
                    } else {
                        if( t.total > 0 ) {
                            message.channel.send("Setting Clock! \n" + `Due in: 🕒 ${t.days}d ${t.hours}hrs ${t.minutes}min`)
                            .catch(console.error);
                            console.log(t);
                            clearInterval(timeinterval);
                            prevName = clockChannel.name;
                            console.log(prevName);
                            initializeClock(clockChannel, deadline, message);
                        } else {
                            message.channel.send("Time is already up or check your formatting, refer to !help \n(e.g. November 21 2020 09:00:00 PST) \n You typed: \n" + "```"+deadline+"```").catch(console.error);
                            console.log("Time is already up!");
                            console.log(t);
                            clearInterval(timeinterval);
                            deadline;
                        }
                    }
                } else {
                    message.channel.send(   `No channel set as clock yet, use !setid`   ).catch(console.error);
                    clearInterval(timeinterval);
                    deadline = undefined;
                }
            }


            if(message.content.startsWith('!timeleft')  ) {
                t = getTimeRemaining(deadline);

                if( isNaN(t.total) || t.days > 10000000 || deadline == undefined) {
                    message.channel.send("There is no clock running!").catch(console.error);
                } else {
                    if (t.total <= 0) {
                        message.channel.send("Time is already up").catch(console.error);
                    } else {
                        message.channel.send(  `Due in: 🕒 ${t.days}d ${t.hours}hrs ${t.minutes}min`   )
                        .catch(console.error);
                    }
                }
            }


            if(message.content.startsWith('!weekly')    ) {
                if (clockChannel != undefined) {

                    clockChannel.setName('WEEKLY CHALLENGE').catch(console.error);
                    message.channel.send("Set channel-name to WEEKLY-CHALLENGE").catch(console.error);  

                } else {
                    message.channel.send("No channel defined, use !setid").catch(console.error);
                }
                deadline == undefined;
                clearInterval(timeinterval);    //for good measure, so it doesn't run the clock again.
            }


            if(message.content.startsWith('!reset')     ) {
                if (clockChannel != undefined) {
                    clockChannel.setName(prevName);
                    message.channel.send(`Resetted channel-name to ${prevName}`).catch(console.error);
                } else {
                    message.channel.send(   `Channel not found or No channel defined, use !setid`   ).catch(console.error);
                }
                
                clearInterval(timeinterval);    //for good measure, so it doesn't run the clock again.
                deadline = undefined;
            }


            if(message.content.startsWith("!rename")   ) {
                var rename = message.content.slice(8);

                if (clockChannel != undefined) {

                    if(rename == "") {
                        message.channel.send(   `Channel name can't be empty`   );
                        return;
                    } else {
                        try {
                            await clockChannel.setName(rename)
                            .then(
                                function() {     message.channel.send(`Renamed the channel ${prevName} to ${rename}`);    },
                                function() {     message.channel.send(`Too many Requests!` + error.message);    }
                            ).catch(console.log);
                        } catch(err) {
                            console.log("THIS WAS INTENTIONAL" + err);
                            message.channel.send(`Too many Requests!` + err.message);
                        }
                    }
                } else {
                    message.channel.send(`Couldn't rename, there is no clock-channel set! Use !setid`);
                }
                clearInterval(timeinterval);
            }


            if (message.content.startsWith('!ping')     ) {
                // send back "Pong." to the channel the message was sent in
                message.channel.send("poug")          
                .catch(console.error);
            }

        } catch (err) {
            catchErr(err, message);
        }
    } 
});

function catchErr (err, message) {
    message.channel.send("There was an error");
    message.channel.send("ERROR:```" + err + "```");
}

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

function getTimeRemaining(endtime) {
    const total = Date.parse(endtime) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
}

function initializeClock(ch, endtime, message) {
    timeinterval;

    function updateClock() {
        console.log('UpdatedClock');
        t = getTimeRemaining(endtime);
        console.log(t);

        if( isNaN(t.total) == false) {
             if (t.total <= 0) {
                clearInterval(timeinterval);

                //Update Channel Name
                ch.setName(`(╯°□°）╯TIME IS UP!`).catch(console.error);
                setTimeout(function(){ ch.setName(prevName) }, 5 * 60000); //Timeout to change it back in minutes
                console.log("Updated channel name to time UP");
            } else {
                //message.channel.send(`\n🕒 ${t.days}d ${t.hours}hrs ${t.minutes}min`   )
                //.then(msg => {msg.delete({ timeout: 10000 })})
                //.catch(console.error);
                //message.delete({ timeout: 10000}).catch(console.error);
                //console.log(id); 
                
                ch.setName( `🕒 Due in: ${t.days}d ${t.hours}hrs ${t.minutes}min`).catch(console.error);//Update Channel Name
                console.log("Updated channel name - timer");
                
            }
        }  
    } 
    updateClock(); 
    timeinterval = setInterval(updateClock, interval);
}