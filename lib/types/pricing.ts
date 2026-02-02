export interface YesNoPrice {
    yes: number
    no: number
}

export interface PricingRules {
    questions: {
        powerOn: YesNoPrice
        cameraFunction: YesNoPrice
        buttonsWorking: YesNoPrice
        waterDamage: YesNoPrice
        flashWorking: YesNoPrice
        memoryCardSlotWorking: YesNoPrice
        speakerWorking: YesNoPrice
        hasLensToSell?: YesNoPrice
        // Phone-specific questions
        batteryHealth?: YesNoPrice
        biometricWorking?: YesNoPrice
        cameraWorking?: YesNoPrice
        trueTone?: YesNoPrice
        // Laptop-specific questions
        screenCondition?: YesNoPrice
        keyboardWorking?: YesNoPrice
        batteryCycleCount?: YesNoPrice
        portsWorking?: YesNoPrice
        chargingWorking?: YesNoPrice
        // Tablet-specific questions
        batteryWorking?: YesNoPrice
        // Samsung phone-specific questions
        fingerprintWorking?: YesNoPrice
        faceRecognitionWorking?: YesNoPrice
        display120Hz?: YesNoPrice
        eyeComfortShield?: YesNoPrice
        sPenTipGood?: YesNoPrice
        sPenWriting?: YesNoPrice
        sPenAirActions?: YesNoPrice
        sPenCharging?: YesNoPrice
        // Legacy fields for backward compatibility
        bodyDamage?: YesNoPrice
        lcdWorking?: YesNoPrice
        lensScratches?: YesNoPrice
        autofocusWorking?: YesNoPrice
        additionalLens?: YesNoPrice
    }
    lensCondition: {
        withoutLens: number
        good: number
        autofocusIssue: number
        fungus: number
        scratches: number
    }
    displayCondition: {
        excellent: number
        good: number
        fair: number
        cracked: number
        // Phone display options
        goodWorking?: number
        screenLine?: number
        minorCrack?: number
        majorDamage?: number
        notWorking?: number
    }
    // Samsung battery health (Normal/Good vs Action Required)
    batteryHealthSamsung?: {
        normalGood: number
        actionRequired: number
    }
    bodyCondition: {
        excellent: number
        good: number
        fair: number
        poor: number
    }
    errorCondition: {
        noErrors: number
        minorErrors: number
        frequentErrors: number
    }
    // New Body Conditions (Camera-specific)
    bodyPhysicalCondition: {
        likeNew: number
        average: number
        worn: number
    }
    lcdDisplayCondition: {
        good: number
        fair: number
        poor: number
    }
    rubberGripsCondition: {
        good: number
        fair: number
        poor: number
    }
    sensorViewfinderCondition: {
        clean: number
        minor: number
        major: number
    }
    errorCodesCondition: {
        none: number
        intermittent: number
        persistent: number
    }
    // Lens Condition (Camera-specific)
    fungusDustCondition: {
        clean: number
        minorFungus: number
        majorFungus: number
    }
    focusFunctionality: {
        goodFocus: number
        afIssue: number
        mfIssue: number
    }
    rubberRingCondition: {
        goodRubber: number
        minorRubber: number
        majorRubber: number
    }
    lensErrorStatus: {
        noErrors: number
        occasionalErrors: number
        frequentErrors: number
    }
    functionalIssues: {
        microphoneIssue: number
        speakerIssue: number
        chargingPortIssue: number
        touchScreenIssue: number
        wifiIssue: number
        buttonIssue: number
        frameDamageIssue: number
        bodyDamageIssue: number
        waterDamageIssue: number
        networkIssue: number
        noIssues: number
    }
    accessories: {
        battery: number
        charger: number
        box: number
        cable: number
        manual: number
        case: number
        bill: number
        warrantyCard: number
        // Samsung accessories
        superFastCharger?: number
        sPen?: number
        screenProtector?: number
    }
    age: {
        lessThan3Months: number
        fourToTwelveMonths: number
        aboveTwelveMonths: number
    }
    // Phone-specific condition ranges
    batteryHealthRange?: {
        battery90Above: number
        battery80to90: number
        battery50to80: number
        batteryBelow50: number
    }
    cameraCondition?: {
        cameraGood: number
        frontCameraNotWorking: number
        backCameraNotWorking: number
        backCameraNotFocusing?: number
        bothCamerasNotWorking: number
    }
}

/**
 * DEFAULT_PRICING_RULES - Fallback pricing rules only
 * 
 * ⚠️ IMPORTANT: These are ONLY used as a last-resort fallback when:
 * 1. Product-specific pricing rules don't exist in Firebase
 * 2. Global pricing rules don't exist in Firebase
 * 3. There's an error loading pricing from Firebase
 * 
 * All actual pricing should be set through the admin dashboard and stored in Firebase:
 * - Product-specific: `productPricing` collection (preferred) or `products.pricingRules`
 * - Global defaults: `settings/pricing` document
 * 
 * These hardcoded values should NOT be used for production pricing.
 */
