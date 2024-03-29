![header image](./Docs/Logo/baniere.png)


# Messenger chat bot for student timetable

With [@jo-pouradier](https://github.com/jo-pouradier), we created a chat bot for Messenger to help students to get their timetable on messenger which is much eassier than a long and fastidious excel file. 
That's why we created [CPE Planning | Facebook](https://www.facebook.com/profile.php?id=100090769200025). 
It's a 24/7 chat bot running with Nodejs on our personnal home lab.

The first version was made by @waleedahmad with his [Aww-Bot | Github](https://github.com/waleedahmad/Aww-Bot).

## _Summary_

- [Messenger chat bot for student timetable](#messenger-chat-bot-for-student-timetable)
  - [_Summary_](#summary)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Legal](#legal)
  - [Database](#database)
    - [Database MPD](#database-mpd)
  - [Recover timetable data from pdf](#recover-timetable-data-from-pdf)
  - [TODO](#todo)

## Installation

/!\ It is really complicated to install a chat bot on messenger, be ready to spend a lot of time on it. /!\
Fist you need a Facebook page connected with messenger to get a personnal token. Then you need to create a server with an https address (you can use `ngrok`, `localtunnel`, or a personnal domain). Then run a nodejs server (I first tried with a python flask server... no sucess) where the url `/webhook` verify your secret token. Finally your chat bot can be used by developpers and admins! For your app to be accessible to anyone, you need to submit it to Facebook for review, with a privacy policy (more in our [Legal](#legal) part).

## Usage

The **get_started** button is the first thing you see when you open the chat bot. It's a simple button that register the user in the database while asking for his promotion, group and major if necessary.
For the database, we are using a local sqlite file to store the user's data. And a json file to store the timetable. 
We are reccording the user's :
 - id (chat id from facebook)
 - promotion (3A or 4A)
 - group (A, B, C or D)
 - major (only for 4ETI students)
On the website we are using the user's:
 - email (cpe)
 - first-name
 - last-name
 - password
 - personnal code (send via messenger) 

On Messenger we send to the user a message with a button for each day of the week. When the user click on a button, we send him a message with the timetable of the day according to his promotion and major. The group is not taken into account for the moment it is way too complicated because of the pdf file and too many of unplanned format.  

On the website, when the user is connected, he can see his timetable and his personnal code.  

## Legal

To make your app accessible to anyone, you need to submit it to Facebook for review, with a privacy policy. You can use [PrivacyPolicies.com](https://www.privacypolicies.com/) to create your privacy policy. It is free and easy to use.
Below is our privacy policy and service requirement.
Webgenarator : [app.privacypolicies.com](https://app.privacypolicies.com/profile/agreements)
- Privacy policy webhosted : [Here](https://www.privacypolicies.com/live/bcce1178-a9c6-4135-988c-ef12048878fa)
  - or in Markdown localy : [Here](./Docs/PrivacyPolicyCPEPlanning.md)


## Database

For the database we are using an sqlite database. This version works for all students. For the MSO we are using a joint table because of the number of MSO (about thirty).
/!\ The database is not finished yet, we are still working on it. 
The database is composed of 3 tables:  

- `user` :
    - `id_user` 
    - `promo` 
    - `filliere` 
    - `groupe`
    - `majeur`
- `TJ_User_MSO` :
  - `id_user` 
  - `id_mso`
- `MSO` :
  - `id_mso`
  - `name_mso`
- `profile`:
  - `email`
  - `prenom`
  - `nom`
  - `password` (stored in sha256 with salt)
  - `psid` (=id_user from user table)
  
### Database MPD

![Database structure V1](./Docs/ReadmeImages/DBV3.png) (not up to date)

## Recover timetable data from pdf

<img src="./Docs/ReadmeImages/confidential-ge984ebf2f_1280.png"  width="400" height="250">

## TODO

- [ ] Verification server side for register
- [ ] handle spam
- [ ] make a stat page
- [ ] Fix Change info form
- [ ] password recovery
- [ ] Manage LV lessons
- [ ] Manage database backup and restore (cron?)
- [ ] Script to send planning automatically at 7h30am
- [ ] Make a better code
- [ ] Don't share the token on github !!!!!!!!!
- [ ] Don't share the code to  ETI students !!!!!!!!!
- [ ] Regex expression for hours  
- [ ] Link the LV lessons website
- [ ] autocomplete the re-registration form of the website
- [ ] make a repport bug or feedback page/form
- [ ] handle 3ETI groups 'X&Y'
- [ ] change python script xls2csv to a js module
- [ ] check for .isc possibilities
- [ ] show error message for invalid form
- [X] remove psid from github
- [X] Interface admin pour gérer les comptes
- [X] change database schema
- [X] For the future : make a web interface for CPE admin to post the planning (manage timetable)
- [X] change url from messenger to cpeplanning
- [X] to link bot and website use sender PSID 
- [X] create send psid button
- [X] create subscribe page
- [X] to link bot and website use sender PSID 
- [X] create send psid button
- [X] create subscribe page
- [X] Make json file for all variables
- [X] Repair isKnown function
- [X] Manage CGP Table
- [X] Manage re-registration 4CGP (mso)
- [X] Manage 3A lessons
- [X] Create MSO TABLE
- [X] Manage groups (but not for 4A its useless and complicated)
- [X] Make more comments in the code so it's easier to understand when you come back to it after a long time
- [X] Use personnal domain to get png
- [X] Manage SQL errors (try catch)
- [X] Make a better readme 
- [X] Use another file to store templates