// Compact lists for the password estimator, loaded lazily. Order is rank: earlier means more common.
// Passwords come from widely known "most used" lists (hand-curated, not exhaustive). Names from the
// public-domain Unix proper-names list. Words extend the shared passphrase word list.
const split = (s: string) => s.split(/\s+/).filter(Boolean);

export const COMMON_PASSWORDS: string[] = split(`
123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon 123123 baseball abc123 football
monkey letmein shadow master 666666 qwertyuiop 123321 mustang 1234567890 michael 654321 superman 1qaz2wsx
7777777 121212 000000 qazwsx 123qwe killer trustno1 jordan jennifer zxcvbnm asdfgh hunter buster soccer harley
batman andrew tigger sunshine iloveyou 2000 charlie robert thomas hockey ranger daniel starwars klaster 112233
george computer michelle jessica pepper 1111 zxcvbn 555555 11111111 131313 freedom 777777 pass maggie 159753
aaaaaa ginger princess joshua cheese amanda summer love ashley 6969 nicole chelsea biteme matthew access
yankees 987654321 dallas austin thunder taylor matrix mobilemail mom monitor monitoring montana moon moscow
welcome admin login passw0rd password1 password123 qwerty123 admin123 letmein1 welcome1 iloveyou1 abc12345
test test123 guest changeme secret root toor default administrator user username pass123 p@ssw0rd p@ssword
1q2w3e4r 1q2w3e 1q2w3e4r5t q1w2e3r4 qwe123 qweasd qweasdzxc asdasd asdfghjkl asdf1234 qazwsxedc zaq12wsx
zaq1zaq1 1qazxsw2 !qaz2wsx 123abc 123456a a123456 a1b2c3 a1b2c3d4 abcd1234 abcdef abcdefg abcdefgh abc123456
aaaaaaaa 11111 1111111 111222 123654 12341234 123123123 123456123456 12345678910 1234qwer 1234abcd 12121212
123987 147258 147258369 159357 951753 321321 456789 456123 789456 789456123 987654 987123 0987654321
1029384756 0123456789 01234567 00000000 0000 00000 1212 1313 2222 2323 4321 5555 6666 7777 8888 9999 1010 1122
1230 2001 2002 2003 2004 2005 2006 2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017 2018 2019 2020 2021
2022 2023 2024 2025 iloveu iloveyou2 ilovegod loveyou lovely lover loveme love123 lovers sweetie sweety baby
babygirl babyboy angel angels honey honeybun cutie darling beautiful pretty sexy sexymama hottie secret1
sunshine1 flower flowers rainbow butterfly cookie cookies chocolate candy sugar muffin pumpkin peanut peanuts
banana apple orange cherry lemon strawberry coffee pizza hamburger bacon dragon1 dragons tiger tigers lion
eagle falcon wolf wolves bear panda monkey1 kitty kitten puppy doggie dog cat horse pony bunny rabbit snake
spider shark dolphin phoenix wizard ninja samurai pirate pirates warrior hero knight king queen prince
princess1 lord god jesus jesus1 christ blessed heaven angel1 devil satan hell football1 baseball1 basketball
soccer1 hockey1 tennis golf golfer swimming skater skate boxing racing rugby cricket lakers cowboys steelers
packers giants patriots eagles redskins broncos raiders arsenal liverpool manchester barcelona madrid juventus
ronaldo messi superman1 batman1 spiderman ironman hulk avengers starwars1 skywalker vader yoda pokemon mario
zelda sonic naruto goku harrypotter hogwarts gandalf matrix1 terminator predator alien aliens gundam
transformers qwertyui qwerty1 qwerty12 qwertyu qwert qwerty1234 qwer1234 qwer qweqwe qweqweqwe zxczxc zxcvb
zxcvbnm1 zxcasd asdzxc asdqwe poiuyt poiuytrewq lkjhgf lkjhgfdsa mnbvcxz mnbvcxzlkjhgfdsapoiuytrewq azerty
azerty123 azertyuiop qsdfghjklm wxcvbn google facebook twitter youtube instagram linkedin yahoo hotmail gmail
microsoft windows windows1 apple1 iphone android samsung linux ubuntu internet website web wifi network server
database system security manager support service office company business money cash gold silver diamond dollar
bitcoin crypto michael1 michelle1 jennifer1 jessica1 jessica2 ashley1 amanda1 nicole1 daniel1 andrew1 joshua1
matthew1 anthony justin justin1 brandon steven ryan ryan1 kevin kevin1 brian jason david david1 john john123
james james1 chris chris1 mark paul peter tom tim jack jake sam alex alex1 max max123 tony mike mike1 joe
joe123 bob bill jim jimmy johnny johnson smith jones brown williams miller davis wilson anderson taylor1
thomas1 moore martin jackson thompson white harris clark lewis robinson walker young allen sarah sara emma
emily emily1 hannah hannah1 samantha lauren megan rachel rebecca elizabeth abigail olivia sophia isabella ava
mia chloe grace lily zoe anna maria jessie jessie1 jenny lisa linda susan karen nancy betty sandra ashley2
kimberly donna carol helen amy melissa stephanie heather tiffany brittany jasmine destiny alexis victoria
letmein123 letmein2 whatever whatever1 nothing something anything hello hello123 hello1 hellohello helloworld
goodluck goodbye welcome123 welcome2 sunshine2 monday tuesday friday sunday summer1 summer2020 winter spring
autumn fall summer2 winter1 spring1 autumn1 january february march april may june july august september
october november december passw0rd1 passw0rd! pa55word pa55w0rd p4ssw0rd p4ssword password! password2
password12 password01 password11 password1! password123! pass1234 pass12345 passpass passwort wachtwort
motdepasse contrasena senha parola salasana 1password mypassword mypass mypass123 thepassword newpassword
newpass temp temp123 tempass temporary default1 changeme1 changeit changeme123 letmeinnow open opensesame
sesame abracadabra trustme secure secure1 security1 private private1 hidden mystery secret123 supersecret
topsecret a1234567 a12345678 a123456789 aa123456 aaa111 aaa123 aaaa1111 abc abc1234 abc123abc abcabc abcabc123
asd123 asd123456 asdf asdf123 asdfasdf asdfjkl asdfjkl; zxc123 zxc123456 qaz123 qazqaz qazwsx123 qazxsw wsxedc
1qw23e 1qwerty q1q1q1 q1w2e3 q1w2e3r4t5 q1w2e3r4t5y6 qq123456 qqqqqq qwqwqw iloveyou! iloveyou123 ihateyou
ihatemyself fuckyou fuckoff fuck1234 asshole bitch shit shit123 dick pussy sex sex123 sexy123 porn porno xxx
xxx123 naked boobs tits cock whore slut bastard damn bailey shadow1 shadow12 master1 master123 killer1 hunter1
hunter2 hunter123 buster1 jordan23 jordan1 tigger1 ranger1 harley1 cooper rocky rocky1 lucky lucky1 lucky7
coco charlie1 oliver bandit diesel duke sparky zeus thor loki odin max1 maxwell buddy buddy1 bear1 tucker
teddy bella lola luna daisy molly maggie1 sadie sophie lucy chloe1 penny abby gracie mustang1 camaro corvette
ferrari porsche bmw mercedes audi toyota honda ford chevy davidson jeep yamaha suzuki kawasaki ducati nissan
subaru mazda computer1 computer123 laptop laptop1 desktop keyboard mouse gaming gamer games game1 minecraft
fortnite roblox xbox playstation nintendo steam 1234567a 12345a 123456q 12345qwert 123456789a 123456789q
123456abc 12345abc 123abc123 123qweasd 123qweasdzxc 123asd 123zxc 1234asdf 1234qwerty 12qwaszx 1q2w3e4r5t6y
1qaz1qaz 1qaz2wsx3edc 1qazzaq1 2wsx3edc 3edc4rfv 4rfv5tgb 5tgb6yhn qwertyuiop[] qazwsxedcrfv zaqxsw zaq123
xsw2zaq1 football123 baseball123 iloveyou12 princess12 sunshine12 password1234 password12345 qwerty12345
abcdefghi abcdefghij abcdefghijk abcdefghijklmnopqrstuvwxyz zyxwvu zyxwvutsrqponmlkjihgfedcba aabbcc aabbccdd
aabb abab abcd abcde abcdef1 qwertz qwertz123 myspace1 myspace blink182 linkinpark metallica nirvana beatles
slipknot eminem rihanna beyonce madonna elvis bonjovi acdc ledzeppelin pinkfloyd rolling nothingtoloseitall
samsung1 nokia sony canon nikon dell hp lenovo asus acer cisco oracle sql mysql mssql postgres mongodb redis
admin1 admin12 admin1234 administrator1 admins sysadmin root123 root1234 rootroot toor123 guest123 guest1
user1 user123 user1234 test1 test1234 testing testing123 tester demo demo123 sample example example1 temp1
temp1234 backup backup1 oracle1 changeme! sa sa123 sqlserver tomcat jenkins docker kubernetes
`);

