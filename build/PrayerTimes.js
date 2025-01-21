"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SolarTime_1 = __importDefault(require("./SolarTime"));
const TimeComponents_1 = __importDefault(require("./TimeComponents"));
const Prayer_1 = __importDefault(require("./Prayer"));
const Astronomical_1 = __importDefault(require("./Astronomical"));
const DateUtils_1 = require("./DateUtils");
const Madhab_1 = require("./Madhab");
const PolarCircleResolution_1 = require("./PolarCircleResolution");
class PrayerTimes {
    // eslint-disable-next-line complexity
    constructor(coordinates, date, calculationParameters) {
        this.coordinates = coordinates;
        this.date = date;
        this.calculationParameters = calculationParameters;
        let solarTime = new SolarTime_1.default(date, coordinates);
        let fajrTime;
        let sunriseTime;
        let dhuhrTime;
        let asrTime;
        let sunsetTime;
        let maghribTime;
        let ishaTime;
        let dahwa;
        let nightFraction;
        dhuhrTime = new TimeComponents_1.default(solarTime.transit).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
        sunriseTime = new TimeComponents_1.default(solarTime.sunrise).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
        sunsetTime = new TimeComponents_1.default(solarTime.sunset).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
        const tomorrow = (0, DateUtils_1.dateByAddingDays)(date, 1);
        let tomorrowSolarTime = new SolarTime_1.default(tomorrow, coordinates);
        const polarCircleResolver = calculationParameters.polarCircleResolution;
        if ((!(0, DateUtils_1.isValidDate)(sunriseTime) ||
            !(0, DateUtils_1.isValidDate)(sunsetTime) ||
            isNaN(tomorrowSolarTime.sunrise)) &&
            polarCircleResolver !== PolarCircleResolution_1.PolarCircleResolution.Unresolved) {
            const resolved = (0, PolarCircleResolution_1.polarCircleResolvedValues)(polarCircleResolver, date, coordinates);
            solarTime = resolved.solarTime;
            tomorrowSolarTime = resolved.tomorrowSolarTime;
            const dateComponents = [
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
            ];
            dhuhrTime = new TimeComponents_1.default(solarTime.transit).utcDate(...dateComponents);
            sunriseTime = new TimeComponents_1.default(solarTime.sunrise).utcDate(...dateComponents);
            sunsetTime = new TimeComponents_1.default(solarTime.sunset).utcDate(...dateComponents);
        }
        // eslint-disable-next-line prefer-const
        asrTime = new TimeComponents_1.default(solarTime.afternoon((0, Madhab_1.shadowLength)(calculationParameters.madhab))).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
        const tomorrowSunrise = new TimeComponents_1.default(tomorrowSolarTime.sunrise).utcDate(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        const night = (Number(tomorrowSunrise) - Number(sunsetTime)) / 1000;
        fajrTime = new TimeComponents_1.default(solarTime.hourAngle(-1 * calculationParameters.fajrAngle, false)).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
        // special case for moonsighting committee above latitude 55
        if (calculationParameters.method === "MoonsightingCommittee" &&
            coordinates.latitude >= 55) {
            nightFraction = night / 7;
            fajrTime = (0, DateUtils_1.dateByAddingSeconds)(sunriseTime, -nightFraction);
        }
        const safeFajr = (function () {
            if (calculationParameters.method === "MoonsightingCommittee") {
                return Astronomical_1.default.seasonAdjustedMorningTwilight(coordinates.latitude, (0, DateUtils_1.dayOfYear)(date), date.getFullYear(), sunriseTime);
            }
            else {
                const portion = calculationParameters.nightPortions().fajr;
                nightFraction = portion * night;
                return (0, DateUtils_1.dateByAddingSeconds)(sunriseTime, -nightFraction);
            }
        })();
        if (isNaN(fajrTime.getTime()) || safeFajr > fajrTime) {
            fajrTime = safeFajr;
        }
        if (calculationParameters.ishaInterval > 0) {
            ishaTime = (0, DateUtils_1.dateByAddingMinutes)(sunsetTime, calculationParameters.ishaInterval);
        }
        else {
            ishaTime = new TimeComponents_1.default(solarTime.hourAngle(-1 * calculationParameters.ishaAngle, true)).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
            // special case for moonsighting committee above latitude 55
            if (calculationParameters.method === "MoonsightingCommittee" &&
                coordinates.latitude >= 55) {
                nightFraction = night / 7;
                ishaTime = (0, DateUtils_1.dateByAddingSeconds)(sunsetTime, nightFraction);
            }
            const safeIsha = (function () {
                if (calculationParameters.method === "MoonsightingCommittee") {
                    return Astronomical_1.default.seasonAdjustedEveningTwilight(coordinates.latitude, (0, DateUtils_1.dayOfYear)(date), date.getFullYear(), sunsetTime, calculationParameters.shafaq);
                }
                else {
                    const portion = calculationParameters.nightPortions().isha;
                    nightFraction = portion * night;
                    return (0, DateUtils_1.dateByAddingSeconds)(sunsetTime, nightFraction);
                }
            })();
            if (isNaN(ishaTime.getTime()) || safeIsha < ishaTime) {
                ishaTime = safeIsha;
            }
        }
        maghribTime = sunsetTime;
        if (calculationParameters.maghribAngle) {
            const angleBasedMaghrib = new TimeComponents_1.default(solarTime.hourAngle(-1 * calculationParameters.maghribAngle, true)).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
            if (sunsetTime < angleBasedMaghrib && ishaTime > angleBasedMaghrib) {
                maghribTime = angleBasedMaghrib;
            }
        }
        //===cal for dahwa===
        const durationBetweenFajrAndMaghrib = maghribTime.getTime() - fajrTime.getTime();
        const halfDuration = durationBetweenFajrAndMaghrib / 2;
        const dahwaTime = new Date(fajrTime.getTime() + halfDuration);
        //===cal for dahwa===
        const fajrAdjustment = (calculationParameters.adjustments.fajr || 0) +
            (calculationParameters.methodAdjustments.fajr || 0);
        const sunriseAdjustment = (calculationParameters.adjustments.sunrise || 0) +
            (calculationParameters.methodAdjustments.sunrise || 0);
        const dhuhrAdjustment = (calculationParameters.adjustments.dhuhr || 0) +
            (calculationParameters.methodAdjustments.dhuhr || 0);
        const asrAdjustment = (calculationParameters.adjustments.asr || 0) +
            (calculationParameters.methodAdjustments.asr || 0);
        const maghribAdjustment = (calculationParameters.adjustments.maghrib || 0) +
            (calculationParameters.methodAdjustments.maghrib || 0);
        const ishaAdjustment = (calculationParameters.adjustments.isha || 0) +
            (calculationParameters.methodAdjustments.isha || 0);
        this.fajr = (0, DateUtils_1.roundedMinute)((0, DateUtils_1.dateByAddingMinutes)(fajrTime, fajrAdjustment), calculationParameters.rounding);
        this.sunrise = (0, DateUtils_1.roundedMinute)((0, DateUtils_1.dateByAddingMinutes)(sunriseTime, sunriseAdjustment), calculationParameters.rounding);
        this.dhuhr = (0, DateUtils_1.roundedMinute)((0, DateUtils_1.dateByAddingMinutes)(dhuhrTime, dhuhrAdjustment), calculationParameters.rounding);
        this.asr = (0, DateUtils_1.roundedMinute)((0, DateUtils_1.dateByAddingMinutes)(asrTime, asrAdjustment), calculationParameters.rounding);
        this.sunset = (0, DateUtils_1.roundedMinute)(sunsetTime, calculationParameters.rounding);
        this.maghrib = (0, DateUtils_1.roundedMinute)((0, DateUtils_1.dateByAddingMinutes)(maghribTime, maghribAdjustment), calculationParameters.rounding);
        this.isha = (0, DateUtils_1.roundedMinute)((0, DateUtils_1.dateByAddingMinutes)(ishaTime, ishaAdjustment), calculationParameters.rounding);
        this.dahwa = (0, DateUtils_1.roundedMinute)(dahwaTime, calculationParameters.rounding); // for dahwa
    }
    timeForPrayer(prayer) {
        if (prayer === Prayer_1.default.Fajr) {
            return this.fajr;
        }
        else if (prayer === Prayer_1.default.Sunrise) {
            return this.sunrise;
        }
        else if (prayer === Prayer_1.default.Dhuhr) {
            return this.dhuhr;
        }
        else if (prayer === Prayer_1.default.Asr) {
            return this.asr;
        }
        else if (prayer === Prayer_1.default.Maghrib) {
            return this.maghrib;
        }
        else if (prayer === Prayer_1.default.Isha) {
            return this.isha;
        }
        else if (prayer === Prayer_1.default.Dahwa) {
            return this.dahwa;
        }
        else {
            return null;
        }
    }
    currentPrayer(date = new Date()) {
        if (date >= this.isha) {
            return Prayer_1.default.Isha;
        }
        else if (date >= this.maghrib) {
            return Prayer_1.default.Maghrib;
        }
        else if (date >= this.asr) {
            return Prayer_1.default.Asr;
        }
        else if (date >= this.dhuhr) {
            return Prayer_1.default.Dhuhr;
        }
        else if (date >= this.sunrise) {
            return Prayer_1.default.Sunrise;
        }
        else if (date >= this.fajr) {
            return Prayer_1.default.Fajr;
        }
        else if (date >= this.dahwa) {
            return Prayer_1.default.Dahwa;
        }
        else {
            return Prayer_1.default.None;
        }
    }
    nextPrayer(date = new Date()) {
        if (date >= this.isha) {
            return Prayer_1.default.None;
        }
        else if (date >= this.maghrib) {
            return Prayer_1.default.Isha;
        }
        else if (date >= this.asr) {
            return Prayer_1.default.Maghrib;
        }
        else if (date >= this.dhuhr) {
            return Prayer_1.default.Asr;
        }
        else if (date >= this.sunrise) {
            return Prayer_1.default.Dhuhr;
        }
        else if (date >= this.fajr) {
            return Prayer_1.default.Sunrise;
        }
        else if (date >= this.dahwa) {
            return Prayer_1.default.Dahwa;
        }
        else {
            return Prayer_1.default.Fajr;
        }
    }
}
exports.default = PrayerTimes;