export const DEFAULT_PRICING_RULES: PricingRules = {
    questions: {
        powerOn: { yes: 0, no: -5000 },
        cameraFunction: { yes: 0, no: -3000 },
        buttonsWorking: { yes: 0, no: -1500 },
        waterDamage: { yes: 0, no: -5000 },
        flashWorking: { yes: 0, no: -1000 },
        memoryCardSlotWorking: { yes: 0, no: -1500 },
        speakerWorking: { yes: 0, no: -800 },
        hasLensToSell: { yes: 0, no: -2000 },
        // Phone-specific questions
        batteryHealth: { yes: 0, no: -3000 },
        biometricWorking: { yes: 0, no: -2500 },
        cameraWorking: { yes: 0, no: -3000 },
        trueTone: { yes: 0, no: -1500 },
        // Laptop-specific questions
        screenCondition: { yes: 0, no: -4000 },
        keyboardWorking: { yes: 0, no: -3000 },
        batteryCycleCount: { yes: 0, no: -2000 },
        portsWorking: { yes: 0, no: -1500 },
        chargingWorking: { yes: 0, no: -2000 },
        // Tablet-specific questions
        batteryWorking: { yes: 0, no: -2500 },
        // Legacy fields for backward compatibility
        bodyDamage: { yes: -2000, no: 0 },
        lcdWorking: { yes: 0, no: -3000 },
        lensScratches: { yes: -1500, no: 0 },
        autofocusWorking: { yes: 0, no: -2500 },
        additionalLens: { yes: 1500, no: 0 },
        // Samsung phone-specific
        fingerprintWorking: { yes: 0, no: -1500 },
        faceRecognitionWorking: { yes: 0, no: -1000 },
        display120Hz: { yes: 0, no: -500 },
        eyeComfortShield: { yes: 0, no: -300 },
        sPenTipGood: { yes: 0, no: -800 },
        sPenWriting: { yes: 0, no: -1500 },
        sPenAirActions: { yes: 0, no: -500 },
        sPenCharging: { yes: 0, no: -1000 },
    },
    lensCondition: {
        withoutLens: -2000,
        good: 0,
        autofocusIssue: -3000,
        fungus: -5000,
        scratches: -2000,
    },
    displayCondition: {
        excellent: 0,
        good: -1000,
        fair: -2500,
        cracked: -8000,
        goodWorking: 0,
        screenLine: -500,
        minorCrack: -2000,
        majorDamage: -4000,
        notWorking: -6000,
    },
    batteryHealthSamsung: {
        normalGood: 0,
        actionRequired: -2000,
    },
    bodyCondition: {
        excellent: 0,
        good: -1500,
        fair: -3000,
        poor: -6000,
    },
    errorCondition: {
        noErrors: 0,
        minorErrors: -2000,
        frequentErrors: -5000,
    },
    // New Body Conditions (Camera-specific) - Fallback values only
    bodyPhysicalCondition: {
        likeNew: 0,
        average: -1500,
        worn: -3000,
    },
    lcdDisplayCondition: {
        good: 0,
        fair: -2000,
        poor: -5000,
    },
    rubberGripsCondition: {
        good: 0,
        fair: -800,
        poor: -1500,
    },
    sensorViewfinderCondition: {
        clean: 0,
        minor: -2000,
        major: -4000,
    },
    errorCodesCondition: {
        none: 0,
        intermittent: -2000,
        persistent: -5000,
    },
    // Lens Condition (Camera-specific) - Fallback values only
    fungusDustCondition: {
        clean: 0,
        minorFungus: -2000,
        majorFungus: -5000,
    },
    focusFunctionality: {
        goodFocus: 0,
        afIssue: -3000,
        mfIssue: -2000,
    },
    rubberRingCondition: {
        goodRubber: 0,
        minorRubber: -800,
        majorRubber: -1500,
    },
    lensErrorStatus: {
        noErrors: 0,
        occasionalErrors: -2000,
        frequentErrors: -5000,
    },
    functionalIssues: {
        microphoneIssue: -800,
        speakerIssue: -800,
        chargingPortIssue: -1200,
        touchScreenIssue: -3000,
        wifiIssue: -1000,
        buttonIssue: -1500,
        frameDamageIssue: -2000,
        bodyDamageIssue: -2000,
        waterDamageIssue: -4000,
        networkIssue: -1500,
        noIssues: 0,
    },
    accessories: {
        battery: 800,
        charger: 500,
        box: 1000,
        cable: 300,
        manual: 300,
        case: 400,
        bill: 300,
        warrantyCard: 400,
        superFastCharger: 500,
        sPen: 800,
        screenProtector: 200,
    },
    age: {
        lessThan3Months: 0,
        fourToTwelveMonths: -2000,
        aboveTwelveMonths: -4000,
    },
    batteryHealthRange: {
        battery90Above: 0,
        battery80to90: -500,
        battery50to80: -1500,
        batteryBelow50: -3000,
    },
    cameraCondition: {
        cameraGood: 0,
        frontCameraNotWorking: -1000,
        backCameraNotWorking: -2000,
        backCameraNotFocusing: -1500,
        bothCamerasNotWorking: -4000,
    },
}

/** Recursively set all number values in an object to 0. Used when no rules exist in Firebase. */
function zeroAllNumbers<T>(obj: T): T {
  if (typeof obj === 'number') return 0 as T
  if (Array.isArray(obj)) return obj.map(zeroAllNumbers) as T
  if (obj != null && typeof obj === 'object') {
    const out = {} as T
    for (const k of Object.keys(obj) as (keyof T)[]) {
      (out as Record<string, unknown>)[k as string] = zeroAllNumbers((obj as Record<string, unknown>)[k as string])
    }
    return out
  }
  return obj
}

/**
 * ZERO_PRICING_RULES - Same structure as PricingRules but every modifier is 0.
 * Used when no pricing is set in Firebase so that final price = internalBasePrice until admin configures rules.
 * All prices must be set in Admin → Pricing Calculator (per product or global default) and stored in Firebase.
 */
export const ZERO_PRICING_RULES: PricingRules = zeroAllNumbers({ ...DEFAULT_PRICING_RULES }) as PricingRules