export const EXTRA_WORDS: string[] = split(`
the be to of and in that have it for not on with he as you do at this but his by from they we say her she or
an will my one all would there their what so up out if about who get which go me when make can like time no
just him know take people into year your good some could them see other than then now look only come its over
think also back after use two how our work first well way even new want because any these give day most us
correct horse battery staple purple monkey dishwasher orange green blue red yellow black white pink brown grey
gray silver golden iron copper stone river mountain ocean forest desert island valley lake sea sky cloud storm
thunder lightning rain snow wind fire water earth moon sun star planet galaxy universe space rocket house home
room kitchen garden window door table chair bed bath school class teacher student book paper pencil pen music
song dance movie film picture photo camera phone email letter message mail city town village country street
road bridge park beach farm field market store shop bank hotel hospital church castle tower family mother
father mom dad sister brother son daughter uncle aunt cousin friend friends boy girl man woman child children
baby kid kids person team group club party wedding birthday holiday christmas easter halloween happy sad angry
funny crazy lazy smart clever brave strong weak fast slow quick quiet loud big small little large tiny huge
giant long short tall high low deep wide narrow heavy light dark bright warm cold hot cool dry wet clean dirty
rich poor young old fresh sweet sour bitter salty spicy run walk jump fly swim climb drive ride sing play
sleep dream wake eat drink cook bake read write draw paint build break fix cut open close push pull throw
catch kick hit hold carry bring send buy sell pay win lose find hide seek search learn teach study believe
remember forget wish hope wait stay leave return start stop begin end finish tree flower grass leaf rose lily
oak pine maple apple banana grape lemon peach pear plum berry melon tomato potato carrot onion pepper bread
butter milk cream sugar salt honey rice pasta noodle soup salad cake pie cookie candy chocolate coffee tea
juice beer wine whiskey vodka cat dog bird fish cow pig sheep goat chicken duck goose rabbit mouse rat bear
wolf fox deer lion tiger elephant zebra giraffe dolphin whale shark turtle frog snake spider bee ant butterfly
eagle hawk owl crow parrot penguin hello world goodmorning goodnight thanks thankyou please sorry yes maybe
never always sometimes forever together alone again once twice three four five six seven eight nine ten eleven
twelve hundred thousand million billion zero paris london berlin rome madrid tokyo moscow dubai sydney toronto
chicago boston dallas houston miami denver seattle phoenix vegas texas florida california canada america
england france germany italy spain china japan india brazil mexico russia australia ireland scotland africa
europe asia
`);

