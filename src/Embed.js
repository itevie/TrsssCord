class Embed {
    constructor() {
    }

    setTitle(text) {
        this.title = text;
        return this;
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    setImage(url) {
        this.image = {
            url: url
        }
        return this;
    }
    
    setColor(color) {
        if (color.startsWith("#")) color = parseInt(color.replace("#", ""), 16);
        this.color = color;
        return this;
    }

    addField(name, value, inline) {
        this.fields.push({
            name: name,
            value: value,
            inline: inline ? true : false
        });

        return this;
    }

    setAuthor(name, url) {
        this.author = {
            name: name,
            icon_url: url
        }
        return this;
    }

    setFooter(text, icon) {
        this.footer = {
            text: text,
            icon_url: icon 
        }
        return this;
    }

    setThumbnail(url) {
        this.thumbnail = url;
        return this;
    }

    get() {
        let fin = {};

        if (this.title) fin.title = this.title;
        if (this.description) fin.description = this.description;
        if (this.timestamp) fin.timestamp = this.timestamp;
        if (this.color) fin.color = this.color;
        if (this.footer.text || this.footer.icon_url) fin.footer = this.footer;
        if (this.image) fin.image = this.image;
        if (this.thumbnail) fin.thumbnail = this.thumbnail;
        if (this.author.text || this.author.icon_url) fin.author = this.author;
        if (this.fields.length != 0) fin.fields = this.fields;

        return fin;
    }
}

module.exports = Embed;