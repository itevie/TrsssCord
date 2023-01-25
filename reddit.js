const Discord = require("./src/index.js");
const RIF = require("reddit-image-fetcher");

// Create client
let client = new Discord.Client({
    intents: [
        Discord.Intents.Guilds,
        Discord.Intents.GuildMessages,
        Discord.Intents.MessageContent,
        Discord.Intents.GuildMessageReactions
    ]
});

client.on("ready", () => {
    console.log("Client ready");
});

client.on("messageCreate", async (msg) => {
    try {
        // Check if the msg starts with prefix and the author is not a bot
        if (!msg.content.startsWith("r!")) return;
        if (msg.author.bot) return;

        // Fetch images
        let images = await genImage(msg.content.replace("r!", ""));
        let index = 0;
        if (!images) return;

        // Check if image is NSFW, if so return
        if (images[0].NSFW) return msg.reply("The image is marked as NSFW, but this channel is not.");

        // Create embed with image data
        let embed = new Discord.Embed()
            .setTitle(images[0].subreddit)
            .setDescription(images[0].title)
            .setImage(images[0].images)
            .setThumbnail(images[0].thumbnail);

        // Send message then add reactions
        let message = await msg.reply(embed);
        await message.reactions.add("◀");
        await message.reactions.add("▶");

        // Add event listener for reactions
        message.reactions.addEventListener("add", {
            userId: msg.author.id
        }, async (e, remove) => {
            // Remove the reaction
            message.reactions.remove(e.emoji.name, msg.author.id);

            if (e.emoji.name == "◀") { // Navigate back
                if (index == 0) return;
                else {
                    // Decrease index and update embed
                    index--;
                    embed = new Discord.Embed()
                        .setTitle(images[index].subreddit)
                        .setDescription(images[index].title)
                        .setImage(images[index].image)
                        .setThumbnail(images[index].thumbnail);

                    // Edit the message
                    message = await message.edit(embed);
                }
            } else if (e.emoji.name == "▶") {
                // Increase index and update embed
                index++;
                if (index >= images.length) { // Generate new images if neseccary
                    embed.setTitle("Loading new images...")
                        .setDescription("Please wait...");

                    message = await message.edit(embed);
                    newImages = await genImage(msg.content.replace("r!", ""));
                    for (let i in newImages) images.push(newImages[i]);

                }

                // Update embed
                embed = new Discord.Embed()
                    .setTitle(images[index].subreddit)
                    .setDescription(images[index].title)
                    .setImage(images[index].image)
                    .setThumbnail(images[index].thumbnail);

                // Edit message
                message = await message.edit(embed);
            }
        });
    } catch (err) {
        return msg.reply("Oops, I encounterd an error: " + err.toString());
    }
});

// Function to get images from reddit
async function genImage(type) {
    return new Promise((resolve, reject) => {
        RIF.fetch({
            type: "custom",
            subreddit: [type],
            total: 5
        }).then(res => {
            resolve(res);
        }).catch(err => {
            reject(err)
        });
    });
}

// Login to client
client.login("<your token here>");