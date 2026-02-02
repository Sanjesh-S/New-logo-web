/**
 * Human-readable labels for assessment answer keys (used in admin)
 */
export const ASSESSMENT_LABELS: Record<string, string> = {
  // Functionality (yes/no)
  powerOn: 'Powers on',
  cameraFunction: 'Camera function',
  buttonsWorking: 'Buttons working',
  waterDamage: 'Water damage',
  flashWorking: 'Flash working',
  memoryCardSlotWorking: 'Memory card slot',
  speakerWorking: 'Speaker working',
  bodyDamage: 'Body damage',
  lcdWorking: 'LCD working',
  lensScratches: 'Lens scratches',
  autofocusWorking: 'Autofocus working',
  batteryHealth: 'Battery health',
  biometricWorking: 'Biometric working',
  cameraWorking: 'Camera working',
  trueTone: 'True Tone available',
  // Samsung phone-specific
  fingerprintWorking: 'Fingerprint working',
  faceRecognitionWorking: 'Face Recognition working',
  display120Hz: '120Hz / High refresh rate',
  eyeComfortShield: 'Eye Comfort Shield',
  sPenTipGood: 'S Pen tip condition',
  sPenWriting: 'S Pen writing/touch',
  sPenAirActions: 'S Pen Air Actions',
  sPenCharging: 'S Pen charging/connectivity',
  batteryHealthSamsung: 'Battery health (Samsung)',
  screenCondition: 'Screen condition',
  keyboardWorking: 'Keyboard working',
  batteryCycleCount: 'Battery cycle count',
  portsWorking: 'Ports working',
  chargingWorking: 'Charging working',
  batteryWorking: 'Battery working',
  // Body / physical (cameras)
  bodyPhysicalCondition: 'Body condition',
  lcdDisplayCondition: 'LCD display',
  rubberGripsCondition: 'Rubber grips',
  sensorViewfinderCondition: 'Sensor / viewfinder',
  errorCodesCondition: 'Error codes',
  // Lens
  lensCondition: 'Lens condition',
  hasAdditionalLens: 'Additional lens',
  additionalLenses: 'Additional lenses',
  hasLensToSell: 'Lens to sell',
  fungusDustCondition: 'Fungus / dust',
  focusFunctionality: 'Focus functionality',
  rubberRingCondition: 'Rubber ring',
  lensErrorStatus: 'Lens error status',
  // Condition / display
  bodyCondition: 'Body condition',
  displayCondition: 'Display condition',
  batteryHealthRange: 'Battery health',
  cameraCondition: 'Camera condition',
  errorCondition: 'Error condition',
  // Other
  accessories: 'Accessories',
  age: 'Age of device',
  functionalIssues: 'Functional issues',
  imeiNumber: 'IMEI number',
  serialNumber: 'Serial number',
}

/** Friendly labels for common answer values */
const VALUE_LABELS: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  lessThan3Months: 'Less than 3 months',
  fourToTwelveMonths: '4–12 months',
  oneToTwoYears: '1–2 years',
  moreThan2Years: 'More than 2 years',
  likeNew: 'Like new',
  average: 'Average',
  worn: 'Worn',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  clean: 'Clean',
  minor: 'Minor',
  major: 'Major',
  none: 'None',
  intermittent: 'Intermittent',
  persistent: 'Persistent',
}

/** Format a raw answer value for display */
export function formatAnswerValue(value: unknown): string {
  if (value == null) return '—'
  if (Array.isArray(value)) {
    return value.map((v) => VALUE_LABELS[String(v)] ?? String(v)).join(', ')
  }
  if (typeof value === 'object') return JSON.stringify(value)
  const s = String(value)
  return VALUE_LABELS[s] ?? s
}

/** Group answer keys by category for admin display */
export const ASSESSMENT_GROUPS: Record<string, string[]> = {
  'Functionality': [
    'powerOn', 'cameraFunction', 'buttonsWorking', 'waterDamage', 'flashWorking',
    'memoryCardSlotWorking', 'speakerWorking', 'bodyDamage', 'lcdWorking', 'lensScratches',
    'autofocusWorking', 'batteryHealth', 'biometricWorking', 'cameraWorking', 'trueTone',
    'screenCondition', 'keyboardWorking', 'batteryCycleCount', 'portsWorking', 'chargingWorking', 'batteryWorking',
  ],
  'Body / physical': [
    'bodyPhysicalCondition', 'lcdDisplayCondition', 'rubberGripsCondition',
    'sensorViewfinderCondition', 'errorCodesCondition', 'bodyCondition', 'displayCondition',
    'batteryHealthRange', 'cameraCondition', 'errorCondition',
  ],
  'Lens': [
    'lensCondition', 'hasAdditionalLens', 'additionalLenses', 'hasLensToSell',
    'fungusDustCondition', 'focusFunctionality', 'rubberRingCondition', 'lensErrorStatus',
  ],
  'Device info': ['accessories', 'age', 'functionalIssues', 'imeiNumber', 'serialNumber'],
}

export function getAssessmentLabel(key: string): string {
  return ASSESSMENT_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}
