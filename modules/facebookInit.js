let request = require("request"),
    config = require("config"),
    templates = require("./templates");

// Set up the Get Started button
function set_get_started() {
    let get_started = { get_started: { payload: "GET_STARTED" } };
    let res = request({
        uri: "https://graph.facebook.com/v16.0/me/messenger_profile",
        qs: { access_token: config.get("facebook.page.access_token") },
        method: "POST",
        json: get_started,
    });
    if (res) {
    console.log("get_started set");
    } else {
    console.error("Unable to send message:");
    console.error(res);
    }
    return;
}

// Set up the persistent menu
async function set_persistent_menu(psid) {
    let menu = templates.askTemplateMenu(psid);
    let res = await request({
        uri: "https://graph.facebook.com/v16.0/me/custom_user_settings",
        qs: { access_token: config.get("facebook.page.access_token") },
        method: "POST",
        json: menu,
    });
    // handling errors
    if (res) {
    console.log("menu set");
    } else {
    console.error("Unable to send message:");
    console.error(res);
    }
    return;
}

module.exports = {
    set_get_started,
    set_persistent_menu
}