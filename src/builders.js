const {
  RichPresenceAssets
} = require("discord.js");

const Embed = require(__dirname + "/Embed.js");
const genErr = require(__dirname + "/GenerateError.js");

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
        }).catch(err => reject(genErr("channel init", err)));
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
                }).catch(err => reject(genErr("message init", err)));
              }).catch(err => rej(genErr("fetch message", err)));
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
          }).catch(err => reject(genErr("message init", err)));
        }).catch(err => reject(genErr("channel send message", err)));
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
          }).catch(err => reject(genErr("message init", err)));
        }).catch(err => reject(genErr("channel reply", err)));
    });
  }

  setName(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/channels/" + this.id, {
        name: newName
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(genErr("channel init", err)));
      }).catch(err => reject(genErr("update channel; set name", err)));
    });
  }

  setTopic(newTopic) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/channels/" + this.id, {
        topic: newTopic
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(genErr("channel init; set topic", err)));
      }).catch(err => reject(genErr("update channel; set topic", err)));
    });
  }

  setNsfw(enable) {
    return new Promise((resolve, reject) => {
      if (enable != true && enable != false)
        reject(genErr("expected bool", null))

      this.client.sendHttps("patch", this.client.api + "/channels/" + this.id, {
        nsfw: enable
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(genErr("init channel", err)));
      }).catch(err => reject(genErr("fetch channel", err)));
    });
  }

  typing() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("post", this.client.api + "/channels/" + this.id + "/typing  ", {})
        .then(res => {
          resolve();
        }).catch(err => reject(genErr("set typing", err)));
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
        }).catch(err => reject(genErr("fetch pins", err)));
    });
  }

  getMessage(id) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/channels/" + this.id + "/messages/" + id)
        .then(res => {
          let message = new Message(this.client, res, this.guild.id);
          message.init().then(() => {
            resolve(res);
          }).catch(err => reject(genErr("message init", err)));
        }).catch(err => reject(genErr("fetch message", err)));
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.id)
        .then(res => {
          resolve();
        }).catch(err => reject(genErr("channel delete", err)));
    });
  }

  invites = {
    create: () => {
      return new Promise((resolve, reject) => {
        this.client.sendHttps("post", this.client.api + "/channels/" + this.id + "/invites", {})
          .then(res => {
            let invite = new Invite(this.client, res);
            invite.init(res).then(() => {
              resolve(invite);
            }).catch(err => reject(genErr("init invite", err)));
          }).catch(err => reject(genErr("create invite", err)));
      });
    }
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
        }).catch(err => reject(genErr("guild init", err)));
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

      // Set up roles
      for (let i in this.roles) {
        let role = new Role(this.client, this.roles[i], this);
        this.roles[i] = role;
      }

      this.client.sendHttps("get", this.client.api + "/users/" + d.owner_id).then(res => {
        this.owner = new User(this.client, res);
        resolve();
      }).catch(err => reject(genErr("guild init settings", err)));
    });
  }

  setName(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.id, {
        name: newName
      }).then(res => {
        this.init().then(() => {
          resolve();
        }).catch(err => reject(genErr("guild init", err)));
      }).catch(err => reject(genErr("update guild; set name" + err)));
    });
  }

  getMember(id) {

  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/guilds/" + this.id)
        .then(res => {
          resolve();
        }).catch(err => reject(genErr("delete guild " + err)));
    });
  }

  channels = {
    createTextChannel: (name, options) => {
      return new Promise((resolve, reject) => {
        let o = {
          name: name
        }

        for (let i in options) {
          switch (options[i]) {
            case "topic":
              o.topic = options[i];
              break;
            case "timeout":
              o.rate_limit_per_user = options[i];
              break;
            case "position":
              o.position = options[i];
              break;
            case "parentId":
              o.parent_id = options[i];
              break;
            case "nsfw":
              o.nsfw = options[i];
              break;
          }
        }

        this.client.sendHttps("post", this.client.api + "/guilds/" + this.id + "/channels", o)
          .then(res => {
            let channel = new Channel(this.client, res.id);
            channel.init().then(() => {
              resolve(channel);
            }).catch((err) => {
              reject(genErr("init channel", err));
            })
          }).catch(err => reject(genErr("create channel", err)));
      });
    },

    fetchAll: () => {
      return new Promise((resolve, reject) => {
        this.client.sendHttps("get", this.client.api + "/guilds/" + this.id + "/channels")
          .then(res => {
            let channels = res;
            for (let i in channels) {
              let channel = new Channel(this.client, channels[i].id);
              channel.init().then(() => {
                channels[i] = channel;
                if (i == channels.length - 1) resolve(channels);
              }).catch(err => reject(genErr("channel init (" + i + ")", err)));
            }
          }).catch(err => reject(genErr("fetch channels", err)))
      });
    }
  }

  members = {
    fetch: (id) => {
      return new Promise((resolve, reject) => {
        this.client.sendHttps("get", this.client.api + "/guilds/" + this.id + "/members/" + id)
          .then(member => {
            this.client.sendHttps("get", this.client.api + "/users/" + id).then(user => {
              let newUser = new Member(this.client, member, user, this);
              resolve(newUser);
            }).catch(err => {
              reject(genErr("fetch user " + id, err))
            })
          }).catch(err => {
            reject(genErr("fetch member " + id, err));
          });
      });
    }
  }

  templates = {
    create: (name) => {
      return new Promise((resolve, reject) => {
        this.client.sendHttps("post", this.client.api + "/guilds/" + this.id + "/templates", {
          name: name
        }).then((res) => {
          let template = new Template(this.client, res);
          resolve(template);
        }).catch(err => reject(genErr("create template", err)));
      });
    }
  }

  fetchInvites() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/guilds/" + this.id + "/invites")
        .then((res) => {
          resolve(res);
        }).catch(err => reject(genErr("fetch invites", err)));
    });
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
              let msg = new Message(this.client, r);
              msg.init().then(() => {
                resolve(msg);
              }).catch(err => reject(genErr("init message", err)));
            }).catch(err => reject(genErr("fetch message", err)));
        } catch (err) {}
      }).catch(err => reject(genErr("create user DM", err)));
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
      this.member = new Member(client, d.member, d.author, gId);
    }
    this.id = d.id;
    this.embeds = d.embeds;
    this.editedTimestamp = d.edited_timestamp;
    if (d.message_reference) this.reference = {
      id: d.message_reference.message_id,
      fetch: () => this.fetchReference()
    }
    this.content = d.content;
    this.channelId = d.channel_id;
    this.channel = new Channel(client, this.channelId);
    this.author = new User(client, d.author);
    this.guild = new Guild(client, gId || d.guild_id);
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
          }).catch(err => reject(genErr("guild init", err)));
        } else resolve();
      }).catch(err => reject(genErr("channel init", err)));
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
                this.member = new Member(this.client, r, msg.member || msg.author, this.guild);
                this.member.guild = this.guild;
                resolve(msg);
              }).catch(err => reject(genErr("fetch member", err)));
            } else resolve(msg);
          }).catch(err => reject(genErr("message init", err)));
        }).catch(err => reject(genErr("fetch message", err)));
    });
  }

  edit(content, other) {
    return new Promise((resolve, reject) => {
      let toSend = getToSend(content, other);

      this.client.sendHttps("patch", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id, toSend).then(res => {
        let msg = new Message(this.client, res, this.guild.id);
        msg.init().then(() => {
          resolve(msg)
        }).catch(err => reject(genErr("message init", err)));
      }).catch(err => reject(genErr("fetch message", err)));
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id)
        .then(res => {
          resolve(true);
        }).catch(err => reject(genErr("delete message", err)));
    });
  }

  pin() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("put", this.client.api + "/channels/" + this.channel.id + "/pins/" + this.id)
        .then(res => {
          resolve(true);
        }).catch(err => reject(genErr("pin", err)));
    });
  }

  unpin() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/pins/" + this.id)
        .then(res => {
          resolve(true);
        }).catch(err => reject(genErr("unpin", err)));
    });
  }

  reply(content, other) {
    return new Promise((resolve, reject) => {
      this.channel.replyTo(this, content, other).then((msg) => {
        resolve(msg);
      }).catch(err => reject(genErr("reply", err)));
    });
  }

  reactions = {
    add: (emoji) => {
      return new Promise((resolve, reject) => {
        let to = this.client.lastDoneTimers.reactionAdd - (Date.now() - this.client.lastDone.reactionAdd);
        if (to < 0) to = 0;
        else this.client.debug("Waiting " + to + "ms");
        this.client.lastDone.reactionAdd = Date.now();
        setTimeout(() => {
          this.client.sendHttps("put", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id + "/reactions/" + encodeURI(emoji) + "/@me")
            .then(() => {
              resolve();
            }).catch(err => reject(genErr("add reaction", err)));
        }, to);
      });
    },

    remove: (emoji, user = "@me") => {
      return new Promise((resolve, reject) => {
        this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id + "/reactions/" + encodeURI(emoji) + "/" + user)
          .then(() => {
            resolve();
          }).catch(err => reject(genErr("delete reaction for user: " + user, err)));
      });
    },

    clear: () => {
      return new Promise((resolve, reject) => {
        this.client.sendHttps("delete", this.client.api + "/channels/" + this.channel.id + "/messages/" + this.id + "/reactions")
          .then(res => {
            resolve(true);
          }).catch(err => reject(genErr("clear reactions", err)));
      });
    },

    addEventListener: (type, o = {}, callback) => {
      if (type != "add" && type != "remove") 
        throw new Error(genErr("Expected either add or remove for param 1 (reaction event listener)", null, true));
      if (typeof o == "function") callback = o;
      let options = {
        event: type == "add" ? "MESSAGE_REACTION_ADD" : "MESSAGE_REACTION_REMOVE",
        messageId: this.id
      }

      if (o.userId) options.userId = o.userId;

      this.client.addEventListener(options, callback);
    },

    removeEventListener: (callback) => {
      this.client.removeEventListener(callback);
    }
  }
}

