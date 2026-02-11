/**
 * List of fixed-lens camera models that should not show variant selection
 * (Body Only / With Kit Lens options)
 */

export const FIXED_LENS_CAMERAS: string[] = [
  // Canon G7 X Series
  'Canon EOS G7 X',
  'Canon EOS G7 X Mark II',
  'Canon EOS G7 X Mark III',
  
  // Fujifilm X100 Series (Fixed Prime Lens)
  'Fujifilm X100',
  'Fujifilm X100S',
  'Fujifilm X100T',
  'Fujifilm X100F',
  'Fujifilm X100V',
  
  // Fujifilm Other Fixed Lens
  'Fujifilm X10',
  'Fujifilm X20',
  'Fujifilm X30',
  'Fujifilm X70',
  'Fujifilm XF1',
  
  // GoPro Hero Series
  'Hero',
  'Hero Plus',
  'Hero 7',
  'Hero 8',
  'Hero 9',
  'Hero 10',
  'Hero 11',
  'Hero 11 Mini',
  'Hero 12',
  'Hero 13',
  'Max 360',
  
  // Nikon Coolpix Series (All Fixed Lens)
  'Coolpix A1000',
  'Coolpix B500',
  'Coolpix B600',
  'Coolpix B700',
  'Coolpix P90',
  'Coolpix P100',
  'Coolpix P500',
  'Coolpix P510',
  'Coolpix P520',
  'Coolpix P530',
  'Coolpix P600',
  'Coolpix P610',
  'Coolpix P900',
  'Coolpix P950',
  'Coolpix P1000',
  
  // Sony RX Series
  'RX0',
  'RX0 II',
  'RX1',
  'RX1R',
  'RX1R II',
  'RX10',
  'RX10 II',
  'RX10 III',
  'RX10 IV',
  'RX100',
  'RX100 II',
  'RX100 III',
  'RX100 IV',
  'RX100 V',
  'RX100 VA',
  'RX100 VI',
  'RX100 VII',
  
  // Sony ZV Compact Series
  'ZV-1',
  'ZV-1 II',
  'ZV-1F',
  
  // Sony CyberShot / H Series
  'DSC-H100',
  'DSC-H300',
  'DSC-W190',
  'DSC-WX500',
  'H300',
  'H400',
  'HX50',
  'HX60',
  'HX80',
  'HX90',
  'HX99',
  'W800',
  'W810',
  'W830',
]

/**
 * Check if a camera model is a fixed-lens camera
 * @param modelName - The camera model name to check
 * @returns true if the camera is a fixed-lens model
 */
export function isFixedLensCamera(modelName: string): boolean {
  if (!modelName) return false
  
  const normalizedModel = modelName.trim()
  
  // Check exact matches
  if (FIXED_LENS_CAMERAS.includes(normalizedModel)) {
    return true
  }
  
  // Check partial matches for models that might have additional text
  // e.g., "Canon EOS G7 X Mark II" should match "Canon EOS G7 X Mark II"
  for (const fixedLensModel of FIXED_LENS_CAMERAS) {
    // Check if the model name contains the fixed lens model name
    // or if the fixed lens model name contains the model name
    if (
      normalizedModel.toLowerCase().includes(fixedLensModel.toLowerCase()) ||
      fixedLensModel.toLowerCase().includes(normalizedModel.toLowerCase())
    ) {
      return true
    }
  }
  
  // Special cases for series that might have variations
  const lowerModel = normalizedModel.toLowerCase()
  
  // GoPro Hero series (any Hero model)
  if (lowerModel.includes('hero') && !lowerModel.includes('lens')) {
    return true
  }
  
  // Nikon Coolpix series
  if (lowerModel.includes('coolpix')) {
    return true
  }
  
  // Sony RX series
  if (lowerModel.includes('rx') && (lowerModel.includes('rx0') || lowerModel.includes('rx1') || lowerModel.includes('rx10') || lowerModel.includes('rx100'))) {
    return true
  }
  
  // Sony ZV series
  if (lowerModel.includes('zv-')) {
    return true
  }
  
  // Sony CyberShot / H Series
  if (lowerModel.includes('dsc-') || lowerModel.includes('hx') || lowerModel.includes('w800') || lowerModel.includes('w810') || lowerModel.includes('w830')) {
    return true
  }
  
  // Fujifilm X100 series
  if (lowerModel.includes('x100')) {
    return true
  }
  
  // Fujifilm X10, X20, X30, X70, XF1
  if (lowerModel.match(/^x(10|20|30|70)$/) || lowerModel.includes('xf1')) {
    return true
  }
  
  return false
}
