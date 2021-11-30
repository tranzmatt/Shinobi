var accountSettings = {
    onLoadFieldsExtensions: [],
    onLoadFields: function(...extender){
        accountSettings.onLoadFieldsExtensions.push(...extender)
    },
    onSaveFieldsExtensions: [],
    onSaveFields: function(...extender){
        accountSettings.onSaveFieldsExtensions.push(...extender)
    },
}