class Member extends User {
  constructor(client, data, author, guild) {
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
    if (guild) this.guild = guild;
  }

  setNick(newNick) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.guild.id + "/members/" + this.id, {
        nick: newNick
      }).then(() => {
        this.nick = newNick;
        resolve();
      }).catch(err => {
        reject(genErr("member; set nick", err));
      });
    });
  }

  ban() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("put", this.client.api + "/guilds/" + this.guild.id + "/bans/" + this.id).then(() => {
        resolve();
      }).catch(err => {
        reject(genErr("ban " + this.id, err));
      });
    });
  }

  unban() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/guilds/" + this.guild.id + "/bans/" + this.id).then(() => {
        resolve();
      }).catch(err => {
        reject(genErr("remove ban " + this.id, err));
      });
    });
  }

  kick() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/guilds/" + this.guild.id + "/members/" + this.id).then(() => {
        resolve();
      }).catch(err => {
        reject(genErr("kick " + this.id, err));
      });
    });
  }
}

class Reaction {
  constructor(client) {
    this.client = client;
  }

  init(data) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("get", this.client.api + "/users/" + data.user_id)
        .then(res => {
          let user = new User(this.client, res);
          this.user = user;
          this.client.sendHttps("get", this.client.api + "/channels/" + data.channel_id + "/messages/" + data.message_id)
            .then(mRes => {
              let message = new Message(this.client, mRes, data.guild_id)
              message.init().then(() => {
                this.channel = message.channel;
                this.guild = message.guild;
                this.message = message;
                this.emoji = {
                  name: data.emoji.name,
                  id: data.emoji.id
                }
                resolve(this);
              }).catch(err => reject(genErr("init message", err)));
            }).catch(err => reject(genErr("fetch message", err)));
        }).catch(err => reject(genErr("init reaction; fetch user", err)));
    });
  }
}

