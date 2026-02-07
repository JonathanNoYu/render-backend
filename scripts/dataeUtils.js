export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
Date.prototype.subtractDays = function (d) {
    this.setTime(this.getTime() 
        - (d * 24 * 60 * 60 * 1000));
    return this;
}

const options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

/**
 * Takes a string with a weekday in it, assumes it is within the past week and returns a
 * Date and updated date String with the weekday replaced with "<Weekday>, <Month> <Day>, <Year>".
 * 
 * @param {String} weekday - string that includes the week day
 * @returns [Date, String]
 *      Date - Date Object for the weekday (Assuming the weekday is within the last week))
 *      String - Replaces the Weekday with "<Weekday>, <Month> <Day>, <Year>"
 */
export function weekdayToDate(weekday) {
    let today = new Date(Date.now())
    let thisWeekdayNum = today.getDay()
    var otherWeekDayNum;
    daysOfWeek.forEach((day, index) => {
        if (weekday.includes(day)) otherWeekDayNum = index
    })
    let subtractByDays = (7 - otherWeekDayNum + thisWeekdayNum) % 7 
    let pastDate = new Date(Date.now())
    let dateString;
    if (otherWeekDayNum != undefined) {
        pastDate.subtractDays(subtractByDays)
        dateString = weekday.replace(daysOfWeek[otherWeekDayNum], pastDate.toLocaleDateString("en-US", options))
    } else {
        dateString = weekday.replace("–", "– " + pastDate.toLocaleDateString("en-US", options))
    }
    pastDate = new Date(Date.parse(dateString))
    return [pastDate, dateString]
    // 0  1  2  3  4  5  6  0 
    // M  T  W TH  F  SA SU M  
    // 0  6  5  4  3  2  1  0
    // 7 - dayOfOtherWeek +  thisWeekDayNum
    
    // 1  2  3  4  5  6  0  1  
    // T  W  TH F  SA SU M  T
    // 0  6  5  4  3  2  1  0
    // 7 - dayOfOtherWeek +  thisWeekDayNum

    // 2  3  4  5  6  0  1  2  
    // W  TH F  SA SU M  T  W
    // 0  6  5  4  3  2  1  0
    // 7 - dayOfOtherWeek + thisWeekDayNum
    // 7 - 3 + 2 = 6
    // 7 - 4 + 2 = 5
    // 7 - 5 + 2 = 4
    // 7 - 6 + 2 = 3
    // 7 - 0 + 2 = 9 - 7 = 2
    // 7 - 1 + 2 = 8 - 7 = 1
    // 7 - 2 + 2 = 7 - 7 = 0 mod
}
// console.log(weekdayToDate("Posted by princeofopenness – Monday 7:41 PM"))
// console.log(new Date(Date.parse((weekdayToDate("Posted by princeofopenness – Monday 7:41 PM")[1]))))

// console.log(weekdayToDate("Reblogged by stormofembla – 10:58 AM"))
// console.log(new Date(Date.parse((weekdayToDate("Reblogged by stormofembla – 10:58 AM")[1]))))

/**
 * 
 * 
 * "Reblogged by stormofembla – Saturday, February 7, 2026 10:19 AM",
 * "Reblogged by sacrificialspear – January 17th, 9:04 PM",
 * @param {*} postDateString - String that includes a valid date
 * @param {*} date - Date Object
 * @returns 
 */
export function checkYearOrAddYear(date, postDateString) {
    let yearDate = date.getFullYear()
    if (!postDateString.includes(yearDate)) {
        let thisYear = new Date(Date.now()).getFullYear()
        let dateString = postDateString.replace(',', `, ${thisYear},`)
        let newDate = new Date(Date.parse(dateString))
        return [newDate, dateString]
    }
    return [date, postDateString]
}

//console.log(checkYearOrAddYear(new Date("2001-01-18T02:04:00.000Z"), "Reblogged by sacrificialspear – January 17, 9:04 PM"))