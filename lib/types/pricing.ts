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
    functionalIssues: {
        batteryIssue: number
        flashlightIssue: number
        memoryCardIssue: number
        speakerIssue: number
        connectorIssue: number
        buttonIssue: number
        noIssues: number
    }
    accessories: {
        adapter: number
        battery: number
        box: number
        cable: number
        tripod: number
    }
    age: {
        lessThan3Months: number
        fourToTwelveMonths: number
        aboveTwelveMonths: number
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
        // Legacy fields for backward compatibility
        bodyDamage: { yes: -2000, no: 0 },
        lcdWorking: { yes: 0, no: -3000 },
        lensScratches: { yes: -1500, no: 0 },
        autofocusWorking: { yes: 0, no: -2500 },
        additionalLens: { yes: 1500, no: 0 },
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
    functionalIssues: {
        batteryIssue: -2000,
        flashlightIssue: -1000,
        memoryCardIssue: -1500,
        speakerIssue: -800,
        connectorIssue: -1200,
        buttonIssue: -1500,
        noIssues: 0,
    },
    accessories: {
        adapter: 500,
        battery: 800,
        box: 1000,
        cable: 400,
        tripod: 2000,
    },
    age: {
        lessThan3Months: 0,
        fourToTwelveMonths: -2000,
        aboveTwelveMonths: -4000,
    },
}