class Invite {
  constructor(client, data) {
    this.client = client;
    this.code = data.code;
    this.type = data.type;
    this.expiresAt = new Date(data.expires_at);
    this.uses = data.uses;
    this.maxUses = data.max_uses;
    this.maxAge = data.max_age;
    this.temporary = data.temporary;
    this.createdAt = new Date(data.created_at);
  }

  init(data) {
    return new Promise((resolve, reject) => {
      let guild = new Guild(this.client, data.guild.id);
      guild.init().then(() => {
        this.guild = guild;
        let channel = new Channel(this.client, data.channel.id);
        channel.init().then(() => {
          this.channel = channel;
          this.client.sendHttps("get", this.client.api + "/users/" + data.inviter.id)
            .then(uRes => {
              let user = new User(this.client, uRes);
              this.inviter = user;
              resolve(this);
            }).catch(err => reject(genError("fetch user", err)));
        }).catch(err => reject(genErr("init channel", err)));
      }).catch(err => reject(genErr("init guild", err)));
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/invites/" + this.code)
        .then(res => {
          resolve();
        }).catch(err => reject(genErr("delete invite " + this.code, err)));
    });
  }
}

class Role {
  constructor(client, data, guild) {
    this.client = client;
    this.guild = guild;

    this.init(data);
  }

