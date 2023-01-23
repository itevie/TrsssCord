const Discord = require("./src/index.js");

const client = new Discord.Client({
    intents: [
        Discord.Intents.Guilds,
        Discord.Intents.GuildMessages,
        Discord.Intents.MessageContent
    ]
});

client.on("ready", () => {
    console.log("Client ready!")
});

client.on("messageCreate", (message) => {
    if (!message.content.startsWith("%")) return;
    if (message.author.bot) return;

    let play = message.content.slice(1);
    if (play != "rock" && play != "paper" && play != "scissors")
        return message.reply("Please select rock paper or scissors");

    let botPlay = Math.floor(Math.random() * 3);

    if (botPlay == 0) botPlay = "paper";
    else if (botPlay == 1) botPlay = "rock";
    else if (botPlay == 2) botPlay = "scissors";

    let result = null;
    if (play == botPlay) result = "it is a tie";
    else if (
        (play == "paper" && botPlay == "rock") ||
        (play == "rock" && botPlay == "scissors") ||
        (play == "scissors" && botPlay == "paper")
    ) result = "you win";
    else result = "I win";

    let toSend = "You played **" + play + "** and I played **" + botPlay + "**, this means that " + result;
    return message.reply(toSend);
});

client.login("MTA0ODYyMTg5NTE3NzczMjA5Nw.GfbV_-.egGxLDnq1yCzLHC1myzdQRerMNo5b_QP3h3RQs")