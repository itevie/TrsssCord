# TrsssCord innit
A crappy library for commuicating with the Discord API to make your very own (amazing) Discord Bot
## Why should I use this?
Because it kind of works
## Why should I NOT use this?
- Because it has very little compared to other ones
- Errors are very crappy
- It is very inefficient
- Proably crash
- Inconsistant (I think)
## Yea ok anyway, but what if I wanna use it
Well if you really want to, follow the following
### Getting started
1. Download this repository and add it to a new folder
2. Include it using 
   ```js
   const Discord = require("src/index.js") // Or wherever you put it
   ```
3. Welldone you did it
### Creating the client
If you haven't already, go to [https://discord.com/developers/applications](https://discord.com/developers/applications) to create yourself a bot and obtain it's token.

Next you'll want to create the client in your code, here is an example:

```js
const clinet = new Discord.Client({
    intents: [
        Discord.Intents.GuildMessages,
        Discord.Intents.MessageContet
    ]
})
```

With the above example, this will create a bot that can recieve guild messages with their content.
For other intents just look at the discord developer documentation.

Next, to login use the `client.login()` method:

```js
client.login("<your token goes here>");
```

This will connect your bot to the Discord API and your bot will magically come to life.

### But you may be asking; why is there no output?
Don't worry! For we have events!

All events are registered using `client.on("<event>", <callback>)`, here is an on ready example:

```js
client.on("ready", () => {
    console.log("The client is ready!");
});
```

This will fire the moment the bot comes online and is ready to recieve events.
#### debug
The debug event is fired for everytime something happens in the library.

```js
client.on("debug", (message) => {
    console.log(message);
});
```
#### messageCreate
This is fired every time a message has been sent.

```js
client.on("messageCreate", (message) => {
    if (message.content == "!ping")
        return message.reply("Pong!");
});
```

When a user sends "!ping" the bot will reply with "Pong!"
*This requires the message content intent*
#### messageUpdate
This will fire when a user edits their message

```js
client.on("messageUpdate", (message) => {
    console.log(message.author.username + " edited their message!");
});
```
#### messageDelete
This will fire whenever a user deletes a message
```js
client.on("messageDelete", (message) => {
    console.log(message.author.username + " deleted their message!");
});
```
### Message Methods
Here are some common methods that can be used on a message object
#### delete
Deletes a message
`message.delete()`
#### reply
Replies to a message
`message.reply("hi!")`
#### edit
Edits a message
`message.edit("I edited this message!")`
#### messageReference.fetch
Fetches the message that the message is replying too
`let msg = await message.messageReference.fetch()`
#### pin / unpin
Pins or unpins a message in a channel
`message.pin()`
`message.unpin()`
#### clearReactions
Removes all reactions on a message
`message.clearReactions()`
### Channel Methods
Some common methods for the channel object
#### send
Send a message to a channel
`channel.send("hi!")`
`message.channel.send("hi!")`
#### Modifying settings
`channel.setName("new Name")` - Modifies a channel's name
`channel.setTopic("new topic")` - Modifies a channel's topic
`channel.setNsfw(false)` - Changes a channel's NSFW setting
`channel.typing()` - Sends a typing indicator
`channel.getPinned()` - Returns an array of messages that are pinned
`channel.getMessage("<message id>")` - Fetches a message within a channel
`channel.delete()` - Deletes a channel
### User AND member methods
Methods you can use on a user object
#### send
Send a message to a user

```js
message.author.send("hi!");
user.send("hi!");
message.member.send("hi!");
message.guild.owner.send("hi!");
```
### member methods
#### setNick
Modifies a member's nick
`message.member.setNick("Awesome person")`
## Client methods
### Login
Login to your application
`client.login("<discord token>")`
### Fetch channel
Fetches a channel by id
`let channel = await client.fetchChannel("<channel id>")`
### Get self
Returns the currently logged in user
`let user = await client.getSelf()`
## Other things
### Sending messages
There are multiple ways messages can be formatted on `.send()` and `.reply()`

1. Only string
   `.send("hello")`
2. Only embed
   `.send(<embed Object>)`
3. Sting AND embed
   `.send("hello", <embed Object>)`
4. Data
   `.send({ content: "Hello", embeds: [ <embed Object> ] })`
5. String and data
   `.send("hello", { embeds: [ <embed Object> ] })`
### Creating embeds
To create a embed, first initiate one:

```js
let embed = new Dicord.Embed()
```

Methods on this can be directly added in a chain, here is what can be added:

```js
.setTitle(<string>)
.setDescription(<string>)
.setImage(<string url>)
.setColor(<hex or decimal color>)
.addField(<name: string>, <value: string>, <inline: true>)
.setAuthor(<text: string>, <icon: string url>)
.setFooter(<text: string>, <icon: string url>)
.setThumbnail(<string url>)
```

Example:
```js
let embed = new Discord.Embed().setTite("hi").setDescription("Hello!").setColor("#FFB6C1");
```