export const NAMES: string[] = split(`
aaron adam adlai adrian agatha ahmed ahmet aimee alain alan alastair albert alberto alejandro alex alexander
alexis alf alfred alison allan allen alvin amanda amarth amedeo ami amigo amir amos amy anatole anatoly
anderson andre andrea andreas andrew andries andy angela angus anita ann anna annard anne annie anthony anton
antonella antonio antony archie ariel arlene arne arnold art arthur audrey avery axel barbara barbra barney
barrett barrio barry bart barton bea beckie becky belinda ben benjamin benson bernard bernie bert bertrand
beth betsy betty beverly bill billie billy bjorne blaine blair blake blayne bob bobbie bobby bonnie boyce boyd
brad bradford bradley brandi brandon brandy brenda brendan brender brent bret brett brian briggs brodie brooke
bruce bruno bryan bryce bucky bud butler byron caleb calvin carisa carl carlo carlos carol carole caroline
carolyn carsten carter cary case casey casper catherine cathrin cathryn cathy cecilia celeste celia charleen
charlene charles charley charlie chet chip chris christian christie christina christofer christophe
christopher chuck cindie cindy claire clara clare clarence clarissa clark claude claudia claudio clay clayton
clem cliff clifford clyde cole coleen colin collin connie conrad corey cory courtney craig cris cristi
cristina cristopher curt curtis cynthia cyrus dale dalton damon damone dan dana dani daniel daniele danielle
dannie danny darci daren darin darrell darren darryl daryl dave david dawn dawson dean deb debbie debi deborah
deirdre del delbert denis dennis derek devon dewey diana diane dick dieter dimetry dimitry dion dirk dominic
dominick don donal donald donn donna donne donnie donovan dori dorian dorothy dory doug douglas doyle drew
duane duke duncan dustin dwayne dwight dylan earl earle earnie eddie eddy edgar edith edmond edmund eduardo
edward edwin eileen elaine eli elias elijah eliot elisabeth elizabeth ellen elliot elliott elric elsa elvis
elwood emil emily emma emmett eric erick erik ernest ernie ernst erwin ethan eugene eva evan evelyn everett
farouk fay felix fletcher floria florian floyd frances francis francisco francois frank franklin fred frederic
frederick fritz gabriel gail gale galen gary gene geoff geoffrey george gerald gerard gideon gigi gil giles
gill gilles ginny giovanni glen glenn glynn gordon grace graeme graham grant granville greg gregg gregge
gregor gregory gretchen griff guido guillermo gunnar gunter guy gypsy hal hamilton hank hans harmon harold
harris harry hartmann harv harvey hazel heather hector heidi hein heinrich heinz helen helge henry herb
herbert herman herve hienz hilda hillary hillel himawan hirofumi hirotoshi hiroyuki hitoshi hohn holly hon
honzo horst hotta howard hsi hsuan huashi hubert huey hugh hughes hui hume hunter hurf hwa ian ilya ima indra
ira irfan irvin irving irwin isaac isabelle isidore israel izchak izumi izzy jack jackye jacob jacobson
jacques jagath jaime jakob james jamie jan jane janet janice janos jared jarl jarmo jarvis jason jay jayant
jayesh jean jeanette jeanne jeannette jeannie jeany jef jeff jeffery jeffie jeffrey jelske jem jenine jennie
jennifer jerald jeremy jerome jerrie jerry jesper jess jesse jesus jianyun jill jim jimmy jin jinchao jingbai
jinny jiri jisheng jitendra joachim joanne jochen jock joe joel johan johann john johnathan johnnie johnny jon
jonathan jones jong joni joon jordan jorge jos jose joseph josh joshua josip joubert joyce juan judge judith
judy juergen juha julia julian juliane julianto julie juliet julius jun june jurevis juri jussi justin jwahar
kaj kamel kamiya kanthan karen kari karl kate kathleen kathryn kathy kay kayvan kazuhiro kee kees keith kelly
kelvin kemal ken kenn kenneth kent kenton kerri kerry kevan kevin kevyn kieran kiki kikki kim kimberly kimmo
kinch king kirk kirsten kit kitty klaudia klaus knapper knudsen knut knute kolkka konrad konstantinos kory
kris kristen kristi kristian kristin kriton krzysztof kuldip kurt kusum kyle kylo kyu kyung lana lance lanny
lar larry lars laura laurel laurence laurent laurianne laurie lawrence lea leads lee leif leigh leila leith
len lenny lenora leo leon leonard leora les leslie lester leung lewis lex liber lievaart lila lin linda linder
lindsay lindsey linley lisa list liyuan liz liza lloyd lois lonhyn lord loren lorenzo lori lorien lorraine lou
louie louiqa louis louise loukas lowell loyd luc lucifer lucius lui luis lukas luke lum lyndon lynn lynne
lynnette maarten mac magnus mah mahesh mahmoud major malaclypse malcolm malloy malus manavendra manjeri mann
manny manolis manuel mara marc marcel marci marcia marco marcos marek margaret margie margot marguerite maria
marian marie marilyn mario marion mariou mark markus marla marlena marnix marsh marsha marshall martha martin
marty martyn marvin mary masanao masanobu mason mat mats matt matthew matthias matthieu matti maureen maurice
max mayo mechael meehan meeks mehrdad melinda merat merril merton metin micah michael micheal michel michelle
michiel mick mickey micky miek mikael mike mikey miki miles milner milo miltos miriam miriamne mitch mitchell
moe mohammad molly mongo monica monty moore moran morgan morris morton moses mosur mott murat murph murray
murthy mwa myrick myron mysore nadeem naim nancy nanda naomi naoto naren narendra naresh nate nathan nathaniel
natraj neal ned neil nelken neville nguyen nhan niall nichael nicholas nici nick nicolas nicolette nicolo
niels nigel nikolai nils ning ninja noam noemi nora norbert norm norma norman nou novo novorolsky ofer olaf
old ole oleg oliver olivier olof olson omar orville oscar oskar owen ozan pablo page pam pamela panacea
pandora panos pantelis panzer paola part pascal pat patrice patricia patricio patrick patty paul paula pedro
peggy penny per perry pete peter petr phil philip philippe phill phillip phiroze pia piercarlo pierce pierette
pierre piet piete pieter pilar pilot pim ping piotr pitawas plastic polly pontus pradeep prakash pratap
pratapwant pratt pravin presley pria price raanan rabin radek rafael rafik raghu ragnar rahul raif rainer raj
raja rajarshi rajeev rajendra rajesh rajiv rakhal ralf ralph ram ramadoss raman ramanan ramesh ramiro ramneek
ramon ramsey rand randal randall randell randolph randy ranjit raphael rathnakumar raul ravi ravindran
ravindranath ray rayan raymond real rebecca rees reid reiner reinhard renu revised rex rhonda ric ricardo rich
richard rick ricky rik ritalynne ritchey rob robbin robert roberta roberto robin rod rodent roderick rodger
rodney roger rogue roland rolf rolfe romain roman ron ronald ronni root ross roxana roxane roxanne roxie roy
rudolf rudolph rudy rupert russ russell rusty ruth saad sabrina saify saiid sal sally sam samir samuel sanand
sanche sandeep sandip sandra sandy sanford sangho sanity sanjay sanjeev sanjib santa saqib sarah sassan saul
saumya scot scott sean sedat sedovic seenu sehyo sekar serdar sergeant sergei sergio sergiu seth seymour
shadow shahid shai shakil shamim shane shankar shannon sharada sharan shari sharon shatter shaw shawn shean
sheila shel sherman sherri shirley sho shutoku shuvra shyam sid sidney siegurd sigurd simon siping sir sjaak
sjouke skeeter skef skip slartibartfast socorrito sofia sofoklis son sonja sonny soohong sorrel space spass
spencer spike spock spudboy spy spyros sri sridhar sridharan srikanth srinivas srinivasan sriram srivatsan ssi
stacey stacy stagger stan stanislaw stanley stanly starbuck steen stefan stephan stephanie stephe stephen
stevan steve steven stewart straka stu stuart subra sue sugih sumitro sundar sundaresan sunil suresh surya
susan susanne susumu suu suwandi suyog suzan suzanne svante swamy syd syed sylvan syun tad tahsin tai tait
takao takayuki takeuchi tal tammy tanaka tandy tanya tao tareq tarmi taurus ted teresa teri teriann terrance
terrence terri terry teruyuki thad tharen the theo theodore thierry think thomas those thuan tiefenthal tigger
tim timo timothy tobias toby todd toerless toft tolerant tollefsen tom tomas tommy tony tor torsten toufic
tovah tracey tracy tran travis trent trevor trey triantaphyllos tricia troy trying tuan tuna turkeer tyler uri
urs vadim val valentin valeria valerie van vance varda vassos vaughn venkata vern vernon vic vice vick vicki
vickie vicky victor victoria vidhyanath vijay vilhelm vince vincent vincenzo vinod vishal vistlik vivek
vladimir vladislav wade walt walter warren wayne wendell wendi wendy werner wes will william willie wilmer
wilson win winnie winston wolf wolfgang woody yvonne
`);
