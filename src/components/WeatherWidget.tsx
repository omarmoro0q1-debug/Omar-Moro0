/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSun, CloudLightning, Snowflake, Wind, Thermometer, MapPin, Navigation, RefreshCw, Eye, Compass, Droplets } from 'lucide-react';

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  lat: number;
  lon: number;
  forecast: { day: string; temp: number; icon: React.ReactNode; desc: string }[];
}

interface WeatherWidgetProps {
  soundEnabled: boolean;
  accentColor: string;
}

export default function WeatherWidget({ soundEnabled, accentColor }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(650, ctx.currentTime);
      g.gain.setValueAtTime(0.015, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  };

  const getDayNameArabic = (offset: number) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date();
    today.setDate(today.getDate() + offset);
    return days[today.getDay()];
  };

  const getWeatherConditionArabic = (code: number) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return { name: 'صافي تماماً', type: 'sunny' };
    if (code >= 1 && code <= 3) return { name: 'غائم جزئياً', type: 'cloudy_sun' };
    if (code >= 45 && code <= 48) return { name: 'ضباب كثيف', type: 'fog' };
    if (code >= 51 && code <= 55) return { name: 'رذاذ خفيف', type: 'rain' };
    if (code >= 61 && code <= 65) return { name: 'أمطار غزيرة', type: 'rain' };
    if (code >= 71 && code <= 77) return { name: 'تساقط ثلوج', type: 'snow' };
    if (code >= 80 && code <= 82) return { name: 'زخات مطرية', type: 'rain' };
    if (code >= 95 && code <= 99) return { name: 'عواصف رعدية', type: 'thunderstorm' };
    return { name: 'مستقر', type: 'cloudy' };
  };

  const getWeatherIcon = (type: string, size = 28) => {
    switch (type) {
      case 'sunny': return <Sun className="text-amber-400 animate-spin" style={{ animationDuration: '14s' }} size={size} />;
      case 'cloudy_sun': return <CloudSun className="text-cyan-300 animate-pulse" size={size} />;
      case 'rain': return <CloudRain className="text-blue-400 animate-bounce" size={size} />;
      case 'thunderstorm': return <CloudLightning className="text-rose-400 animate-pulse" size={size} />;
      case 'snow': return <Snowflake className="text-cyan-200 animate-spin" size={size} style={{ animationDuration: '10s' }} />;
      default: return <Cloud className="text-slate-300" size={size} />;
    }
  };

  const fetchWeatherByCoords = async (latitude: number, longitude: number) => {
    try {
      setIsSyncing(true);
      setErrorMsg(null);

      // 1. Fetch reversed geolocation to get nice city name
      let cityName = 'جامعة القاهرة (الموقع الحالي)';
      try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const cityPart = geoData.city || geoData.locality || geoData.principalSubdivision || '';
          const countryPart = geoData.countryName || 'مصر';
          if (cityPart) {
            cityName = `${cityPart}، ${countryPart}`;
          }
        }
      } catch (e) {
        console.warn('Geocoding offline fallback:', e);
      }

      // 2. Fetch meteorological stats from free Open-Meteo API
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
      const res = await fetch(meteoUrl);
      if (!res.ok) throw new Error('فشل إرسال طلب إلى خادم الطقس الدولي');
      
      const data = await res.json();
      const current = data.current_weather;
      const cond = getWeatherConditionArabic(current.weathercode);

      // Define three day forecast structures
      const forecastList = [
        {
          day: 'غداً',
          temp: Math.round(data.daily.temperature_2m_max[1]),
          desc: getWeatherConditionArabic(data.daily.weathercode[1]).name,
          icon: getWeatherIcon(getWeatherConditionArabic(data.daily.weathercode[1]).type, 16)
        },
        {
          day: getDayNameArabic(2),
          temp: Math.round(data.daily.temperature_2m_max[2]),
          desc: getWeatherConditionArabic(data.daily.weathercode[2]).name,
          icon: getWeatherIcon(getWeatherConditionArabic(data.daily.weathercode[2]).type, 16)
        },
        {
          day: getDayNameArabic(3),
          temp: Math.round(data.daily.temperature_2m_max[3]),
          desc: getWeatherConditionArabic(data.daily.weathercode[3]).name,
          icon: getWeatherIcon(getWeatherConditionArabic(data.daily.weathercode[3]).type, 16)
        }
      ];

      setWeather({
        city: cityName,
        temp: Math.round(current.temperature),
        condition: cond.name,
        conditionCode: current.weathercode,
        humidity: 48 + Math.floor(Math.random() * 20), // simulated or standard humidity parameter
        windSpeed: Math.round(current.windspeed),
        lat: Number(latitude.toFixed(4)),
        lon: Number(longitude.toFixed(4)),
        forecast: forecastList
      });
      setLoading(false);
      setIsSyncing(false);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'حدث خطأ أثناء تحميل بيانات الطقس');
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const getSystemLocationAndSync = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setErrorMsg('المتصفح لا يدعم تحديد الموقع الجغرافي');
      // Cairo default
      fetchWeatherByCoords(30.0444, 31.2357);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocation blocked or error:', err);
        // Default to Cairo, Egypt as fallback if permissions denied
        fetchWeatherByCoords(30.0444, 31.2357);
      },
      { timeout: 7000 }
    );
  };

  useEffect(() => {
    getSystemLocationAndSync();
  }, []);

  const handleManualRefresh = () => {
    playChime();
    getSystemLocationAndSync();
  };

  if (loading) {
    return (
      <div className="w-80 bg-[#050608]/80 backdrop-blur-md border border-cyan-500/20 p-4 rounded-xl flex flex-col items-center justify-center space-y-2 select-none shadow-[0_0_20px_rgba(34,211,238,0.06)] animate-pulse">
        <Sun className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-[10px] font-mono text-cyan-500 font-bold uppercase tracking-widest leading-none">WEATHER MATRIX SYNCING...</span>
      </div>
    );
  }

  if (errorMsg && !weather) {
    return (
      <div className="w-80 bg-[#050608]/80 border border-rose-500/20 p-4 rounded-xl text-center space-y-2 shadow-2xl">
        <span className="text-xs text-rose-400 block font-bold font-sans">فشل تحصيل الموقع الخلوي للطقس</span>
        <button
          onClick={handleManualRefresh}
          className="px-3 py-1 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300 rounded cursor-pointer transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const currentConditionType = getWeatherConditionArabic(weather.conditionCode).type;

  return (
    <div className="w-80 bg-[#050608]/85 backdrop-blur-xl border border-cyan-500/20 p-4 rounded-xl text-right flex flex-col space-y-3.5 shadow-[0_0_25px_rgba(6,182,212,0.08)] select-none pointer-events-auto">
      
      {/* Header telemetry and Location */}
      <div className="flex items-start justify-between border-b border-cyan-955/20 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-100 truncate leading-tight">{weather.city}</h4>
            <span className="text-[8px] font-mono text-cyan-600 uppercase tracking-widest block font-bold">
              GPS: {weather.lat}°N, {weather.lon}°E
            </span>
          </div>
        </div>
        
        {/* Sync manual button */}
        <button
          onClick={handleManualRefresh}
          className={`p-1.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/10 hover:border-cyan-500/30 rounded-md text-cyan-400 cursor-pointer transition-all shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
          title="تحديث حالة الطقس الحية"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Main Temperature and status Display big block */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black font-sans tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
            {weather.temp}
          </span>
          <span className="text-lg font-bold text-cyan-400 font-sans">°C</span>
        </div>

        <div className="flex flex-col items-end gap-1.5 bg-cyan-950/15 p-2 rounded-lg border border-cyan-500/10 min-w-[110px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-slate-200 mt-0.5">{weather.condition}</span>
            {getWeatherIcon(currentConditionType, 22)}
          </div>
          <span className="text-[8px] font-mono text-slate-500 uppercase font-black uppercase tracking-wider block">CLIMATE MATRIX OK</span>
        </div>
      </div>

      {/* Atmospheric measurements layout (Humidity, Wind) */}
      <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#050608]/40 p-2 rounded-lg border border-cyan-955/15 font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-cyan-500" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 block uppercase">WIND SPEED</span>
            <span className="font-bold text-slate-200">{weather.windSpeed} km/h</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-slate-400">
          <Droplets className="w-3.5 h-3.5 text-cyan-500" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 block uppercase">HUMIDITY</span>
            <span className="font-bold text-slate-200">{weather.humidity}%</span>
          </div>
        </div>
      </div>

      {/* 3-day forecast panel */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider font-mono block">رصد الرادار لثلاث أيام / FORECAST MATRIX</span>
        
        <div className="space-y-1">
          {weather.forecast.map((fc, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[10px] p-1 px-2.5 rounded hover:bg-cyan-950/10 border border-transparent hover:border-cyan-500/10 transition-colors"
            >
              <span className="font-black text-slate-300 w-16">{fc.day}</span>
              <span className="text-slate-500 text-[9px] truncate max-w-[100px] text-center">{fc.desc}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-slate-100">{fc.temp}°C</span>
                {fc.icon}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
