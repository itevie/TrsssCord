const ws = require("ws");
const axios = require("axios");
const {
    Message,
    Channel,
    User
} = require("./builders");
const Intents = require("./Intents");

const eventList = require(__dirname + "/eventList");

class Client {
    #token = null
    
    constructor(options) {
        this.api = "https://discord.com/api";
        this.#token = null;
        this.gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";
        this.wsConnection = null;
        this.ready = false;

        this.events = {
            ready: null,
            messageCreate: null,
            messageUpdate: null,
            messageDelete: null,
            debug: null
        }

        this.cache = {
            messages: {},
            guilds: {},
            channels: {},
            users: {}
        }

        this.cacheSettings = {
            guild: 900000,
            channel: 420000,
            user: 300000
        }

        this.lastSequenceCode = null;
        this.heartbeatInterval = null;
        this.sessionId = null;
        this.resumeGatewayUrl = null;

        this.intents = 0
        for (let i in options.intents) {
            if (!Intents.proper[options.intents[i]])
                throw new Error("Invalid intent: " + options.intents[i]);
            this.intents = this.intents | Intents.proper[options.intents[i]];
        }
    }

    on(event, callback) {
        if (event in this.events == false)
            return false;

        this.events[event] = callback;
    }

    login(token) {
        this.#token = token;

        this.debug("Connecting to gateway...", "gateway");
        this.connect();
    }

    connect() {
        this.debug("Preparing to connect...", "gateway");

        this.wsConnection = new ws.WebSocket(this.gatewayUrl);
        this.wsConnection.on("open", () => {
            this.debug("Successfully initiated gateway connction", "gateway");
        });

        this.handleWs();
    }

