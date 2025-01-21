"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateByAddingDays = dateByAddingDays;
exports.dateByAddingMinutes = dateByAddingMinutes;
exports.dateByAddingSeconds = dateByAddingSeconds;
exports.roundedMinute = roundedMinute;
exports.dayOfYear = dayOfYear;
exports.isValidDate = isValidDate;
const Astronomical_1 = __importDefault(require("./Astronomical"));
const Rounding_1 = require("./Rounding");
function dateByAddingDays(date, days) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate() + days;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return new Date(year, month, day, hours, minutes, seconds);
}
function dateByAddingMinutes(date, minutes) {
    return dateByAddingSeconds(date, minutes * 60);
}
function dateByAddingSeconds(date, seconds) {
    return new Date(date.getTime() + seconds * 1000);
}
function roundedMinute(date, rounding = Rounding_1.Rounding.Nearest) {
    const seconds = date.getUTCSeconds();
    let offset = 0; // Default: No rounding adjustments
    if (rounding === Rounding_1.Rounding.Nearest) {
        offset = seconds >= 30 ? 60 - seconds : -1 * seconds;
    }
    else if (rounding === Rounding_1.Rounding.Up) {
        offset = 60 - seconds;
    }
    return dateByAddingSeconds(date, offset);
}
function dayOfYear(date) {
    let returnedDayOfYear = 0;
    const feb = Astronomical_1.default.isLeapYear(date.getFullYear()) ? 29 : 28;
    const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let i = 0; i < date.getMonth(); i++) {
        returnedDayOfYear += months[i];
    }
    returnedDayOfYear += date.getDate();
    return returnedDayOfYear;
}
function isValidDate(date) {
    return date instanceof Date && !isNaN(date.valueOf());
}
