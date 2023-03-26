## Messenger chat bot for student timetable

With @PierrLouis2, we created a chat bot for Messenger to help students to get their timetable on messenger which is much eassier than a long and fastidious excel file. 
That's why we created [Emploi du temps étudiant | Facebook](https://www.facebook.com/profile.php?id=100090431688914). 
It's a 24/7 chat bot running with Nodejs on our personnal home lab.

The first version was made by @waleedahmad with his [Aww-Bot | Github](https://github.com/waleedahmad/Aww-Bot).

### _Summary_

- [Installation](#installation)
- [Usage](#usage)
    - [Registre users](#registre-users)
- [Judiciaire](#judiciaire)

# Installation

/!\ It is really complicated to install a chat bot on messenger, be ready to spend a lot of time on it. /!\
Fist you need a Facebook page connected with messenger to get a personnal token. Then you need to create a server with an https address (you can use `ngrok`, `localtunnel`, or a personnal domain). Then run a nodejs server (I first tried with python... no sucess) where the url `/webhook` verify the token. Finally your chat bot can be used.

# Usage

The **get_started** button is the first thing you see when you open the chat bot. It's a simple button that register the user in the database while asking for his promotion and groupa and Major if necessary.
For the database, are we using a simple json file ?, an sqlite database ? or a docker database ? ? ? We don't know yet.  
We are reccording the user's :
 - id
 - promotion
 - group
 - major  

Then we send to the user a message with a button for each day of the week. When the user click on a button, we send him a message with the timetable of the day according to his promotion and group.

### Registre users

Utilisastion d'un json comme pour la config du bot.  
Depuis le bouton de démarrage, on verifie que l'`id` existe dans la DB, si non on l'ajoute et on lui demande sa promotion, son groupe et sa filière si nécessaire grace a une série de messages avec un `postback`. 

# Judiciaire

Webgenarator : [app.privacypolicies.com](https://app.privacypolicies.com/profile/agreements)
- Privacy policy webhosted : [Here](https://www.privacypolicies.com/live/b31b8520-640b-40d1-b43c-52033d7e05fa)
  - or in Markdown localy : [Here](./Docs/PrivacyPolicy.md)
- Service requirement webhosted [Here](https://www.privacypolicies.com/live/897d7376-61c0-473c-834b-cfcf6d0d0dcd)
  - or in Markdown localy = [Here](./Docs/ServiceRequirement.md)


# DATABASE
## Database structure V1

For the first version of the data base we use a sqlite database. This first version only works for 4ETI students.
The database is composed of 2 tables :
 - `users` : 
    - `ID_user` : the user's id
    - `Promo` : the user's promotion
    - `Filliere` : the user's fillière
    - `group` : the user's group
 - `4ETI` :
  - `ID_user` : the user's id
  - `Major`: the user's major
  - `MSO`: the user's MSO

![Database structure V1](ReadmeImages/DBV1.png)

## Database structure V2

For the second version of the data base we use a sqlite database. This version works for all students. with a jointture table for the MSO.

- `users` : 
    - `ID_user` : the user's id
    - `Promo` : the user's promotion
    - `Filliere` : the user's fillière
    - `group` : the user's group
    - `Major`: the user's major
- `TJ_User_MSO` :
  - `ID_user` : the user's id
  - `MSO`: the user's MSO
- `MSO` :
  - `ID_MSO` : the MSO's id
  - `MSO` : the MSO's name

![Database structure V1](ReadmeImages/DBV2.png)

# TODO

- [ ] Manage CGP Table
- [ ] Manage LV lessons
- [ ] Manage 3A lessons
- [ ] Create MSO TABLE
- [ ] Manage groups
- [ ] manage data base backup and restore
- [ ] script to send planning automatically
- [ ] Manage SQL errors (try catch)
- [ ] Make a better readme 
- [ ] Make a better code
- [ ] For the future : make a web interface for CPE admin to post the planning (manage the time)
- [ ] Make more comments in the code so it's easier to understand when you come back to it after a long time
- [ ] Don't share the token on github !!!!!!!!!
- [ ] don't share the code to  ETI students !!!!!!!!!