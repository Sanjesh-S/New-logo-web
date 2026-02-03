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
 * Create a complete PricingRules structure with all zeros.
 * This is used as a fallback when no pricing rules exist in Firebase.
 * All prices MUST be set in Firebase through the admin dashboard.
 */
function createZeroPricingRules(): PricingRules {
  // Create a minimal structure to ensure all required fields exist
  const structure: PricingRules = {
    questions: {
      powerOn: { yes: 0, no: 0 },
      cameraFunction: { yes: 0, no: 0 },
      buttonsWorking: { yes: 0, no: 0 },
      waterDamage: { yes: 0, no: 0 },
      flashWorking: { yes: 0, no: 0 },
      memoryCardSlotWorking: { yes: 0, no: 0 },
      speakerWorking: { yes: 0, no: 0 },
    },
    lensCondition: {
      withoutLens: 0,
      good: 0,
      autofocusIssue: 0,
      fungus: 0,
      scratches: 0,
    },
    displayCondition: {
      excellent: 0,
      good: 0,
      fair: 0,
      cracked: 0,
    },
    bodyCondition: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    },
    errorCondition: {
      noErrors: 0,
      minorErrors: 0,
      frequentErrors: 0,
    },
    bodyPhysicalCondition: {
      likeNew: 0,
      average: 0,
      worn: 0,
    },
    lcdDisplayCondition: {
      good: 0,
      fair: 0,
      poor: 0,
    },
    rubberGripsCondition: {
      good: 0,
      fair: 0,
      poor: 0,
    },
    sensorViewfinderCondition: {
      clean: 0,
      minor: 0,
      major: 0,
    },
    errorCodesCondition: {
      none: 0,
      intermittent: 0,
      persistent: 0,
    },
    fungusDustCondition: {
      clean: 0,
      minorFungus: 0,
      majorFungus: 0,
    },
    focusFunctionality: {
      goodFocus: 0,
      afIssue: 0,
      mfIssue: 0,
    },
    rubberRingCondition: {
      goodRubber: 0,
      minorRubber: 0,
      majorRubber: 0,
    },
    lensErrorStatus: {
      noErrors: 0,
      occasionalErrors: 0,
      frequentErrors: 0,
    },
    functionalIssues: {
      microphoneIssue: 0,
      speakerIssue: 0,
      chargingPortIssue: 0,
      touchScreenIssue: 0,
      wifiIssue: 0,
      buttonIssue: 0,
      frameDamageIssue: 0,
      bodyDamageIssue: 0,
      waterDamageIssue: 0,
      networkIssue: 0,
      noIssues: 0,
    },
    accessories: {
      battery: 0,
      charger: 0,
      box: 0,
      cable: 0,
      manual: 0,
      case: 0,
      bill: 0,
      warrantyCard: 0,
    },
    age: {
      lessThan3Months: 0,
      fourToTwelveMonths: 0,
      aboveTwelveMonths: 0,
    },
  }
  return structure
}

/**
 * ZERO_PRICING_RULES - Same structure as PricingRules but every modifier is 0.
 * Used when no pricing is set in Firebase so that final price = internalBasePrice until admin configures rules.
 * All prices MUST be set in Firebase through the admin dashboard:
 * - Product-specific: `productPricing` collection (preferred) or `products.pricingRules`
 * - Global defaults: `settings/pricing` document
 */
export const ZERO_PRICING_RULES: PricingRules = createZeroPricingRules()
