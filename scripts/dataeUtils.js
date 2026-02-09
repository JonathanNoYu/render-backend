export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
Date.prototype.subtractDays = function (d) {
    this.setTime(this.getTime() 
        - (d * 24 * 60 * 60 * 1000));
    return this;
}

// options to produce "<Weekday> <Month> <Date>, <YEAR>" when used on <date>.toLocaleDateString
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
    let subtractByDays = (7 - otherWeekDayNum + thisWeekdayNum - 1) % 7 
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
}

/**
 * 
 * Checks if the year in the date is in the postDateString, if not it will assume it is this year
 * and inject this year into the dateString and returns the newDate and the new dateString.
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

/**
 * Compares two dates and returns 1 if aDate is eariler returns -1 if bdate is earilier and returns 0 if they are the same date
 * 
 * @param {Date} aDate 
 * @param {Date} bDate 
 * @returns Number (-1 | 0 | 1)
 */
export function compareDates(aDate, bDate) {
    let a = Date.parse(aDate)
    let b = Date.parse(bDate)
    if (a > b) return -1
    if (b > a) return 1
    return 0
 }