    handleWs() {
        if (this.wsConnection == null) return;

        this.wsConnection.on("message", (msg) => {
            let json = JSON.parse("" + msg);
            this.debug("New WS message: " + json.op, "ws");
            let opCode = json.op;

            switch (opCode) {
                case 10:
                    this.#handleHeartbeat(json, true);
                    this.#login()
                    break;
                case 11:
                    this.#handleHeartbeat(json, false);
                    break;
                case 1:
                    this.debug("Gateway asked for immediate heartbeat");
                    this.#wsSend({
                        op: 1,
                        d: msg.s
                    });
                    break;
                case 0:
                    this.#dispatcher(json);
                    break;
                case 7:
                    this.#reconnect();
                    break;
                case 9:
                    this.debug("Connection has been invalidated");
                    break;
            }
        });
    }

    #dispatcher(msg) {
        let event = msg.t;
        this.debug("Recieved " + event);
        this.lastSequenceCode = msg.s;
        switch (event) {
            case "READY":
                this.debug("Client has successfully connected to gateway", "event");
                this.ready = true;
                this.sessionId = msg.d.session_id;
                this.resumeGatewayUrl = msg.d.resume_gateway_url;

                if (this.events.ready) this.events.ready();
                break;
            case "MESSAGE_CREATE":
                let msgCreate = new Message(this, msg.d);
                msgCreate.init().then(() => {
                    if (this.events.messageCreate) this.events.messageCreate(msgCreate);
                });
                break;
            case "MESSAGE_UPDATE":
                if (msg.d.type == undefined) {
                    this.debug("EVENT CANCELLED: INVALID MESSAGE UPDATE");
                    return;
                }
                let msgUpdate = new Message(this, msg.d);
                msgUpdate.init().then(() => {
                    if (this.events.messageUpdate) this.events.messageUpdate(msgUpdate);
                });
                break;
            case "MESSAGE_DELETE":
                if (this.events.messageDelete) this.events.messageDelete({
                    channel: new Channel(this, msg.d.channel_id)
                });
                break;
        }
    }

    #handleHeartbeat(msg, first) {
        if (first) this.debug("Hello event recievd", "ws");
        this.debug("Heartbeat recieved from gateway", "ws")

        if (first == true) this.heartbeatInterval = msg.d.heartbeat_interval;

        let send = () => {
            this.debug("Sending heartbeat", "ws")
            this.#wsSend({
                op: 1,
                d: msg.s
            });
        }

        setTimeout(() => send(), this.heartbeatInterval + Math.random());
    }

    #login() {
        this.debug("Preparing to login...", "bot");
        this.#wsSend({
            op: 2,
            d: {
                token: this.#token,
                intents: this.intents,
                properties: {
                    os: "windows",
                    browser: "my_library",
                    device: "my_library"
                }
            }
        });
    }

    #reconnect() {
        if (this.ready != true)
            return this.debug("Failed to reconnect: client is not ready", "gateway");

        this.wsConnection.close();
        this.wsConnection = null;
        this.wsConnection = new ws.WebSocket(this.resumeGatewayUrl);

        this.#wsSend({
            op: 6,
            d: {
                token: this.#token,
                session_id: this.sessionId,
                seq: this.lastSequenceCode
            }
        });

        this.handleWs();
    }

    #wsSend(msg) {
        this.debug("Send WS message " + JSON.stringify(msg).replace(this.#token, "<token>"), "ws");
        this.wsConnection.send(JSON.stringify(msg));
    }

    debug(message, type = "info") {
        if (this.events.debug) this.events.debug("[ " + type.toUpperCase() + " ] => " + message);
    }

    sendHttps(method, url, data) {
        return new Promise((resolve, reject) => {
            this.debug(method.toUpperCase() + ": " + url, "http");

            // Check if cache exists
            if (method == "get") {
                if (url.match(/(guilds\/[0-9]+)$/)) { // GUILDS /guilds/xxxxxxxxxxxxxxx
                    let id = url.match(/[0-9]+/)[0];
                    if (this.cache.guilds[id]) {
                        if (this.cacheSettings.guild - (Date.now() - this.cache.guilds[id].createdAt) > 0) {
                            this.debug("^ - fetched from cache");
                            resolve(this.cache.guilds[id].data);
                        } else {
                            this.debug("^ - Cache outdated")
                            delete this.cache.guilds[id];
                        }
                    }
                } else if (url.match(/(channels\/[0-9]+)$/)) {
                    let id = url.match(/[0-9]+/)[0];
                    if (this.cache.channels[id]) {
                        if (this.cacheSettings.channel - (Date.now() - this.cache.channels[id].createdAt) > 0) {
                            this.debug("^ - fetched from cache");
                            resolve(this.cache.channels[id].data);
                        } else {
                            this.debug("^ - Cache outdated")
                            delete this.cache.channels[id];
                        }
                    }
                } else if (url.match(/(users\/[0-9]+)$/)) {
                    let id = url.match(/[0-9]+/)[0];
                    if (this.cache.users[id]) {
                        if (this.cacheSettings.user - (Date.now() - this.cache.users[id].createdAt) > 0) {
                            this.debug("^ - fetched from cache");
                            resolve(this.cache.users[id].data);
                        } else {
                            this.debug("^ - Cache outdated")
                            delete this.cache.users[id];
                        }
                    }
                }
            }

            let headers = {
                Authorization: 'Bot ' + this.#token
            }

            axios({
                method: method,
                url: url,
                headers: headers,
                data: data
            }).then(res => {
                if (method == "get") {
                    // set cache
                    if (url.match(/(guilds\/[0-9]+)$/)) {
                        let id = url.match(/[0-9]+/)[0];
                        this.cache.guilds[id] = {
                            data: res.data,
                            createdAt: Date.now()
                        }
                    } else if (url.match(/(channels\/[0-9]+)$/)) {
                        let id = url.match(/[0-9]+/)[0];
                        this.cache.channels[id] = {
                            data: res.data,
                            createdAt: Date.now()
                        }
                    } else if (url.match(/(users\/[0-9]+)$/)) {
                        let id = url.match(/[0-9]+/)[0];
                        this.cache.users[id] = {
                            data: res.data,
                            createdAt: Date.now()
                        }
                    }
                }
                resolve(res.data);
            }).catch(err => {
                let msg = err.response.data;
                this.debug(JSON.stringify(msg));
                if (msg?.message?.includes("rate limited"))
                    reject("You are ratelimited, try again in " + msg.retry_after + "s");
                else reject(JSON.stringify(msg.message));
            });
        });
    }

    fetchChannel(id) {
        return new Promise((resolve, reject) => {
            this.sendHttps("get", this.api + "/channels/" + id)
                .then(res => {
                    let channel = new Channel(this, res);
                    channel.init().then(() => {
                        resolve(new Channel(this, res));
                    });
                }).catch(err => {
                    reject(err);
                });
        });
    }

    getSelf() {
        return new Promise((resolve, reject) => {
            this.sendHttps("get", this.api + "/users/@me")
                .then(res => {
                    let user = new User(this, res);
                    resolve(user)
                }).catch(err => {
                    reject(err);
                });
        });
    }
}

module.exports = Client;