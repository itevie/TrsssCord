const Embed = require(__dirname + "/Embed.js");

class Channel {
  constructor(client, id) {
    this.client = client;

    if (typeof id == "object") this.initSettings(id);
    else this.id = id;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/channels/" + this.id)
        .then(chRes => {
          this.initSettings(chRes);

          resolve();
        }).catch(err => reject(err));
    });
  }

  initSettings(chRes) {
    return new Promise((resolve, reject) => {
      this.id = chRes.id;
      this.name = chRes.name;
      this.type = chRes.type;
      this.isDM = chRes.type == 1 ? true : false;
      this.position = chRes.position;
      this.parent = {
        id: chRes.parent_id
      }
      this.topic = chRes.topic;
      this.guild = {};
      this.nsfw = chRes.nsfw;
      this.lastMessage = {
        id: chRes.last_message_id,
        fetch: () => {
          return new Promise((reso, rej) => {
            this.client.sendHttps("get", this.client.api + "/channels/" + this.id + "/messages/" + chRes.last_message_id)
              .then(res => {
                let msg = new Message(this.client, res, this.guild.id);
                msg.init().then(() => {
                  reso(msg)
                }).catch(err => reject(err));;
              }).catch(err => rej(err));
          });
        }
      }

      if (this.type != 1) {
        let guild = new Guild(this.client, chRes.guild_id);
        this.guild = guild;
        guild.init().then(() => {
          resolve();
        })
      }
    });
  }

  send(content, other) {
    return new Promise((resolve, reject) => {
      let toSend = getToSend(content, other);

      this.client.sendHttps("post", "https://discord.com/api/channels/" + this.id + "/messages", toSend)
        .then(res => {
          let msg = new Message(this.client, res, this.guild.id);
          msg.init().then(() => {
            resolve(msg)
          }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
  }

  replyTo(msg, content, other) {
    return new Promise((resolve, reject) => {
      let toSend = getToSend(content, other);
      toSend.message_reference = {
        message_id: msg.id
      }

      this.client.sendHttps("post", "https://discord.com/api/channels/" + this.id + "/messages", toSend)
        .then(res => {
          let msg = new Message(this.client, res, this.guild.id);
          msg.init().then(() => {
            resolve(msg)
          }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
  }

  setName(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/channels/" + this.id, {
        name: newName
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  setTopic(newTopic) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/channels/" + this.id, {
        topic: newTopic
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  setNsfw(enable) {
    return new Promise((resolve, reject) => {
      if (enable != true && enable != false)
        throw new Error("Expected boolean");

      this.client.sendHttps("patch", this.client.api + "/channels/" + this.id, {
        nsfw: enable
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  typing() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("post", this.client.api + "/channels/" + this.id + "/typing  ", {})
        .then(res => {
          resolve();
        }).catch(err => reject(err));
    });
  }

  getPinned() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/channels/" + this.id + "/pins")
        .then(res => {
          for (let i in res) {
            let message = new Message(this.client, res[i], this.guild.id);
            message.channel.initSettings(this);
            res[i] = message;
          }
          resolve(res);
        }).catch(err => reject(err));
    });
  }

  getMessage(id) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/channels/" + this.id + "/messages/" + id)
        .then(res => {
          let message = new Message(this.client, res, this.guild.id);
          message.init().then(() => {
            resolve(res);
          }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.id)
        .then(res => {
          resolve();
        }).catch(err => reject(err));
    });
  }
}

class Guild {
  constructor(client, id) {
    this.id = id;
    this.client = client;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/guilds/" + this.id)
        .then(gRes => {
          this.initSettings(gRes).then(() => {
            resolve();
          });
        }).catch(err => reject(err));
    });
  }

  initSettings(d) {
    return new Promise((resolve, reject) => {
      this.id = d.id;
      this.name = d.name;
      this.icon = d.icon;
      this.description = d.description;
      this.homeHeader = d.home_header;
      this.splash = d.splash;
      this.discoverySplash = d.discovery_splash;
      this.features = d.features;
      this.emojis = d.emojis;
      this.stickers = d.stickers;
      this.banner = d.banner;
      this.applicationId = d.application_id;
      this.region = d.region;
      this.afkChannelId = d.afk_channel_id;
      this.aftTimeout = d.afk_timeout;
      this.systemChannelId = d.system_channel_id;
      this.widgetEnabled = d.widget_enabled;
      this.widgetChannelId = d.widget_channel_id;
      this.verificationLevel = d.verification_level;
      this.roles = d.roles;
      this.defaultMessageNotifications = d.default_message_notifications;
      this.mfaLevel = d.mfa_level;
      this.explicitContentFilter = d.explicit_content_filter;
      this.maxPresences = d.max_presences;
      this.maxMembers = d.max_members;
      this.maxStageVideoChannelUsers = d.max_stage_video_channel_users;
      this.maxVideoChannelUsers = d.max_video_channel_users;
      this.vanityUrlCode = d.vanity_url_code;
      this.premiumTier = d.premium_tier;
      this.premiumSubscriptionCount = d.premium_subscription_count;
      this.systemChannelFlags = d.system_channel_flags;
      this.preferredLocale = d.preferred_locale;
      this.rulesChannelId = d.rules_channel_id;
      this.safetyAlertsChannelId = d.safety_alerts_channel_id;
      this.publicAlertsChannelId = d.public_updates_channel_id;
      this.hubType = d.hub_type;
      this.premiumProgressBarEnabled = d.premium_progress_bar_enabled;
      this.nsfw = d.nsfw;
      this.nsfwLevel = d.nsfw_level;
      this.embedEnabled = d.embed_enabled;
      this.embedChannelId = d.embed_channel_id;
      this.owner = null;

      this.client.sendHttps("get", this.client.api + "/users/" + d.owner_id).then(res => {
        this.owner = new User(this.client, res);
        resolve();
      }).catch(err => reject(err));
    });
  }

  setName(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.id, {
        name: newName
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  getMember(id) {
    
  }
}

class User {
  constructor(client, user) {
    this.client = client;
    this.id = user.id;
    this.username = user.username;
    this.avatar = user.avatar;
    this.avatarDecoration = user.avatar_decoration;
    this.discriminator = user.discriminator;
    this.bot = user.bot ? true : false;
  }

  send(content, other) {
    return new Promise((resolve, reject) => {
      this.client.debug("Sending DM to user, creating DM");
      this.client.sendHttps("post", this.client.api + "/users/@me/channels", {
        recipient_id: this.id
      }).then(res => {
        try {
          this.client.debug("DM created: " + res.id + ", performing DM");

          let toSend = getToSend(content, other);

          this.client.sendHttps("post", this.client.api + "/channels/" + res.id + "/messages", toSend)
            .then(r => {
              this.client.debug("Successfully sent DM to " + this.id);
              resolve(r);
            }).catch(err => reject(err));
        } catch (err) {}
      }).catch(err => reject(err));
    });
  }
}

class Message {
  constructor(client, d, gId) {
    this.client = client;
    this.timestamp = d.timestamp;
    this.pinned = d.pinned;
    this.mentions = d.mentions;
    this.mentionRoles = d.mention_roles;
    this.mentionsEveryone = d.mention_everyone;
    if (d.member) {
      this.member = new Member(client, d.member, d.author);
    }
    this.id = d.id;
    this.embeds = d.embeds;
    this.editedTimestamp = d.edited_timestamp;
    if (d.message_reference) this.messageReference = {
      id: d.message_reference.message_id,
      fetch: () => this.fetchReference()
    }
    this.content = d.content;
    this.channelId = d.channel_id;
    this.channel = new Channel(client, this.channelId);
    this.author = new User(client, d.author);
    this.guild = new Guild(client, gId || d.guild_id  );
  }

  init() {
    return new Promise((resolve, reject) => {
      this.channel.init().then(() => {
        if (this.channel.type != 1) {
          this.guild.init().then(() => {
            if (this.member) {
              this.member.guild = this.guild;
              this.member.id = this.author.id;
              resolve();
            } else resolve();
          }).catch(err => reject(err));
        }
      }).catch(err => reject(err));
    });
  }

  fetchReference() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/channels/" + this.channelId + "/messages/" + this.messageReference.id)
        .then(res => {
          let msg = new Message(this.client, res, this.guild.id);
          msg.init().then(() => {
            if (msg.guild && msg.channel.type != 1) {
              this.client.sendHttps("get", this.client.api + "/guilds/" + this.guild.id + "/members/" + this.author.id).then(r => {
                this.member = new Member(this.client, r, msg.member || msg.author);
                this.member.guild = this.guild;
                resolve(msg);
              }).catch(err => reject(err));
            } else resolve(msg);
          }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
  }

  edit(content) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id, {
        content: content
      }).then(res => {
        let msg = new Message(this.client, res, this.guild.id);
        msg.init().then(() => {
          resolve(msg)
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id)
        .then(res => {
          resolve(true);
        }).catch(err => reject(err));
    });
  }

  pin() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("put", this.client.api + "/channels/" + this.channel.id + "/pins/" + this.id)
        .then(res => {
          resolve(true);
        }).catch(err => reject(err));
    });
  }

  unpin() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/pins/" + this.id)
        .then(res => {
          resolve(true);
        }).catch(err => reject(err));
    });
  }

  clearReactions() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id + "/reactions")
        .then(res => {
          resolve(true);
        }).catch(err => reject(err));
    });
  }

  reply(content, other) {
    return new Promise((resolve, reject) => {
      this.channel.replyTo(this, content, other).then((msg) => {
        resolve(msg);
      }).catch(err => reject(err));
    });
  }
}

class Member extends User {
  constructor(client, data, author) {
    super(client, author);
    this.client = client;
    this.roles = data.roles;
    this.premiumSince = data.premium_since;
    this.nick = data.nick;
    this.pending = data.pending;
    this.mute = data.mute;
    this.joinedAt = data.joined_at;
    this.communicationDisabledUntil = data.communication_disabled_until;
    this.avatar = data.avatar;
  }

  setNick(newNick) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.guild.id + "/members/" + this.id, {
        nick: newNick
      }).then(() => {
        this.nick = newNick;
        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  }
}

function getToSend(content, other) {
  let toSend = {};

  // STRING, SINGLE EMBED
  // STRING, OTHER DATA
  // EMBED
  // STRNG
  // OTHER

  //Find different combos
  if (other instanceof Embed) toSend = {
    content: content,
    embeds: [other]
  }
  else if (other != undefined) {
    toSend = other;
    toSend.content = content;
  } else if (content instanceof Embed) toSend = {
    embeds: [content]
  }
  else if (typeof content == "string") toSend = {
    content: content
  }
  else {
    toSend = content;
  }

  return toSend;
}

module.exports.Member = Member;
module.exports.Message = Message;
module.exports.Channel = Channel;
module.exports.User = User;