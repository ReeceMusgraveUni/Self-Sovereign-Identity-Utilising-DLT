

//Takes validTill, a string value for the expiration date of a credential, which is not set means it does not expire, but still needs converted to a uint
function blankTimeStamp (validTill) {
    let validTillTimestamp = parseInt(validTill);
    if(isNaN(validTillTimestamp)){
        validTillTimestamp = 0;
    }
    return validTillTimestamp;
}