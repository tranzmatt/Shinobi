module.exports = function(s,config,lang,Theme){
    const Theme = {
        isDark: true,
    }
    const mainBackgroundColor = Theme.isDark ? 'bg-dark' : Theme.isDarkDefaultBg || 'bg-light'
    const textWhiteOnBgDark = Theme.isDark ? 'text-white' : ''
    return {
        Theme,
        mainBackgroundColor,
        textWhiteOnBgDark,
    }
}
