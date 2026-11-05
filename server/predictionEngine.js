/**
 * Mine Rescue & Safety Monitoring System - Gas Prediction Engine
 * Analyzes rate of gas accumulation and predicts hazardous threshold crossings.
 */

// Safety Threshold Definitions (OSHA / MSHA Mine Safety Standards)
const THRESHOLDS = {
  ch4_ppm: {
    caution: 5000,    // 0.5% vol / 10% LEL (Lower Explosive Limit)
    critical: 10000,  // 1.0% vol / 20% LEL - MSHA Mandatory Evacuation Action
    explosive: 25000, // 2.5% vol / 50% LEL - Explosive Hazard
    unit: 'ppm',
    name: 'Methane (CH4)',
    toLel: (ppm) => (ppm / 50000) * 100 // 50,000 ppm = 5% vol = 100% LEL
  },
  co_ppm: {
    caution: 35,      // NIOSH REL 8-hr TWA
    critical: 100,    // MSHA Ceiling Action Level
    danger: 200,      // Lethal in prolonged exposure
    unit: 'ppm',
    name: 'Carbon Monoxide (CO)'
  },
  o2_percent: {
    caution_low: 19.5, // OSHA Oxygen Deficiency Threshold
    critical_low: 16.0,// Dangerous Asphyxiation Level
    caution_high: 23.5,// Oxygen Enriched
    unit: '%',
    name: 'Oxygen (O2)'
  },
  distance_cm: {
    caution: 180,     // Ceiling convergence or obstacle caution
    critical: 100,    // Structural hazard / Impending cave-in proximity
    unit: 'cm',
    name: 'Tunnel Clearance'
  }
};

/**
 * Perform simple linear regression on (x, y) coordinates
 * where x is time in seconds, y is concentration
 */
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  // Coefficient of determination (R^2)
  const ssTotal = sumY2 - (sumY * sumY) / n;
  const ssRes = points.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  let r2 = ssTotal <= 0.00001 ? 1 : Math.max(0, Math.min(1, 1 - (ssRes / (ssTotal || 1))));
  if (isNaN(r2)) r2 = 0.95;

  return { slope, intercept, r2 };
}

/**
 * Predict future hazard crossings and generate forward projection curve
 * @param {Array} history - Array of recent telemetry objects sorted by timestamp
 * @param {string} gasKey - 'ch4_ppm', 'co_ppm', 'o2_percent', or 'distance_cm'
 * @param {number} forecastMinutes - Projection horizon in minutes (default: 10)
 */
