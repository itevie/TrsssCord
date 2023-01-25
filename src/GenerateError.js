let reportMsg = " > Not sure what this means? Please report the whole error to the TrsssCord github repository.";

function genErr(i, e = "", noErr) {
    if (!e) e = "";
    let text = i.replace(/^(Error:)$/g, "") + "\n";
    let lin = e.toString().split("\n");
    for (let i in lin) {
        if (lin[i].trim().length == 0) lin.splice(i, 1);
    }

    for (let l in lin) {
        let t = lin[l].replace(/^(Error:)$/g, "")
            .replace(/at:/g, "")
            .replace(/err:/g, "")
            .replace(reportMsg, "").trim();

        if (t == "") continue;
        if (l == lin.length - 2)
            text += "   err: " + t + "\n";
        else
            text += "   at: " + t + "\n";
    }

    text.trim()
    text += "\n" + reportMsg + "\n";
    
    if (noErr) return text;
    return new Error(text);
}

module.exports = genErr;