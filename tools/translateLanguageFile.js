console.log('This translation tool uses a Google Translate scraper. Use responsibly or your IP will be blocked by Google from using the service.')
if(!process.argv[2]||!process.argv[3]||!process.argv[4]){
    console.log('You must input arguments.')
    console.log('# node translateLanguageFile.js <SOURCE> <FROM_LANGUAGE> <TO_LANGUAGE>')
    console.log('Example:')
    console.log('# node translateLanguageFile.js en_CA en ar')
    return
}
let translate;
try{
    translate = require('@vitalets/google-translate-api')
}catch(err){
    console.log(`You are missing a module to use this tool. Run "npm install @vitalets/google-translate-api" to install the required module.`)
    return
}
var langDir='../languages/'
var fs=require('fs');
var https = require('https');
var jsonfile=require('jsonfile');
var source=require(langDir+process.argv[2]+'.json')
var list = Object.keys(source)
console.log(list.length)
var extra = ''
var current = 1
var currentItem = list[0]
var chosenFile = langDir+process.argv[4]+'.json'
var throttleTime = parseInt(process.argv[5]) || 1000
try{
    newList=require(chosenFile)
}catch(err){
    console.log(chosenFile)
    var newList={}
}
var newListAlphabetical={}
var goNext=function(){
    ++current
    currentItem = list[current]
    if(list.length===current){
        console.log('complete checking.. please wait')
            Object.keys(newList).sort().forEach(function(y,t){
                newListAlphabetical[y]=newList[y]
            })
            jsonfile.writeFile(chosenFile,newListAlphabetical,{spaces: 2},function(){
                console.log('complete writing')
            })
    }else{
        setTimeout(() => {
            next(currentItem)
        },throttleTime)
    }
}
var next=function(v){
    if(v===undefined){return false}
    if(newList[v]&&newList[v]!==source[v]){
        goNext()
        console.log('found a rule for this one, skipping : ',source[v]);
        return
    }
    translate(source[v], {to: process.argv[4],from: process.argv[3]}).then(res => {
        translation = res.text
        newList[v] = translation;
        console.log(current, ' of')
        console.log(list.length)
        console.log(v,' ---> ',translation)
        goNext()
    }).catch(err => {
        translation = `${source[v]}`
        console.log('translation failed : ',translation);
        console.error(err);
        newList[v]=translation;
        goNext()
    });
}
next(currentItem)