function forecastTrend(history, gasKey, forecastMinutes = 10) {
  if (!history || history.length < 3) {
    const lastVal = history?.[history.length - 1]?.[gasKey] || 0;
    return {
      currentValue: lastVal,
      ratePerMin: 0,
      predictedValue10m: lastVal,
      timeToCautionSec: null,
      timeToCriticalSec: null,
      hazardLevel: 'NORMAL',
      projectedPoints: []
    };
  }

  // Take the most recent 30 samples (e.g., last 30-60 seconds)
  const windowSlice = history.slice(-30);
  const baseTime = new Date(windowSlice[0].timestamp).getTime() / 1000;
  
  const points = windowSlice.map(item => ({
    x: (new Date(item.timestamp).getTime() / 1000) - baseTime,
    y: Number(item[gasKey]) || 0
  }));

  const { slope, intercept, r2 } = linearRegression(points);
  const currentT = (new Date(windowSlice[windowSlice.length - 1].timestamp).getTime() / 1000) - baseTime;
  const currentValue = points[points.length - 1].y;

  // Rate of change per minute
  const ratePerMin = slope * 60;

  // Thresholds for this gas
  const thresh = THRESHOLDS[gasKey];
  let timeToCautionSec = null;
  let timeToCriticalSec = null;

  if (gasKey === 'o2_percent') {
    // For O2, hazard is declining below 19.5% or 16%
    if (slope < -0.0005) { // declining
      if (currentValue > thresh.caution_low) {
        timeToCautionSec = Math.max(0, (thresh.caution_low - currentValue) / slope);
      }
      if (currentValue > thresh.critical_low) {
        timeToCriticalSec = Math.max(0, (thresh.critical_low - currentValue) / slope);
      }
    }
  } else if (gasKey === 'distance_cm') {
    // For ultrasonic clearance, hazard is decreasing distance (tunnel squeeze/cave-in)
    if (slope < -0.01) {
      if (currentValue > thresh.caution) {
        timeToCautionSec = Math.max(0, (thresh.caution - currentValue) / slope);
      }
      if (currentValue > thresh.critical) {
        timeToCriticalSec = Math.max(0, (thresh.critical - currentValue) / slope);
      }
    }
  } else {
    // For CH4 and CO, hazard is rising
    if (slope > 0.005) {
      if (currentValue < thresh.caution) {
        timeToCautionSec = Math.max(0, (thresh.caution - currentValue) / slope);
      }
      if (currentValue < thresh.critical) {
        timeToCriticalSec = Math.max(0, (thresh.critical - currentValue) / slope);
      }
    }
  }

  // Determine current hazard level
  let hazardLevel = 'NORMAL';
  if (gasKey === 'ch4_ppm') {
    if (currentValue >= thresh.critical || (timeToCriticalSec && timeToCriticalSec < 300)) {
      hazardLevel = 'CRITICAL';
    } else if (currentValue >= thresh.caution || (timeToCautionSec && timeToCautionSec < 600)) {
      hazardLevel = 'CAUTION';
    }
  } else if (gasKey === 'co_ppm') {
    if (currentValue >= thresh.critical || (timeToCriticalSec && timeToCriticalSec < 300)) {
      hazardLevel = 'CRITICAL';
    } else if (currentValue >= thresh.caution || (timeToCautionSec && timeToCautionSec < 600)) {
      hazardLevel = 'CAUTION';
    }
  } else if (gasKey === 'o2_percent') {
    if (currentValue <= thresh.critical_low || (timeToCriticalSec && timeToCriticalSec < 300)) {
      hazardLevel = 'CRITICAL';
    } else if (currentValue <= thresh.caution_low || (timeToCautionSec && timeToCautionSec < 600)) {
      hazardLevel = 'CAUTION';
    }
  } else if (gasKey === 'distance_cm') {
    if (currentValue <= thresh.critical || (timeToCriticalSec && timeToCriticalSec < 180)) {
      hazardLevel = 'CRITICAL';
    } else if (currentValue <= thresh.caution || (timeToCautionSec && timeToCautionSec < 420)) {
      hazardLevel = 'CAUTION';
    }
  }

  // Generate projection points into the future (every 1 min up to forecastMinutes)
  const lastTimestamp = new Date(windowSlice[windowSlice.length - 1].timestamp).getTime();
  const projectedPoints = [];
  const futureSteps = [1, 2, 3, 5, 8, 10];

  for (const min of futureSteps) {
    if (min > forecastMinutes) break;
    const deltaSec = min * 60;
    const futureT = currentT + deltaSec;
    // Damped linear projection (slight real-world dispersion damping)
    const dampingFactor = Math.exp(-0.02 * min);
    let predVal = currentValue + (slope * deltaSec * (0.8 + 0.2 * dampingFactor));
    
    // Physical bounds
    if (gasKey === 'o2_percent') predVal = Math.max(0, Math.min(30, predVal));
    if (gasKey === 'ch4_ppm') predVal = Math.max(0, Math.min(100000, predVal));
    if (gasKey === 'co_ppm') predVal = Math.max(0, Math.min(2000, predVal));
    if (gasKey === 'distance_cm') predVal = Math.max(0, Math.min(500, predVal));

    projectedPoints.push({
      minuteOffset: min,
      timestamp: new Date(lastTimestamp + deltaSec * 1000).toISOString(),
      predictedValue: Number(predVal.toFixed(2)),
      confidence: Number(Math.max(0.4, (r2 * (1 - min * 0.05))).toFixed(2))
    });
  }

  const pred10m = projectedPoints.length ? projectedPoints[projectedPoints.length - 1].predictedValue : currentValue;

  return {
    currentValue: Number(currentValue.toFixed(2)),
    ratePerMin: Number(ratePerMin.toFixed(2)),
    predictedValue10m: Number(pred10m.toFixed(2)),
    timeToCautionSec: timeToCautionSec !== null ? Math.round(timeToCautionSec) : null,
    timeToCriticalSec: timeToCriticalSec !== null ? Math.round(timeToCriticalSec) : null,
    hazardLevel,
    r2Score: isNaN(r2) ? 0.95 : Number(r2.toFixed(3)),
    projectedPoints
  };
}

/**
 * Computes an overall Tunnel Safety Index (0 to 100)
 * 100 = Optimal/Safe, <70 = Caution, <40 = Critical/Hazard
 */
function calculateSafetyIndex(telemetry) {
  if (!telemetry) return 100;
  
  let score = 100;

  // Ultrasonic clearance impact
  const dist = telemetry.distance_cm;
  if (dist !== undefined) {
    if (dist < 80) score -= 45;
    else if (dist < 120) score -= 30;
    else if (dist < 180) score -= 15;
  }

  // Methane CH4 impact
  const ch4 = telemetry.ch4_ppm;
  if (ch4 !== undefined) {
    if (ch4 >= 10000) score -= 45;
    else if (ch4 >= 5000) score -= 25;
    else if (ch4 >= 2500) score -= 10;
  }

  // Carbon Monoxide CO impact
  const co = telemetry.co_ppm;
  if (co !== undefined) {
    if (co >= 100) score -= 40;
    else if (co >= 50) score -= 25;
    else if (co >= 35) score -= 15;
  }

  // Oxygen O2 impact
  const o2 = telemetry.o2_percent;
  if (o2 !== undefined) {
    if (o2 < 16.0) score -= 40;
    else if (o2 < 19.5) score -= 20;
    else if (o2 > 23.5) score -= 15;
  }

  // LoRa connectivity impact
  if (telemetry.rssi !== undefined && telemetry.rssi < -115) {
    score -= 10;
  }
  if (telemetry.battery !== undefined && telemetry.battery < 20) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = {
  THRESHOLDS,
  forecastTrend,
  calculateSafetyIndex
};

