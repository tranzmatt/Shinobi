module.exports = function(s,config,lang,app,io){
    if(config.showPoweredByShinobi === undefined){config.showPoweredByShinobi=true}
    if(config.poweredByShinobi === undefined){config.poweredByShinobi='Powered by Shinobi.Systems'}
    if(config.webPageTitle === undefined){config.webPageTitle='Shinobi'}
    if(config.showLoginCardHeader === undefined){config.showLoginCardHeader=true}
    if(config.webFavicon === undefined){config.webFavicon='libs/img/icon/favicon.ico'}
    if(config.logoLocation76x76 === undefined){config.logoLocation76x76='libs/img/icon/apple-touch-icon-76x76.png'}
    if(config.logoLocation76x76Link === undefined){config.logoLocation76x76Link='https://shinobi.video'}
    if(config.logoLocation76x76Style === undefined){config.logoLocation76x76Style='border-radius:50%'}
    if(config.loginScreenBackground === undefined){config.loginScreenBackground='https://shinobi.video/libs/assets/backgrounds/7.jpg'}
    if(config.showLoginSelector === undefined){config.showLoginSelector=true}
    if(config.socialLinks === undefined){
        config.socialLinks = [
            {
                icon: 'home',
                href: 'https://shinobi.video',
                title: 'Homepage'
            },
            {
                icon: 'facebook',
                href: 'https://www.facebook.com/ShinobiCCTV',
                title: 'Facebook'
            },
            {
                icon: 'twitter',
                href: 'https://twitter.com/ShinobiCCTV',
                title: 'Twitter'
            },
            {
                icon: 'youtube',
                href: 'https://www.youtube.com/channel/UCbgbBLTK-koTyjOmOxA9msQ',
                title: 'YouTube'
            },
        ]
}

    s.getConfigWithBranding = function(domain){
        var configCopy = Object.assign({},config)
        if(config.brandingConfig && config.brandingConfig[domain]){
            return Object.assign(configCopy,config.brandingConfig[domain])
        }
        return config
    }
}
