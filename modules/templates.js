// Set up the message when a user send text and not a postback
function askTemplateJour() {
  return [
    {
      name: "ask",
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Quel jour ?",
          buttons: [
            { type: "postback", title: "LUNDI", payload: "LUNDI" },
            { type: "postback", title: "MARDI", payload: "MARDI" },
            { type: "postback", title: "MERCREDI", payload: "MERCREDI" },
          ],
        },
      },
    },
    {
      name: "ask",
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "ou",
          buttons: [
            { type: "postback", title: "JEUDI", payload: "JEUDI" },
            { type: "postback", title: "VENDREDI", payload: "VENDREDI" },
            { type: "postback", title: "TOUT 🗓", payload: "TOUT" },
          ],
        },
      },
    },
  ];
}

// Set up message for new user
function askTemplateNewUserPromo() {
  return {
    name: "ask",
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: "Quel Promo ?",
        buttons: [
          { type: "postback", title: "3A", payload: "3" },
          { type: "postback", title: "4A", payload: "4" },
        ],
      },
    },
  };
}

// Set up message to get the user group
function askTemplateGroupe() {
  return [
    {
      name: "ask",
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Quel Groupe ?",
          buttons: [
            { type: "postback", title: "groupe A", payload: "A" },
            { type: "postback", title: "groupe B", payload: "B" },
            { type: "postback", title: "groupe C", payload: "C" },
          ],
        },
      },
    },
    {
      name: "ask",
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "ou",
          buttons: [{ type: "postback", title: "groupe D", payload: "D" }],
        },
      },
    },
  ];
}

// Set up message to handle unknown user or unknown event
function askTemplateStart() {
  return {
    name: "ask",
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: "Redémarrer le bot",
        buttons: [
          { type: "postback", title: "Démarrez", payload: "GET_STARTED" },
        ],
      },
    },
  };
}

// Set up message to get the user filliere
function askTemplateFilliere() {
  return {
    name: "ask",
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: "Quel fillière ?",
        buttons: [
          { type: "postback", title: "ETI", payload: "ETI" },
          { type: "postback", title: "CGP", payload: "CGP" },
        ],
      },
    },
  };
}

// Set up message to get the user majeure for 4ETI
function askTemplateMajeureETI() {
  return [
    {
      name: "ask",
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Quel majeure ?",
          buttons: [
            { type: "postback", title: "CBD", payload: "CBD" },
            { type: "postback", title: "Réseau", payload: "INFRA" },
            { type: "postback", title: "Image", payload: "IMI" },
          ],
        },
      },
    },
    {
      name: "ask",
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "ou",
          buttons: [
            { type: "postback", title: "Robot", payload: "ROSE" },
            { type: "postback", title: "Electronique", payload: "ESE" },
          ],
        },
      },
    },
  ];
}

// changer le lien de l'image chaque semaine
function askTemplateImage() {
  // utilisation d'une url discord pour l'image
  return {
    name: "image",
    attachment: {
      type: "image",
      payload: {
        url: "",
        is_reusable: true,
      },
    },
  };
};

function askTemplateSendWeek() {
  return {
    name: "image",
    attachment: {
      type: "image",
      payload: {
        url: "",
        is_reusable: true,
      },
    },
  };
};

function askTemplateMenu(psid) {
  return {
    psid: psid,
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: true, // activate/deactivate the keyboard
        call_to_actions: [
          {
            type: "postback",
            title: "LUNDI",
            payload: "LUNDI",
          },
          {
            type: "postback",
            title: "MARDI",
            payload: "MARDI",
          },
          {
            type: "postback",
            title: "MERCREDI",
            payload: "MERCREDI",
          },
          {
            type: "postback",
            title: "JEUDI",
            payload: "JEUDI",
          },
          {
            type: "postback",
            title: "VENDREDI",
            payload: "VENDREDI",
          },
          {
            type: "postback",
            title: "TOUT 🗓",
            payload: "TOUT",
          },
          {
            type: "postback",
            title: "REINSCRIPTION",
            payload: "REINSCRIPTION",
          },
          {
            type: "postback",
            title: "Code de liaison",
            payload: "CODE",
          }
        ]
      }
    ]
  };
};

function askTemplateMsoCGP(msos) {
    // I have to say that it is ChatGPT who found this solution ;(
    const templates = [];
    let i = 1;
    let num = 1;
    while (Object.keys(msos).length > 0) {
        const buttons = [];
        for (let j = 0; j < 3; j++) {
            const msoKey = Object.keys(msos)[0];
            if (!msoKey) {
                break;
            }
            const msoValue = msos[msoKey];
            delete msos[msoKey];
            buttons.push({ type: "postback", title: msoValue, payload: msoKey,});
        }
        templates.push({
            name: "ask",
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: `mso n°${num}`,
                    buttons: buttons,
                },
            },
        });
      i++;
      num++;
    }
    return templates;
  }
  



module.exports = {
    askTemplateJour,
    askTemplateNewUserPromo,
    askTemplateGroupe,
    askTemplateStart,
    askTemplateFilliere,
    askTemplateMajeureETI,
    askTemplateImage,
    askTemplateSendWeek,
    askTemplateMenu,
    askTemplateMsoCGP
}