  init(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.permissions = data.permissions;
    this.position = data.position;
    this.color = data.color;
    this.hoise = data.hoist;
    this.managed = data.managed;
    this.mentionable = data.mentionable;
    this.icon = data.icon;
    this.unicodeEmoji = data.unicodeEmoji;
    this.tags = data.tags;
    this.flags = data.flags;
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/guilds/" + this.guild.id + "/roles/" + this.id)
        .then(() => {
          resolve();
        }).catch(err => reject(genErr("delete role " + this.name, err)));
    })
  }

  setName(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.guild.id + "/roles/" + this.id, {
          name: newName
        })
        .then((res) => {
          this.init(res);
          resolve(this);
        }).catch(err => reject(genErr("update role; set name: " + this.name, err)));
    });
  }

  setHoist(hoist) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.guild.id + "/roles/" + this.id, {
          hoist: hoist
        })
        .then((res) => {
          this.init(res);
          resolve(this);
        }).catch(err => reject(genErr("update role; set hoist: " + this.name, err)));
    });
  }
}

class Template {
  constructor(client, data) {
    this.client = client;
    this.code = data.code;
    this.name = data.name;
    this.description = data.description;
    this.uses = data.usageCount;
    this.creator = data.creator;
    this.createdAt = new Date(data.created_at);
    this.updatedAt = new Date(data.updated_at);
    this.source = data.source_guild_id;
    this.sourceGuild = data.serialized_source_guild;
    this.dirty = data.is_dirty;
  }

  sync() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("put", this.client.api + "/guilds/" + this.source + "/templates/" + this.code)
        .then((res) => {
          let template = new Template(this.client, res);
          resolve(template);
        }).catch(err => reject(genErr("sync template", err)));
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("delete", this.client.api + "/guilds/" + this.source + "/templates/" + this.code)
        .then(() => {
          resolve();
        }).catch(err => reject(genErr("delete template", err)));
    });
  }

  setName(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.source + "/templates/" + this.code, {
          name: newName
        })
        .then((res) => {
          let template = new Template(this.client, res);
          resolve(template);
        }).catch(err => reject(genErr("update template; set name", err)));
    });
  }

  setDescription(newName) {
    return new Promise((resolve, reject) => {
      this.client.sendHttps("patch", this.client.api + "/guilds/" + this.source + "/templates/" + this.code, {
          desription: newName
        })
        .then((res) => {
          let template = new Template(this.client, res);
          resolve(template);
        }).catch(err => reject(genErr("update template; set description", err)));
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
module.exports.Guild = Guild;
module.exports.Invite = Invite;
module.exports.Reaction = Reaction;