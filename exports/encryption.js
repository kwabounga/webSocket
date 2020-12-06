var CryptoJS = require("crypto-js");

module.exports = function Encrypt(msg, keyPhrase) {
    let encrypted = CryptoJS.AES.encrypt(msg, keyPhrase, {
        format: JsonFormatter
    });
    return encrypted;
}
module.exports = function Decrypt(encrypted, keyPhrase) {
    let decrypted = CryptoJS.AES.decrypt(encrypted, keyPhrase, {
        format: JsonFormatter
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}




//console.log(CryptoJS.HmacSHA1("Message", "Key"));

var JsonFormatter = {
    stringify: function (cipherParams) {
        // create json object with cipherText
        var jsonObj = {
            ct: cipherParams.cipherText.toString(CryptoJS.enc.Base64)
        };
        // optionally add iv or salt
        if (cipherParams.iv) {
            jsonObj.iv = cipherParams.iv.toString();
        }
        if (cipherParams.salt) {
            jsonObj.s = cipherParams.salt.toString();
        }
        // stringify json object
        return JSON.stringify(jsonObj);
    },
    parse: function (jsonStr) {
        // parse json string
        var jsonObj = JSON.parse(jsonStr);
        // extract cipherText from json object, and create cipher params object
        var cipherParams = CryptoJS.lib.CipherParams.create({
            cipherText: CryptoJS.enc.Base64.parse(jsonObj.ct)
        });
        // optionally extract iv or salt

        if (jsonObj.iv) {
            cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
        }
        if (jsonObj.s) {
            cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
        }
        return cipherParams;
    }
};







// console.log(decrypted.toString(CryptoJS.enc.Utf8));